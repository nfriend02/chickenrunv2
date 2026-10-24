import { soundSynth } from '../audio/SoundSynth.js';

export class InputManager {
  constructor(player) {
    this.player = player;

    this.keys = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      KeyW: false,
      KeyS: false,
      KeyA: false,
      KeyD: false,
      Space: false
    };

    this.holdingStates = {
      up: false,
      down: false,
      left: false,
      right: false
    };

    this.setupKeyboard();
    this.setupTouchAndHoverControls();
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (this.keys.hasOwnProperty(e.code)) {
        this.keys[e.code] = true;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.player) this.player.jump();
      }
      // Instant tap move on single key press
      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (this.player) this.player.stepMove('up');
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        if (this.player) this.player.stepMove('down');
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        if (this.player) this.player.stepMove('left');
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        if (this.player) this.player.stepMove('right');
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.keys.hasOwnProperty(e.code)) {
        this.keys[e.code] = false;
      }
    });
  }

  setupTouchAndHoverControls() {
    // Jump Button (Left Thumb)
    const jumpBtn = document.getElementById('jump-button');
    if (jumpBtn) {
      const doJump = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (this.player) this.player.jump();
        jumpBtn.classList.add('active');
        setTimeout(() => jumpBtn.classList.remove('active'), 150);
      };

      jumpBtn.addEventListener('pointerdown', doJump);
      jumpBtn.addEventListener('click', doJump);
    }

    // 4-Way D-Pad Arrow Buttons (Right Thumb)
    const dpadButtons = document.querySelectorAll('.dpad-btn');
    dpadButtons.forEach((btn) => {
      const dir = btn.dataset.dir;

      const triggerStart = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        this.holdingStates[dir] = true;
        btn.classList.add('hover-active');

        // Apply instant tactile step on initial contact
        if (this.player) {
          this.player.stepMove(dir);
        }
      };

      const triggerEnd = (e) => {
        if (e) e.preventDefault();
        this.holdingStates[dir] = false;
        btn.classList.remove('hover-active');
      };

      // Pointer events for instant cross-device touch and mouse support
      btn.addEventListener('pointerdown', triggerStart);
      btn.addEventListener('pointerup', triggerEnd);
      btn.addEventListener('pointercancel', triggerEnd);

      // Mouse Hover (Desktop: moves instantly upon hovering without click!)
      btn.addEventListener('mouseenter', () => {
        this.holdingStates[dir] = true;
        btn.classList.add('hover-active');
        if (this.player) this.player.stepMove(dir);
      });

      btn.addEventListener('mouseleave', () => {
        this.holdingStates[dir] = false;
        btn.classList.remove('hover-active');
      });

      // Regular click event fallback
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.player) {
          this.player.stepMove(dir);
        }
      });
    });

    // Global release guard to ensure buttons never stay stuck
    window.addEventListener('pointerup', () => {
      Object.keys(this.holdingStates).forEach(k => {
        this.holdingStates[k] = false;
      });
      dpadButtons.forEach(b => b.classList.remove('hover-active'));
    });
  }

  update(dt) {
    if (!this.player) return;

    let forwardDelta = 0; // +1: Up along 20° track, -1: Down along 200° track
    let lateralDelta = 0; // -1: Left across track, +1: Right across track

    // Forward/Backward: Up (▲) moves towards vanishing point, Down (▼) moves backwards
    if (this.keys.ArrowUp || this.keys.KeyW || this.holdingStates.up) forwardDelta += 1;
    if (this.keys.ArrowDown || this.keys.KeyS || this.holdingStates.down) forwardDelta -= 1;

    // Lateral Steering: Left (◀) steers left, Right (▶) steers right
    if (this.keys.ArrowRight || this.keys.KeyD || this.holdingStates.right) lateralDelta += 1;
    if (this.keys.ArrowLeft || this.keys.KeyA || this.holdingStates.left) lateralDelta -= 1;

    if (forwardDelta !== 0 || lateralDelta !== 0) {
      this.player.move(forwardDelta, lateralDelta, dt);
    }
  }
}
