import { soundSynth } from '../audio/SoundSynth.js';
import { Obstacle } from './Obstacle.js';
import { SpriteAnimator } from '../animation/SpriteAnimator.js';

const STALK_OFFSET = -4.2;
// While stalking the cat keeps to the lane beside the player so the hero stays visible.
const STALK_SIDE = 0.8;
const LUNGE_SPEED = 10;
const RETREAT_SPEED = 6;
const HAY_TARGET = 3;
const HAY_SPAWN_AHEAD = 24;
const HAY_LANES = [-0.4, 0.45, 0.0];

const CLIP_FOR_STATE = {
  ENTERING: 'walk',
  RETREAT: 'walk',
  STALKING: 'chase',
  LUNGING: 'chase',
  BURY_RUN: 'chase',
  CHARGING: 'angry',
  EVADED: 'angry',
  BURIED: 'defeated',
  DEFEATED: 'defeated'
};

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

    this.sprite = renderer.createBillboard('/assets/images/npcs/cat_grumpy.png', 1.9);
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
    this.buryHay = null;
    this.successSent = false;
    this.hasResolvedCurrentLunge = false;
    this.targetEvades = this.usesHayFinale ? HAY_TARGET : 4;
    this.hays.forEach(h => h.deactivate());

    const img = stageId === 2 ? '/assets/images/npcs/cat_tractor.png' : '/assets/images/npcs/cat_grumpy.png';
    this.renderer.setBillboardTexture(this.sprite, img);
    this.staticTexture = this.sprite.material.map;
    this.animator.stop();
    this.sprite.material.color.setHex(0xffffff);
    this.sprite.material.rotation = 0;
    this.sprite.visible = true;
    soundSynth.playBossChase();

    if (this.onAttackWarning) {
      this.onAttackWarning(this.usesHayFinale
        ? '🚪💥 늙은 고양이가 헛간 문을 부수고 나왔다! 건초더미 3개를 연속으로 피하세요!'
        : `🚨 늙은 고양이 출현! (회피 목표: ${this.targetEvades}회)`);
    }
  }

  sideLane(player) {
    const side = player.lane >= 0 ? -STALK_SIDE : STALK_SIDE;
    return Math.max(-0.95, Math.min(0.95, player.lane + side));
  }

  setState(state) {
    this.state = state;
    this.stateTimer = 0;
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

    if (this.usesHayFinale && this.state !== 'BURIED') {
      this.updateHays(dt, player, anchorS);
    }

    switch (this.state) {
      case 'ENTERING': {
        this.relS += (STALK_OFFSET - this.relS) * 2.2 * dt;
        this.lane += (this.sideLane(player) - this.lane) * 2.0 * dt;
        if (this.stateTimer < 0.6 && Math.random() < 0.5) {
          this.renderer.emitFeathers(this.sprite.position, 4, 0x8d5524);
        }
        if (Math.abs(this.relS - STALK_OFFSET) < 0.15) this.setState('STALKING');
        break;
      }

      case 'STALKING': {
        this.lane += (this.sideLane(player) - this.lane) * 2.8 * dt;
        this.relS = STALK_OFFSET + Math.sin(this.animTime * 6) * 0.15;
        if (this.stateTimer >= (this.usesHayFinale ? 2.6 : 2.0)) {
          this.setState('CHARGING');
          soundSynth.playWarning();
          if (this.onAttackWarning) this.onAttackWarning('⚠️ 고양이 급습 임박! JUMP 버튼으로 회피하세요! 🪶');
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
              this.setState('IDLE');
              if (this.onMissionFailed) this.onMissionFailed(this.evadeCount);
              return;
            }
            this.setState('RETREAT');
          }
        }
        if (this.relS > 4.0) this.setState('RETREAT');
        break;
      }

      case 'EVADED': {
        this.relS += (4.5 - this.relS) * 2.0 * dt;
        this.sprite.material.rotation += 9.0 * dt;
        if (this.stateTimer >= 0.7) {
          this.sprite.material.rotation = 0;
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
        this.lane += (hay.lane - this.lane) * 4.0 * dt;
        this.s = Math.min(this.s + (player.speedFactor * 2 + 3) * dt, hay.s);
        this.relS = this.s - player.s;
        if (hay.s - this.s < 0.35) {
          this.setState('BURIED');
          soundSynth.playExplosion();
          soundSynth.playThunderLightning();
          this.renderer.emitFeathers(hay.sprite.position, 40, 0xe6c280);
          this.renderer.emitFeathers(hay.sprite.position, 20, 0xffd54f);
          if (this.onAttackWarning) this.onAttackWarning('🌾 고양이가 건초더미에 푹 파묻혔다! 미션 성공!');
        }
        break;
      }

      case 'BURIED': {
        const k = Math.min(1, this.stateTimer / 0.6);
        this.sprite.material.rotation = Math.sin(this.animTime * 25) * 0.25 * (1 - k);
        this.h = -1.2 * k;
        if (Math.random() < 0.3) this.renderer.emitFeathers(this.buryHay.sprite.position, 2, 0xe6c280);
        if (this.stateTimer >= 0.9 && !this.successSent) {
          this.successSent = true;
          if (this.onMissionSuccess) this.onMissionSuccess();
        }
        this.place(0);
        return;
      }

      case 'DEFEATED': {
        this.relS -= 3.0 * dt;
        this.h += 5.0 * dt;
        this.sprite.material.rotation += 10 * dt;
        if (this.h > 8) this.sprite.visible = false;
        break;
      }

      default:
        break;
    }

    if (this.state !== 'BURY_RUN') this.s = player.s + this.relS;
    const hop = this.hopTimer > 0 ? Math.sin((1 - this.hopTimer / 0.5) * Math.PI) * 1.4 : 0;
    const bob = this.state === 'DEFEATED' ? 0 : Math.abs(Math.sin(this.animTime * 12)) * 0.18 + hop;
    if (this.state !== 'EVADED' && this.state !== 'DEFEATED') {
      this.sprite.material.rotation = Math.sin(this.animTime * 12) * 0.07;
    }
    this.place(bob);
  }

  finishDefeated() {
    this.setState('DEFEATED');
    soundSynth.playThunderLightning();
    this.renderer.emitFeathers(this.sprite.position, 35, 0xffeb3b);
    if (this.onMissionSuccess) this.onMissionSuccess();
  }

  place(bob) {
    this.renderer.path.point(this.s, this.lane, this.h + bob, this.sprite.position);
    const clipName = CLIP_FOR_STATE[this.state];
    const clip = clipName ? this.renderer.anims.get('cat_grumpy', clipName) : null;
    if (clip && this.stageId !== 2) {
      this.animator.play(clip);
      this.animator.update(this.frameDt || 1 / 60);
      this.sprite.userData.aspect = this.animator.aspect;
      const hgt = this.sprite.userData.height;
      this.sprite.scale.set(hgt * this.sprite.userData.aspect, hgt, 1);
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
    this.sprite.material.rotation = 0;
    this.sprite.material.color.setHex(0xffffff);
    this.hays.forEach(h => h.deactivate());
  }
}
