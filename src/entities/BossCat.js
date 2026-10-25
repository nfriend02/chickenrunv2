import { soundSynth } from '../audio/SoundSynth.js';
import { Obstacle } from './Obstacle.js';
import { SpriteAnimator } from '../animation/SpriteAnimator.js';
import { ENTITY_SCALE } from '../core/WorldScale.js';
import { t } from '../core/i18n.js';

const STALK_OFFSET = -4.2;
// While stalking the cat keeps to the lane beside the player so the hero stays visible.
const STALK_SIDE = 0.8;
const LUNGE_SPEED = 10;
const RETREAT_SPEED = 6;
const HAY_TARGET = 3;
const HAY_SPAWN_AHEAD = 24;
const HAY_LANES = [-0.4, 0.45, 0.0];

const CAT_HEIGHT = 1.9 * ENTITY_SCALE;
const HISS_TIME = 1.3;
const EVADED_TIME = 1.1;
const SWIPE_TIME = 0.9;
const LAUNCH_TIME = 1.2;
const LAUNCH_PEAK = 3.2 * ENTITY_SCALE;
const POUNCE_PEAK = 1.0 * ENTITY_SCALE;
const POUNCE_END = 4.0;
const BURIED_MIN_REL = -3.6;
// Lane speed (lanes/s) above which the cat switches to the diagonal run.
const DIAG_LANE_SPEED = 0.35;

// clip: sprite sheet, height: world height relative to CAT_HEIGHT (sheets are cropped to each clip's
// own pose range, so tall poses need a larger sprite to keep the cat the same size), duration: seconds.
const CLIP_FOR_STATE = {
  ENTERING: { clip: 'run_back', height: 1.0 },
  HISSING: { clip: 'hiss', height: 0.8, duration: HISS_TIME, loop: false },
  STALKING: { clip: 'run_back', height: 1.0 },
  CHARGING: { clip: 'crouch', height: 0.85, duration: 0.85 },
  LUNGING: { clip: 'pounce', height: 0.85, duration: (POUNCE_END - STALK_OFFSET) / LUNGE_SPEED, loop: false },
  EVADED: { clip: 'miss_tumble', height: 1.0, duration: EVADED_TIME, loop: false },
  SWIPE: { clip: 'swipe', height: 0.9, duration: SWIPE_TIME, loop: false },
  RETREAT: { clip: 'taunt', height: 1.05 },
  BURY_RUN: { clip: 'run_back', height: 1.0 },
  BURIED: { clip: 'faceplant', height: 0.8, duration: 2.4 },
  DEFEATED: { clip: 'launched', height: 0.95, duration: LAUNCH_TIME, loop: false },
  DIZZY: { clip: 'dizzy', height: 0.87, duration: 1.6 },
  GLOAT: { clip: 'swipe', height: 0.9, duration: 1.4, loop: true },
  IDLE: { clip: 'taunt', height: 1.05 }
};
const DIAG_CLIP = { clip: 'run_diag', height: 0.83 };

/**
 * The old grumpy cat's finale chase. The cat lives at a distance offset (relS) from the player:
 * negative = behind the player (lower on screen), positive = ahead.
 * Stage 1 follows the GDD finale: dodge 3 haystacks in a row and the cat gets buried in the last one.
 * Other stages use the generic "dodge 4 lunges" finale until their own gimmicks are built.
 */
export class BossCat {
  constructor(renderer) {
    this.renderer = renderer;
    this.active = false;
    this.stageId = 1;
    this.s = 0;
    this.relS = -9;
    this.lane = 0;
    this.h = 0;
    this.state = 'IDLE';
    this.animTime = 0;
    this.stateTimer = 0;
    this.evadeCount = 0;
    this.targetEvades = 4;
    this.hasResolvedCurrentLunge = false;

    this.hays = [];
    this.haysAvoided = 0;
    this.hayIndex = 0;
    this.buryHay = null;
    this.hopTimer = 0;

    this.onAttackWarning = null;
    this.onEvaded = null;
    this.onMissionSuccess = null;
    this.onMissionFailed = null;

    this.sprite = renderer.createBillboard('/assets/images/npcs/cat_grumpy.png', 1.9 * ENTITY_SCALE);
    this.staticTexture = this.sprite.material.map;
    this.animator = new SpriteAnimator(this.sprite);

    for (let i = 0; i < HAY_TARGET + 2; i++) {
      this.hays.push(new Obstacle(renderer, 'haystack'));
    }
  }

