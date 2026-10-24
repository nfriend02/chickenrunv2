import { soundSynth } from '../audio/SoundSynth.js';
import { saveSystem } from '../core/SaveSystem.js';

export class Player {
  constructor(renderer) {
    this.renderer = renderer;

    // Track Coordinates (0: Top-Right Vanishing Point -> 1: Bottom-Left Exit)
    this.trackPos = 0.70; // Player default position along track
    this.lanePos = 0.0;   // Lateral lane (-0.85: Left -> +0.85: Right)

    // Jump Physics (Along Y axis)
    this.y = 0.0;
    this.vy = 0.0;
    this.isGrounded = true;
    this.isJumping = false;
    this.jumpCount = 0;
    this.maxJumps = 1;
    this.jumpForce = 15.0;
    this.gravity = -38.0;

    // Movement speeds
    this.trackSpeed = 0.65;
    this.laneSpeed = 2.2;
    this.currentLateralVel = 0.0;
    this.currentForwardVel = 0.0;

    // 2x Hitbox size
    this.hitboxRadius = 1.2;
    this.magnetRadius = 4.5;

    // Character config
    this.character = null;

    // Health
    this.feathers = saveSystem.getFeatherLives();
    this.maxFeathers = this.feathers;
    this.isInvincible = false;
    this.invincibleTimer = 0.0;
    this.speedDebuffTimer = 0.0;

    // Power-ups
    this.hasSpicyPepper = false;
    this.pepperTimer = 0.0;
    this.hasGoldenBanana = false;
    this.bananaTimer = 0.0;
    this.hasMagnet = false;
    this.magnetTimer = 0.0;
    this.isFever = false;
    this.feverTimer = 0.0;

    this.heavyBreakUsed = false;
    this.rageTimer = 0.0;
  }

  setCharacter(charConfig) {
    this.character = charConfig;
    this.trackSpeed = 0.55 + charConfig.speed * 0.08;
    this.laneSpeed = 1.8 + charConfig.speed * 0.25;
    this.jumpForce = 13.5 + charConfig.jumpPower * 0.8;
    this.hitboxRadius = charConfig.hitboxRadius * 1.8; // 2x scaled
    this.magnetRadius = charConfig.magnetRadius * 1.6;

    if (charConfig.id === 'speedy_chick') {
      this.trackSpeed *= 1.15;
      this.laneSpeed *= 1.15;
    }

    this.heavyBreakUsed = false;
    if (this.renderer) {
      this.renderer.setPlayerCharacter(charConfig);
    }
  }

  reset(feathersCount) {
    this.trackPos = 0.70;
    this.lanePos = 0.0;
    this.y = 0.0;
    this.vy = 0.0;
    this.isGrounded = true;
    this.isJumping = false;
    this.jumpCount = 0;
    this.maxJumps = 1;

    this.feathers = feathersCount;
    this.maxFeathers = feathersCount;
    this.isInvincible = false;
    this.invincibleTimer = 0.0;
    this.speedDebuffTimer = 0.0;

    this.hasSpicyPepper = false;
    this.pepperTimer = 0.0;
    this.hasGoldenBanana = false;
    this.bananaTimer = 0.0;
    this.hasMagnet = false;
    this.magnetTimer = 0.0;
    this.isFever = false;
    this.feverTimer = 0.0;

    this.heavyBreakUsed = false;
    this.rageTimer = 0.0;
    this.isMissionSuccess = false;
    this.isMissionFailed = false;
  }

  jump() {
    const allowedJumps = this.hasGoldenBanana ? 2 : 1;
    if (this.jumpCount < allowedJumps) {
      this.jumpCount++;
      this.vy = this.jumpForce;
      this.isGrounded = false;
      this.isJumping = true;

      if (this.jumpCount === 1) {
        soundSynth.playJump();
      } else {
        soundSynth.playDoubleJump();
      }

      if (this.renderer) {
        const worldPos = this.renderer.getTrackWorldPos(this.trackPos, this.lanePos, this.y);
        this.renderer.emitFeathers(worldPos, 12, 0xFFE082);
      }
    }
  }

  // Instant tactile movement step on tap / click
  stepMove(dir) {
    if (dir === 'up') {
      this.trackPos = Math.max(0.15, this.trackPos - 0.06);
      this.currentForwardVel = 1.0;
    } else if (dir === 'down') {
      this.trackPos = Math.min(0.95, this.trackPos + 0.06);
      this.currentForwardVel = -1.0;
    } else if (dir === 'left') {
      this.lanePos = Math.max(-2.0, this.lanePos - 0.25);
      this.currentLateralVel = -1.0;
    } else if (dir === 'right') {
      this.lanePos = Math.min(2.0, this.lanePos + 0.25);
      this.currentLateralVel = 1.0;
    }
  }

  // Continuous movement while holding button / hovering / pressing keys (Across 200% road width)
  move(forwardDelta, lateralDelta, dt) {
    let speedMult = 1.0;
    if (this.hasSpicyPepper || this.isFever || this.rageTimer > 0) {
      speedMult = 1.6;
    } else if (this.speedDebuffTimer > 0) {
      speedMult = 0.8;
    }

    this.currentForwardVel = forwardDelta;
    this.currentLateralVel = lateralDelta;

    // forwardDelta: +1 (Up towards road start), -1 (Down towards road exit)
    this.trackPos -= forwardDelta * this.trackSpeed * speedMult * dt;
    this.trackPos = Math.max(0.15, Math.min(0.95, this.trackPos));

    // lateralDelta: -1 (Left), +1 (Right) across 200% of road
    this.lanePos += lateralDelta * this.laneSpeed * speedMult * dt;
    this.lanePos = Math.max(-2.0, Math.min(2.0, this.lanePos));
  }

