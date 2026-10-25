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

const ERROR_TEXT = {
  'auth/invalid-email': '이메일 형식이 올바르지 않아요.',
  'auth/missing-password': '비밀번호를 입력해 주세요.',
  'auth/weak-password': '비밀번호는 6자 이상이어야 해요.',
  'auth/email-already-in-use': '이미 가입된 이메일이에요. 로그인해 주세요.',
  'auth/invalid-credential': '이메일 또는 비밀번호가 맞지 않아요.',
  'auth/wrong-password': '이메일 또는 비밀번호가 맞지 않아요.',
  'auth/user-not-found': '가입되지 않은 이메일이에요.',
  'auth/too-many-requests': '시도가 너무 많아요. 잠시 후 다시 해 주세요.',
  'auth/popup-closed-by-user': '로그인 창이 닫혔어요.',
  'auth/cancelled-popup-request': '로그인 창이 닫혔어요.',
  'auth/unauthorized-domain': '이 주소에서는 로그인할 수 없어요. (Firebase 승인 도메인 확인 필요)',
  'auth/operation-not-allowed': '이 로그인 방법이 Firebase에서 꺼져 있어요.',
  'auth/admin-restricted-operation': '이 로그인 방법이 Firebase에서 꺼져 있어요.',
  'auth/network-request-failed': '네트워크 연결을 확인해 주세요.'
};

const PHONE_ERROR_TEXT = {
  'auth/email-already-in-use': '이미 가입된 휴대폰번호예요. 로그인해 주세요.',
  'auth/invalid-credential': '휴대폰번호 또는 비밀번호가 맞지 않아요.',
  'auth/wrong-password': '휴대폰번호 또는 비밀번호가 맞지 않아요.',
  'auth/user-not-found': '가입되지 않은 휴대폰번호예요.',
  'auth/invalid-email': '휴대폰번호 형식이 올바르지 않아요.'
};

class InputError extends Error {}

/** Country code and number, ignoring '+', '-' and spaces; a leading trunk 0 (010...) is dropped. */
function readPhone(form) {
  const cc = form.cc.value.replace(/[^\d]/g, '');
  let number = form.phone.value.replace(/[\s-]/g, '');
  if (!/^\d{1,4}$/.test(cc)) throw new InputError('국가번호를 확인해 주세요. (예: +82)');
  if (!/^\d+$/.test(number)) throw new InputError('휴대폰번호는 숫자만 입력해 주세요.');
  number = number.replace(/^0+/, '');
  if (number.length < 7 || number.length > 13) throw new InputError('휴대폰번호를 확인해 주세요. (예: 10 1234 5678)');
  return { cc, number };
}

function readNewPassword(form) {
  const pw = form.password.value;
  if (pw.length < 6) throw new InputError('비밀번호는 6자 이상이어야 해요.');
  if (pw !== form.password2.value) throw new InputError('비밀번호 확인이 일치하지 않아요.');
  return pw;
}

function readEmail(form) {
  const email = form.email.value.trim();
  if (!email) throw new InputError('이메일을 입력해 주세요.');
  return email;
}

export function readNickname(value) {
  const nick = value.trim().replace(/\s+/g, ' ');
  if (nick.length < 2 || nick.length > 12) throw new InputError('별명은 2~12자로 정해 주세요.');
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
    this.setMessage('');
    const first = this.screen.querySelector(`.login-view[data-view="${name}"] input:not(.cc-input)`);
    if (first && window.matchMedia('(hover: hover)').matches) first.focus();
  }

  setMessage(text, ok = false) {
    this.message.textContent = text;
    this.message.classList.toggle('ok', ok);
  }

  showError(e, phone = false) {
    if (e instanceof InputError) {
      this.setMessage(e.message);
      return;
    }
    console.warn('Auth error', e);
    const text = (phone && PHONE_ERROR_TEXT[e?.code]) || ERROR_TEXT[e?.code];
    this.setMessage(text || `처리하지 못했어요. (${e?.code || e?.message || e})`);
  }

  async run(action, form) {
    if (this.busy) return;
    this.busy = true;
    this.screen.classList.add('busy');
    this.setMessage('');
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
      if (!form.password.value) throw new InputError('비밀번호를 입력해 주세요.');
      await signInWithEmailAndPassword(auth, email, form.password.value);
    },

    async 'email-reset'(form) {
      const email = form.email.value.trim();
      if (!email) throw new InputError('비밀번호를 재설정할 이메일을 먼저 입력해 주세요.');
      await sendPasswordResetEmail(auth, email);
      this.setMessage(`${email} 로 비밀번호 재설정 메일을 보냈어요.`, true);
    },

    async 'phone-login'(form) {
      const { cc, number } = readPhone(form);
      if (!form.password.value) throw new InputError('비밀번호를 입력해 주세요.');
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