  get usesHayFinale() {
    return this.stageId === 1;
  }

  /** World scroll multiplier: slow motion while the cat crashes into the haystack. */
  get worldSpeedScale() {
    return this.state === 'BURY_RUN' || this.state === 'BURIED' ? 0.3 : 1.0;
  }

  startChase(stageId) {
    this.stageId = stageId;
    this.active = true;
    this.state = 'ENTERING';
    this.relS = -9;
    this.lane = 0;
    this.h = 0;
    this.animTime = 0;
    this.stateTimer = 0;
    this.evadeCount = 0;
    this.haysAvoided = 0;
    this.hayIndex = 0;
    this.successSent = false;
    this.hasResolvedCurrentLunge = false;
    this.targetEvades = this.usesHayFinale ? HAY_TARGET : 4;
    this.hays.forEach(h => h.deactivate());
    this.buryHay = null;

    this.laneSpeed = 0;
    this.animator.stop();
    this.sprite.material.color.setHex(0xffffff);
    this.sprite.visible = true;
    soundSynth.playBossChase();

    if (this.onAttackWarning) {
      this.onAttackWarning(this.usesHayFinale
        ? t('boss.appearHay')
        : t('boss.appear', { n: this.targetEvades }));
    }
  }

  sideLane(player) {
    const side = player.lane >= 0 ? -STALK_SIDE : STALK_SIDE;
    return Math.max(-0.95, Math.min(0.95, player.lane + side));
  }

  setState(state) {
    this.state = state;
    this.stateTimer = 0;
    this.sprite.material.color.setHex(0xffffff);
  }

  // ------------------------------------------------------------ finale

  spawnNextHay(player) {
    const hay = this.hays.find(h => !h.active);
    if (!hay) return;
    hay.spawn(player.s + HAY_SPAWN_AHEAD, HAY_LANES[this.hayIndex % HAY_LANES.length]);
    hay.isFinale = true;
    this.hayIndex++;
  }

  updateHays(dt, player, anchorS) {
    let pending = false;
    for (const hay of this.hays) {
      if (!hay.active) continue;
      if (hay !== this.buryHay) hay.update(dt, anchorS);
      if (!hay.active || !hay.isFinale) continue;

      if (!hay.passed) {
        pending = true;
        const res = hay.checkCollision(player, this.renderer.path.halfWidth);
        if (res === 'DAMAGE') {
          player.takeDamage();
        }
        if (hay.s < player.s - 1.0) {
          hay.passed = true;
          if (!hay.wasHit) {
            this.haysAvoided++;
            soundSynth.playEvadeSuccess();
            this.renderer.emitFeathers(this.renderer.path.point(player.s, player.lane, 0.5), 16, 0xffd700);
            if (this.onEvaded) this.onEvaded(this.haysAvoided, HAY_TARGET);
            if (this.haysAvoided >= HAY_TARGET) {
              this.buryHay = hay;
              this.setState('BURY_RUN');
            }
          }
        }
      }

      if (hay !== this.buryHay && Math.abs(hay.s - this.s) < 0.6 && this.hopTimer <= 0) {
        this.hopTimer = 0.5;
      }
    }
    if (!pending && this.haysAvoided < HAY_TARGET && this.state !== 'ENTERING') {
      this.spawnNextHay(player);
    }
  }

  // ------------------------------------------------------------- update

