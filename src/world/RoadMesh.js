import * as THREE from 'three';

/**
 * Ribbon geometry that follows the RoadPath from just behind the camera to the fog horizon.
 * Vertices are rewritten every frame; texture V is tied to absolute distance so the ground
 * appears to flow toward the camera as the runner advances.
 */
export class RoadMesh {
  constructor(path, { segments = 180, behind = 14, ahead = 260 } = {}) {
    this.path = path;
    this.segments = segments;
    this.behind = behind;
    this.ahead = ahead;
    this.group = new THREE.Group();

    this.roadMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    this.grassMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });

    this.road = this.createStrip(this.roadMat);
    this.leftSkirt = this.createStrip(this.grassMat);
    this.rightSkirt = this.createStrip(this.grassMat);
    this.group.add(this.road.mesh, this.leftSkirt.mesh, this.rightSkirt.mesh);

    this.tileWorldWidth = 13.8;
    this.tileWorldLength = 6.3;
    this.roadUCenter = 0.5;
    this.grassTileWidth = 4.3;
    this.grassTileLength = 6.3;
    this.skirtWidth = 70;

    this.tmp = new THREE.Vector3();
  }

  createStrip(material) {
    const n = this.segments + 1;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(n * 2 * 3);
    const uvs = new Float32Array(n * 2 * 2);
    const indices = [];
    for (let i = 0; i < this.segments; i++) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    const mesh = new THREE.Mesh(geo, material);
    mesh.frustumCulled = false;
    return { geo, positions, uvs, mesh };
  }

  /**
   * @param {object} cfg { groundTexture, grassTexture, roadU0, roadU1, groundAspect, grassAspect, groundColor }
   */
  configure(cfg) {
    const roadWidth = this.path.halfWidth * 2;
    const roadFrac = Math.max(0.1, (cfg.roadU1 ?? 0.67) - (cfg.roadU0 ?? 0.33));
    this.tileWorldWidth = roadWidth / roadFrac;
    this.tileWorldLength = this.tileWorldWidth * (cfg.groundAspect ?? 0.5);
    this.roadUCenter = ((cfg.roadU0 ?? 0.33) + (cfg.roadU1 ?? 0.67)) / 2;

    const grassFrac = cfg.grassFrac ?? 0.3;
    this.grassTileWidth = this.tileWorldWidth * grassFrac;
    this.grassTileLength = this.tileWorldLength;

    this.applyTexture(this.roadMat, cfg.groundTexture, THREE.ClampToEdgeWrapping, cfg.groundColor);
    this.applyTexture(this.grassMat, cfg.grassTexture, THREE.MirroredRepeatWrapping, cfg.grassColor ?? cfg.groundColor);
  }

  applyTexture(mat, tex, wrapS, fallbackColor) {
    if (tex) {
      tex.wrapS = wrapS;
      tex.wrapT = THREE.RepeatWrapping;
      tex.anisotropy = 8;
      tex.needsUpdate = true;
      mat.map = tex;
      mat.color.setHex(0xffffff);
    } else {
      mat.map = null;
      mat.color.setHex(fallbackColor ?? 0x8d6e63);
    }
    mat.needsUpdate = true;
  }

  setTint(hex) {
    this.roadMat.color.setHex(this.roadMat.map ? hex : this.roadMat.color.getHex());
    this.grassMat.color.setHex(this.grassMat.map ? hex : this.grassMat.color.getHex());
  }

  update(anchorS) {
    const path = this.path;
    const start = anchorS - this.behind;
    const step = (this.behind + this.ahead) / this.segments;
    const half = this.tileWorldWidth / 2;
    const outer = half + this.skirtWidth;
    const p = this.tmp;

    for (let i = 0; i <= this.segments; i++) {
      const s = start + i * step;
      const v = s / this.tileWorldLength;
      const gv = s / this.grassTileLength;
      const k = i * 2;

      path.pointAtOffset(s, -half, 0, p);
      this.writeVertex(this.road, k, p, this.roadUCenter - 0.5, v);
      this.writeVertex(this.leftSkirt, k + 1, p, 0, gv);
      path.pointAtOffset(s, half, 0, p);
      this.writeVertex(this.road, k + 1, p, this.roadUCenter + 0.5, v);
      this.writeVertex(this.rightSkirt, k, p, 0, gv);

      path.pointAtOffset(s, -outer, -0.02, p);
      this.writeVertex(this.leftSkirt, k, p, -this.skirtWidth / this.grassTileWidth, gv);
      path.pointAtOffset(s, outer, -0.02, p);
      this.writeVertex(this.rightSkirt, k + 1, p, this.skirtWidth / this.grassTileWidth, gv);
    }

    for (const strip of [this.road, this.leftSkirt, this.rightSkirt]) {
      strip.geo.attributes.position.needsUpdate = true;
      strip.geo.attributes.uv.needsUpdate = true;
    }
  }

  writeVertex(strip, index, p, u, v) {
    strip.positions[index * 3] = p.x;
    strip.positions[index * 3 + 1] = p.y;
    strip.positions[index * 3 + 2] = p.z;
    strip.uvs[index * 2] = u;
    strip.uvs[index * 2 + 1] = v;
  }
}
