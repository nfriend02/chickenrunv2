import * as THREE from 'three';

export class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();

    // Perspective Camera setup - looking directly down Z axis
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 0, 14.5);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.textureLoader = new THREE.TextureLoader();
    this.textureCache = new Map();
    this.currentStageId = 1;

    // Dimensions of 16:9 view frustum at Z = -7.0 (Camera Z = 14.5, Distance = 21.5, FOV 50°)
    this.bgWidth = 35.64;
    this.bgHeight = 20.05;
    this.bgScrollOffset = 0.0;

    // Continuous Multi-Point Road Paths Recognized from stage01.png ~ stage05.png
    // Each path is an array of continuous coordinate landmarks {u, v, w} from road start to foreground exit
    // u: 0(left)~1(right), v: 0(top)~1(bottom), w: road half-width at that point
    this.stageRoads = {
      1: {
        name: '농장 마당 (Farm Yard)',
        points: [
          { u: 0.36, v: 0.38, w: 0.035 },
          { u: 0.38, v: 0.44, w: 0.045 },
          { u: 0.40, v: 0.52, w: 0.060 },
          { u: 0.43, v: 0.60, w: 0.080 },
          { u: 0.45, v: 0.68, w: 0.110 },
          { u: 0.47, v: 0.76, w: 0.145 },
          { u: 0.49, v: 0.85, w: 0.180 },
          { u: 0.52, v: 0.95, w: 0.220 }
        ]
      },
      2: {
        name: '울타리 초원 (Fenced Meadow)',
        points: [
          { u: 0.70, v: 0.52, w: 0.035 },
          { u: 0.65, v: 0.58, w: 0.050 },
          { u: 0.57, v: 0.64, w: 0.070 },
          { u: 0.49, v: 0.70, w: 0.095 },
          { u: 0.41, v: 0.76, w: 0.125 },
          { u: 0.35, v: 0.82, w: 0.155 },
          { u: 0.31, v: 0.90, w: 0.185 },
          { u: 0.28, v: 0.98, w: 0.220 }
        ]
      },
      3: {
        name: '시골 집안 (Rustic Farmhouse)',
        points: [
          { u: 0.46, v: 0.48, w: 0.040 },
          { u: 0.47, v: 0.56, w: 0.065 },
          { u: 0.48, v: 0.64, w: 0.095 },
          { u: 0.48, v: 0.72, w: 0.130 },
          { u: 0.49, v: 0.80, w: 0.165 },
          { u: 0.50, v: 0.88, w: 0.200 },
          { u: 0.52, v: 0.98, w: 0.240 }
        ]
      },
      4: {
        name: '시골 산길 (Mountain Dirt Road)',
        points: [
          { u: 0.22, v: 0.44, w: 0.035 },
          { u: 0.25, v: 0.52, w: 0.050 },
          { u: 0.34, v: 0.60, w: 0.075 },
          { u: 0.48, v: 0.68, w: 0.105 },
          { u: 0.62, v: 0.74, w: 0.135 },
          { u: 0.74, v: 0.80, w: 0.165 },
          { u: 0.82, v: 0.88, w: 0.195 },
          { u: 0.86, v: 0.98, w: 0.230 }
        ]
      },
      5: {
        name: '시골 5일장 (Rural 5-Day Market)',
        points: [
          { u: 0.64, v: 0.48, w: 0.040 },
          { u: 0.60, v: 0.56, w: 0.065 },
          { u: 0.56, v: 0.64, w: 0.095 },
          { u: 0.52, v: 0.72, w: 0.130 },
          { u: 0.49, v: 0.80, w: 0.165 },
          { u: 0.47, v: 0.88, w: 0.200 },
          { u: 0.45, v: 0.98, w: 0.240 }
        ]
      }
    };

    // Stage Background (Scenic backdrop precisely framed to 16:9 frustum)
    this.setupStageBackground();

    // Vibrant Lighting
    this.setupLighting();

    // Particles (Feathers, Sparkles, and Gloomy Rain)
    this.setupParticles();

    // 3D Lightning Electric Storm FX (Radiates outward from hero on Mission Success)
    this.setupLightningFX();

    // 3D Player Character Model (2x size, faces right, tilted towards top-right)
    this.setupPlayerMesh();

    this.viewMode = 'LANDSCAPE';
    this.isLightningActive = false;
    this.isGloomyDefeat = false;

    window.addEventListener('resize', () => this.onWindowResize());
  }

  // --- Smooth Piecewise Spline Interpolation over Continuous Road Points ---
  sampleRoadSpline(progress, stageId = this.currentStageId) {
    const road = this.stageRoads[stageId] || this.stageRoads[1];
    const pts = road.points;
    const n = pts.length;
    const t = Math.max(0.0, Math.min(0.9999, progress));
    const floatIdx = t * (n - 1);
    const idx = Math.floor(floatIdx);
    const frac = floatIdx - idx;

    // Hermite smoothstep interpolation
    const p0 = pts[Math.max(0, idx - 1)];
    const p1 = pts[idx];
    const p2 = pts[Math.min(n - 1, idx + 1)];
    const p3 = pts[Math.min(n - 1, idx + 2)];

    // Cubic Hermite spline formulation
    const f2 = frac * frac;
    const f3 = f2 * frac;

    const u = 0.5 * (
      (2 * p1.u) +
      (-p0.u + p2.u) * frac +
      (2 * p0.u - 5 * p1.u + 4 * p2.u - p3.u) * f2 +
      (-p0.u + 3 * p1.u - 3 * p2.u + p3.u) * f3
    );

    const v = 0.5 * (
      (2 * p1.v) +
      (-p0.v + p2.v) * frac +
      (2 * p0.v - 5 * p1.v + 4 * p2.v - p3.v) * f2 +
      (-p0.v + 3 * p1.v - 3 * p2.v + p3.v) * f3
    );

    const w = p1.w + frac * (p2.w - p1.w);

    // Tangent derivative du/dt and dv/dt
    const du = (p2.u - p0.u) * 0.5 + (2 * p0.u - 5 * p1.u + 4 * p2.u - p3.u) * frac + (-p0.u + 3 * p1.u - 3 * p2.u + p3.u) * 1.5 * f2;
    const dv = (p2.v - p0.v) * 0.5 + (2 * p0.v - 5 * p1.v + 4 * p2.v - p3.v) * frac + (-p0.v + 3 * p1.v - 3 * p2.v + p3.v) * 1.5 * f2;

    return { u, v, w, du, dv };
  }

  // --- Converts Track Distance (0: distant start -> 1: foreground) and Lane (-2.0: left -> +2.0: right, 200% road width) to 3D coords ---
  getTrackWorldPos(progress, lane, jumpHeight = 0, stageId = this.currentStageId) {
    const t = Math.max(0.0, Math.min(1.0, progress));
    const spline = this.sampleRoadSpline(t, stageId);

    // Gameplay depth Z along the road
    const z = -3.5 + 4.0 * t;

    // Ray projection scale from camera (Z = 14.5) to background plane (Z = -7.0, Dist = 21.5)
    // Guarantees 100% pixel-perfect alignment with background image road!
    const alpha = (14.5 - z) / 21.5;

    const cx = alpha * (spline.u - 0.5) * this.bgWidth;
    const cy = alpha * (0.5 - spline.v) * this.bgHeight;

    // Derivative on screen (tangent of the road path)
    const dX = spline.du * this.bgWidth;
    const dY = -spline.dv * this.bgHeight;
    const len = Math.sqrt(dX * dX + dY * dY) || 1.0;
    const uTx = dX / len;
    const uTy = dY / len;

    // Perpendicular lateral normal vector (pointing right across the road)
    const normX = -uTy;
    const normY = uTx;

    // 3D road half-width at depth z
    const halfWidth3D = alpha * spline.w * this.bgWidth;

    // Lane offset (lane can range [-2.0, +2.0] for 200% road width!)
    const lateralX = normX * (lane * halfWidth3D);
    const lateralY = normY * (lane * halfWidth3D);

    return new THREE.Vector3(
      cx + lateralX,
      cy + lateralY + jumpHeight,
      z + jumpHeight * 0.35
    );
  }

  // Returns road tangent angle on screen
  getRoadAngle(progress, stageId = this.currentStageId) {
    const spline = this.sampleRoadSpline(progress, stageId);
    const dX = spline.du * this.bgWidth;
    const dY = -spline.dv * this.bgHeight;
    return Math.atan2(dX, dY);
  }

  // Perspective scale: starts small at vanishing point, grows larger towards bottom-left
  getPerspectiveScale(progress) {
    return Math.max(0.3, 0.35 + 1.65 * progress);
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.3);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xFFFFFF, 1.2);
    sunLight.position.set(8, 15, 12);
    this.scene.add(sunLight);
  }

  setupStageBackground() {
    // Exact 16:9 scenic background framing matching camera frustum at Z = -7.0
    const bgGeo = new THREE.PlaneGeometry(this.bgWidth, this.bgHeight);
    const initialTexture = this.loadTexture('/assets/images/backgrounds/stage01.png');
    this.bgMat = new THREE.MeshBasicMaterial({
      map: initialTexture,
      color: 0xFFFFFF,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.bgMesh = new THREE.Mesh(bgGeo, this.bgMat);
    this.bgMesh.position.set(0, 0, -7.0);
    this.scene.add(this.bgMesh);
  }

  setupPlayerMesh() {
    this.playerGroup = new THREE.Group();

    // 2x Sized Character Billboard (Width 4.4, Height 2.5)
    // Clean transparent material - ZERO circles, ZERO outlines, ZERO shadows
    const charGeo = new THREE.PlaneGeometry(4.4, 2.5);
    // Flip horizontally (좌우 반전)
    charGeo.scale(-1, 1, 1);

    this.charSpriteMat = new THREE.MeshBasicMaterial({
      transparent: true,
      alphaTest: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.charSpriteMesh = new THREE.Mesh(charGeo, this.charSpriteMat);
    
    // Head faces UP towards 10-degree top-right direction (상방향 10도 방향)
    // With charGeo flipped along X (head is at +X), rotating by +80°
    // brings head vector (+1, 0) to (+cos 80°, +sin 80°) = (+sin 10°, +cos 10°),
    // maintaining head facing UP at 10° while flipping the character's left and right!
    this.baseAngle = (80 * Math.PI) / 180;
    this.charSpriteMesh.rotation.z = this.baseAngle;

    this.playerGroup.add(this.charSpriteMesh);
    this.scene.add(this.playerGroup);
  }

  setupParticles() {
    const count = 80;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -100;
      positions[i * 3 + 2] = 0;
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.9;
      colors[i * 3 + 2] = 0.5;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.45,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });

    this.particlePoints = new THREE.Points(geo, mat);
    this.scene.add(this.particlePoints);
    this.activeParticles = [];
  }

  setupLightningFX() {
    this.lightningGroup = new THREE.Group();
    this.lightningBranches = [];
    const mat = new THREE.LineBasicMaterial({
      color: 0x00FFFF,
      transparent: true,
      opacity: 0.95
    });

    for (let b = 0; b < 16; b++) {
      const segCount = 6;
      const positions = new Float32Array(segCount * 3);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const line = new THREE.Line(geo, mat.clone());
      line.visible = false;
      this.lightningGroup.add(line);
      this.lightningBranches.push({ line, geo, positions, segCount });
    }

    this.scene.add(this.lightningGroup);
  }

  emitLightningStorm(centerPos, dt) {
    if (!this.lightningBranches) return;
    this.isLightningActive = true;
    const colors = [0x00FFFF, 0xFFEB3B, 0xFFFFFF, 0x80D8FF, 0xFFD700];

    // Recalculate jagged lightning bolts radiating in 3D around character
    this.lightningBranches.forEach((branch, idx) => {
      branch.line.visible = true;
      const segs = branch.segCount;
      const angle = (idx / this.lightningBranches.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const elev = (Math.random() - 0.5) * 1.5;
      const maxDist = 3.5 + Math.random() * 3.0;

      let cx = centerPos.x;
      let cy = centerPos.y;
      let cz = centerPos.z;

      for (let s = 0; s < segs; s++) {
        const frac = s / (segs - 1);
        const dist = frac * maxDist;
        const jitterX = (s === 0 ? 0 : (Math.random() - 0.5) * 0.7);
        const jitterY = (s === 0 ? 0 : (Math.random() - 0.5) * 0.7);
        const jitterZ = (s === 0 ? 0 : (Math.random() - 0.5) * 0.5);

        branch.positions[s * 3] = cx + Math.cos(angle) * dist + jitterX;
        branch.positions[s * 3 + 1] = cy + Math.sin(angle) * dist + jitterY;
        branch.positions[s * 3 + 2] = cz + elev * dist + jitterZ;
      }
      branch.geo.attributes.position.needsUpdate = true;
      branch.line.material.color.setHex(colors[Math.floor(Math.random() * colors.length)]);
    });

    // Emit bright electric spark particles
    if (Math.random() < 0.85) {
      this.emitFeathers(centerPos, 5, 0x00FFFF);
      this.emitFeathers(centerPos, 3, 0xFFEB3B);
    }
  }

  clearLightningStorm() {
    this.isLightningActive = false;
    if (this.lightningBranches) {
      this.lightningBranches.forEach(b => {
        b.line.visible = false;
      });
    }
  }

  setGloomyDefeatFX(active) {
    this.isGloomyDefeat = active;
    this.scene.traverse(obj => {
      if (obj.isAmbientLight) {
        obj.color.setHex(active ? 0x405060 : 0xFFFFFF);
        obj.intensity = active ? 0.7 : 1.3;
      }
      if (obj.isDirectionalLight) {
        obj.intensity = active ? 0.4 : 1.2;
      }
    });
  }

  emitFeathers(pos, count = 14, color = 0xFFD700) {
    const col = new THREE.Color(color);
    for (let i = 0; i < count; i++) {
      this.activeParticles.push({
        x: pos.x + (Math.random() - 0.5) * 1.2,
        y: pos.y + (Math.random() - 0.5) * 1.2,
        z: pos.z + (Math.random() - 0.5) * 1.2,
        vx: (Math.random() - 0.5) * 7,
        vy: Math.random() * 6 + 1,
        vz: (Math.random() - 0.5) * 4,
        life: 1.0,
        decay: 1.2 + Math.random() * 0.8,
        r: col.r,
        g: col.g,
        b: col.b
      });
    }
  }

  updateParticles(dt) {
    if (!this.particlePoints) return;
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
      p.vy -= 10.0 * dt;
    }

    const count = posAttr.count;
    for (let i = 0; i < count; i++) {
      if (i < this.activeParticles.length) {
        const p = this.activeParticles[i];
        posAttr.setXYZ(i, p.x, p.y, p.z);
        colAttr.setXYZ(i, p.r * p.life, p.g * p.life, p.b * p.life);
      } else {
        posAttr.setXYZ(i, 0, -100, 0);
      }
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  // --- Creates 2x Sized Billboard Mesh for Items & Obstacles (No circles, no shadows, pure transparent) ---
  createEntityMesh(imagePath, defaultColor, width = 2.4, height = 2.4) {
    const group = new THREE.Group();
    // Double sized per Requirement 3
    const geo = new THREE.PlaneGeometry(width * 2, height * 2);

    let mat;
    if (imagePath) {
      const texture = this.loadTexture(imagePath);
      mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.05,
        side: THREE.DoubleSide,
        depthWrite: false
      });
    } else {
      mat = new THREE.MeshBasicMaterial({
        color: defaultColor,
        transparent: true,
        depthWrite: false
      });
    }

    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);
    return group;
  }

  loadTexture(path) {
    if (this.textureCache.has(path)) {
      return this.textureCache.get(path);
    }
    const texture = this.textureLoader.load(
      path,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        if (this.bgMat && this.bgMat.map === tex) {
          this.bgMat.needsUpdate = true;
        }
        if (this.charSpriteMat && this.charSpriteMat.map === tex) {
          this.charSpriteMat.needsUpdate = true;
        }
      },
      undefined,
      (err) => {
        console.warn(`Could not load image: ${path}`, err);
      }
    );
    this.textureCache.set(path, texture);
    return texture;
  }

  setStageColors(stage) {
    if (!stage) return;
    this.currentStageId = stage.id || 1;

    // Load and clearly display user's 16:9 stage background image
    if (stage.bgImage && this.bgMat) {
      const texture = this.loadTexture(stage.bgImage);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      this.bgMat.map = texture;
      this.bgMat.color.setHex(0xFFFFFF); // Full vibrant brightness
      this.bgMat.needsUpdate = true;
    }
  }

  setPlayerCharacter(character) {
    if (!character) return;
    if (character.imagePath && this.charSpriteMat) {
      const texture = this.loadTexture(character.imagePath);
      this.charSpriteMat.map = texture;
      this.charSpriteMat.needsUpdate = true;
    }
  }

  updatePlayerVisuals(player, time, dt) {
    if (!this.playerGroup || !this.charSpriteMesh) return;

    // Calculate 3D position along the stage's specific road curve
    const worldPos = this.getTrackWorldPos(player.trackPos, player.lanePos, player.y);
    this.playerGroup.position.copy(worldPos);

    // Road tangent curve angle
    const roadCurveAngle = this.getRoadAngle(player.trackPos);

    // Perspective scale at player's road depth (2x base size)
    const pScale = this.getPerspectiveScale(player.trackPos);

    // Mission Success: Standing heroically at center with radiating lightning
    if (player.isMissionSuccess) {
      this.playerGroup.scale.set(pScale * 1.25, pScale * 1.25, pScale * 1.25);
      this.charSpriteMesh.rotation.z = this.baseAngle + Math.sin(time * 8) * 0.04;
      this.charSpriteMesh.rotation.y = 0;
      this.charSpriteMesh.rotation.x = 0;
      this.emitLightningStorm(worldPos, dt);
      return;
    }

    // Mission Failed: Slumped sad drooping pose with rain/tear droplets
    if (player.isMissionFailed) {
      this.clearLightningStorm();
      const sadDroop = Math.sin(time * 3) * 0.04;
      this.playerGroup.scale.set(pScale * 0.95, pScale * (0.85 + sadDroop), pScale);
      this.charSpriteMesh.rotation.z = this.baseAngle - 0.38; // Head hung down
      this.charSpriteMesh.rotation.x = -0.22;
      this.charSpriteMesh.rotation.y = 0;
      this.charSpriteMat.color.setHex(0xB0BEC5); // Desaturated sad tint
      if (Math.random() < 0.6) {
        this.emitFeathers(worldPos, 1, 0x81D4FA); // Rainy tear drops
      }
      return;
    }

    this.clearLightningStorm();

    // Substantial 3D Motion (Zero circles, Zero shadows per Requirement 4)
    if (player.isGrounded) {
      const runBounce = Math.sin(time * 18) * 0.09;
      this.playerGroup.scale.set(
        pScale * (1 + runBounce),
        pScale * (1 - runBounce),
        pScale
      );

      // Natural alignment with road angle plus spirited running waddle
      this.charSpriteMesh.rotation.z = this.baseAngle + (roadCurveAngle * 0.25) + Math.sin(time * 18) * 0.06;

      // Real 3D Banking: roll on Y axis tilting into the steering turn
      const latVel = player.currentLateralVel || 0;
      const targetRoll = -latVel * 0.38;
      this.charSpriteMesh.rotation.y += (targetRoll - this.charSpriteMesh.rotation.y) * Math.min(1.0, dt * 14);

      // Real 3D Pitch: lean forward on X axis when dashing forward, lean back when braking
      const fwdVel = player.currentForwardVel || 0;
      const targetPitch = fwdVel * 0.28;
      this.charSpriteMesh.rotation.x += (targetPitch - this.charSpriteMesh.rotation.x) * Math.min(1.0, dt * 14);
    } else {
      // Dynamic 3D Somersault Flip in mid-air
      this.charSpriteMesh.rotation.z += (Math.PI * 2 * 2.2) * dt;
      this.charSpriteMesh.rotation.x = Math.sin(time * 12) * 0.4;
      this.charSpriteMesh.rotation.y = Math.cos(time * 12) * 0.3;
      this.playerGroup.scale.set(pScale * 1.15, pScale * 1.15, pScale * 1.15);
    }

    // Power-up Tint / Scale (Zero circle rings, zero shadows!)
    if (player.isFever) {
      this.playerGroup.scale.multiplyScalar(1.6);
      this.charSpriteMat.color.setHSL((time * 2) % 1, 1, 0.65); // Rainbow fever glow
    } else if (player.hasSpicyPepper) {
      this.charSpriteMat.color.setHex(0xFF5252); // Red fire tint
    } else if (player.hasGoldenBanana) {
      this.charSpriteMat.color.setHex(0xFFEB3B); // Golden banana tint
    } else {
      this.charSpriteMat.color.setHex(0xFFFFFF); // Natural colors
    }

    // Invincibility flashing
    if (player.isInvincible && !player.isFever && !player.hasSpicyPepper) {
      this.playerGroup.visible = Math.sin(time * 30) > 0;
    } else {
      this.playerGroup.visible = true;
    }
  }

  updateBackgroundScroll(speed, dt) {
    this.bgScrollOffset = (this.bgScrollOffset || 0) + speed * 0.0008 * dt;
    if (this.bgMat && this.bgMat.map) {
      this.bgMat.map.wrapT = THREE.RepeatWrapping;
      // Continuous vertical scroll giving subtle road momentum
      this.bgMat.map.offset.y = -(this.bgScrollOffset % 1.0) * 0.04;
    }
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  setViewMode(mode) {
    this.viewMode = mode;
    if (mode === 'PORTRAIT') {
      this.camera.position.set(0, 0, 18.0);
      this.camera.lookAt(0, 0, 0);
    } else {
      this.camera.position.set(0, 0, 14.5);
      this.camera.lookAt(0, 0, 0);
    }
    this.onWindowResize();
  }

  render(dt) {
    this.renderer.render(this.scene, this.camera);
  }
}
