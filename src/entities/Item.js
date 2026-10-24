import { soundSynth } from '../audio/SoundSynth.js';

export class Item {
  constructor(renderer, itemConfig) {
    this.renderer = renderer;
    this.config = itemConfig;

    // Track Coordinates
    this.trackPos = 0.0; // 0.0 = Vanishing Point (Top-Right)
    this.lanePos = 0.0;  // Lateral lane across track
    this.active = false;
    this.animTime = Math.random() * 10;

    // 2x Sized Mesh (Width 2.4, Height 2.4)
    this.mesh = this.renderer.createEntityMesh(itemConfig.image, itemConfig.color, 1.2, 1.2);
    this.mesh.visible = false;
    this.renderer.scene.add(this.mesh);
  }

  spawn(lanePos) {
    this.trackPos = 0.0; // Spawns far away at Top-Right vanishing point
    this.lanePos = lanePos;
    this.active = true;
    this.mesh.visible = true;

    const initialPos = this.renderer.getTrackWorldPos(this.trackPos, this.lanePos, 0.4);
    this.mesh.position.copy(initialPos);
    const pScale = this.renderer.getPerspectiveScale(this.trackPos);
    this.mesh.scale.set(pScale, pScale, pScale);
  }

  deactivate() {
    this.active = false;
    this.mesh.visible = false;
    this.mesh.position.set(0, -100, 0);
  }

  update(scrollSpeed, dt, player) {
    if (!this.active) return;

    this.animTime += dt;

    // Move along track from Top-Right (0) down towards Bottom-Left (1)
    const trackSpeed = scrollSpeed * 0.024;
    this.trackPos += trackSpeed * dt;

    // Magnet suction pull logic
    if (player && (player.hasMagnet || player.isFever)) {
      const dTrack = player.trackPos - this.trackPos;
      const dLane = player.lanePos - this.lanePos;
      const dist = Math.sqrt(dTrack * dTrack + dLane * dLane);

      if (dist < 0.45) {
        const pullSpeed = 2.4;
        this.trackPos += (dTrack / dist) * pullSpeed * dt;
        this.lanePos += (dLane / dist) * pullSpeed * dt;
      }
    }

    // Dynamic 3D bobbing and spinning collectible animation
    const bob = Math.sin(this.animTime * 5.0) * 0.22;
    const worldPos = this.renderer.getTrackWorldPos(this.trackPos, this.lanePos, 0.45 + bob);
    this.mesh.position.copy(worldPos);

    // Growing perspective scale as it gets closer along the road
    const pScale = this.renderer.getPerspectiveScale(this.trackPos);
    this.mesh.scale.set(pScale, pScale, pScale);

    // Real 3D Motion: continuous spinning around Y axis + rhythmic 3D tilt
    this.mesh.rotation.y += 3.8 * dt;
    this.mesh.rotation.x = Math.sin(this.animTime * 3.5) * 0.18;
    this.mesh.rotation.z = Math.sin(this.animTime * 2.0) * 0.10;

    // Despawn once it passes screen exit at bottom-left
    if (this.trackPos > 1.1) {
      this.deactivate();
    }
  }

  checkCollision(player) {
    if (!this.active) return false;

    const dTrack = Math.abs(this.trackPos - player.trackPos);
    const dLane = Math.abs(this.lanePos - player.lanePos);

    // Collision check based on track distance and lane
    if (dTrack < 0.075 && dLane < 0.38) {
      this.deactivate();
      return true;
    }
    return false;
  }
}
