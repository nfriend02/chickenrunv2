import { Stages } from '../core/GameState.js';
import { saveSystem } from '../core/SaveSystem.js';
import { cloudSave } from '../core/CloudSave.js';
import { i18n, stageName, t } from '../core/i18n.js';
import { InputError, readNickname } from './AuthUI.js';

const PASSWORD_ERRORS = {
  'auth/invalid-credential': 'mypage.err.wrongCurrent',
  'auth/wrong-password': 'mypage.err.wrongCurrent',
  'auth/weak-password': 'mypage.err.newTooShort',
  'auth/too-many-requests': 'auth.err.tooMany',
  'auth/requires-recent-login': 'mypage.err.recentLogin'
};

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function isShown(el) {
  return !!el && !el.classList.contains('hidden') && el.style.display !== 'none';
}

/**
 * Top-right account bar (language + My Page + logout) on the title, settings and score screens,
 * the floating language button on the login screen, the My Page modal, and the logout confirmation.
 */
export class AccountUI {
  constructor() {
    this.bar = document.getElementById('account-bar');
    this.nameEl = document.getElementById('account-name');
    this.mileageEl = document.getElementById('account-mileage');
    this.mypage = document.getElementById('mypage-modal');
    this.body = document.getElementById('mypage-body');
    this.confirmModal = document.getElementById('confirm-modal');
    this.confirmKey = null;
    this.langBtn = document.getElementById('lang-btn');
    this.langFloat = document.getElementById('lang-float');
    this.mypageBtn = document.getElementById('mypage-btn');
    this.watched = ['title-screen', 'settings-modal', 'result-modal', 'login-screen', 'mypage-modal', 'confirm-modal']
      .map(id => document.getElementById(id));
    this.state = cloudSave.state();

    this.langBtn.addEventListener('click', () => i18n.cycle());
    this.mypageBtn.addEventListener('click', () => this.openMypage());
    document.getElementById('logout-btn').addEventListener('click', () => this.confirmLogout());
    this.body.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleForm(e.target);
    });
    this.body.addEventListener('click', (e) => {
      const toggle = e.target.closest('[data-toggle]');
      if (toggle) this.body.querySelector(`#${toggle.dataset.toggle}`)?.classList.toggle('hidden');
    });

    const observer = new MutationObserver(() => this.updateVisibility());
    this.watched.forEach(el => el && observer.observe(el, { attributes: true, attributeFilter: ['class', 'style'] }));

    cloudSave.subscribe((s) => {
      this.state = s;
      this.renderBar();
      this.updateVisibility();
      if (isShown(this.mypage)) this.renderMypage(false);
    });

    i18n.subscribe(() => {
      this.renderBar();
      if (isShown(this.mypage)) this.renderMypage(false);
      if (this.confirmKey) document.getElementById('confirm-text').textContent = t(this.confirmKey);
    });
    this.updateVisibility();
  }

  renderBar() {
    const { user, syncing, mileage } = this.state;
    if (!user) return;
    this.nameEl.textContent = `👤 ${cloudSave.displayName()}`;
    this.mileageEl.textContent = syncing ? '…' : mileage.toLocaleString(i18n.locale());
  }

  updateVisibility() {
    const [title, settings, result, login, mypage, confirm] = this.watched;
    const onMenuScreen = isShown(title) || isShown(settings) || isShown(result);
    const show = !!this.state.user && !this.state.needsNickname && onMenuScreen
      && !isShown(login) && !isShown(mypage) && !isShown(confirm);
    this.bar.classList.toggle('hidden', !show);

    const onLogin = isShown(login);
    if (show && this.langBtn.parentElement !== this.bar) this.bar.insertBefore(this.langBtn, this.mypageBtn);
    if (onLogin && !show && this.langBtn.parentElement !== this.langFloat) this.langFloat.appendChild(this.langBtn);
    this.langFloat.classList.toggle('hidden', !onLogin || show);
  }

  openMypage() {
    this.renderMypage(true);
    this.mypage.classList.remove('hidden');
  }

  renderMypage(resetForms) {
    if (!resetForms && this.body.querySelector('input:focus')) return;
    const { user, provider, profile } = this.state;
    if (!user) {
      this.mypage.classList.add('hidden');
      return;
    }
    const isGuest = provider === 'guest';
    const hasPassword = provider === 'email' || provider === 'phone';
    const idLabel = t(isGuest ? 'mypage.idNickname' : provider === 'phone' ? 'mypage.idPhone' : provider === 'google' ? 'mypage.idGoogle' : 'mypage.idEmail');
    const joined = profile?.createdAt ? profile.createdAt.toLocaleDateString(i18n.locale()) : '-';
    const num = (n) => n.toLocaleString(i18n.locale());
    const best = Stages.map(st => `
      <div class="mp-stage"><span>${escapeHtml(stageName(st))}</span><b>${num(saveSystem.getHighScore(st.id))}</b></div>`).join('');

    let passwordBlock;
    if (hasPassword) {
      passwordBlock = `
        <div class="mp-row"><span class="mp-label">${t('mypage.password')}</span>
          <span class="mp-value mp-password">••••••••
            <button class="mp-mini-btn" type="button" data-toggle="mp-pw-form">${t('mypage.change')}</button></span></div>
        <p class="mp-hint">${t('mypage.passwordHint')}</p>
        <form id="mp-pw-form" class="mp-form hidden" data-form="password" novalidate>
          <input class="farm-input" name="current" type="password" placeholder="${t('mypage.currentPassword')}" autocomplete="current-password">
          <input class="farm-input" name="next" type="password" placeholder="${t('mypage.newPassword')}" autocomplete="new-password">
          <input class="farm-input" name="next2" type="password" placeholder="${t('mypage.newPasswordConfirm')}" autocomplete="new-password">
          <button class="farm-btn farm-btn-orange" type="submit">${t('mypage.changePassword')}</button>
          <p class="mp-msg" role="status"></p>
        </form>`;
    } else if (provider === 'google') {
      passwordBlock = `<div class="mp-row"><span class="mp-label">${t('mypage.password')}</span><span class="mp-value">${t('mypage.googleManaged')}</span></div>`;
    } else {
      passwordBlock = `
        <div class="mp-row"><span class="mp-label">${t('mypage.password')}</span><span class="mp-value">${t('mypage.guestNoPassword')}</span></div>
        <form class="mp-form mp-form-inline" data-form="nickname" novalidate>
          <input class="farm-input" name="nickname" type="text" maxlength="12" value="${escapeHtml(profile?.nickname || '')}" placeholder="${t('mypage.newNickname')}">
          <button class="farm-btn farm-btn-green" type="submit">${t('mypage.changeNickname')}</button>
          <p class="mp-msg" role="status"></p>
        </form>
        <p class="mp-hint mp-warn">${t('mypage.guestWarn')}</p>`;
    }

    this.body.innerHTML = `
      <div class="mp-mileage">
        <span class="mp-coin">🪙</span>
        <div><div class="mp-mileage-num">${num(saveSystem.getMileage())}</div><div class="mp-mileage-label">${t('mypage.mileage')}</div></div>
        <div class="mp-runs">${t('mypage.runs', { n: num(saveSystem.data.totalRuns || 0) })}</div>
      </div>
      <div class="mp-rows">
        <div class="mp-row"><span class="mp-label">${t('mypage.method')}</span><span class="mp-value">${t(`provider.${provider}`)}</span></div>
        <div class="mp-row"><span class="mp-label">${idLabel}</span><span class="mp-value mp-id">${escapeHtml(cloudSave.accountId())}</span></div>
        ${passwordBlock}
        <div class="mp-row"><span class="mp-label">${t('mypage.joined')}</span><span class="mp-value">${joined}</span></div>
      </div>
      <h3 class="mp-subtitle">${t('mypage.bestScores')}</h3>
      <div class="mp-stages">${best}</div>`;
  }

  async handleForm(form) {
    const msg = form.querySelector('.mp-msg');
    const say = (key, ok = false, vars) => {
      msg.textContent = t(key, vars);
      msg.classList.toggle('ok', ok);
    };
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      if (form.dataset.form === 'password') {
        if (!form.current.value) throw new InputError('mypage.err.currentRequired');
        if (form.next.value.length < 6) throw new InputError('mypage.err.newTooShort');
        if (form.next.value !== form.next2.value) throw new InputError('mypage.err.newMismatch');
        await cloudSave.changePassword(form.current.value, form.next.value);
        form.reset();
        say('mypage.passwordChanged', true);
      } else if (form.dataset.form === 'nickname') {
        await cloudSave.setNickname(readNickname(form.nickname.value));
        say('mypage.nicknameChanged', true);
      }
    } catch (e) {
      if (e instanceof InputError) say(e.key, false, e.vars);
      else if (PASSWORD_ERRORS[e.code]) say(PASSWORD_ERRORS[e.code]);
      else say('auth.err.unknown', false, { code: e.code || e.message });
    } finally {
      btn.disabled = false;
    }
  }

  confirm(key) {
    return new Promise((resolve) => {
      this.confirmKey = key;
      document.getElementById('confirm-text').textContent = t(key);
      this.confirmModal.classList.remove('hidden');
      const done = (ok) => {
        this.confirmModal.classList.add('hidden');
        this.confirmKey = null;
        yes.removeEventListener('click', onYes);
        no.removeEventListener('click', onNo);
        resolve(ok);
      };
      const yes = document.getElementById('confirm-yes');
      const no = document.getElementById('confirm-no');
      const onYes = () => done(true);
      const onNo = () => done(false);
      yes.addEventListener('click', onYes);
      no.addEventListener('click', onNo);
    });
  }

  async confirmLogout() {
    const isGuest = this.state.provider === 'guest';
    const ok = await this.confirm(isGuest ? 'confirm.logoutGuest' : 'confirm.logout');
    if (!ok) return;
    ['settings-modal', 'result-modal', 'mypage-modal'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
    const game = window.__CHICKEN_RUN_GAME__;
    if (game && game.state !== 'TITLE' && typeof game.returnToTitle === 'function') game.returnToTitle();
    try {
      await cloudSave.logout();
    } catch (e) {
      console.warn('Logout failed', e);
    }
  }
}
