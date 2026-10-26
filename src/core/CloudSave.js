import {
  EmailAuthProvider,
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signOut,
  updatePassword
} from 'firebase/auth';
import { Timestamp, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, trackEvent } from './firebase.js';
import { saveSystem } from './SaveSystem.js';
import { t } from './i18n.js';

const PUSH_DELAY_MS = 1500;
// Guest records are kept this long after the last play, then removed by a Firestore TTL policy on expireAt.
const GUEST_RETENTION_MS = 100 * 24 * 60 * 60 * 1000;

// Phone-number accounts sign in with phone + password; Firebase stores them under this login-only email domain.
export const PHONE_ID_DOMAIN = 'phone.chickenrunv2.app';

export function phoneLoginEmail(cc, number) {
  return `${cc}-${number}@${PHONE_ID_DOMAIN}`;
}

export function formatPhone(cc, number) {
  const n = number.length === 10 ? `${number.slice(0, 2)} ${number.slice(2, 6)} ${number.slice(6)}`
    : number.length === 9 ? `${number.slice(0, 2)} ${number.slice(2, 5)} ${number.slice(5)}`
      : number;
  return `+${cc} ${n}`;
}

/**
 * Admins are listed in Firestore admins/{login email} (phone accounts use their login email,
 * e.g. 82-1012345678@phone.chickenrunv2.app). Add or remove documents in the Firebase console;
 * the rules let a signed-in user read only the document named after their own email.
 */
async function fetchIsAdmin(user) {
  if (!user || user.isAnonymous || !user.email) return false;
  try {
    const snap = await getDoc(doc(db, 'admins', user.email.toLowerCase()));
    return snap.exists();
  } catch (e) {
    console.warn('Admin check failed.', e);
    return false;
  }
}

function phoneFromLoginEmail(email) {
  const m = /^(\d+)-(\d+)@/.exec(email || '');
  return m ? formatPhone(m[1], m[2]) : null;
}

export function providerOf(user) {
  if (!user) return null;
  if (user.isAnonymous) return 'guest';
  const id = user.providerData[0]?.providerId;
  if (id === 'google.com') return 'google';
  if (id === 'password') return user.email?.endsWith(`@${PHONE_ID_DOMAIN}`) ? 'phone' : 'email';
  return id || 'unknown';
}


/**
 * Keeps the local save (SaveSystem / localStorage) in sync with Firestore users/{uid}
 * and holds the signed-in player's profile (nickname, account id, join date).
 * Local saves always happen first, so the game keeps working offline; the cloud copy follows.
 */
class CloudSave {
  constructor() {
    this.user = null;
    this.profile = null;
    this.isAdmin = false;
    this.authResolved = false;
    this.syncing = false;
    this.listeners = new Set();
    this.pushTimer = null;
    this.suppressPush = false;
    this.pendingNickname = null;
    this.pendingAccountId = null;

    saveSystem.onSave = () => this.schedulePush();
    onAuthStateChanged(auth, (user) => this.handleUser(user));
  }

  /** fn(state) runs now and on every change. */
  subscribe(fn) {
    this.listeners.add(fn);
    fn(this.state());
    return () => this.listeners.delete(fn);
  }

  state() {
    return {
      user: this.user,
      profile: this.profile,
      provider: providerOf(this.user),
      isAdmin: this.isAdmin,
      authResolved: this.authResolved,
      syncing: this.syncing,
      needsNickname: !!this.user && this.user.isAnonymous && !this.profile?.nickname,
      mileage: saveSystem.getMileage()
    };
  }

  emit() {
    const s = this.state();
    this.listeners.forEach(fn => fn(s));
  }

  displayName() {
    if (!this.user) return '';
    if (this.user.isAnonymous) return this.profile?.nickname || t('account.guest');
    return this.user.displayName || this.accountId();
  }

  accountId() {
    const u = this.user;
    if (!u) return '';
    if (u.isAnonymous) return this.profile?.nickname || '';
    return this.profile?.accountId || phoneFromLoginEmail(u.email) || u.email || u.phoneNumber || '';
  }

  userRef() {
    return doc(db, 'users', this.user.uid);
  }

  async handleUser(user) {
    this.user = user;
    this.authResolved = true;
    this.isAdmin = false;
    this.profile = user ? { nickname: user.isAnonymous ? this.pendingNickname : null, accountId: this.pendingAccountId } : null;
    if (!user) {
      this.emit();
      return;
    }
    fetchIsAdmin(user).then((isAdmin) => {
      if (this.user !== user) return;
      this.isAdmin = isAdmin;
      this.emit();
    });
    this.syncing = true;
    this.emit();
    let isNew = true;
    try {
      const snap = await getDoc(this.userRef());
      isNew = !snap.exists();
      const data = isNew ? {} : snap.data();
      this.profile = {
        nickname: this.pendingNickname || data.nickname || null,
        accountId: this.pendingAccountId || data.accountId || null,
        createdAt: data.createdAt?.toDate?.() || new Date()
      };
      this.suppressPush = true;
      if (isNew) saveSystem.claimForNewAccount(user.uid);
      else saveSystem.applyCloud(user.uid, data);
      this.suppressPush = false;
      if (!this.state().needsNickname) await this.push(isNew);
      trackEvent(isNew ? 'sign_up' : 'login', { method: providerOf(user) });
    } catch (e) {
      this.suppressPush = false;
      console.warn('Cloud save load failed; playing with the local save.', e);
    }
    this.pendingNickname = null;
    this.pendingAccountId = null;
    this.syncing = false;
    this.emit();
  }

  schedulePush() {
    this.emit();
    if (!this.user || this.suppressPush) return;
    clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => this.push(false), PUSH_DELAY_MS);
  }

  async push(isNew) {
    if (!this.user) return;
    clearTimeout(this.pushTimer);
    this.pushTimer = null;
    const data = {
      ...saveSystem.progressSnapshot(),
      displayName: this.displayName().slice(0, 120),
      accountId: this.accountId().slice(0, 120),
      provider: providerOf(this.user),
      updatedAt: serverTimestamp()
    };
    if (this.user.isAnonymous) {
      data.nickname = this.profile?.nickname || 'Guest';
      data.expireAt = Timestamp.fromMillis(Date.now() + GUEST_RETENTION_MS);
    }
    if (isNew) data.createdAt = serverTimestamp();
    try {
      await setDoc(this.userRef(), data, { merge: true });
    } catch (e) {
      console.warn('Cloud save upload failed; will retry on the next save.', e);
    }
  }

  /** Guests: set or change the nickname that their progress is filed under. */
  async setNickname(nickname) {
    if (!this.user?.isAnonymous) return;
    const first = !this.profile?.nickname;
    this.profile = { ...this.profile, nickname };
    this.emit();
    await this.push(first);
  }

  async changePassword(current, next) {
    const user = this.user;
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, current));
    await updatePassword(user, next);
  }

  /**
   * Guests lose access for good: their anonymous account is deleted, while the Firestore record
   * (nickname + mileage) stays until its expireAt passes.
   */
  async logout() {
    const user = this.user;
    if (!user) return;
    await this.push(false);
    if (user.isAnonymous) {
      try {
        await deleteUser(user);
      } catch (e) {
        console.warn('Guest account delete failed; signing out instead.', e);
      }
    }
    if (auth.currentUser) await signOut(auth);
    saveSystem.resetProgress();
  }
}

export const cloudSave = new CloudSave();