  takeDamage() {
    if (this.isInvincible || this.isFever || this.hasSpicyPepper || this.rageTimer > 0) {
      return false; // Immune
    }

    // Funny Chicken passive: Somersault Guard (Invulnerable during jump)
    if (this.character && this.character.id === 'funny_chicken' && this.isJumping) {
      return false;
    }

    // Rooster King passive: Heavy Break (Ignore 1st obstacle collision)
    if (this.character && this.character.id === 'rooster_king' && !this.heavyBreakUsed) {
      this.heavyBreakUsed = true;
      soundSynth.playHit();
      if (this.renderer) {
        const worldPos = this.renderer.getTrackWorldPos(this.trackPos, this.lanePos, this.y);
        this.renderer.emitFeathers(worldPos, 18, 0x8D6E63);
      }
      return false;
    }

    this.feathers--;
    soundSynth.playHit();

    if (this.renderer) {
      const worldPos = this.renderer.getTrackWorldPos(this.trackPos, this.lanePos, this.y);
      this.renderer.emitFeathers(worldPos, 24, 0xFFD700);
    }

    // Turbo Turkey passive: Rage Booster
    if (this.character && this.character.id === 'turbo_turkey') {
      this.rageTimer = 3.0;
    }

    // 1.2s invincibility frames & 20% slowdown
    this.isInvincible = true;
    this.invincibleTimer = 1.2;
    this.speedDebuffTimer = 0.8;

    return true;
  }

  applyPowerup(type, duration) {
    soundSynth.playPowerup();
    if (type === 'FIRE_BOOST') {
      this.hasSpicyPepper = true;
      this.pepperTimer = duration;
    } else if (type === 'DOUBLE_JUMP') {
      this.hasGoldenBanana = true;
      this.bananaTimer = duration;
      this.maxJumps = 2;
    } else if (type === 'MAGNET_PULL') {
      this.hasMagnet = true;
      this.magnetTimer = duration;
    }
  }

  activateFever(duration = 5.0) {
    this.isFever = true;
    this.feverTimer = duration;
    soundSynth.playFever();
    if (this.renderer) {
      const worldPos = this.renderer.getTrackWorldPos(this.trackPos, this.lanePos, this.y);
      this.renderer.emitFeathers(worldPos, 30, 0xFFD700);
    }
  }

  update(dt) {
    // Smooth cinematic centering on Mission Success or Mission Failed
    if (this.isMissionSuccess || this.isMissionFailed) {
      this.trackPos += (0.65 - this.trackPos) * 2.5 * dt;
      this.lanePos += (0.0 - this.lanePos) * 2.5 * dt;
      if (this.y > 0) {
        this.y = Math.max(0, this.y - 4.0 * dt);
        this.isGrounded = this.y === 0;
      }
      return;
    }

    // Jump physics
    if (!this.isGrounded) {
      this.y += this.vy * dt;
      this.vy += this.gravity * dt;

      if (this.y <= 0) {
        this.y = 0;
        this.vy = 0;
        this.isGrounded = true;
        this.isJumping = false;
        this.jumpCount = 0;
      }
    }

    // Powerup Timers
    if (this.hasSpicyPepper) {
      this.pepperTimer -= dt;
      if (this.pepperTimer <= 0) this.hasSpicyPepper = false;
    }

    if (this.hasGoldenBanana) {
      this.bananaTimer -= dt;
      if (this.bananaTimer <= 0) {
        this.hasGoldenBanana = false;
        this.maxJumps = 1;
      }
    }

    if (this.hasMagnet) {
      this.magnetTimer -= dt;
      if (this.magnetTimer <= 0) this.hasMagnet = false;
    }

    if (this.isFever) {
      this.feverTimer -= dt;
      if (this.feverTimer <= 0) this.isFever = false;
    }

    if (this.rageTimer > 0) {
      this.rageTimer -= dt;
    }

    // Invincibility Timer
    if (this.isInvincible) {
      this.invincibleTimer -= dt;
      if (this.invincibleTimer <= 0) this.isInvincible = false;
    }

    // Speed Debuff Timer
    if (this.speedDebuffTimer > 0) {
      this.speedDebuffTimer -= dt;
    }

    // Smoothly decay velocity when inputs are released
    this.currentLateralVel *= Math.max(0.0, 1.0 - dt * 8.0);
    this.currentForwardVel *= Math.max(0.0, 1.0 - dt * 8.0);
  }

  reset(lives) {
    this.trackPos = 0.70;
    this.lanePos = 0.0;
    this.y = 0.0;
    this.vy = 0.0;
    this.isGrounded = true;
    this.isJumping = false;
    this.jumpCount = 0;
    this.feathers = (lives !== undefined && lives !== null) ? lives : saveSystem.getFeatherLives();
    this.maxFeathers = this.feathers;
    this.isInvincible = false;
    this.invincibleTimer = 0.0;
    this.speedDebuffTimer = 0.0;
    this.hasSpicyPepper = false;
    this.pepperTimer = 0.0;
    this.hasGoldenBanana = false;
    this.bananaTimer = 0.0;
    this.hasMagnet = false;
    this.magnetTimer = 0.0;
    this.isFever = false;
    this.feverTimer = 0.0;
    this.heavyBreakUsed = false;
    this.rageTimer = 0.0;
  }
}
