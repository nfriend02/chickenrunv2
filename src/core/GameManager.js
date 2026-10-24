import { GameStateEnum, Characters, Stages } from './GameState.js';
import { saveSystem } from './SaveSystem.js';
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
      this.uiManager.showBossChase(`🚨 늙은 심술 고양이 추격 시작!! 🚨`);
      this.bossCat.startChase(stageId);
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
   * Transitions immediately to the Title Screen (첫화면).
   */
  onIntroCompleted() {
    console.log('🎬 Intro finished or skipped -> Showing Title Screen (첫화면)');
    this.state = GameStateEnum.TITLE;
    if (this.uiManager && this.uiManager.titleScreen) {
      this.uiManager.titleScreen.classList.remove('hidden');
      this.uiManager.titleScreen.style.display = 'flex';
    }
  }

  /**
   * Called when "게임 시작 (START)" button is clicked on the Title Screen.
   * Immediately launches Stage 1 gameplay without waiting or playing videos!
   */
  startGame() {
    console.log('🚀 [START GAME] Launching Stage 1 Gameplay Immediately!');
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
    this.player.reset(lives);
    this.scoreManager.reset();
    this.bossCat.reset();
    this.renderer.setGloomyDefeatFX(false);
    this.renderer.clearLightningStorm();

    const currentStage = this.stageManager.stageConfig || Stages[0];
    this.stageManager.loadStage(this.stageManager.currentStageIndex || 0);

    if (this.uiManager) {
      this.uiManager.showHUD(lives, currentStage.name);
    }

    try {
      soundSynth.startBgm();
    } catch (e) {
      console.warn('BGM start warning:', e);
    }
  }

  pauseGame() {
    if (this.state === GameStateEnum.PLAYING) {
      this.state = GameStateEnum.PAUSED;
      soundSynth.stopBgm();
    }
  }

  resumeGame() {
    if (this.state === GameStateEnum.PAUSED) {
      this.state = GameStateEnum.PLAYING;
      this.lastTime = performance.now();
      soundSynth.startBgm();
    }
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

    this.player.isMissionSuccess = true;
    this.renderer.setGloomyDefeatFX(false);

    const currentStageId = this.stageManager.stageConfig.id;
    saveSystem.setHighScore(currentStageId, this.scoreManager.score);
    saveSystem.unlockNextStage(currentStageId);

    // Displays "미션 성공" with radiating lightning, then after 3s reveals "스코어 보기" button
    this.uiManager.showMissionResult(true, 4, 4, () => {
      this.uiManager.showResultModal(
        true,
        this.scoreManager.score,
        this.scoreManager.maxCombo,
        this.player.feathers
      );
    });
  }

  onMissionFailed(evadeCount = 0) {
    this.state = GameStateEnum.GAME_OVER;
    soundSynth.stopBgm();
    soundSynth.playMissionFailed();

    this.player.isMissionFailed = true;
    this.renderer.setGloomyDefeatFX(true);

    // Displays "미션 실패" with gloomy atmosphere, then after 3s reveals "스코어 보기" button
    this.uiManager.showMissionResult(false, evadeCount, 4, () => {
      this.uiManager.showResultModal(
        false,
        this.scoreManager.score,
        this.scoreManager.maxCombo,
        0
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

    const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;
    this.animTime += dt;

    if (this.state === GameStateEnum.PLAYING) {
      // 1. Update Input
      this.inputManager.update(dt);

      // 2. Update Player
      this.player.update(dt);
      this.uiManager.updateFeathers(this.player.feathers, this.player.maxFeathers);

      // Check Game Over
      if (this.player.feathers <= 0) {
        this.onGameOver();
        return;
      }

      // 3. Update Stage Manager (Obstacles, Items, Parallax)
      this.stageManager.update(dt, this.player);

      // 4. Update Boss Cat
      if (this.bossCat.active) {
        this.bossCat.update(dt, this.player);
      }

      // 5. Update Score Manager (combo timer)
      this.scoreManager.update(dt);
    } else if (this.state === GameStateEnum.STAGE_CLEAR || this.state === GameStateEnum.GAME_OVER) {
      // Smoothly animate hero moving to center on mission complete/fail
      this.player.update(dt);
    }

    // Always update visual animations & render
    this.renderer.updatePlayerVisuals(this.player, this.animTime, dt);
    this.renderer.updateParticles(dt);
    this.renderer.render(dt);
  }
}
