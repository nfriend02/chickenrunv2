export class IntroCutscene {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.container = document.getElementById('intro-video-container');
    this.video = document.getElementById('intro-video');
    this.soundBtn = document.getElementById('intro-sound-btn');
    this.soundIcon = document.getElementById('intro-sound-icon');
    this.soundLabel = document.getElementById('intro-sound-label');
    this.skipBtn = document.getElementById('skip-intro-btn');

    this.isPlaying = true;
    this.safetyTimer = null;

    // Global reference for emergency direct calls
    window.__INTRO_CUTSCENE__ = this;

    this.setupListeners();
  }

  setupListeners() {
    // Top-Left Sound Toggle Button (Default: Off / Muted)
    // Note: onclick is hooked in index.html to window.toggleIntroSound(event)
    // Here we ensure window.toggleIntroSound syncs with this instance
    this.toggleSound = (e) => {
      if (typeof window.toggleIntroSound === 'function') {
        window.toggleIntroSound(e);
      }
    };

    // Skip Button (Bottom-Right)
    if (this.skipBtn) {
      const handleSkip = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        console.log('⏩ Intro skipped by user button click');
        this.finish();
      };
      this.skipBtn.addEventListener('click', handleSkip);
      this.skipBtn.onclick = handleSkip;
    }

    // Clicking on intro container (outside buttons) also skips
    if (this.container) {
      this.container.addEventListener('click', (e) => {
        if (e.target.closest('#intro-sound-btn') || e.target.closest('#skip-intro-btn')) {
          return;
        }
        console.log('⏩ Intro skipped by container click');
        this.finish();
      });
    }

    // Keyboard Space / Enter / Escape skips intro
    window.addEventListener('keydown', (e) => {
      if (this.isPlaying && (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape')) {
        this.finish();
      }
    });
  }

  toggleSound() {
    if (!this.video) this.video = document.getElementById('intro-video');
    if (!this.video) return;

    this.video.muted = !this.video.muted;
    console.log('🔊 Sound toggle clicked. video.muted =', this.video.muted);
    this.updateSoundDisplay();
  }

  updateSoundDisplay() {
    if (!this.soundBtn) this.soundBtn = document.getElementById('intro-sound-btn');
    if (!this.soundIcon) this.soundIcon = document.getElementById('intro-sound-icon');
    if (!this.soundLabel) this.soundLabel = document.getElementById('intro-sound-label');
    if (!this.video) this.video = document.getElementById('intro-video');

    const isMuted = !this.video || this.video.muted;
    if (this.soundIcon) {
      this.soundIcon.textContent = isMuted ? '🔇' : '🔊';
    }
    if (this.soundLabel) {
      this.soundLabel.textContent = isMuted ? '사운드 OFF' : '사운드 ON';
    }
    if (this.soundBtn) {
      if (isMuted) {
        this.soundBtn.classList.remove('unmuted');
        this.soundBtn.setAttribute('title', '사운드 켜기 (현재: 음소거 OFF)');
      } else {
        this.soundBtn.classList.add('unmuted');
        this.soundBtn.setAttribute('title', '사운드 끄기 (현재: 소리 ON)');
      }
    }
  }

  play() {
    this.isPlaying = true;

    if (!this.container) this.container = document.getElementById('intro-video-container');
    if (!this.video) this.video = document.getElementById('intro-video');

    if (this.container) {
      this.container.classList.remove('hidden');
      this.container.style.display = 'flex';
    }

    // Safety timeout: 7.5 seconds (video is 6s). Transition to Title Screen if finished.
    if (this.safetyTimer) clearTimeout(this.safetyTimer);
    this.safetyTimer = setTimeout(() => {
      if (this.isPlaying) {
        console.log('⏰ 6-second Intro completed -> Transitioning to Title Screen');
        this.finish();
      }
    }, 7500);

    if (this.video) {
      this.video.style.display = 'block';
      if (!this.video.src || !this.video.src.includes('intro.mp4')) {
        this.video.src = '/assets/videos/intro.mp4';
      }
      this.video.currentTime = 0;
      this.video.muted = true; // Default OFF
      this.updateSoundDisplay();

      const onEnded = () => {
        this.video.removeEventListener('ended', onEnded);
        console.log('🎬 Video ended naturally');
        this.finish();
      };
      this.video.addEventListener('ended', onEnded);

      // Attempt playback
      const playPromise = this.video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('🎬 Intro video playing (Sound OFF default)');
          })
          .catch((err) => {
            console.warn('Autoplay warning:', err);
            // Ensure muted and retry
            this.video.muted = true;
            this.video.play().catch((e) => {
              console.warn('Secondary play failed:', e);
            });
          });
      }
    }
  }

  finish() {
    console.log('🏁 IntroCutscene finish() executed');
    this.isPlaying = false;

    if (this.safetyTimer) {
      clearTimeout(this.safetyTimer);
      this.safetyTimer = null;
    }

    if (this.video) {
      try {
        this.video.pause();
        this.video.currentTime = 0;
      } catch (e) {}
    }

    if (this.container) {
      this.container.classList.add('hidden');
      this.container.style.display = 'none';
    }

    if (this.onComplete) {
      const callback = this.onComplete;
      this.onComplete = null;
      callback();
    }
  }
}
