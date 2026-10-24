import { soundSynth } from '../audio/SoundSynth.js';

export class ScoreManager {
  constructor() {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.comboTimer = 0.0;
    this.comboDuration = 2.0;

    this.feverGauge = 0.0;
    this.maxFever = 100.0;
    this.isFever = false;

    this.onScoreChanged = null;
    this.onComboChanged = null;
    this.onFeverChanged = null;
    this.onFeverTriggered = null;
  }

  reset() {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.comboTimer = 0.0;
    this.feverGauge = 0.0;
    this.isFever = false;

    if (this.onScoreChanged) this.onScoreChanged(this.score);
    if (this.onComboChanged) this.onComboChanged(this.combo, 0);
    if (this.onFeverChanged) this.onFeverChanged(this.feverGauge);
  }

  addFood(baseScore = 10, feverInc = 5) {
    // Increment combo
    this.combo++;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }
    this.comboTimer = this.comboDuration;

    // Multiplier calculation
    let multiplier = 1.0;
    if (this.combo >= 20) {
      multiplier = 3.0;
    } else if (this.combo >= 10) {
      multiplier = 2.0;
    } else if (this.combo >= 5) {
      multiplier = 1.5;
    }

    const earned = Math.round(baseScore * multiplier);
    this.score += earned;

    // Pitch shifted audio
    soundSynth.playEat(this.combo);

    // Increase fever gauge
    if (!this.isFever) {
      this.feverGauge = Math.min(this.maxFever, this.feverGauge + feverInc);
      if (this.feverGauge >= this.maxFever) {
        this.triggerFever();
      }
    }

    if (this.onScoreChanged) this.onScoreChanged(this.score);
    if (this.onComboChanged) this.onComboChanged(this.combo, this.comboTimer / this.comboDuration);
    if (this.onFeverChanged) this.onFeverChanged(this.feverGauge);
  }

  triggerFever() {
    this.isFever = true;
    this.feverGauge = this.maxFever;
    if (this.onFeverTriggered) this.onFeverTriggered(5.0);
  }

  endFever() {
    this.isFever = false;
    this.feverGauge = 0;
    if (this.onFeverChanged) this.onFeverChanged(0);
  }

  breakCombo() {
    this.combo = 0;
    this.comboTimer = 0;
    if (this.onComboChanged) this.onComboChanged(0, 0);
  }

  update(dt) {
    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.breakCombo();
      } else {
        if (this.onComboChanged) this.onComboChanged(this.combo, this.comboTimer / this.comboDuration);
      }
    }
  }
}
