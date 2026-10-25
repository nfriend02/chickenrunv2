import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect
} from 'firebase/auth';
import { auth } from '../core/firebase.js';
import { cloudSave, formatPhone, phoneLoginEmail } from '../core/CloudSave.js';
import { i18n, t } from '../core/i18n.js';

const ERROR_KEY = {
  'auth/invalid-email': 'auth.err.invalidEmail',
  'auth/missing-password': 'auth.err.missingPassword',
  'auth/weak-password': 'auth.err.weakPassword',
  'auth/email-already-in-use': 'auth.err.emailInUse',
  'auth/invalid-credential': 'auth.err.wrongEmailLogin',
  'auth/wrong-password': 'auth.err.wrongEmailLogin',
  'auth/user-not-found': 'auth.err.emailNotFound',
  'auth/too-many-requests': 'auth.err.tooMany',
  'auth/popup-closed-by-user': 'auth.err.popupClosed',
  'auth/cancelled-popup-request': 'auth.err.popupClosed',
  'auth/unauthorized-domain': 'auth.err.domain',
  'auth/operation-not-allowed': 'auth.err.disabled',
  'auth/admin-restricted-operation': 'auth.err.disabled',
  'auth/network-request-failed': 'auth.err.network'
};

const PHONE_ERROR_KEY = {
  'auth/email-already-in-use': 'auth.err.phoneInUse',
  'auth/invalid-credential': 'auth.err.wrongPhoneLogin',
  'auth/wrong-password': 'auth.err.wrongPhoneLogin',
  'auth/user-not-found': 'auth.err.phoneNotFound',
  'auth/invalid-email': 'auth.err.phoneInvalid'
};

/** Validation failure; carries an i18n key so the message follows the current language. */
export class InputError extends Error {
  constructor(key, vars) {
    super(key);
    this.key = key;
    this.vars = vars;
  }
}

/** Country code and number, ignoring '+', '-' and spaces; a leading trunk 0 (010...) is dropped. */
function readPhone(form) {
  const cc = form.cc.value.replace(/[^\d]/g, '');
  let number = form.phone.value.replace(/[\s-]/g, '');
  if (!/^\d{1,4}$/.test(cc)) throw new InputError('auth.in.countryCode');
  if (!/^\d+$/.test(number)) throw new InputError('auth.in.phoneDigits');
  number = number.replace(/^0+/, '');
  if (number.length < 7 || number.length > 13) throw new InputError('auth.in.phoneLength');
  return { cc, number };
}

function readNewPassword(form) {
  const pw = form.password.value;
  if (pw.length < 6) throw new InputError('auth.err.weakPassword');
  if (pw !== form.password2.value) throw new InputError('auth.in.passwordMismatch');
  return pw;
}

function readEmail(form) {
  const email = form.email.value.trim();
  if (!email) throw new InputError('auth.in.emailRequired');
  return email;
}

export function readNickname(value) {
  const nick = value.trim().replace(/\s+/g, ' ');
  if (nick.length < 2 || nick.length > 12) throw new InputError('auth.in.nickname');
  return nick;
}

/**
 * Login / sign-up overlay. It stays above the title screen until the player is signed in
 * (guests also need a nickname), then the title screen underneath is ready to play.
 */
export class AuthUI {
  constructor() {
    this.screen = document.getElementById('login-screen');
    this.message = document.getElementById('login-message');
    this.busy = false;
    this.view = 'menu';
    this.messageState = null;

    this.bindEvents();
    getRedirectResult(auth).catch((e) => this.showError(e));
    cloudSave.subscribe((s) => this.render(s));
    i18n.subscribe(() => this.refreshMessage());
  }

