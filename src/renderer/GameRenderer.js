import * as THREE from 'three';
import { StageWorld } from '../world/StageWorld.js';
import { AnimLibrary } from '../animation/AnimLibrary.js';
import { SpriteAnimator } from '../animation/SpriteAnimator.js';

const CAMERA_PRESETS = {
  LANDSCAPE: { fov: 50, height: 4.4, back: 7.0, lookAhead: 12, lookHeight: 0.9, laneFollow: 0.35 },
  PORTRAIT: { fov: 64, height: 5.4, back: 8.0, lookAhead: 10, lookHeight: 0.6, laneFollow: 0.25 }
};

const CHARACTER_HEIGHT = {
  funny_chicken: 1.75,
  rooster_king: 2.0,
  speedy_chick: 1.2,
  daffy_duck: 1.6,
  turbo_turkey: 1.95
};

// Physics jump units (Player.y) to world units above the road.
export const JUMP_VISUAL_SCALE = 0.5;

export class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.textureLoader = new THREE.TextureLoader();
    this.textureCache = new Map();
    this.currentStageId = 1;

    this.world = new StageWorld(this.scene, this.camera, (p) => this.loadTexture(p));
    this.path = this.world.path;
    this.anims = new AnimLibrary();

    this.anchorS = 0;
    this.camPos = new THREE.Vector3();
    this.camLook = new THREE.Vector3();
    this.tmpPos = new THREE.Vector3();
    this.tmpLook = new THREE.Vector3();
    this.camInitialized = false;

    this.viewMode = 'LANDSCAPE';
    this.preset = CAMERA_PRESETS.LANDSCAPE;
    this.applyPreset();

    this.setupParticles();
    this.setupLightningFX();
    this.setupPlayerSprite();

    this.isLightningActive = false;
    this.isGloomyDefeat = false;

    window.addEventListener('resize', () => this.onWindowResize());
  }

  // ------------------------------------------------------------ textures

  loadTexture(path) {
    if (this.textureCache.has(path)) {
      return this.textureCache.get(path);
    }
    const texture = this.textureLoader.load(
      path,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        const waiting = this.pendingSprites.get(tex);
        if (waiting) {
          waiting.forEach((s) => this.fitSprite(s));
          this.pendingSprites.delete(tex);
        }
      },
      undefined,
      (err) => console.warn(`Could not load image: ${path}`, err)
    );
    texture.colorSpace = THREE.SRGBColorSpace;
    this.textureCache.set(path, texture);
    return texture;
  }

  get pendingSprites() {
    if (!this._pending) this._pending = new Map();
    return this._pending;
  }

  /** Billboard standing on its bottom edge; width follows the image aspect once loaded. */
  createBillboard(imagePath, height, color = 0xffffff) {
    const mat = new THREE.SpriteMaterial({
      map: imagePath ? this.loadTexture(imagePath) : null,
      color,
      transparent: true,
      alphaTest: 0.08,
      depthWrite: true
    });
    const sprite = new THREE.Sprite(mat);
    sprite.center.set(0.5, 0.02);
    sprite.userData.height = height;
    sprite.userData.aspect = 1;
    sprite.visible = false;
    this.scene.add(sprite);
    if (mat.map) this.fitSprite(sprite);
    return sprite;
  }

  fitSprite(sprite) {
    const tex = sprite.material.map;
    const img = tex && tex.image;
    if (img && img.width) {
      sprite.userData.aspect = img.width / img.height;
    } else if (tex) {
      const list = this.pendingSprites.get(tex) || [];
      list.push(sprite);
      this.pendingSprites.set(tex, list);
    }
    const h = sprite.userData.height;
    sprite.scale.set(h * sprite.userData.aspect, h, 1);
  }

  setBillboardTexture(sprite, imagePath) {
    sprite.material.map = this.loadTexture(imagePath);
    sprite.material.needsUpdate = true;
    this.fitSprite(sprite);
  }

  // -------------------------------------------------------------- stage

  setStageColors(stage) {
    if (!stage) return;
    this.currentStageId = stage.id || 1;
    this.camInitialized = false;
    return this.world.loadStage(stage);
  }

  setAnchor(s) {
    this.anchorS = s;
  }

  // ------------------------------------------------------------- camera

  applyPreset() {
    this.preset = CAMERA_PRESETS[this.viewMode] || CAMERA_PRESETS.LANDSCAPE;
    this.camera.fov = this.preset.fov;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.world.sky.layout();
  }

  updateCamera(playerLane, dt) {
    const p = this.preset;
    const lane = playerLane * p.laneFollow;
    this.path.point(this.anchorS - p.back, lane, p.height, this.tmpPos);
    this.path.point(this.anchorS + p.lookAhead, lane * 0.5, p.lookHeight, this.tmpLook);

    if (!this.camInitialized) {
      this.camPos.copy(this.tmpPos);
      this.camLook.copy(this.tmpLook);
      this.camInitialized = true;
    } else {
      const k = Math.min(1, dt * 6);
      this.camPos.lerp(this.tmpPos, k);
      this.camLook.lerp(this.tmpLook, k);
    }
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);

    const dx = this.camLook.x - this.camPos.x;
    const dz = this.camLook.z - this.camPos.z;
    const pitch = Math.atan2(this.camPos.y - this.camLook.y, Math.sqrt(dx * dx + dz * dz));
    if (Math.abs(pitch - (this.world.sky.pitch || 0)) > 0.002) this.world.sky.setPitch(pitch);
  }

  setViewMode(mode) {
    this.viewMode = mode;
    this.applyPreset();
    this.onWindowResize();
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.world.sky.layout();
  }

  // ------------------------------------------------------------- player

  setupPlayerSprite() {
    this.playerSprite = this.createBillboard(null, 1.75);
    this.playerSprite.visible = true;
    this.playerAnimator = new SpriteAnimator(this.playerSprite);
    this.playerCharId = null;
    this.playerStaticTexture = null;
    this.lastJumpCount = 0;
    this.lastHitSerial = 0;
    this.hitAnimActive = false;
  }

  setPlayerCharacter(character) {
    if (!character) return;
    this.playerCharId = character.id;
    this.playerSprite.userData.height = CHARACTER_HEIGHT[character.id] || 1.75;
    this.playerStaticTexture = character.imagePath ? this.loadTexture(character.imagePath) : null;
    this.playerAnimator.stop();
    this.useStaticPlayerTexture();
  }

  useStaticPlayerTexture() {
    if (!this.playerStaticTexture) return;
    const mat = this.playerSprite.material;
    if (mat.map !== this.playerStaticTexture) {
      mat.map = this.playerStaticTexture;
      mat.needsUpdate = true;
    }
    this.playerSprite.center.set(0.5, 0.02);
    const img = this.playerStaticTexture.image;
    this.playerSprite.userData.aspect = img && img.width ? img.width / img.height : 1.6;
  }

  clip(action) {
    return this.playerCharId ? this.anims.get(this.playerCharId, action) : null;
  }

  /** Chooses the sprite-sheet clip for the player's current state; returns false when none exists. */
  animatePlayer(player, dt) {
    const anim = this.playerAnimator;

    if (player.isMissionFailed) {
      return anim.play(this.clip('caught'), { loop: false, duration: 1.6 });
    }
    if (player.isMissionSuccess) {
      return anim.play(this.clip('victory'), { loop: true, duration: 2.2 });
    }

    if (player.hitSerial !== this.lastHitSerial) {
      this.lastHitSerial = player.hitSerial;
      const hit = this.clip('hit');
      if (hit) {
        this.hitAnimActive = true;
        anim.play(hit, { loop: false, duration: 0.7, restart: true, onEnd: () => { this.hitAnimActive = false; } });
      }
    }
    if (this.hitAnimActive && anim.clip && anim.clip.name === 'hit' && !anim.finished) return true;
    this.hitAnimActive = false;

    if (!player.isGrounded) {
      const restart = player.jumpCount !== this.lastJumpCount;
      this.lastJumpCount = player.jumpCount;
      const airtime = (2 * player.jumpForce) / Math.abs(player.gravity);
      if (this.clip('jump')) {
        return anim.play(this.clip('jump'), { loop: false, duration: airtime * 1.05, restart });
      }
    } else {
      this.lastJumpCount = 0;
    }

    return anim.play(this.clip('run'), { loop: true, duration: 0.62, speed: player.speedFactor || 1 });
  }

  updatePlayerVisuals(player, time, dt) {
    const sprite = this.playerSprite;
    const mat = sprite.material;
    const h = player.y * JUMP_VISUAL_SCALE;
    this.path.point(player.s, player.lane, h, sprite.position);

    const animated = this.animatePlayer(player, dt);
    if (animated) {
      this.playerAnimator.update(dt);
      sprite.userData.aspect = this.playerAnimator.aspect;
    } else {
      this.playerAnimator.stop();
      this.useStaticPlayerTexture();
    }

    let sx = 1;
    let sy = 1;
    let rot = 0;

    if (player.isMissionSuccess) {
      this.emitLightningStorm(sprite.position, dt);
      sx = sy = 1.15;
    } else if (player.isMissionFailed) {
      this.clearLightningStorm();
      mat.color.setHex(0xb0bec5);
      if (Math.random() < 0.5) this.emitFeathers(sprite.position, 1, 0x81d4fa);
    } else {
      this.clearLightningStorm();
      if (!animated) {
        if (player.isGrounded) {
          const bounce = Math.sin(time * 18) * 0.08;
          sx = 1 + bounce;
          sy = 1 - bounce;
          rot = Math.sin(time * 18) * 0.06;
        } else {
          rot = time * Math.PI * 4.4;
        }
      }
      if (player.landTimer > 0) {
        const k = player.landTimer / 0.18;
        sx *= 1 + 0.18 * k;
        sy *= 1 - 0.18 * k;
      }
      rot += -(player.currentLateralVel || 0) * 0.12;
    }

    if (!player.isMissionFailed) {
      if (player.isFever) {
        sx *= 1.6;
        sy *= 1.6;
        mat.color.setHSL((time * 2) % 1, 1, 0.7);
      } else if (player.hasSpicyPepper) {
        mat.color.setHex(0xff6e6e);
      } else if (player.hasGoldenBanana) {
        mat.color.setHex(0xfff176);
      } else {
        mat.color.setHex(0xffffff);
      }
    }

    mat.rotation = rot;
    const baseH = sprite.userData.height;
    sprite.scale.set(baseH * sprite.userData.aspect * sx, baseH * sy, 1);

    if (player.isInvincible && !player.isFever && !player.hasSpicyPepper && !player.isMissionFailed) {
      sprite.visible = Math.sin(time * 30) > 0;
    } else {
      sprite.visible = true;
    }
  }

  // ---------------------------------------------------------- particles

  setupParticles() {
    const count = 220;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) positions[i * 3 + 1] = -1000;
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false
    });
    this.particlePoints = new THREE.Points(geo, mat);
    this.particlePoints.frustumCulled = false;
    this.scene.add(this.particlePoints);
    this.activeParticles = [];
  }

  emitFeathers(pos, count = 14, color = 0xffd700) {
    const col = new THREE.Color(color);
    const room = 220 - this.activeParticles.length;
    const n = Math.min(count, room);
    for (let i = 0; i < n; i++) {
      this.activeParticles.push({
        x: pos.x + (Math.random() - 0.5) * 0.6,
        y: pos.y + 0.6 + (Math.random() - 0.5) * 0.6,
        z: pos.z + (Math.random() - 0.5) * 0.6,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 4 + 1,
        vz: (Math.random() - 0.5) * 3,
        life: 1.0,
        decay: 1.2 + Math.random() * 0.8,
        r: col.r,
        g: col.g,
        b: col.b
      });
    }
  }

  updateParticles(dt) {
    const posAttr = this.particlePoints.geometry.attributes.position;
    const colAttr = this.particlePoints.geometry.attributes.color;
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.life -= dt * p.decay;
      if (p.life <= 0) {
        this.activeParticles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vy -= 7.0 * dt;
    }
    const count = posAttr.count;
    for (let i = 0; i < count; i++) {
      if (i < this.activeParticles.length) {
        const p = this.activeParticles[i];
        posAttr.setXYZ(i, p.x, p.y, p.z);
        colAttr.setXYZ(i, p.r * p.life, p.g * p.life, p.b * p.life);
      } else {
        posAttr.setXYZ(i, 0, -1000, 0);
      }
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  // ---------------------------------------------------------- lightning

  setupLightningFX() {
    this.lightningGroup = new THREE.Group();
    this.lightningBranches = [];
    const mat = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.95, fog: false });
    for (let b = 0; b < 16; b++) {
      const segCount = 6;
      const positions = new Float32Array(segCount * 3);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const line = new THREE.Line(geo, mat.clone());
      line.visible = false;
      line.frustumCulled = false;
      this.lightningGroup.add(line);
      this.lightningBranches.push({ line, geo, positions, segCount });
    }
    this.scene.add(this.lightningGroup);
  }

  emitLightningStorm(centerPos, dt) {
    this.isLightningActive = true;
    const colors = [0x00ffff, 0xffeb3b, 0xffffff, 0x80d8ff, 0xffd700];
    const cy = centerPos.y + 0.9;
    this.lightningBranches.forEach((branch, idx) => {
      branch.line.visible = true;
      const angle = (idx / this.lightningBranches.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const elev = (Math.random() - 0.5) * 1.2;
      const maxDist = 1.8 + Math.random() * 1.6;
      for (let s = 0; s < branch.segCount; s++) {
        const dist = (s / (branch.segCount - 1)) * maxDist;
        const j = s === 0 ? 0 : 0.35;
        branch.positions[s * 3] = centerPos.x + Math.cos(angle) * dist + (Math.random() - 0.5) * j;
        branch.positions[s * 3 + 1] = cy + Math.sin(angle) * dist + (Math.random() - 0.5) * j;
        branch.positions[s * 3 + 2] = centerPos.z + elev * dist + (Math.random() - 0.5) * j;
      }
      branch.geo.attributes.position.needsUpdate = true;
      branch.line.material.color.setHex(colors[Math.floor(Math.random() * colors.length)]);
    });
    if (Math.random() < 0.6) {
      this.emitFeathers(centerPos, 3, 0x00ffff);
      this.emitFeathers(centerPos, 2, 0xffeb3b);
    }
  }

  clearLightningStorm() {
    if (!this.isLightningActive) return;
    this.isLightningActive = false;
    this.lightningBranches.forEach((b) => { b.line.visible = false; });
  }

  setGloomyDefeatFX(active) {
    this.isGloomyDefeat = active;
    this.world.setGloomy(active);
  }

  render() {
    this.world.update(this.anchorS);
    this.renderer.render(this.scene, this.camera);
  }
}
