import { GameStateEnum, Characters, Stages } from './GameState.js';
import { saveSystem } from './SaveSystem.js';
import { trackEvent } from './firebase.js';
import { stageName, t } from './i18n.js';
import { soundSynth } from '../audio/SoundSynth.js';
import { GameRenderer } from '../renderer/GameRenderer.js';
import { Player } from '../entities/Player.js';
import { BossCat } from '../entities/BossCat.js';
import { StageManager } from '../managers/StageManager.js';
import { ScoreManager } from '../managers/ScoreManager.js';
import { InputManager } from '../input/InputManager.js';
import { ResponsiveUIManager } from '../ui/ResponsiveUIManager.js';
import { IntroCutscene } from '../ui/IntroCutscene.js';

export class GameManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.state = GameStateEnum.TITLE;
    this.frozen = false;
    this.frozenBgm = false;

    // Renderer
    this.renderer = new GameRenderer(this.canvas);

    // Player
    this.player = new Player(this.renderer);
    const selectedCharId = saveSystem.getSelectedCharacter();
    const charConfig = Characters.find(c => c.id === selectedCharId) || Characters[0];
    this.player.setCharacter(charConfig);

    // Score & Boss
    this.scoreManager = new ScoreManager();
    this.bossCat = new BossCat(this.renderer);

    // Stage Manager
    this.stageManager = new StageManager(this.renderer, this.scoreManager);
    this.stageManager.loadStage(0);

    // Camera anchor distance along the road and current scroll speed (world units / s)
    this.distance = 0;
    this.scrollSpeed = 0;

    // Input Manager
    this.inputManager = new InputManager(this.player);

    // UI Manager
    this.uiManager = new ResponsiveUIManager(this);

    // Intro Cutscene Player
    this.introCutscene = new IntroCutscene(() => this.onIntroCompleted());

    // Connect Callbacks
    this.bindCallbacks();

    // Timing
    this.lastTime = performance.now();
    this.animTime = 0.0;

    // Start loop
    requestAnimationFrame((t) => this.loop(t));

    // Play 6-second Intro Video FIRST upon site entry!
    this.introCutscene.play();
  }

  bindCallbacks() {
    this.stageManager.onStageProgress = (progress, stageName) => {
      this.uiManager.updateProgress(progress, stageName);
    };

    this.stageManager.onBossChaseStart = (stageId) => {
      this.bossCat.startChase(stageId);
      const hayFinale = this.bossCat.usesHayFinale;
      this.uiManager.showBossChase(
        t(hayFinale ? 'boss.chaseHay' : 'boss.chase'),
        this.bossCat.targetEvades,
        t(hayFinale ? 'evade.titleHay' : 'evade.titleCat')
      );
    };

    this.bossCat.onAttackWarning = (msg) => {
      this.uiManager.showCatAlert(msg);
    };

    this.bossCat.onEvaded = (count, max) => {
      this.uiManager.showEvadeBanner(count, max);
    };

    this.bossCat.onMissionSuccess = () => {
      this.onMissionSuccess();
    };

    this.bossCat.onMissionFailed = (evades) => {
      this.onMissionFailed(evades);
    };

    this.stageManager.onWarning = (warningMsg) => {
      this.uiManager.showWarning(warningMsg);
    };

    this.scoreManager.onScoreChanged = (score) => {
      this.uiManager.updateScore(score);
    };

    this.scoreManager.onComboChanged = (combo, timerRatio) => {
      this.uiManager.updateCombo(combo, timerRatio);
    };

    this.scoreManager.onFeverChanged = (gauge) => {
      this.uiManager.updateFever(gauge);
    };

    this.scoreManager.onFeverTriggered = (duration) => {
      this.player.activateFever(duration);
      this.uiManager.setFeverFX(true);
      setTimeout(() => {
        this.scoreManager.endFever();
        this.uiManager.setFeverFX(false);
      }, duration * 1000);
    };
  }

  selectCharacter(character) {
    this.player.setCharacter(character);
  }

  selectStage(stageIndex) {
    this.stageManager.loadStage(stageIndex);
  }

  /**
   * Called when the 6-second intro video finishes or is skipped.
   * Transitions immediately to the Title Screen.
   */
  onIntroCompleted() {
    console.log('🎬 Intro finished or skipped -> Showing Title Screen');
    this.state = GameStateEnum.TITLE;
    if (this.uiManager && this.uiManager.titleScreen) {
      this.uiManager.titleScreen.classList.remove('hidden');
      this.uiManager.titleScreen.style.display = 'flex';
    }
  }

  /**
   * Called when the START button is clicked on the Title Screen.
   * Immediately launches Stage 1 gameplay without waiting or playing videos!
   */
  startGame() {
    console.log('🚀 [START GAME] Launching Stage 1 Gameplay Immediately!');
    this.setFrozen(false);
    try {
      soundSynth.ensureContext();
      if (typeof soundSynth.playCollect === 'function') {
        soundSynth.playCollect();
      } else if (typeof soundSynth.playEat === 'function') {
        soundSynth.playEat(1);
      }
    } catch (e) {
      console.warn('Audio start warning:', e);
    }

    if (this.uiManager && this.uiManager.titleScreen) {
      this.uiManager.titleScreen.classList.add('hidden');
      this.uiManager.titleScreen.style.display = 'none';
    }

    this.state = GameStateEnum.PLAYING;
    const lives = saveSystem.getFeatherLives();
    this.distance = 0;
    this.scrollSpeed = 0;
    this.player.reset(lives);
    this.scoreManager.reset();
    this.bossCat.reset();
    this.renderer.setGloomyDefeatFX(false);
    this.renderer.clearLightningStorm();

    const currentStage = this.stageManager.stageConfig || Stages[0];
    this.stageManager.loadStage(this.stageManager.currentStageIndex || 0);

    if (this.uiManager) {
      this.uiManager.showHUD(lives, stageName(currentStage));
    }

    try {
      soundSynth.startBgm();
    } catch (e) {
      console.warn('BGM start warning:', e);
    }
  }

  /**
   * Admin-only inspection freeze: the current frame stays on screen exactly as it is
   * (no simulation, animation, particles, timers driven by the loop, or input) until unfrozen.
   */
  setFrozen(on) {
    if (this.frozen === on) return;
    this.frozen = on;
    this.inputManager.frozen = on;
    document.body.classList.toggle('game-frozen', on);
    if (on) {
      this.frozenBgm = this.state === GameStateEnum.PLAYING;
      if (this.frozenBgm) soundSynth.stopBgm();
    } else {
      this.lastTime = performance.now();
      if (this.frozenBgm && this.state === GameStateEnum.PLAYING) soundSynth.startBgm();
      this.frozenBgm = false;
    }
    this.uiManager.updateFreezeButton(on);
  }

  toggleFrozen() {
    this.setFrozen(!this.frozen);
  }

  restartStage() {
    this.bossCat.reset();
    this.startGame();
  }

  nextStage() {
    const nextIdx = this.stageManager.currentStageIndex + 1;
    if (nextIdx < Stages.length) {
      this.stageManager.currentStageIndex = nextIdx;
      this.restartStage();
    } else {
      this.returnToTitle();
    }
  }

  returnToTitle() {
    this.setFrozen(false);
    this.state = GameStateEnum.TITLE;
    soundSynth.stopBgm();
    this.bossCat.reset();
    this.renderer.setGloomyDefeatFX(false);
    this.renderer.clearLightningStorm();
    this.uiManager.hideHUD();
  }

  onMissionSuccess() {
    this.state = GameStateEnum.STAGE_CLEAR;
    soundSynth.stopBgm();
    soundSynth.playThunderLightning();
    soundSynth.playFever();

    this.player.startCelebration();
    this.renderer.setGloomyDefeatFX(false);

    const currentStageId = this.stageManager.stageConfig.id;
    saveSystem.setHighScore(currentStageId, this.scoreManager.score);
    saveSystem.unlockNextStage(currentStageId);
    const earned = saveSystem.addRunMileage(this.scoreManager.score, true);
    trackEvent('stage_clear', { stage: currentStageId, score: this.scoreManager.score, mileage: earned });

    // 3-second victory ceremony, then the mission-complete box with the "View Score" button
    const target = this.bossCat.targetEvades;
    const texts = this.bossCat.usesHayFinale
      ? { success: t('mission.haySub', { n: target }) }
      : {};
    this.uiManager.showMissionResult(true, target, target, () => {
      this.uiManager.showResultModal(
        true,
        this.scoreManager.score,
        this.scoreManager.maxCombo,
        this.player.feathers,
        earned
      );
    }, texts);
  }

  onMissionFailed(evadeCount = 0) {
    this.state = GameStateEnum.GAME_OVER;
    soundSynth.stopBgm();
    soundSynth.playMissionFailed();

    this.player.isMissionFailed = true;
    this.bossCat.gloat();
    this.renderer.setGloomyDefeatFX(true);
    this.bossCat.gloat();

    // 3-second caught scene in the gloomy tint, then the mission-failed box with the "View Score" button
    const stageId = this.stageManager.stageConfig.id;
    saveSystem.setHighScore(stageId, this.scoreManager.score);
    const earned = saveSystem.addRunMileage(this.scoreManager.score, false);
    trackEvent('stage_fail', { stage: stageId, score: this.scoreManager.score, mileage: earned });

    const done = this.bossCat.usesHayFinale ? this.bossCat.haysAvoided : evadeCount;
    this.uiManager.showMissionResult(false, done, this.bossCat.targetEvades, () => {
      this.uiManager.showResultModal(
        false,
        this.scoreManager.score,
        this.scoreManager.maxCombo,
        0,
        earned
      );
    });
  }

  onStageClear() {
    this.onMissionSuccess();
  }

  onGameOver() {
    this.onMissionFailed(this.bossCat ? this.bossCat.evadeCount : 0);
  }

  loop(currentTime) {
    requestAnimationFrame((t) => this.loop(t));

    if (this.frozen) {
      this.lastTime = currentTime;
      this.renderer.render(0);
      return;
    }

    const elapsed = Math.max(0, (currentTime - this.lastTime) / 1000);
    const dt = Math.min(0.1, elapsed);
    this.lastTime = currentTime;
    this.animTime += dt;
    this.uiManager.tick(elapsed);

    if (this.state === GameStateEnum.PLAYING) {
      this.inputManager.update(dt);

      const target = this.stageManager.getRunSpeed() * this.player.speedFactor * this.bossCat.worldSpeedScale;
      this.scrollSpeed += (target - this.scrollSpeed) * Math.min(1, dt * 3);
      this.distance += this.scrollSpeed * dt;

      this.player.update(dt, this.distance);
      this.uiManager.updateFeathers(this.player.feathers, this.player.maxFeathers);

      if (this.player.feathers <= 0) {
        this.onGameOver();
        return;
      }

      this.stageManager.update(dt, this.player, this.distance);

      if (this.bossCat.active) {
        this.bossCat.update(dt, this.player, this.distance);
      }

      this.scoreManager.update(dt);
    } else {
      // Title / pause / results: ease the scroll to an idle drift (or a stop after a stage ends)
      const ended = this.state === GameStateEnum.STAGE_CLEAR || this.state === GameStateEnum.GAME_OVER;
      const idle = this.state === GameStateEnum.PAUSED || ended ? 0 : 3.0;
      this.scrollSpeed += (idle - this.scrollSpeed) * Math.min(1, dt * 2);
      this.distance += this.scrollSpeed * dt;
      if (this.state !== GameStateEnum.PAUSED) this.player.update(dt, this.distance);
      if (ended && this.bossCat.active) this.bossCat.update(dt, this.player, this.distance);
    }

    this.renderer.setAnchor(this.distance);
    this.renderer.updateCamera(this.player.lane, dt);
    this.renderer.updatePlayerVisuals(this.player, this.animTime, dt);
    this.renderer.updateParticles(dt);
    this.renderer.render(dt);
  }
}