  bindEvents() {
    this.screen.addEventListener('click', (e) => {
      const goto = e.target.closest('[data-goto]');
      if (goto) {
        e.preventDefault();
        this.showView(goto.dataset.goto);
        return;
      }
      const btn = e.target.closest('[data-action]');
      if (btn) {
        e.preventDefault();
        this.run(btn.dataset.action, btn.closest('form'));
      }
    });
    this.screen.querySelectorAll('form[data-submit]').forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.run(form.dataset.submit, form);
      });
    });
  }

  render({ user, authResolved, needsNickname }) {
    const show = authResolved && (!user || needsNickname);
    this.screen.classList.toggle('hidden', !show);
    if (show && needsNickname && this.view !== 'guest') this.showView('guest');
    if (!show) this.view = null;
    else if (!this.view) this.showView('menu');
  }

  showView(name) {
    this.view = name;
    this.screen.querySelectorAll('.login-view').forEach(v => v.classList.toggle('hidden', v.dataset.view !== name));
    this.setMessage(null);
    const first = this.screen.querySelector(`.login-view[data-view="${name}"] input:not(.cc-input)`);
    if (first && window.matchMedia('(hover: hover)').matches) first.focus();
  }

  /** Shows an i18n message (null clears it); it is re-translated when the language changes. */
  setMessage(key, vars, ok = false) {
    this.messageState = key ? { key, vars, ok } : null;
    this.refreshMessage();
  }

  refreshMessage() {
    const m = this.messageState;
    this.message.textContent = m ? t(m.key, m.vars) : '';
    this.message.classList.toggle('ok', !!m?.ok);
  }

  showError(e, phone = false) {
    if (e instanceof InputError) {
      this.setMessage(e.key, e.vars);
      return;
    }
    console.warn('Auth error', e);
    const key = (phone && PHONE_ERROR_KEY[e?.code]) || ERROR_KEY[e?.code];
    if (key) this.setMessage(key);
    else this.setMessage('auth.err.unknown', { code: e?.code || e?.message || String(e) });
  }

  async run(action, form) {
    if (this.busy) return;
    this.busy = true;
    this.screen.classList.add('busy');
    this.setMessage(null);
    try {
      await this.actions[action].call(this, form);
    } catch (e) {
      cloudSave.pendingAccountId = null;
      cloudSave.pendingNickname = null;
      this.showError(e, action.includes('phone'));
    } finally {
      this.busy = false;
      this.screen.classList.remove('busy');
    }
  }

  actions = {
    async google() {
      const provider = new GoogleAuthProvider();
      try {
        await signInWithPopup(auth, provider);
      } catch (e) {
        if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') {
          await signInWithRedirect(auth, provider);
        } else {
          throw e;
        }
      }
    },

    async 'email-login'(form) {
      const email = readEmail(form);
      if (!form.password.value) throw new InputError('auth.err.missingPassword');
      await signInWithEmailAndPassword(auth, email, form.password.value);
    },

    async 'email-reset'(form) {
      const email = form.email.value.trim();
      if (!email) throw new InputError('auth.in.resetEmail');
      await sendPasswordResetEmail(auth, email);
      this.setMessage('auth.resetSent', { email }, true);
    },

    async 'phone-login'(form) {
      const { cc, number } = readPhone(form);
      if (!form.password.value) throw new InputError('auth.err.missingPassword');
      await signInWithEmailAndPassword(auth, phoneLoginEmail(cc, number), form.password.value);
    },

    async 'signup-email'(form) {
      const email = readEmail(form);
      const pw = readNewPassword(form);
      cloudSave.pendingAccountId = email;
      await createUserWithEmailAndPassword(auth, email, pw);
    },

    async 'signup-phone'(form) {
      const { cc, number } = readPhone(form);
      const pw = readNewPassword(form);
      cloudSave.pendingAccountId = formatPhone(cc, number);
      await createUserWithEmailAndPassword(auth, phoneLoginEmail(cc, number), pw);
    },

    async guest(form) {
      const nickname = readNickname(form.nickname.value);
      if (auth.currentUser?.isAnonymous) {
        await cloudSave.setNickname(nickname);
        return;
      }
      cloudSave.pendingNickname = nickname;
      await signInAnonymously(auth);
    }
  };
}
