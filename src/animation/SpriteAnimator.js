/**
 * Plays sprite-sheet clips on a THREE.Sprite by moving the texture window frame by frame.
 * play() with the clip already playing is a no-op unless { restart: true } is passed.
 */
export class SpriteAnimator {
  constructor(sprite) {
    this.sprite = sprite;
    this.clip = null;
    this.time = 0;
    this.frame = 0;
    this.loop = true;
    this.duration = 0;
    this.speed = 1;
    this.finished = false;
    this.onEnd = null;
    this.flipX = false;
  }

  /**
   * @param {object} clip { texture, meta }
   * @param {object} opts { loop, duration (seconds for whole clip), speed, restart, onEnd }
   */
  play(clip, opts = {}) {
    if (!clip) return false;
    if (this.clip === clip && !opts.restart) {
      if (opts.speed !== undefined) this.speed = opts.speed;
      return true;
    }
    this.clip = clip;
    this.time = 0;
    this.frame = -1;
    this.finished = false;
    this.loop = opts.loop ?? clip.meta.loop;
    this.speed = opts.speed ?? 1;
    this.duration = opts.duration ?? clip.meta.frameCount / clip.meta.fps;
    this.onEnd = opts.onEnd || null;

    const mat = this.sprite.material;
    mat.map = clip.texture;
    mat.needsUpdate = true;
    this.sprite.center.set(clip.meta.pivot?.x ?? 0.5, 0.02);
    this.setFrame(0);
    return true;
  }

  stop() {
    this.clip = null;
  }

  get aspect() {
    return this.clip ? this.clip.meta.frameWidth / this.clip.meta.frameHeight : 1;
  }

  /** Mirror the clip horizontally (the texture window runs right-to-left). */
  setFlipX(flip) {
    if (this.flipX === flip) return;
    this.flipX = flip;
    if (this.clip) {
      const f = this.frame;
      this.frame = -1;
      this.setFrame(Math.max(0, f));
    }
  }

  setFrame(i) {
    if (i === this.frame) return;
    this.frame = i;
    const n = this.clip.meta.frameCount;
    const tex = this.clip.texture;
    tex.repeat.x = this.flipX ? -1 / n : 1 / n;
    tex.offset.x = this.flipX ? (i + 1) / n : i / n;
  }

  update(dt) {
    if (!this.clip || this.finished) return;
    const n = this.clip.meta.frameCount;
    this.time += dt * this.speed;
    let t = this.time / this.duration;
    if (t >= 1) {
      if (this.loop) {
        t %= 1;
      } else {
        t = 0.9999;
        this.finished = true;
        if (this.onEnd) this.onEnd();
      }
    }
    this.setFrame(Math.min(n - 1, Math.floor(t * n)));
  }
}
