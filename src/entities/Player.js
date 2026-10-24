import { soundSynth } from '../audio/SoundSynth.js';
import { saveSystem } from '../core/SaveSystem.js';

// Forward offset (world units ahead of the camera anchor) the player may occupy on screen.
const MIN_OFFSET = 0.5;
const MAX_OFFSET = 8.0;
const LANE_LIMIT = 1.0;

export class Player {
  constructor(renderer) {
    this.renderer = renderer;

    // Path coordinates: s = distance along road, lane = -1 (left edge) .. +1 (right edge)
    this.s = 0;
    this.lane = 0;
    this.forwardOffset = 2.0;

    // Jump physics (physics units; renderer scales to world height)
    this.y = 0.0;
    this.vy = 0.0;
    this.isGrounded = true;
    this.isJumping = false;
    this.jumpCount = 0;
    this.maxJumps = 1;
    this.jumpForce = 15.0;
    this.gravity = -38.0;
    this.landTimer = 0;

    this.offsetSpeed = 4.0;
    this.laneSpeed = 2.2;
    this.currentLateralVel = 0.0;
    this.currentForwardVel = 0.0;

    // Collision half-width in world units
    this.hitRadius = 0.55;
    this.magnetRadius = 4.5;

    this.character = null;

    this.feathers = saveSystem.getFeatherLives();
    this.maxFeathers = this.feathers;
    this.isInvincible = false;
    this.invincibleTimer = 0.0;
    this.speedDebuffTimer = 0.0;
    this.pondTimer = 0.0;
    this.hitSerial = 0;

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

  setCharacter(charConfig) {
    this.character = charConfig;
    this.offsetSpeed = 3.0 + charConfig.speed * 0.5;
    this.laneSpeed = 1.6 + charConfig.speed * 0.25;
    this.jumpForce = 13.5 + charConfig.jumpPower * 0.8;
    this.hitRadius = charConfig.hitboxRadius * 0.75;
    this.magnetRadius = charConfig.magnetRadius * 1.6;

    if (charConfig.id === 'speedy_chick') {
      this.offsetSpeed *= 1.15;
      this.laneSpeed *= 1.15;
    }

    this.heavyBreakUsed = false;
    if (this.renderer) {
      this.renderer.setPlayerCharacter(charConfig);
    }
  }

  reset(lives) {
    this.s = 0;
    this.lane = 0;
    this.forwardOffset = 2.0;
    this.y = 0.0;
    this.vy = 0.0;
    this.isGrounded = true;
    this.isJumping = false;
    this.jumpCount = 0;
    this.maxJumps = 1;
    this.landTimer = 0;

    this.feathers = (lives !== undefined && lives !== null) ? lives : saveSystem.getFeatherLives();
    this.maxFeathers = this.feathers;
    this.isInvincible = false;
    this.invincibleTimer = 0.0;
    this.speedDebuffTimer = 0.0;
    this.pondTimer = 0.0;

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
    this.currentLateralVel = 0;
    this.currentForwardVel = 0;
  }

  /** Multiplier applied to the stage scroll speed (GDD: pepper 1.8x, hit -20%, pond -30%). */
  get speedFactor() {
    let f = 1.0;
    if (this.hasSpicyPepper) f *= 1.8;
    else if (this.rageTimer > 0) f *= 1.6;
    else if (this.isFever) f *= 1.3;
    if (this.speedDebuffTimer > 0 && !this.hasSpicyPepper) f *= 0.8;
    if (this.pondTimer > 0) {
      f *= this.character && this.character.id === 'daffy_duck' ? 1.2 : 0.7;
    }
    return f;
  }

  get worldHeight() {
    return this.y * 0.5;
  }

  jump() {
    if (this.isMissionSuccess || this.isMissionFailed) return;
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
        this.renderer.emitFeathers(this.renderer.path.point(this.s, this.lane, this.worldHeight), 10, 0xffe082);
      }
    }
  }

  /** Instant step on tap / click / key press. */
  stepMove(dir) {
    if (this.isMissionSuccess || this.isMissionFailed) return;
    if (dir === 'up') {
      this.forwardOffset = Math.min(MAX_OFFSET, this.forwardOffset + 0.6);
      this.currentForwardVel = 1.0;
    } else if (dir === 'down') {
      this.forwardOffset = Math.max(MIN_OFFSET, this.forwardOffset - 0.6);
      this.currentForwardVel = -1.0;
    } else if (dir === 'left') {
      this.lane = Math.max(-LANE_LIMIT, this.lane - 0.2);
      this.currentLateralVel = -1.0;
    } else if (dir === 'right') {
      this.lane = Math.min(LANE_LIMIT, this.lane + 0.2);
      this.currentLateralVel = 1.0;
    }
  }

  /** Continuous movement while holding a direction. forwardDelta +1 = up the screen. */
  move(forwardDelta, lateralDelta, dt) {
    if (this.isMissionSuccess || this.isMissionFailed) return;
    const agility = (this.hasSpicyPepper || this.isFever || this.rageTimer > 0) ? 1.4
      : (this.speedDebuffTimer > 0 ? 0.8 : 1.0);

    this.currentForwardVel = forwardDelta;
    this.currentLateralVel = lateralDelta;

    this.forwardOffset += forwardDelta * this.offsetSpeed * agility * dt;
    this.forwardOffset = Math.max(MIN_OFFSET, Math.min(MAX_OFFSET, this.forwardOffset));

    this.lane += lateralDelta * this.laneSpeed * agility * dt;
    if (this.lane > LANE_LIMIT) this.lane = LANE_LIMIT;
    if (this.lane < -LANE_LIMIT) this.lane = -LANE_LIMIT;
  }

  takeDamage() {
    if (this.isInvincible || this.isFever || this.hasSpicyPepper || this.rageTimer > 0) {
      return false;
    }

    // Funny Chicken passive: Somersault Guard
    if (this.character && this.character.id === 'funny_chicken' && this.isJumping) {
      return false;
    }

    const pos = this.renderer ? this.renderer.path.point(this.s, this.lane, this.worldHeight) : null;

    // Rooster King passive: Heavy Break
    if (this.character && this.character.id === 'rooster_king' && !this.heavyBreakUsed) {
      this.heavyBreakUsed = true;
      soundSynth.playHit();
      if (pos) this.renderer.emitFeathers(pos, 18, 0x8d6e63);
      return false;
    }

    this.feathers--;
    this.hitSerial++;
    soundSynth.playHit();
    if (pos) this.renderer.emitFeathers(pos, 24, 0xffd700);

    // Turbo Turkey passive: Rage Booster
    if (this.character && this.character.id === 'turbo_turkey') {
      this.rageTimer = 3.0;
    }

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
      this.renderer.emitFeathers(this.renderer.path.point(this.s, this.lane, this.worldHeight), 30, 0xffd700);
    }
  }

  /** anchorS: camera anchor distance; the player sits forwardOffset ahead of it. */
  update(dt, anchorS) {
    if (this.isMissionSuccess || this.isMissionFailed) {
      this.forwardOffset += (2.5 - this.forwardOffset) * 2.5 * dt;
      this.lane += (0.0 - this.lane) * 2.5 * dt;
      if (this.y > 0) {
        this.y = Math.max(0, this.y - 6.0 * dt);
      }
      this.isGrounded = this.y === 0;
      this.isJumping = !this.isGrounded;
      this.s = anchorS + this.forwardOffset;
      return;
    }

    if (!this.isGrounded) {
      this.y += this.vy * dt;
      this.vy += this.gravity * dt;
      if (this.y <= 0) {
        this.y = 0;
        this.vy = 0;
        this.isGrounded = true;
        this.isJumping = false;
        this.jumpCount = 0;
        this.landTimer = 0.18;
      }
    }
    if (this.landTimer > 0) this.landTimer = Math.max(0, this.landTimer - dt);

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
    if (this.rageTimer > 0) this.rageTimer -= dt;
    if (this.isInvincible) {
      this.invincibleTimer -= dt;
      if (this.invincibleTimer <= 0) this.isInvincible = false;
    }
    if (this.speedDebuffTimer > 0) this.speedDebuffTimer -= dt;
    if (this.pondTimer > 0) this.pondTimer -= dt;

    this.currentLateralVel *= Math.max(0.0, 1.0 - dt * 8.0);
    this.currentForwardVel *= Math.max(0.0, 1.0 - dt * 8.0);

    this.s = anchorS + this.forwardOffset;
  }
}