  update(dt, player, anchorS) {
    if (!this.active) return;
    this.frameDt = dt;
    this.animTime += dt;
    this.stateTimer += dt;
    if (this.hopTimer > 0) this.hopTimer -= dt;

    if (this.usesHayFinale && this.state !== 'BURIED' && this.state !== 'GLOAT') {
      this.updateHays(dt, player, anchorS);
    }

    const prevLane = this.lane;
    this.h = 0;

    switch (this.state) {
      case 'ENTERING': {
        this.relS += (STALK_OFFSET - this.relS) * 2.2 * dt;
        this.lane += (this.sideLane(player) - this.lane) * 2.0 * dt;
        if (this.stateTimer < 0.6 && Math.random() < 0.5) {
          this.renderer.emitFeathers(this.sprite.position, 4, 0x8d5524);
        }
        if (Math.abs(this.relS - STALK_OFFSET) < 0.15) {
          this.setState('HISSING');
          soundSynth.playWarning();
        }
        break;
      }

      case 'HISSING': {
        this.relS = STALK_OFFSET;
        this.lane += (this.sideLane(player) - this.lane) * 2.0 * dt;
        if (this.stateTimer >= HISS_TIME) this.setState('STALKING');
        break;
      }

      case 'STALKING': {
        this.lane += (this.sideLane(player) - this.lane) * 2.8 * dt;
        this.relS = STALK_OFFSET;
        if (this.stateTimer >= (this.usesHayFinale ? 2.6 : 2.0)) {
          this.setState('CHARGING');
          soundSynth.playWarning();
          if (this.onAttackWarning) this.onAttackWarning(t('boss.pounce'));
        }
        break;
      }

      case 'CHARGING': {
        this.lane += (player.lane - this.lane) * 3.5 * dt;
        this.sprite.material.color.setHex(Math.sin(this.animTime * 30) > 0 ? 0xffffff : 0xff8a80);
        if (this.stateTimer >= 0.85) {
          this.sprite.material.color.setHex(0xffffff);
          this.setState('LUNGING');
          this.hasResolvedCurrentLunge = false;
          soundSynth.playBossChase();
        }
        break;
      }

      case 'LUNGING': {
        this.relS += LUNGE_SPEED * dt;
        const p = Math.min(1, Math.max(0, (this.relS - STALK_OFFSET) / (POUNCE_END - STALK_OFFSET)));
        this.h = Math.sin(p * Math.PI) * POUNCE_PEAK;
        const ds = Math.abs(this.relS);
        const dLane = Math.abs(this.lane - player.lane);
        if (!this.hasResolvedCurrentLunge && ds < 0.7 && dLane < 0.55) {
          this.hasResolvedCurrentLunge = true;
          if (player.isJumping || player.y > 0.9) {
            soundSynth.playEvadeSuccess();
            const pos = this.renderer.path.point(player.s, player.lane, player.worldHeight);
            this.renderer.emitFeathers(pos, 20, 0x00ffff);
            if (!this.usesHayFinale) {
              this.evadeCount++;
              if (this.onEvaded) this.onEvaded(this.evadeCount, this.targetEvades);
            }
            this.setState('EVADED');
          } else {
            player.takeDamage();
            this.renderer.emitFeathers(this.sprite.position, 22, 0xe53935);
            if (player.feathers <= 0) {
              this.gloat();
              if (this.onMissionFailed) this.onMissionFailed(this.evadeCount);
              this.place();
              return;
            }
            this.setState('SWIPE');
          }
        }
        if (this.relS > POUNCE_END) this.setState('RETREAT');
        break;
      }

      case 'SWIPE': {
        this.relS += (-1.2 - this.relS) * 4.0 * dt;
        this.lane += (player.lane - this.lane) * 3.0 * dt;
        if (this.stateTimer >= SWIPE_TIME) this.setState('RETREAT');
        break;
      }

      case 'GLOAT': {
        this.relS += (-1.3 - this.relS) * 3.0 * dt;
        this.lane += (player.lane + (player.lane > 0 ? -0.35 : 0.35) - this.lane) * 3.0 * dt;
        break;
      }

      case 'EVADED': {
        this.relS += (4.5 - this.relS) * 2.0 * dt;
        if (this.stateTimer >= EVADED_TIME) {
          if (!this.usesHayFinale && this.evadeCount >= this.targetEvades) {
            this.finishDefeated();
            return;
          }
          this.setState('RETREAT');
        }
        break;
      }

      case 'RETREAT': {
        this.relS -= RETREAT_SPEED * dt;
        if (this.relS <= STALK_OFFSET) {
          this.relS = STALK_OFFSET;
          this.setState('STALKING');
          this.hasResolvedCurrentLunge = false;
        }
        break;
      }

      case 'BURY_RUN': {
        // Cat keeps charging straight at the last haystack, which is now behind the player.
        const hay = this.buryHay;
        this.keepHayInView(player);
        this.lane += (hay.lane - this.lane) * 4.0 * dt;
        const gap = hay.s - this.s;
        this.s += Math.sign(gap) * Math.min(Math.abs(gap), (player.speedFactor * 2 + 6) * dt);
        this.relS = this.s - player.s;
        if (Math.abs(hay.s - this.s) < 0.35) {
          this.setState('BURIED');
          soundSynth.playExplosion();
          soundSynth.playThunderLightning();
          this.renderer.emitFeathers(hay.sprite.position, 40, 0xe6c280);
          this.renderer.emitFeathers(hay.sprite.position, 20, 0xffd54f);
          if (this.onAttackWarning) this.onAttackWarning(t('boss.buried'));
        }
        break;
      }

      case 'BURIED': {
        // Head-first in the hay: the cat sits just behind the haystack, sunk into its top half.
        const hay = this.buryHay;
        this.keepHayInView(player);
        this.s = hay.s + 0.08;
        this.lane = hay.lane;
        this.h = hay.def.height * 0.5;
        if (Math.random() < 0.2) this.renderer.emitFeathers(hay.sprite.position, 2, 0xe6c280);
        if (this.stateTimer >= 0.9 && !this.successSent) {
          this.successSent = true;
          if (this.onMissionSuccess) this.onMissionSuccess();
        }
        this.place();
        return;
      }

      case 'DEFEATED': {
        const p = Math.min(1, this.stateTimer / LAUNCH_TIME);
        this.h = Math.sin(p * Math.PI) * LAUNCH_PEAK;
        this.lane += (this.sideLane(player) - this.lane) * 2.0 * dt;
        if (p >= 1) {
          this.setState('DIZZY');
          this.renderer.emitFeathers(this.sprite.position, 18, 0xffeb3b);
        }
        break;
      }

      case 'DIZZY':
        break;

      default:
        break;
    }

    if (this.state !== 'BURY_RUN') this.s = player.s + this.relS;
    if (this.hopTimer > 0) this.h += Math.sin((1 - this.hopTimer / 0.5) * Math.PI) * 1.4 * ENTITY_SCALE;
    this.laneSpeed += ((this.lane - prevLane) / Math.max(dt, 1e-3) - this.laneSpeed) * Math.min(1, dt * 10);
    this.place();
  }

