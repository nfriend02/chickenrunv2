import * as THREE from 'three';

/**
 * Loads sprite-sheet clips listed in /assets/anim/manifest.json (written by scripts/asset_pipeline.py).
 * A clip is { texture, meta } where meta = { frameCount, fps, frameWidth, frameHeight, loop, pivot }.
 */
export class AnimLibrary {
  constructor() {
    this.loader = new THREE.TextureLoader();
    this.clips = new Map();
    this.ready = this.load();
  }

  async load() {
    let manifest = {};
    try {
      const res = await fetch('/assets/anim/manifest.json', { cache: 'no-cache' });
      if (res.ok) manifest = await res.json();
    } catch (e) {
      console.warn('Animation manifest not found; using static sprites.', e);
      return;
    }

    const jobs = [];
    for (const [charId, actions] of Object.entries(manifest)) {
      for (const action of actions) {
        jobs.push(this.loadClip(charId, action));
      }
    }
    await Promise.all(jobs);
  }

  async loadClip(charId, action) {
    const base = `/assets/anim/${charId}/${action}`;
    try {
      const res = await fetch(`${base}.json`, { cache: 'no-cache' });
      if (!res.ok) return;
      const meta = await res.json();
      const texture = await this.loader.loadAsync(`${base}.webp`);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.repeat.set(1 / meta.frameCount, 1);
      texture.needsUpdate = true;
      this.clips.set(`${charId}/${action}`, { texture, meta, name: action });
    } catch (e) {
      console.warn(`Clip load failed: ${base}`, e);
    }
  }

  get(charId, action) {
    return this.clips.get(`${charId}/${action}`) || null;
  }
}
