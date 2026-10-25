import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, trackEvent } from './firebase.js';
import { saveSystem } from './SaveSystem.js';

const PUSH_DELAY_MS = 1500;

function providerOf(user) {
  if (user.isAnonymous) return 'anonymous';
  return user.providerData[0]?.providerId || 'unknown';
}

export function displayNameOf(user) {
  if (!user) return '';
  if (user.isAnonymous) return '게스트';
  return user.displayName || user.email || user.phoneNumber || '플레이어';
}

/**
 * Keeps the local save (SaveSystem / localStorage) in sync with Firestore users/{uid}.
 * Local saves always happen first, so the game keeps working offline; the cloud copy follows.
 */
class CloudSave {
  constructor() {
    this.user = null;
    this.authResolved = false;
    this.syncing = false;
    this.listeners = new Set();
    this.pushTimer = null;
    this.suppressPush = false;

    saveSystem.onSave = () => this.schedulePush();
    onAuthStateChanged(auth, (user) => this.handleUser(user));
  }

  /** fn({ user, authResolved, syncing, mileage }) runs now and on every change. */
  subscribe(fn) {
    this.listeners.add(fn);
    fn(this.state());
    return () => this.listeners.delete(fn);
  }

  state() {
    return { user: this.user, authResolved: this.authResolved, syncing: this.syncing, mileage: saveSystem.getMileage() };
  }

  emit() {
    const s = this.state();
    this.listeners.forEach(fn => fn(s));
  }

  userRef() {
    return doc(db, 'users', this.user.uid);
  }

  async handleUser(user) {
    this.user = user;
    this.authResolved = true;
    if (!user) {
      this.emit();
      return;
    }
    this.syncing = true;
    this.emit();
    try {
      const snap = await getDoc(this.userRef());
      this.suppressPush = true;
      if (snap.exists()) {
        saveSystem.applyCloud(user.uid, snap.data());
      } else {
        saveSystem.claimForNewAccount(user.uid);
      }
      this.suppressPush = false;
      await this.push(!snap.exists());
      trackEvent('login', { method: providerOf(user) });
    } catch (e) {
      this.suppressPush = false;
      console.warn('Cloud save load failed; playing with the local save.', e);
    }
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
    const data = {
      ...saveSystem.progressSnapshot(),
      displayName: displayNameOf(this.user),
      provider: providerOf(this.user),
      updatedAt: serverTimestamp()
    };
    if (isNew) data.createdAt = serverTimestamp();
    try {
      await setDoc(this.userRef(), data, { merge: true });
    } catch (e) {
      console.warn('Cloud save upload failed; will retry on the next save.', e);
    }
  }

  async logout() {
    if (this.pushTimer) await this.push(false);
    await signOut(auth);
    saveSystem.resetProgress();
  }
}

export const cloudSave = new CloudSave();
