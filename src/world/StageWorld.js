import * as THREE from 'three';
import { RoadPath } from './RoadPath.js';
import { RoadMesh } from './RoadMesh.js';
import { SkyLayer } from './SkyLayer.js';
import { PropScatter } from './PropScatter.js';

const DEFAULT_PROP = { height: 3.0, minOffset: 4.5, maxOffset: 10, weight: 1 };

/**
 * Owns everything that makes up the 3D stage: road path, ground ribbon, sky backdrop,
 * roadside props and fog. Stage assets come from /assets/stages/stageXX/stage.json
 * produced by scripts/asset_pipeline.py; missing assets fall back to flat colors.
 */
export class StageWorld {
  constructor(scene, camera, loadTexture) {
    this.scene = scene;
    this.camera = camera;
    this.loadTexture = loadTexture;
    this.path = new RoadPath();
    this.road = new RoadMesh(this.path);
    scene.add(this.road.group);
    this.sky = new SkyLayer(camera);
    this.props = new PropScatter(this.path, scene);
    this.fogColor = new THREE.Color(0xd3bc94);
    scene.fog = new THREE.Fog(this.fogColor, 60, 175);
    scene.background = this.fogColor.clone();
    this.loadToken = 0;
    this.ready = false;
  }

  async loadStage(stage) {
    const token = ++this.loadToken;
    this.ready = false;
    const w = stage.world || {};
    this.path.setShape({
      curviness: w.curviness ?? 1.0,
      hilliness: w.hilliness ?? 1.0,
      seed: stage.id || 1,
      halfWidth: w.roadHalfWidth ?? 2.2
    });

    let meta = null;
    if (w.dir) {
      try {
        const res = await fetch(`${w.dir}/stage.json`, { cache: 'no-cache' });
        if (res.ok) meta = await res.json();
      } catch (e) {
        console.warn('Stage meta load failed', e);
      }
    }
    if (token !== this.loadToken) return;

    const tex = (file) => (meta && file ? this.loadTexture(`${w.dir}/${file}`) : null);
    const groundTexture = tex(meta?.ground);
    const grassTexture = tex(meta?.grass);
    const skyTexture = tex(meta?.sky);
    await Promise.all([groundTexture, grassTexture, skyTexture].filter(Boolean).map(waitForTexture));
    if (token !== this.loadToken) return;

    this.road.configure({
      groundTexture,
      grassTexture,
      roadU0: meta?.roadU0,
      roadU1: meta?.roadU1,
      groundAspect: meta?.groundAspect,
      grassFrac: meta ? Math.max(0.05, (meta.roadU0 ?? 0.33) - 0.03) : 0.3,
      groundColor: stage.groundColor,
      grassColor: stage.bgColor
    });
    this.sky.setTexture(skyTexture, stage.skyColor);

    const fogHex = meta?.fogColor ?? `#${new THREE.Color(stage.bgColor ?? 0xd3bc94).getHexString()}`;
    this.fogColor.set(fogHex);
    this.scene.fog.color.copy(this.fogColor);
    this.scene.background.copy(this.fogColor);

    const propDefs = [];
    const sizes = w.props || {};
    for (const p of meta?.props || []) {
      const cfg = { ...DEFAULT_PROP, ...(sizes[p.name] || {}) };
      if (cfg.weight <= 0) continue;
      propDefs.push({ ...cfg, name: p.name, aspect: p.aspect, texture: this.loadTexture(`${w.dir}/${p.file}`) });
    }
    this.props.setDefs(propDefs, (stage.id || 1) * 13);
    this.ready = true;
  }

  setGloomy(active) {
    const tint = active ? 0x7d8a99 : 0xffffff;
    this.road.setTint(tint);
    this.sky.setTint(tint);
    this.props.setTint(tint);
  }

  update(anchorS) {
    this.road.update(anchorS);
    this.props.update(anchorS);
    this.sky.update(this.path.heading(anchorS + 30));
  }
}

function waitForTexture(tex) {
  if (tex.image && tex.image.width) return Promise.resolve(tex);
  return new Promise((resolve) => {
    const started = performance.now();
    const check = () => {
      if ((tex.image && tex.image.width) || performance.now() - started > 8000) resolve(tex);
      else setTimeout(check, 30);
    };
    check();
  });
}
