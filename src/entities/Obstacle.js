import { soundSynth } from '../audio/SoundSynth.js';
import { SpriteAnimator } from '../animation/SpriteAnimator.js';
import { ENTITY_SCALE, ROAD_SCALE } from '../core/WorldScale.js';

/**
 * behavior: static | wander | rush | zone
 * height: billboard height (world units); halfLen / halfWidth: collision extents (world units)
 * zone obstacles slow the player instead of hurting.
 */
export const ObstacleDefs = {
  haystack: { name: 'Haystack', image: '/assets/images/fixtures/haystack.png', height: 1.5, halfLen: 0.55, halfWidth: 0.75, behavior: 'static' },
  fence: { name: 'Wooden fence', image: '/assets/images/fixtures/fence.png', height: 1.25, halfLen: 0.3, halfWidth: 1.0, behavior: 'static' },
  dog: { name: 'Farm dog', image: '/assets/images/npcs/dog.png', anim: ['dog', 'move'], height: 1.25, halfLen: 0.45, halfWidth: 0.5, behavior: 'wander', wanderAmp: 0.35, wanderFreq: 1.4, approach: 1.5 },
  duck: { name: 'Duck', image: '/assets/images/npcs/duck.png', height: 1.0, halfLen: 0.35, halfWidth: 0.4, behavior: 'wander', wanderAmp: 0.45, wanderFreq: 0.9, approach: 0.6 },
  pond: { name: 'Duck pond', image: '/assets/stages/stage01/props/duck_pond.webp', height: 1.2, halfLen: 1.1, halfWidth: 1.3, behavior: 'zone', lanes: [-0.45, 0.45] },
  cow_rushing: { name: 'Charging bull', image: '/assets/images/npcs/cow_rushing.png', anim: ['cow_rushing', 'move'], height: 1.9, halfLen: 0.6, halfWidth: 0.7, behavior: 'rush', rushSpeed: 11, warnTime: 0.9 },
  popcorn_machine: { name: 'Popcorn machine', image: '/assets/images/fixtures/popcorn_machine.png', height: 2.0, halfLen: 0.6, halfWidth: 0.8, behavior: 'static' }
};

const JUMP_CLEAR_Y = 1.0;

export class Obstacle {
  constructor(renderer, typeKey) {
    this.renderer = renderer;
    this.typeKey = typeKey;
    const base = ObstacleDefs[typeKey] || ObstacleDefs.haystack;
    this.def = {
      ...base,
      height: base.height * ENTITY_SCALE,
      halfLen: base.halfLen * ENTITY_SCALE,
      halfWidth: base.halfWidth * ROAD_SCALE
    };

    this.s = 0;
    this.lane = 0;
    this.baseLane = 0;
    this.active = false;
    this.isFinale = false;
    this.wasHit = false;
    this.passed = false;

    this.isRushing = this.def.behavior === 'rush';
    this.warnTimer = 0;
    this.animTime = 0;

    this.sprite = renderer.createBillboard(this.def.image, this.def.height);
    this.animator = this.def.anim ? new SpriteAnimator(this.sprite) : null;
  }

  /** Swaps the static PNG for the sprite-sheet clip once the clip has loaded. */
  animate(dt, speed = 1) {
    if (!this.animator) return false;
    const shared = this.renderer.anims.get(this.def.anim[0], this.def.anim[1]);
    if (!shared) return false;
    // Each instance needs its own texture offset, otherwise every dog shows the same frame.
    if (!this.ownClip || this.ownClip.shared !== shared) {
      const texture = shared.texture.clone();
      texture.needsUpdate = true;
      this.ownClip = { shared, texture, meta: shared.meta };
    }
    this.animator.play(this.ownClip, { speed });
    this.animator.update(dt);
    const hgt = this.def.height;
    this.sprite.scale.set(hgt * this.animator.aspect, hgt, 1);
    return true;
  }

  spawn(s, lane) {
    this.s = s;
    const lanes = this.def.lanes;
    const limit = this.def.behavior === 'zone' ? 0.55 : 0.8;
    this.baseLane = lanes ? lanes[Math.floor(Math.random() * lanes.length)] : Math.max(-limit, Math.min(limit, lane));
    this.lane = this.baseLane;
    this.active = true;
    this.isFinale = false;
    this.wasHit = false;
    this.passed = false;
    this.animTime = Math.random() * 10;
    this.warnTimer = this.isRushing ? this.def.warnTime : 0;
    this.sprite.visible = true;
    this.sprite.material.rotation = 0;
    this.sprite.material.color.setHex(0xffffff);

    if (this.isRushing) {
      soundSynth.playWarning();
      soundSynth.playCowMoo();
    }
    this.place(0);
  }

  deactivate() {
    this.active = false;
    this.sprite.visible = false;
  }

  place(bob) {
    this.renderer.path.point(this.s, this.lane, bob, this.sprite.position);
  }

  update(dt, anchorS) {
    if (!this.active) return;
    this.animTime += dt;
    const d = this.def;
    let bob = 0;
    let rot = 0;

    if (d.behavior === 'rush') {
      if (this.warnTimer > 0) {
        this.warnTimer -= dt;
        rot = Math.sin(this.animTime * 30) * 0.06;
        this.sprite.material.color.setHex(Math.sin(this.animTime * 25) > 0 ? 0xffffff : 0xff8a80);
      } else {
        this.sprite.material.color.setHex(0xffffff);
        this.s -= d.rushSpeed * dt;
        if (this.animate(dt, 1.6)) {
          bob = Math.abs(Math.sin(this.animTime * 14)) * 0.06;
        } else {
          bob = Math.abs(Math.sin(this.animTime * 14)) * 0.25;
          rot = Math.sin(this.animTime * 14) * 0.08;
        }
      }
      if (this.warnTimer > 0) this.animate(0, 1);
    } else if (d.behavior === 'wander') {
      this.s -= (d.approach || 0) * dt;
      this.lane = Math.max(-0.9, Math.min(0.9, this.baseLane + Math.sin(this.animTime * d.wanderFreq) * d.wanderAmp));
      if (!this.animate(dt)) {
        bob = Math.abs(Math.sin(this.animTime * 12)) * 0.12;
        rot = Math.sin(this.animTime * 12) * 0.1;
      }
    }

    this.sprite.material.rotation = rot;
    this.place(bob);

    if (this.s < anchorS - 6) {
      this.deactivate();
    }
  }

  /** Returns 'DAMAGE' | 'SLOW' | 'FEVER_POPCORN' | 'SMASHED' | false */
  checkCollision(player, roadHalfWidth) {
    if (!this.active || this.wasHit) return false;
    const d = this.def;

    const ds = Math.abs(this.s - player.s);
    const dx = Math.abs(this.lane - player.lane) * roadHalfWidth;
    if (ds > d.halfLen + player.hitRadius * 0.6 || dx > d.halfWidth + player.hitRadius) return false;

    if (player.y > JUMP_CLEAR_Y) return false;

    if (d.behavior === 'zone') {
      return 'SLOW';
    }

    const pos = this.sprite.position;
    if (player.isFever) {
      soundSynth.playEat();
      this.renderer.emitFeathers(pos, 20, 0xffeb3b);
      this.wasHit = true;
      this.deactivate();
      return 'FEVER_POPCORN';
    }
    if (player.hasSpicyPepper) {
      soundSynth.playHit();
      this.renderer.emitFeathers(pos, 25, 0xff4500);
      this.wasHit = true;
      this.deactivate();
      return 'SMASHED';
    }
    this.wasHit = true;
    return 'DAMAGE';
  }
}
