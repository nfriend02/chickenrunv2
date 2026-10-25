import { Characters, Stages, ViewMode } from '../core/GameState.js';
import { saveSystem } from '../core/SaveSystem.js';
import { soundSynth } from '../audio/SoundSynth.js';

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
    this.missionTimer = null;

    // Modals & Screens
    this.titleScreen = document.getElementById('title-screen');
    this.charModal = document.getElementById('char-modal');
    this.stageModal = document.getElementById('stage-modal');
    this.settingsModal = document.getElementById('settings-modal');
    this.pauseModal = document.getElementById('pause-modal');
    this.resultModal = document.getElementById('result-modal');

    // Title Elements
    this.titleCharName = document.getElementById('title-char-name');
    this.titleCharImg = document.getElementById('title-char-img');
    this.titleCharHead = document.getElementById('title-char-head');
    this.currentModeLabel = document.getElementById('current-mode-label');

    this.warningTimeout = null;
    this.catAlertTimeout = null;

    this.setupEventListeners();
    this.setupCharacterModal();
    this.setupStageModal();
    this.setupSettingsModal();
    this.updateTitleCharacterDisplay();
    this.checkOrientation();
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

    // Pause Button & Actions
    document.getElementById('pause-btn').addEventListener('click', () => {
      this.gameManager.pauseGame();
      this.openModal('pause-modal');
    });

    document.getElementById('resume-btn').addEventListener('click', () => {
      this.closeModal('pause-modal');
      this.gameManager.resumeGame();
    });

    document.getElementById('restart-btn').addEventListener('click', () => {
      this.closeModal('pause-modal');
      this.gameManager.restartStage();
    });

    document.getElementById('home-btn').addEventListener('click', () => {
      this.closeModal('pause-modal');
      this.gameManager.returnToTitle();
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

    window.addEventListener('resize', () => this.checkOrientation());
  }

  checkOrientation() {
    const isPortrait = window.innerHeight > window.innerWidth;
    const mode = isPortrait ? ViewMode.PORTRAIT : ViewMode.LANDSCAPE;
    this.setViewMode(mode);
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
      if (this.currentModeLabel) this.currentModeLabel.textContent = '세로 쿼터뷰 (Portrait)';
    } else {
      body.classList.remove('portrait-mode');
      body.classList.add('landscape-mode');
      if (this.currentModeLabel) this.currentModeLabel.textContent = '가로 횡스크롤 (Landscape)';
    }
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
            <img src="${ch.imagePath}" alt="${ch.name}" style="width:100%; height:100%; object-fit:contain;">
          </div>
          <div>
            <div class="card-name">${ch.name}</div>
            <div class="card-desc">${ch.title} | ${ch.skill}</div>
          </div>
        </div>
        <button class="comic-btn btn-secondary" style="font-size:13px; padding:6px 14px;">
          ${ch.id === selectedCharId ? '선택됨' : '선택'}
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
    if (this.titleCharName) this.titleCharName.textContent = ch.name;
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
            ${isUnlocked ? `<img src="${st.bgImage}" alt="${st.name}" style="width:100%; height:100%; object-fit:cover;">` : '🔒'}
          </div>
          <div>
            <div class="card-name">${st.name}</div>
            <div class="card-desc">난이도: ${st.difficulty} | 최고점수: ${highScore.toLocaleString()}</div>
          </div>
        </div>
        <button class="comic-btn ${isUnlocked ? 'btn-primary' : 'btn-secondary'}" style="font-size:13px; padding:6px 14px;" ${!isUnlocked ? 'disabled' : ''}>
          ${isUnlocked ? (isCurrent ? '선택됨' : '플레이') : '잠김'}
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
    if (this.titleScreen) {
      this.titleScreen.classList.add('hidden');
      this.titleScreen.style.display = 'none';
    }
    if (this.hud) {
      this.hud.classList.remove('hidden');
      this.hud.style.display = 'flex';
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

  hideHUD() {
    this.clearMissionResult();
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

  showWarning(text) {
    if (!this.warningBanner) return;
    if (this.warningTimeout) clearTimeout(this.warningTimeout);

    if (this.warningText) this.warningText.textContent = text;
    this.warningBanner.classList.remove('hidden');

    this.warningTimeout = setTimeout(() => {
      this.warningBanner.classList.add('hidden');
    }, 2500);
  }

  showBossChase(text, target = 4, title = '⚡ 고양이 공격 회피:') {
    if (!this.bossBanner) return;
    if (this.bossBannerText) this.bossBannerText.textContent = text;
    this.bossBanner.classList.remove('hidden');

    const titleEl = this.catEvadeHud && this.catEvadeHud.querySelector('.evade-title');
    if (titleEl) titleEl.textContent = title;
    this.showCatEvadeHUD(true, target);

    setTimeout(() => {
      this.bossBanner.classList.add('hidden');
    }, 3500);
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
    if (!this.catAttackAlert) return;
    if (this.catAlertText) this.catAlertText.textContent = text;
    this.catAttackAlert.classList.remove('hidden');
    this.catAttackAlert.style.display = 'flex';

    if (this.catAlertTimeout) clearTimeout(this.catAlertTimeout);
    this.catAlertTimeout = setTimeout(() => {
      this.catAttackAlert.classList.add('hidden');
      this.catAttackAlert.style.display = 'none';
    }, 1800);
  }

  showEvadeBanner(count, target = 4) {
    this.updateEvadeCount(count, target);
    this.showWarning(`⚡ 회피 성공! (${count}/${target})`);
  }

  /**
   * Ends the run: a 3-second ceremony (success: "미션 성공" title with radiating stars while the hero
   * celebrates; failure: the hero's caught scene) and then the result box with the "스코어 보기" button.
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
      this.missionTitle.textContent = isSuccess ? '⚡ 미션 성공 ⚡' : '🌧️ 미션 실패 🌧️';
    }

    if (this.missionSubtitle) {
      this.missionSubtitle.textContent = isSuccess
        ? (texts.success || `늙은 고양이의 공격을 ${target}회 완벽히 회피했습니다!`)
        : (texts.fail || '늙은 고양이의 공격에 쓰러졌습니다...');
    }

    if (this.missionStars) {
      this.missionStars.textContent = isSuccess
        ? '🌟'.repeat(target)
        : `회피 성공: ${evades} / ${target}`;
    }

    this.clearMissionResult();
    if (isSuccess) this.showCeremony();

    // The hero's victory / caught scene plays for CEREMONY_MS before the box and button appear.
    this.missionTimer = setTimeout(() => {
      this.missionTimer = null;
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
    }, CEREMONY_MS);
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
    if (this.missionTimer) {
      clearTimeout(this.missionTimer);
      this.missionTimer = null;
    }
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

  showResultModal(isClear, score, maxCombo, feathersLeft) {
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
      feathersEl.textContent = '🪶'.repeat(Math.max(0, feathersLeft)) || '없음';
    }

    if (nextBtn) {
      nextBtn.style.display = isClear ? 'inline-flex' : 'none';
    }

    this.openModal('result-modal');
  }
}
