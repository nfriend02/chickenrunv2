import { Characters, Stages, ViewMode } from '../core/GameState.js';
import { saveSystem } from '../core/SaveSystem.js';
import { soundSynth } from '../audio/SoundSynth.js';
import { uxMode } from '../core/UXMode.js';
import { charText, i18n, stageName, t } from '../core/i18n.js';
import { cloudSave } from '../core/CloudSave.js';

const CEREMONY_MS = 3000;

export class ResponsiveUIManager {
  constructor(gameManager) {
    this.gameManager = gameManager;

    // Elements
    this.hud = document.getElementById('hud');
    this.feathersContainer = document.getElementById('feathers-container');
    this.hudStageName = document.getElementById('hud-stage-name');
    this.stageProgressFill = document.getElementById('stage-progress-fill');
    this.stageRunnerIcon = document.getElementById('stage-runner-icon');
    this.feverFill = document.getElementById('fever-fill');
    this.scoreText = document.getElementById('score-text');
    this.comboBox = document.getElementById('combo-box');
    this.comboCount = document.getElementById('combo-count');
    this.comboTimerFill = document.getElementById('combo-timer-fill');

    this.warningBanner = document.getElementById('warning-banner');
    this.warningText = document.getElementById('warning-text');
    this.bossBanner = document.getElementById('boss-chase-banner');
    this.bossBannerText = document.getElementById('boss-banner-text');
    this.feverScreenFx = document.getElementById('fever-screen-fx');
    this.controlsContainer = document.getElementById('controls-container');

    // Cat Evade & Mission Result Elements
    this.catEvadeHud = document.getElementById('cat-evade-hud');
    this.evadeBadges = document.querySelectorAll('#evade-badges .evade-star');
    this.evadeCountText = document.getElementById('evade-count-text');
    this.catAttackAlert = document.getElementById('cat-attack-alert');
    this.catAlertText = document.getElementById('cat-alert-text');
    this.missionResultContainer = document.getElementById('mission-result-container');
    this.missionBannerCard = document.getElementById('mission-banner-card');
    this.missionTitle = document.getElementById('mission-title');
    this.missionSubtitle = document.getElementById('mission-subtitle');
    this.missionStars = document.getElementById('mission-stars');
    this.missionScoreBtn = document.getElementById('mission-score-btn');
    this.missionCeremony = document.getElementById('mission-ceremony');
    this.ceremonySparkles = document.getElementById('ceremony-sparkles');
    // Modals & Screens
    this.titleScreen = document.getElementById('title-screen');
    this.charModal = document.getElementById('char-modal');
    this.stageModal = document.getElementById('stage-modal');
    this.settingsModal = document.getElementById('settings-modal');
    this.freezeBtn = document.getElementById('pause-btn');
    this.isAdmin = false;
    this.resultModal = document.getElementById('result-modal');

    // Title Elements
    this.titleCharName = document.getElementById('title-char-name');
    this.titleCharImg = document.getElementById('title-char-img');
    this.titleCharHead = document.getElementById('title-char-head');
    this.titleCharRole = document.getElementById('title-char-role');
    this.titleCharSkill = document.getElementById('title-char-skill');
    this.currentModeLabel = document.getElementById('current-mode-label');

    this.flyToLeft = true;
    this.lastFlyText = null;
    this.lastFlyAt = 0;
    this.missionDelay = null;
    this.missionReveal = null;
    this.viewLabelKey = 'view.landscape';
    this.lastResult = null;

    this.setupEventListeners();
    this.setupCharacterModal();
    this.setupStageModal();
    this.setupSettingsModal();
    this.updateTitleCharacterDisplay();
    this.checkOrientation();
    i18n.subscribe(() => this.refreshLanguage());
  }

  /** Re-renders every piece of text this manager builds in code. */
  refreshLanguage() {
    this.setupCharacterModal();
    this.setupStageModal();
    this.updateTitleCharacterDisplay();
    if (this.currentModeLabel) this.currentModeLabel.textContent = t(this.viewLabelKey);
    if (this.lastResult && !this.resultModal.classList.contains('hidden')) this.showResultModal(...this.lastResult);
  }