  keepHayInView(player) {
    const hay = this.buryHay;
    if (hay.s < player.s + BURIED_MIN_REL) {
      hay.s = player.s + BURIED_MIN_REL;
      hay.place(0);
    }
  }

  /** The hero has run out of feathers: the cat stays beside them, swiping, through the fail scene. */
  gloat() {
    if (!this.active || this.state === 'GLOAT') return;
    this.sprite.material.color.setHex(0xffffff);
    this.setState('GLOAT');
  }

  finishDefeated() {
    this.setState('DEFEATED');
    soundSynth.playThunderLightning();
    this.renderer.emitFeathers(this.sprite.position, 35, 0xffeb3b);
    if (this.onMissionSuccess) this.onMissionSuccess();
  }

  clipSpec() {
    if (this.state === 'STALKING' && Math.abs(this.laneSpeed) > DIAG_LANE_SPEED) return DIAG_CLIP;
    return CLIP_FOR_STATE[this.state];
  }

  place() {
    this.renderer.path.point(this.s, this.lane, this.h, this.sprite.position);
    const spec = this.clipSpec();
    const clip = spec ? this.renderer.anims.get('cat_grumpy', spec.clip) : null;
    if (clip) {
      const opts = {};
      if (spec.duration) opts.duration = spec.duration;
      if (spec.loop !== undefined) opts.loop = spec.loop;
      this.animator.play(clip, opts);
      // run_diag faces left in the source video.
      const flip = spec === DIAG_CLIP && this.laneSpeed > 0;
      this.animator.setFlipX(flip);
      this.animator.update(this.frameDt || 1 / 60);
      const pivotX = clip.meta.pivot?.x ?? 0.5;
      this.sprite.center.x = flip ? 1 - pivotX : pivotX;
      const hgt = CAT_HEIGHT * spec.height;
      this.sprite.userData.aspect = this.animator.aspect;
      this.sprite.scale.set(hgt * this.animator.aspect, hgt, 1);
    } else if (this.animator.clip) {
      this.animator.stop();
      this.sprite.material.map = this.staticTexture;
      this.sprite.material.needsUpdate = true;
      this.renderer.fitSprite(this.sprite);
    }
  }

  reset() {
    this.active = false;
    this.state = 'IDLE';
    this.evadeCount = 0;
    this.haysAvoided = 0;
    this.successSent = false;
    this.hasResolvedCurrentLunge = false;
    this.buryHay = null;
    this.h = 0;
    this.sprite.visible = false;
    this.sprite.material.color.setHex(0xffffff);
    this.hays.forEach(h => h.deactivate());
  }
}
