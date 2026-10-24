import { saveSystem } from '../core/SaveSystem.js';

class SoundSynth {
  constructor() {
    this.ctx = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.isBgmPlaying = false;
    this.bgmInterval = null;
    this.bgmStep = 0;
    this.settings = saveSystem.getSettings();
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = this.settings.bgmVolume * 0.35;
    this.bgmGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.settings.sfxVolume * 0.6;
    this.sfxGain.connect(this.ctx.destination);
  }

  ensureContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolumes(bgm, sfx) {
    this.settings.bgmVolume = bgm;
    this.settings.sfxVolume = sfx;
    if (this.bgmGain) this.bgmGain.gain.value = bgm * 0.35;
    if (this.sfxGain) this.sfxGain.gain.value = sfx * 0.6;
  }

  // --- Sound Effects ---

  playJump() {
    this.ensureContext();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(680, this.ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);
  }

  playDoubleJump() {
    this.ensureContext();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1100, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.24);
  }

  playEat(comboCount = 0) {
    this.ensureContext();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    // Pitch shift with combo (1.05^combo, capped at 2.0x)
    const pitchMul = Math.min(2.0, Math.pow(1.05, comboCount));
    const baseFreq = 580 * pitchMul;

    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.11);
  }

  playCollect(comboCount = 0) {
    this.playEat(comboCount);
  }

  playPowerup() {
    this.ensureContext();
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.06 + 0.12);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(this.ctx.currentTime + idx * 0.06);
      osc.stop(this.ctx.currentTime + idx * 0.06 + 0.15);
    });
  }

  playHit() {
    this.ensureContext();
    // Low punch + noise burst
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playFever() {
    this.ensureContext();
    const chords = [523.25, 659.25, 783.99, 1046.5];
    chords.forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.65);
    });
  }

  playWarning() {
    this.ensureContext();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.setValueAtTime(500, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.28);
  }

  playBossChase() {
    this.ensureContext();
    // Siren warble
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(950, this.ctx.currentTime + 0.3);
    osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.6);
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.7);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.75);
  }

  playCowMoo() {
    this.ensureContext();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(110, this.ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.52);
  }

  playCarHonk() {
    this.ensureContext();
    [392, 493.88].forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.27);
    });
  }

  playExplosion() {
    this.ensureContext();
    // BBONG! Puffed rice explosion
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.9, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.65);
  }

  playEvadeSuccess() {
    this.ensureContext();
    // High-pitched bright chime + whoosh (successful jump dodge!)
    const notes = [659.25, 880.00, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.04);
      gain.gain.setValueAtTime(0.5, this.ctx.currentTime + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.04 + 0.22);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(this.ctx.currentTime + idx * 0.04);
      osc.stop(this.ctx.currentTime + idx * 0.04 + 0.25);
    });
  }

  playThunderLightning() {
    this.ensureContext();
    // Thunder clap & electric zap
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.85, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.85);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.9);
  }

  playMissionFailed() {
    this.ensureContext();
    // Sad declining notes
    const sadNotes = [392.00, 369.99, 329.63, 293.66];
    sadNotes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.22);
      gain.gain.setValueAtTime(0.4, this.ctx.currentTime + idx * 0.22);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.22 + 0.35);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(this.ctx.currentTime + idx * 0.22);
      osc.stop(this.ctx.currentTime + idx * 0.22 + 0.38);
    });
  }

  // --- Upbeat Background Music Melody Loop ---
  startBgm() {
    this.ensureContext();
    if (this.isBgmPlaying) return;
    this.isBgmPlaying = true;
    this.bgmStep = 0;

    const melody = [
      261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 261.63, 392.00,
      293.66, 349.23, 440.00, 587.33, 440.00, 349.23, 293.66, 440.00,
      329.63, 392.00, 523.25, 659.25, 523.25, 392.00, 329.63, 523.25,
      261.63, 329.63, 392.00, 523.25, 440.00, 392.00, 349.23, 329.63
    ];

    const bass = [
      130.81, 130.81, 164.81, 164.81, 196.00, 196.00, 130.81, 196.00,
      146.83, 146.83, 174.61, 174.61, 220.00, 220.00, 146.83, 220.00,
      164.81, 164.81, 196.00, 196.00, 261.63, 261.63, 164.81, 261.63,
      130.81, 130.81, 164.81, 164.81, 220.00, 196.00, 174.61, 164.81
    ];

    const stepDuration = 180; // ms

    this.bgmInterval = setInterval(() => {
      if (!this.isBgmPlaying || !this.ctx) return;
      const idx = this.bgmStep % melody.length;
      const mFreq = melody[idx];
      const bFreq = bass[idx];

      // Lead note
      const mOsc = this.ctx.createOscillator();
      const mGain = this.ctx.createGain();
      mOsc.type = 'triangle';
      mOsc.frequency.value = mFreq;
      mGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      mGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
      mOsc.connect(mGain);
      mGain.connect(this.bgmGain);
      mOsc.start();
      mOsc.stop(this.ctx.currentTime + 0.16);

      // Bass note
      if (idx % 2 === 0) {
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = 'sine';
        bOsc.frequency.value = bFreq;
        bGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        bGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.28);
        bOsc.connect(bGain);
        bGain.connect(this.bgmGain);
        bOsc.start();
        bOsc.stop(this.ctx.currentTime + 0.3);
      }

      this.bgmStep++;
    }, stepDuration);
  }

  stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const soundSynth = new SoundSynth();