  setupEventListeners() {
    // Start Game Button (Launches Stage 1 directly)
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
      let isStarting = false;
      const onStart = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (isStarting) return;
        isStarting = true;
        this.gameManager.startGame();
        setTimeout(() => { isStarting = false; }, 500);
      };
      startBtn.addEventListener('click', onStart);
      startBtn.addEventListener('touchend', onStart);
    }

    // Sub-buttons on title
    document.getElementById('char-select-btn').addEventListener('click', () => {
      this.openModal('char-modal');
    });

    document.getElementById('stage-select-btn').addEventListener('click', () => {
      this.setupStageModal(); // Refresh unlock status
      this.openModal('stage-modal');
    });

    document.getElementById('settings-btn').addEventListener('click', () => {
      this.openModal('settings-modal');
    });

    // Close buttons on modals
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetId = btn.dataset.close;
        if (targetId) this.closeModal(targetId);
      });
    });

    // Admin-only freeze button (stays out of the DOM layout for everyone else); F8 toggles it too.
    this.freezeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Drop focus so Space (the jump key) cannot re-press the button.
      this.freezeBtn.blur();
      if (this.isAdmin) this.gameManager.toggleFrozen();
    });
    window.addEventListener('keydown', (e) => {
      if (e.code !== 'F8' || !this.isAdmin || this.hud.classList.contains('hidden')) return;
      e.preventDefault();
      this.gameManager.toggleFrozen();
    });
    cloudSave.subscribe((s) => {
      const wasAdmin = this.isAdmin;
      this.isAdmin = !!s.isAdmin;
      this.freezeBtn.classList.toggle('admin-visible', this.isAdmin);
      if (wasAdmin && !this.isAdmin) this.gameManager.setFrozen?.(false);
    });

    // Result Modal Actions
    document.getElementById('next-stage-btn').addEventListener('click', () => {
      this.closeModal('result-modal');
      this.gameManager.nextStage();
    });

    document.getElementById('retry-stage-btn').addEventListener('click', () => {
      this.closeModal('result-modal');
      this.gameManager.restartStage();
    });

    document.getElementById('result-home-btn').addEventListener('click', () => {
      this.closeModal('result-modal');
      this.gameManager.returnToTitle();
    });

    // Orientation toggle button
    document.getElementById('toggle-view-mode-btn').addEventListener('click', () => {
      this.toggleViewMode();
    });

    uxMode.subscribe((state, prev) => this.applyUX(state, prev));
  }

  /** Game camera follows the device orientation; a rotation mid-run switches the view instantly. */
  applyUX(state, prev) {
    if (!prev || prev.orientation !== state.orientation) {
      this.setViewMode(state.orientation === 'portrait' ? ViewMode.PORTRAIT : ViewMode.LANDSCAPE);
    } else if (this.gameManager.renderer) {
      this.gameManager.renderer.onWindowResize();
    }
  }

  checkOrientation() {
    this.applyUX(uxMode.get(), null);
  }

  toggleViewMode() {
    const newMode = this.gameManager.renderer.viewMode === ViewMode.LANDSCAPE
      ? ViewMode.PORTRAIT
      : ViewMode.LANDSCAPE;
    this.setViewMode(newMode);
  }

  setViewMode(mode) {
    if (this.gameManager.renderer) {
      this.gameManager.renderer.setViewMode(mode);
    }
    const body = document.body;
    if (mode === ViewMode.PORTRAIT) {
      body.classList.remove('landscape-mode');
      body.classList.add('portrait-mode');
      this.viewLabelKey = 'view.portrait';
    } else {
      body.classList.remove('portrait-mode');
      body.classList.add('landscape-mode');
      this.viewLabelKey = 'view.landscape';
    }
    if (this.currentModeLabel) this.currentModeLabel.textContent = t(this.viewLabelKey);
  }

  openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('hidden');
  }

  closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('hidden');
  }

  setupCharacterModal() {
    const grid = document.getElementById('char-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const selectedCharId = saveSystem.getSelectedCharacter();

    Characters.forEach(ch => {
      const card = document.createElement('div');
      card.className = `char-item-card ${ch.id === selectedCharId ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="card-left">
          <div class="card-icon" style="width:52px; height:52px; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.3); border-radius:12px; padding:4px;">
            <img src="${ch.imagePath}" alt="${charText(ch, 'name')}" style="width:100%; height:100%; object-fit:contain;">
          </div>
          <div>
            <div class="card-name">${charText(ch, 'name')}</div>
            <div class="card-desc">${charText(ch, 'title')} | ${charText(ch, 'skill')}</div>
          </div>
        </div>
        <button class="comic-btn btn-secondary" style="font-size:13px; padding:6px 14px;">
          ${t(ch.id === selectedCharId ? 'pick.selected' : 'pick.select')}
        </button>
      `;

      card.addEventListener('click', () => {
        saveSystem.setSelectedCharacter(ch.id);
        this.gameManager.selectCharacter(ch);
        this.updateTitleCharacterDisplay();
        this.closeModal('char-modal');
      });

      grid.appendChild(card);
    });
  }

  updateTitleCharacterDisplay() {
    const charId = saveSystem.getSelectedCharacter();
    const ch = Characters.find(c => c.id === charId) || Characters[0];
    if (this.titleCharName) this.titleCharName.textContent = charText(ch, 'name');
    if (this.titleCharRole) this.titleCharRole.textContent = charText(ch, 'role');
    if (this.titleCharSkill) this.titleCharSkill.textContent = t('title.skillTag', { skill: charText(ch, 'skill') });
    if (this.titleCharImg) {
      this.titleCharImg.onerror = () => {
        this.titleCharImg.onerror = null;
        this.titleCharImg.src = ch.imagePath;
      };
      this.titleCharImg.src = `/assets/images/characters/portraits/${ch.id}.png`;
      this.titleCharImg.style.display = 'block';
    }
    if (this.titleCharHead) {
      this.titleCharHead.src = `/assets/images/characters/portraits/${ch.id}_head.png`;
      this.titleCharHead.style.display = 'block';
    }
  }

  setupStageModal() {
    const grid = document.getElementById('stage-grid');
    if (!grid) return;
    grid.innerHTML = '';

    Stages.forEach(st => {
      const isUnlocked = saveSystem.isStageUnlocked(st.id);
      const highScore = saveSystem.getHighScore(st.id);
      const isCurrent = this.gameManager.stageManager && this.gameManager.stageManager.currentStageIndex === (st.id - 1);

      const card = document.createElement('div');
      card.className = `stage-item-card ${isCurrent ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;
      card.innerHTML = `
        <div class="card-left">
          <div class="card-icon" style="width:68px; height:42px; display:flex; align-items:center; justify-content:center; border-radius:8px; overflow:hidden; border:1.5px solid var(--primary-gold);">
            ${isUnlocked ? `<img src="${st.bgImage}" alt="${stageName(st)}" style="width:100%; height:100%; object-fit:cover;">` : '🔒'}
          </div>
          <div>
            <div class="card-name">${stageName(st)}</div>
            <div class="card-desc">${t('pick.stageDesc', { d: st.difficulty, s: highScore.toLocaleString() })}</div>
          </div>
        </div>
        <button class="comic-btn ${isUnlocked ? 'btn-primary' : 'btn-secondary'}" style="font-size:13px; padding:6px 14px;" ${!isUnlocked ? 'disabled' : ''}>
          ${t(isUnlocked ? (isCurrent ? 'pick.selected' : 'pick.play') : 'pick.locked')}
        </button>
      `;

      if (isUnlocked) {
        card.addEventListener('click', () => {
          this.gameManager.selectStage(st.id - 1);
          this.closeModal('stage-modal');
        });
      }

      grid.appendChild(card);
    });
  }

  setupSettingsModal() {
    // Feather lives options
    const optButtons = document.querySelectorAll('.feather-options .opt-btn');
    const currentFeathers = saveSystem.getFeatherLives();

    optButtons.forEach(btn => {
      const val = parseInt(btn.dataset.feathers, 10);
      if (val === currentFeathers) btn.classList.add('active');
      else btn.classList.remove('active');

      btn.addEventListener('click', () => {
        optButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        saveSystem.setFeatherLives(val);
      });
    });

    // Volume sliders
    const bgmSlider = document.getElementById('bgm-volume');
    const bgmVal = document.getElementById('bgm-val');
    const sfxSlider = document.getElementById('sfx-volume');
    const sfxVal = document.getElementById('sfx-val');

    const settings = saveSystem.getSettings();
    if (bgmSlider) {
      bgmSlider.value = settings.bgmVolume * 100;
      bgmVal.textContent = Math.round(settings.bgmVolume * 100) + '%';
      bgmSlider.addEventListener('input', (e) => {
        const val = e.target.value / 100;
        bgmVal.textContent = e.target.value + '%';
        soundSynth.setVolumes(val, sfxSlider.value / 100);
        saveSystem.setSettings({ bgmVolume: val });
      });
    }

    if (sfxSlider) {
      sfxSlider.value = settings.sfxVolume * 100;
      sfxVal.textContent = Math.round(settings.sfxVolume * 100) + '%';
      sfxSlider.addEventListener('input', (e) => {
        const val = e.target.value / 100;
        sfxVal.textContent = e.target.value + '%';
        soundSynth.setVolumes(bgmSlider.value / 100, val);
        saveSystem.setSettings({ sfxVolume: val });
      });
    }

    document.getElementById('save-settings-btn').addEventListener('click', () => {
      this.closeModal('settings-modal');
    });
  }

  showHUD(feathersCount, stageName) {
    this.clearMissionResult();
    this.clearFlyingMessages();
    if (this.titleScreen) {
      this.titleScreen.classList.add('hidden');
      this.titleScreen.style.display = 'none';
    }
    if (this.hud) {
      this.hud.classList.remove('hidden');
      this.hud.style.display = '';
    }
    if (this.controlsContainer) {
      this.controlsContainer.classList.remove('hidden');
      this.controlsContainer.style.display = 'flex';
    }

    this.updateFeathers(feathersCount, feathersCount);
    if (this.hudStageName) this.hudStageName.textContent = stageName;
    if (this.scoreText) this.scoreText.textContent = '000,000';
    if (this.stageProgressFill) this.stageProgressFill.style.width = '0%';
    if (this.feverFill) this.feverFill.style.width = '0%';
    if (this.comboBox) this.comboBox.classList.add('hidden');
  }

  updateFreezeButton(frozen) {
    const btn = this.freezeBtn;
    btn.textContent = frozen ? '▶️' : '⏸️';
    btn.classList.toggle('is-frozen', frozen);
    btn.dataset.i18nTitle = frozen ? 'hud.resume' : 'hud.pause';
    btn.dataset.i18nAria = btn.dataset.i18nTitle;
    btn.title = t(btn.dataset.i18nTitle);
    btn.setAttribute('aria-label', btn.title);
  }

  hideHUD() {
    this.clearMissionResult();
    this.clearFlyingMessages();
    if (this.hud) this.hud.classList.add('hidden');
    if (this.controlsContainer) this.controlsContainer.classList.add('hidden');
    if (this.warningBanner) this.warningBanner.classList.add('hidden');
    if (this.bossBanner) this.bossBanner.classList.add('hidden');
    if (this.feverScreenFx) this.feverScreenFx.classList.add('hidden');
    if (this.titleScreen) {
      this.titleScreen.classList.remove('hidden');
      this.titleScreen.style.display = 'flex';
    }
  }

  updateFeathers(current, max) {
    if (!this.feathersContainer) return;
    this.feathersContainer.innerHTML = '';
    for (let i = 0; i < max; i++) {
      const span = document.createElement('span');
      span.className = `feather-icon ${i < current ? 'active' : 'lost'}`;
      span.textContent = '🪶';
      this.feathersContainer.appendChild(span);
    }
  }

  updateProgress(progress, stageName) {
    if (this.stageProgressFill) {
      const pct = (progress * 100).toFixed(1) + '%';
      this.stageProgressFill.style.width = pct;
      if (this.stageRunnerIcon) this.stageRunnerIcon.style.left = pct;
    }
    if (this.hudStageName && stageName) {
      this.hudStageName.textContent = stageName;
    }
  }

  updateScore(score) {
    if (this.scoreText) {
      this.scoreText.textContent = score.toLocaleString().padStart(7, '0');
    }
  }

  updateCombo(combo, timerRatio) {
    if (!this.comboBox) return;
    if (combo > 1) {
      this.comboBox.classList.remove('hidden');
      if (this.comboCount) this.comboCount.textContent = `COMBO x${combo}!`;
      if (this.comboTimerFill) this.comboTimerFill.style.width = `${timerRatio * 100}%`;
    } else {
      this.comboBox.classList.add('hidden');
    }
  }

  updateFever(gauge) {
    if (this.feverFill) {
      this.feverFill.style.width = `${gauge}%`;
    }
  }

  setFeverFX(active) {
    if (this.feverScreenFx) {
      if (active) this.feverScreenFx.classList.remove('hidden');
      else this.feverScreenFx.classList.add('hidden');
    }
  }

  /**
   * In-game messages never sit on the play area: each one is a copy of its (always hidden) banner template
   * that holds for 0.5 s, then shrinks and drifts off toward the top-left or top-right corner, alternating,
   * and is fully off screen after 3 s (CSS .fly-msg). Pure CSS timing, so the admin freeze holds it too.
   */
  flyMessage(template, textEl, text) {
    if (!template) return;
    const now = performance.now();
    if (text === this.lastFlyText && now - this.lastFlyAt < 400) return;
    this.lastFlyText = text;
    this.lastFlyAt = now;

    if (textEl) textEl.textContent = text;
    const msg = template.cloneNode(true);
    msg.removeAttribute('id');
    msg.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    msg.querySelectorAll('[data-i18n]').forEach(el => el.removeAttribute('data-i18n'));
    msg.classList.remove('hidden');
    msg.style.display = '';
    msg.classList.add('fly-msg', this.flyToLeft ? 'fly-left' : 'fly-right');
    msg.setAttribute('aria-live', 'polite');
    this.flyToLeft = !this.flyToLeft;
    msg.addEventListener('animationend', (e) => {
      if (e.target === msg) msg.remove();
    });
    template.parentNode.appendChild(msg);
  }

  clearFlyingMessages() {
    document.querySelectorAll('.fly-msg').forEach(el => el.remove());
    this.flyToLeft = true;
    this.lastFlyText = null;
  }

  showWarning(text) {
    this.flyMessage(this.warningBanner, this.warningText, text);
  }

  showBossChase(text, target = 4, title = t('evade.titleCat')) {
    this.flyMessage(this.bossBanner, this.bossBannerText, text);

    const titleEl = this.catEvadeHud && this.catEvadeHud.querySelector('.evade-title');
    if (titleEl) titleEl.textContent = title;
    this.showCatEvadeHUD(true, target);
  }

  showCatEvadeHUD(show = true, target = 4) {
    if (!this.catEvadeHud) return;
    if (show) {
      this.catEvadeHud.classList.remove('hidden');
      this.catEvadeHud.style.display = 'flex';
      if (this.evadeBadges) {
        this.evadeBadges.forEach((star, idx) => { star.style.display = idx < target ? '' : 'none'; });
      }
      this.updateEvadeCount(0, target);
    } else {
      this.catEvadeHud.classList.add('hidden');
      this.catEvadeHud.style.display = 'none';
    }
  }

  updateEvadeCount(count, target = 4) {
    if (this.evadeBadges) {
      this.evadeBadges.forEach((star, idx) => {
        if (idx < count) {
          star.textContent = '⭐';
          star.classList.add('filled');
        } else {
          star.textContent = '⚪';
          star.classList.remove('filled');
        }
      });
    }
    if (this.evadeCountText) {
      this.evadeCountText.textContent = `(${count}/${target})`;
    }
  }

  showCatAlert(text) {
    this.flyMessage(this.catAttackAlert, this.catAlertText, text);
  }

  showEvadeBanner(count, target = 4) {
    this.updateEvadeCount(count, target);
    this.showWarning(t('evade.success', { n: count, target }));
  }

  /**
   * Ends the run: a 3-second ceremony (success: mission-complete title with radiating stars while the hero
   * celebrates; failure: the hero's caught scene) and then the result box with the "View Score" button.
   */
  showMissionResult(isSuccess, evades, target = 4, onShowScoreboard, texts = {}) {
    // Hide active gameplay controls & HUD
    if (this.hud) this.hud.classList.add('hidden');
    if (this.controlsContainer) this.controlsContainer.classList.add('hidden');
    if (this.catAttackAlert) this.catAttackAlert.classList.add('hidden');
    if (this.warningBanner) this.warningBanner.classList.add('hidden');
    if (this.bossBanner) this.bossBanner.classList.add('hidden');
    this.showCatEvadeHUD(false);

    if (!this.missionResultContainer) return;

    if (this.missionBannerCard) {
      this.missionBannerCard.className = `mission-banner-card ${isSuccess ? 'success' : 'fail'}`;
    }

    if (this.missionTitle) {
      this.missionTitle.textContent = t(isSuccess ? 'mission.success' : 'mission.fail');
    }

    if (this.missionSubtitle) {
      this.missionSubtitle.textContent = isSuccess
        ? (texts.success || t('mission.successSub', { n: target }))
        : (texts.fail || t('mission.failSub'));
    }

    if (this.missionStars) {
      this.missionStars.textContent = isSuccess
        ? '🌟'.repeat(target)
        : t('mission.evades', { n: evades, target });
    }

    this.clearMissionResult();
    if (isSuccess) this.showCeremony();

    // The ending scene (hero's victory / caught scene) plays for CEREMONY_MS, with no text over it, before the box
    // and button appear. Counted in tick() so the admin freeze holds the countdown too.
    this.missionDelay = CEREMONY_MS / 1000;
    this.missionDelayStarted = false;
    this.missionReveal = () => {
      this.hideCeremony();
      this.missionResultContainer.classList.remove('hidden');
      this.missionResultContainer.style.display = 'flex';
      if (this.missionScoreBtn) {
        this.missionScoreBtn.classList.remove('hidden');
        this.missionScoreBtn.style.display = 'block';
        this.missionScoreBtn.onclick = () => {
          this.missionResultContainer.classList.add('hidden');
          this.missionResultContainer.style.display = 'none';
          if (onShowScoreboard) onShowScoreboard();
        };
      }
    };
  }

  /** Runs every unfrozen frame with the real seconds since the previous frame (not capped like the physics dt). */
  tick(dt) {
    if (this.missionDelay === null) return;
    // The first frame's elapsed time began before the ending started, so it does not count.
    if (!this.missionDelayStarted) {
      this.missionDelayStarted = true;
      return;
    }
    this.missionDelay -= dt;
    if (this.missionDelay > 0) return;
    const reveal = this.missionReveal;
    this.missionDelay = null;
    this.missionReveal = null;
    if (reveal) reveal();
  }

  showCeremony() {
    if (!this.missionCeremony) return;
    if (this.ceremonySparkles) {
      this.ceremonySparkles.innerHTML = '';
      for (let i = 0; i < 28; i++) {
        const star = document.createElement('span');
        star.textContent = i % 3 === 0 ? '✦' : '★';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 75}%`;
        star.style.fontSize = `${14 + Math.random() * 26}px`;
        star.style.animationDelay = `${(Math.random() * 1.2).toFixed(2)}s`;
        this.ceremonySparkles.appendChild(star);
      }
    }
    this.missionCeremony.classList.remove('hidden');
  }

  hideCeremony() {
    if (this.missionCeremony) this.missionCeremony.classList.add('hidden');
    if (this.ceremonySparkles) this.ceremonySparkles.innerHTML = '';
  }

  /** Cancels a pending result reveal and hides the ceremony and result box (restart / back to title). */
  clearMissionResult() {
    this.missionDelay = null;
    this.missionReveal = null;
    this.hideCeremony();
    if (this.missionResultContainer) {
      this.missionResultContainer.classList.add('hidden');
      this.missionResultContainer.style.display = 'none';
    }
    if (this.missionScoreBtn) {
      this.missionScoreBtn.classList.add('hidden');
      this.missionScoreBtn.style.display = 'none';
    }
  }

  showResultModal(isClear, score, maxCombo, feathersLeft, mileageEarned = 0) {
    this.lastResult = [isClear, score, maxCombo, feathersLeft, mileageEarned];
    const mileageEl = document.getElementById('result-mileage');
    if (mileageEl) {
      mileageEl.textContent = t('result.mileageValue', {
        earned: mileageEarned.toLocaleString(),
        total: saveSystem.getMileage().toLocaleString()
      });
    }
    const titleEl = document.getElementById('result-status-title');
    const scoreEl = document.getElementById('result-score');
    const comboEl = document.getElementById('result-combo');
    const feathersEl = document.getElementById('result-feathers');
    const nextBtn = document.getElementById('next-stage-btn');

    if (titleEl) {
      titleEl.textContent = isClear ? '🎉 STAGE CLEAR!' : '😭 GAME OVER';
      titleEl.style.color = isClear ? '#FFD700' : '#DC143C';
    }

    if (scoreEl) scoreEl.textContent = score.toLocaleString();
    if (comboEl) comboEl.textContent = `x${maxCombo}`;
    if (feathersEl) {
      feathersEl.textContent = '🪶'.repeat(Math.max(0, feathersLeft)) || t('result.none');
    }

    if (nextBtn) {
      nextBtn.style.display = isClear ? 'inline-flex' : 'none';
    }

    this.openModal('result-modal');
  }
}
