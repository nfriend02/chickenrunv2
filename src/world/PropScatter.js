import * as THREE from 'three';

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Roadside billboard props recycled from a fixed pool as the runner advances.
 * Each prop def: { texture, aspect, height, minOffset, maxOffset, weight }
 * Offsets are world units measured from the road centerline.
 */
export class PropScatter {
  constructor(path, scene, { poolSize = 48, spacing = 5.5, ahead = 140, behind = 14 } = {}) {
    this.path = path;
    this.spacing = spacing;
    this.ahead = ahead;
    this.behind = behind;
    this.defs = [];
    this.items = [];
    this.tmp = new THREE.Vector3();
    this.rand = mulberry32(7);
    this.nextS = 0;
    this.side = 1;

    for (let i = 0; i < poolSize; i++) {
      const mat = new THREE.SpriteMaterial({ transparent: true, alphaTest: 0.08, depthWrite: true });
      const sprite = new THREE.Sprite(mat);
      sprite.center.set(0.5, 0.02);
      sprite.visible = false;
      scene.add(sprite);
      this.items.push({ sprite, s: 0, offset: 0, active: false });
    }
  }

  setDefs(defs, seed = 7) {
    this.defs = defs.filter(d => d.texture);
    this.totalWeight = this.defs.reduce((sum, d) => sum + (d.weight ?? 1), 0);
    this.rand = mulberry32(seed);
    for (const it of this.items) {
      it.active = false;
      it.sprite.visible = false;
    }
    this.nextS = null;
  }

  setTint(hex) {
    for (const it of this.items) it.sprite.material.color.setHex(hex);
  }

  pickDef() {
    let r = this.rand() * this.totalWeight;
    for (const d of this.defs) {
      r -= d.weight ?? 1;
      if (r <= 0) return d;
    }
    return this.defs[this.defs.length - 1];
  }

  place(item, s) {
    const def = this.pickDef();
    this.side = -this.side;
    const span = (def.maxOffset ?? 9) - (def.minOffset ?? 4);
    const offset = this.side * ((def.minOffset ?? 4) + this.rand() * span);
    const height = def.height * (0.85 + this.rand() * 0.3);
    item.s = s;
    item.offset = offset;
    item.active = true;
    const mat = item.sprite.material;
    if (mat.map !== def.texture) {
      mat.map = def.texture;
      mat.needsUpdate = true;
    }
    const flip = def.noFlip ? 1 : (this.rand() < 0.5 ? -1 : 1);
    item.sprite.scale.set(height * def.aspect * flip, height, 1);
    this.path.pointAtOffset(s, offset, 0, this.tmp);
    item.sprite.position.copy(this.tmp);
    item.sprite.visible = true;
  }

  update(anchorS) {
    if (!this.defs.length) return;
    if (this.nextS === null) this.nextS = anchorS - this.behind;
    const limit = anchorS + this.ahead;

    for (const it of this.items) {
      if (it.active && it.s < anchorS - this.behind) {
        it.active = false;
        it.sprite.visible = false;
      }
    }
    while (this.nextS < limit) {
      let free = null;
      for (let i = 0; i < this.items.length; i++) {
        if (!this.items[i].active) { free = this.items[i]; break; }
      }
      if (!free) break;
      this.place(free, this.nextS);
      this.nextS += this.spacing * (0.6 + this.rand() * 0.8);
    }
  }
}
