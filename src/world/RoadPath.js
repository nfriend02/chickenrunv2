import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

/**
 * Endless road centerline defined analytically so it never needs chunk stitching.
 * Distance s runs forward along -Z; slopes stay small (< 0.25), so s is within ~3% of true arc length.
 * Entities live in (s, lane, h): lane -1..+1 spans the drivable road, h is height above the surface.
 */
export class RoadPath {
  constructor() {
    this.halfWidth = 2.2;
    this.setShape({ curviness: 1.0, hilliness: 1.0, seed: 1 });
  }

  setShape({ curviness = 1.0, hilliness = 1.0, seed = 1, halfWidth = 2.2 }) {
    this.halfWidth = halfWidth;
    this.curviness = curviness;
    this.hilliness = hilliness;
    this.p1 = seed * 1.7;
    this.p2 = seed * 0.6 + 1.3;
    this.p3 = seed * 2.3;
  }

  centerX(s) {
    const c = this.curviness;
    return c * (6.0 * Math.sin(s * 0.018 + this.p1) + 2.4 * Math.sin(s * 0.047 + this.p2));
  }

  centerY(s) {
    const h = this.hilliness;
    return h * (1.1 * Math.sin(s * 0.029 + this.p3) + 0.35 * Math.sin(s * 0.071));
  }

  dX(s) {
    const c = this.curviness;
    return c * (6.0 * 0.018 * Math.cos(s * 0.018 + this.p1) + 2.4 * 0.047 * Math.cos(s * 0.047 + this.p2));
  }

  dY(s) {
    const h = this.hilliness;
    return h * (1.1 * 0.029 * Math.cos(s * 0.029 + this.p3) + 0.35 * 0.071 * Math.cos(s * 0.071));
  }

  /** Writes centerline point, forward tangent and right vector at distance s. */
  frame(s, outCenter, outForward, outRight) {
    outCenter.set(this.centerX(s), this.centerY(s), -s);
    outForward.set(this.dX(s), this.dY(s), -1).normalize();
    outRight.crossVectors(outForward, UP).normalize();
  }

  /** World position for a path coordinate. */
  point(s, lane = 0, h = 0, out = new THREE.Vector3()) {
    const x = this.centerX(s);
    const y = this.centerY(s);
    const fx = this.dX(s);
    const len = Math.sqrt(fx * fx + 1);
    // right = forward x up, flattened: (1, 0, fx) / len
    const off = lane * this.halfWidth;
    out.set(x + off / len, y + h, -s + (off * fx) / len);
    return out;
  }

  /** Lateral offset in world units for points beyond the road edges (used by props). */
  pointAtOffset(s, offset, h = 0, out = new THREE.Vector3()) {
    return this.point(s, offset / this.halfWidth, h, out);
  }

  /** Heading angle (radians) of the road around the Y axis, 0 = straight ahead. */
  heading(s) {
    return Math.atan(this.dX(s));
  }
}
