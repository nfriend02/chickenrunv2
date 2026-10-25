import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  getRedirectResult,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithRedirect
} from 'firebase/auth';
import { auth } from '../core/firebase.js';
import { cloudSave, displayNameOf } from '../core/CloudSave.js';

const ERROR_TEXT = {
  'auth/invalid-email': '이메일 형식이 올바르지 않습니다.',
  'auth/missing-password': '비밀번호를 입력해 주세요.',
  'auth/weak-password': '비밀번호는 6자 이상이어야 합니다.',
  'auth/email-already-in-use': '이미 가입된 이메일입니다. 로그인해 주세요.',
  'auth/invalid-credential': '이메일 또는 비밀번호가 맞지 않습니다.',
  'auth/wrong-password': '이메일 또는 비밀번호가 맞지 않습니다.',
  'auth/user-not-found': '가입되지 않은 이메일입니다.',
  'auth/too-many-requests': '시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  'auth/invalid-phone-number': '휴대폰 번호 형식이 올바르지 않습니다.',
  'auth/invalid-verification-code': '인증번호가 맞지 않습니다.',
  'auth/code-expired': '인증번호가 만료되었습니다. 다시 받아 주세요.',
  'auth/quota-exceeded': '오늘 보낼 수 있는 인증 문자 수를 넘었습니다.',
  'auth/popup-closed-by-user': '로그인 창이 닫혔습니다.',
  'auth/cancelled-popup-request': '로그인 창이 닫혔습니다.',
  'auth/unauthorized-domain': '이 주소에서는 로그인할 수 없습니다. (Firebase 승인 도메인 확인 필요)',
  'auth/operation-not-allowed': '이 로그인 방법이 Firebase에서 꺼져 있습니다.',
  'auth/network-request-failed': '네트워크 연결을 확인해 주세요.'
};

function errorText(e) {
  return ERROR_TEXT[e?.code] || `로그인에 실패했습니다. (${e?.code || e?.message || e})`;
}

/** Korean mobile numbers: 010-1234-5678 -> +821012345678. Numbers already starting with + are kept. */
function toE164(raw) {
  const s = raw.replace(/[^\d+]/g, '');
  if (s.startsWith('+')) return s;
  if (s.startsWith('0')) return `+82${s.slice(1)}`;
  return `+82${s}`;
}

/**
 * Login overlay shown above the title screen while nobody is signed in,
 * plus the account bar (name, mileage, logout) on the title screen.
 */
export class AuthUI {
  constructor() {
    this.screen = document.getElementById('login-screen');
    this.message = document.getElementById('login-message');
    this.accountBar = document.getElementById('account-bar');
    this.accountName = document.getElementById('account-name');
    this.accountMileage = document.getElementById('account-mileage');
    this.confirmation = null;
    this.recaptcha = null;
    this.busy = false;

    this.bindEvents();
    getRedirectResult(auth).catch((e) => this.showError(e));
    cloudSave.subscribe((s) => this.render(s));
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
      if (btn && btn.type !== 'submit') {
        e.preventDefault();
        this.run(btn.dataset.action);
      }
    });
    document.getElementById('email-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.run('email-signin');
    });
    document.getElementById('phone-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.run('phone-send');
    });
    document.getElementById('logout-btn').addEventListener('click', () => {
      cloudSave.logout().catch((e) => console.warn('Logout failed', e));
    });
  }

  render({ user, authResolved, syncing, mileage }) {
    const signedIn = !!user;
    this.screen.classList.toggle('hidden', !authResolved || signedIn);
    this.accountBar.classList.toggle('hidden', !signedIn);
    if (signedIn) {
      this.accountName.textContent = `👤 ${displayNameOf(user)}`;
      this.accountMileage.textContent = syncing ? '…' : mileage.toLocaleString();
    } else if (authResolved) {
      this.showView('menu');
    }
  }

  showView(name) {
    this.screen.querySelectorAll('.login-view').forEach(v => v.classList.toggle('hidden', v.dataset.view !== name));
    if (name === 'phone') this.showPhoneStep('number');
    this.setMessage('');
  }

  showPhoneStep(step) {
    this.screen.querySelectorAll('.phone-step').forEach(s => s.classList.toggle('hidden', s.dataset.step !== step));
  }

  setMessage(text, ok = false) {
    this.message.textContent = text;
    this.message.classList.toggle('ok', ok);
  }

  showError(e) {
    console.warn('Auth error', e);
    this.setMessage(errorText(e));
  }

  async run(action) {
    if (this.busy) return;
    this.busy = true;
    this.screen.classList.add('busy');
    try {
      await this.actions[action].call(this);
    } catch (e) {
      this.showError(e);
    } finally {
      this.busy = false;
      this.screen.classList.remove('busy');
    }
  }

  emailValues() {
    return {
      email: document.getElementById('login-email').value.trim(),
      password: document.getElementById('login-password').value
    };
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

    async guest() {
      await signInAnonymously(auth);
    },

    async 'email-signin'() {
      const { email, password } = this.emailValues();
      await signInWithEmailAndPassword(auth, email, password);
    },

    async 'email-signup'() {
      const { email, password } = this.emailValues();
      await createUserWithEmailAndPassword(auth, email, password);
    },

    async 'email-reset'() {
      const { email } = this.emailValues();
      if (!email) {
        this.setMessage('비밀번호를 재설정할 이메일을 먼저 입력해 주세요.');
        return;
      }
      await sendPasswordResetEmail(auth, email);
      this.setMessage(`${email} 로 비밀번호 재설정 메일을 보냈습니다.`, true);
    },

    async 'phone-send'() {
      const raw = document.getElementById('login-phone').value;
      if (!raw.trim()) {
        this.setMessage('휴대폰 번호를 입력해 주세요.');
        return;
      }
      if (!this.recaptcha) {
        this.recaptcha = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      }
      try {
        this.confirmation = await signInWithPhoneNumber(auth, toE164(raw), this.recaptcha);
      } catch (e) {
        this.recaptcha.clear();
        this.recaptcha = null;
        throw e;
      }
      this.showPhoneStep('code');
      this.setMessage('문자로 받은 인증번호 6자리를 입력해 주세요.', true);
      document.getElementById('login-code').focus();
    },

    async 'phone-verify'() {
      const code = document.getElementById('login-code').value.trim();
      if (!this.confirmation || code.length < 6) {
        this.setMessage('인증번호 6자리를 입력해 주세요.');
        return;
      }
      await this.confirmation.confirm(code);
    },

    async 'phone-retry'() {
      this.confirmation = null;
      this.showPhoneStep('number');
      this.setMessage('');
    }
  };
}
