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

  setFrame(i) {
    if (i === this.frame) return;
    this.frame = i;
    this.clip.texture.offset.x = i / this.clip.meta.frameCount;
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
