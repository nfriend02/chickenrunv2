import { Stages } from '../core/GameState.js';
import { saveSystem } from '../core/SaveSystem.js';
import { PROVIDER_LABEL, cloudSave } from '../core/CloudSave.js';
import { readNickname } from './AuthUI.js';

const PASSWORD_ERRORS = {
  'auth/invalid-credential': '현재 비밀번호가 맞지 않아요.',
  'auth/wrong-password': '현재 비밀번호가 맞지 않아요.',
  'auth/weak-password': '새 비밀번호는 6자 이상이어야 해요.',
  'auth/too-many-requests': '시도가 너무 많아요. 잠시 후 다시 해 주세요.',
  'auth/requires-recent-login': '보안을 위해 다시 로그인한 뒤 바꿔 주세요.'
};

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function isShown(el) {
  return !!el && !el.classList.contains('hidden') && el.style.display !== 'none';
}

/**
 * Top-right account bar (마이페이지 + 로그아웃) on the title, settings and score screens,
 * the My Page modal, and the logout confirmation.
 */
export class AccountUI {
  constructor() {
    this.bar = document.getElementById('account-bar');
    this.nameEl = document.getElementById('account-name');
    this.mileageEl = document.getElementById('account-mileage');
    this.mypage = document.getElementById('mypage-modal');
    this.body = document.getElementById('mypage-body');
    this.confirmModal = document.getElementById('confirm-modal');
    this.watched = ['title-screen', 'settings-modal', 'result-modal', 'login-screen', 'mypage-modal', 'confirm-modal']
      .map(id => document.getElementById(id));
    this.state = cloudSave.state();

    document.getElementById('mypage-btn').addEventListener('click', () => this.openMypage());
    document.getElementById('logout-btn').addEventListener('click', () => this.confirmLogout());
    this.body.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleForm(e.target);
    });
    this.body.addEventListener('click', (e) => {
      const t = e.target.closest('[data-toggle]');
      if (t) this.body.querySelector(`#${t.dataset.toggle}`)?.classList.toggle('hidden');
    });

    const observer = new MutationObserver(() => this.updateVisibility());
    this.watched.forEach(el => el && observer.observe(el, { attributes: true, attributeFilter: ['class', 'style'] }));

    cloudSave.subscribe((s) => {
      this.state = s;
      this.renderBar();
      this.updateVisibility();
      if (isShown(this.mypage)) this.renderMypage(false);
    });
  }

  renderBar() {
    const { user, syncing, mileage } = this.state;
    if (!user) return;
    this.nameEl.textContent = `👤 ${cloudSave.displayName()}`;
    this.mileageEl.textContent = syncing ? '…' : mileage.toLocaleString();
  }

  updateVisibility() {
    const [title, settings, result, login, mypage, confirm] = this.watched;
    const onMenuScreen = isShown(title) || isShown(settings) || isShown(result);
    const show = !!this.state.user && !this.state.needsNickname && onMenuScreen
      && !isShown(login) && !isShown(mypage) && !isShown(confirm);
    this.bar.classList.toggle('hidden', !show);
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
    const idLabel = isGuest ? '별명' : provider === 'phone' ? '휴대폰번호' : provider === 'google' ? 'Google 계정' : '이메일';
    const joined = profile?.createdAt ? profile.createdAt.toLocaleDateString('ko-KR') : '-';
    const best = Stages.map(st => `
      <div class="mp-stage"><span>${escapeHtml(st.name || `Stage ${st.id}`)}</span><b>${saveSystem.getHighScore(st.id).toLocaleString()}</b></div>`).join('');

    let passwordBlock;
    if (hasPassword) {
      passwordBlock = `
        <div class="mp-row"><span class="mp-label">비밀번호</span>
          <span class="mp-value mp-password">••••••••
            <button class="mp-mini-btn" type="button" data-toggle="mp-pw-form">변경</button></span></div>
        <p class="mp-hint">비밀번호는 암호화되어 저장되므로 원래 글자는 다시 볼 수 없어요. 아래에서 새 비밀번호로 바꿀 수 있어요.</p>
        <form id="mp-pw-form" class="mp-form hidden" data-form="password" novalidate>
          <input class="farm-input" name="current" type="password" placeholder="현재 비밀번호" autocomplete="current-password">
          <input class="farm-input" name="next" type="password" placeholder="새 비밀번호 (6자 이상)" autocomplete="new-password">
          <input class="farm-input" name="next2" type="password" placeholder="새 비밀번호 확인" autocomplete="new-password">
          <button class="farm-btn farm-btn-orange" type="submit">비밀번호 변경</button>
          <p class="mp-msg" role="status"></p>
        </form>`;
    } else if (provider === 'google') {
      passwordBlock = `<div class="mp-row"><span class="mp-label">비밀번호</span><span class="mp-value">Google 계정에서 관리해요</span></div>`;
    } else {
      passwordBlock = `
        <div class="mp-row"><span class="mp-label">비밀번호</span><span class="mp-value">게스트는 비밀번호가 없어요</span></div>
        <form class="mp-form mp-form-inline" data-form="nickname" novalidate>
          <input class="farm-input" name="nickname" type="text" maxlength="12" value="${escapeHtml(profile?.nickname || '')}" placeholder="새 별명 (2~12자)">
          <button class="farm-btn farm-btn-green" type="submit">별명 변경</button>
          <p class="mp-msg" role="status"></p>
        </form>
        <p class="mp-hint mp-warn">게스트는 로그아웃하면 이 별명과 마일리지를 다시 불러올 수 없어요. 계속 보관하려면 회원가입을 해 주세요.</p>`;
    }

    this.body.innerHTML = `
      <div class="mp-mileage">
        <span class="mp-coin">🪙</span>
        <div><div class="mp-mileage-num">${saveSystem.getMileage().toLocaleString()}</div><div class="mp-mileage-label">마일리지</div></div>
        <div class="mp-runs">플레이 <b>${(saveSystem.data.totalRuns || 0).toLocaleString()}</b>회</div>
      </div>
      <div class="mp-rows">
        <div class="mp-row"><span class="mp-label">로그인 방법</span><span class="mp-value">${PROVIDER_LABEL[provider] || provider}</span></div>
        <div class="mp-row"><span class="mp-label">${idLabel}</span><span class="mp-value mp-id">${escapeHtml(cloudSave.accountId())}</span></div>
        ${passwordBlock}
        <div class="mp-row"><span class="mp-label">가입일</span><span class="mp-value">${joined}</span></div>
      </div>
      <h3 class="mp-subtitle">🏆 스테이지 최고 점수</h3>
      <div class="mp-stages">${best}</div>`;
  }

  async handleForm(form) {
    const msg = form.querySelector('.mp-msg');
    const say = (text, ok = false) => {
      msg.textContent = text;
      msg.classList.toggle('ok', ok);
    };
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      if (form.dataset.form === 'password') {
        if (!form.current.value) throw new Error('현재 비밀번호를 입력해 주세요.');
        if (form.next.value.length < 6) throw new Error('새 비밀번호는 6자 이상이어야 해요.');
        if (form.next.value !== form.next2.value) throw new Error('새 비밀번호 확인이 일치하지 않아요.');
        await cloudSave.changePassword(form.current.value, form.next.value);
        form.reset();
        say('비밀번호를 바꿨어요. 다음 로그인부터 새 비밀번호를 쓰세요.', true);
      } else if (form.dataset.form === 'nickname') {
        await cloudSave.setNickname(readNickname(form.nickname.value));
        say('별명을 바꿨어요.', true);
      }
    } catch (e) {
      say(PASSWORD_ERRORS[e.code] || e.message);
    } finally {
      btn.disabled = false;
    }
  }

  confirm(text) {
    return new Promise((resolve) => {
      document.getElementById('confirm-text').textContent = text;
      this.confirmModal.classList.remove('hidden');
      const done = (ok) => {
        this.confirmModal.classList.add('hidden');
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
    const ok = await this.confirm(isGuest
      ? '게스트는 로그아웃하면 별명과 마일리지를 다시 불러올 수 없어요. 로그아웃할까요?'
      : '로그아웃할까요? 마일리지와 기록은 계정에 안전하게 보관돼요.');
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
