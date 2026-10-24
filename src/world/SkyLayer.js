import * as THREE from 'three';

/**
 * Far backdrop parented to the camera. Its lower haze band is placed just under the horizon
 * so the fogged road end blends into it; it slides sideways a little with road heading (0.2x parallax).
 */
export class SkyLayer {
  constructor(camera) {
    this.camera = camera;
    this.distance = 400;
    this.aspect = 16 / 9;
    // Fraction of the image height (from the bottom) that sits below the horizon line.
    this.horizonFromBottom = 0.44;
    this.material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      fog: false,
      depthWrite: false,
      depthTest: false
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.material);
    this.mesh.renderOrder = -10;
    this.mesh.frustumCulled = false;
    camera.add(this.mesh);
    this.pitch = 0;
    this.parallaxX = 0;
  }

  setTexture(tex, fallbackColor = 0x87ceeb) {
    if (tex) {
      this.material.map = tex;
      this.material.color.setHex(0xffffff);
      const img = tex.image;
      if (img && img.width) this.aspect = img.width / img.height;
    } else {
      this.material.map = null;
      this.material.color.setHex(fallbackColor);
    }
    this.material.needsUpdate = true;
    this.layout();
  }

  setTint(hex) {
    if (this.material.map) this.material.color.setHex(hex);
  }

  /** pitch: camera downward pitch in radians (positive = looking down). */
  setPitch(pitch) {
    this.pitch = pitch;
    this.layout();
  }

  layout() {
    const cam = this.camera;
    const vHalf = THREE.MathUtils.degToRad(cam.fov / 2);
    const hHalf = Math.atan(Math.tan(vHalf) * cam.aspect);
    const d = this.distance;
    const horizonY = d * Math.tan(this.pitch);
    const topY = d * Math.tan(vHalf);

    let width = 2 * d * Math.tan(hHalf) * 1.25;
    let height = width / this.aspect;
    const neededAbove = topY - horizonY + d * 0.02;
    const above = height * (1 - this.horizonFromBottom);
    if (above < neededAbove) {
      height = neededAbove / (1 - this.horizonFromBottom);
      width = height * this.aspect;
    }
    this.width = width;
    this.mesh.scale.set(width, height, 1);
    this.baseY = horizonY - height * this.horizonFromBottom + height / 2;
    this.mesh.position.set(this.parallaxX, this.baseY, -d);
  }

  update(heading) {
    const maxShift = this.width ? this.width * 0.08 : 0;
    this.parallaxX = THREE.MathUtils.clamp(-heading * this.width * 0.2, -maxShift, maxShift);
    this.mesh.position.x = this.parallaxX;
  }
}
