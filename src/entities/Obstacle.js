import { soundSynth } from '../audio/SoundSynth.js';

export const ObstacleDefs = {
  haystack: { name: '건초더미', image: '/assets/images/fixtures/haystack.png', color: 0xE6C280, w: 2.2, h: 2.0, isRushing: false },
  fence: { name: '나무 울타리', image: '/assets/images/fixtures/fence.png', color: 0x8D6E63, w: 2.3, h: 1.8, isRushing: false },
  cow_rushing: { name: '돌진 황소', image: '/assets/images/npcs/cow_rushing.png', color: 0xB71C1C, w: 2.5, h: 2.3, isRushing: true, extraSpeed: 0.015 },
  dog: { name: '시골 강아지', image: '/assets/images/npcs/dog.png', color: 0xFFB74D, w: 2.0, h: 2.0, isRushing: false },
  popcorn_machine: { name: '뻥튀기 기계', image: '/assets/images/fixtures/popcorn_machine.png', color: 0x424242, w: 2.6, h: 2.6, isRushing: false }
};

export class Obstacle {
  constructor(renderer, typeKey) {
    this.renderer = renderer;
    this.typeKey = typeKey;
    this.def = ObstacleDefs[typeKey] || ObstacleDefs.haystack;

    // Track Coordinates
    this.trackPos = 0.0;
    this.lanePos = 0.0;
    this.active = false;

    this.isRushing = this.def.isRushing || false;
    this.extraSpeed = this.def.extraSpeed || 0.0;
    this.animTime = 0;

    // 2x Sized Mesh (createEntityMesh doubles w & h)
    this.mesh = this.renderer.createEntityMesh(this.def.image, this.def.color, this.def.w, this.def.h);
    this.mesh.visible = false;
    this.renderer.scene.add(this.mesh);
  }

  spawn(lanePos) {
    this.trackPos = 0.0; // Spawns at vanishing point
    // Strictly inside the recognized road (100% of road width = [-0.8, 0.8])
    this.lanePos = Math.max(-0.8, Math.min(0.8, lanePos));
    this.active = true;
    this.mesh.visible = true;

    if (this.isRushing) {
      soundSynth.playCowMoo();
    }

    const worldPos = this.renderer.getTrackWorldPos(this.trackPos, this.lanePos, 0.4);
    this.mesh.position.copy(worldPos);
    const pScale = this.renderer.getPerspectiveScale(this.trackPos);
    this.mesh.scale.set(pScale, pScale, pScale);
  }

  deactivate() {
    this.active = false;
    this.mesh.visible = false;
    this.mesh.position.set(0, -100, 0);
  }

  update(scrollSpeed, dt) {
    if (!this.active) return;

    this.animTime += dt;
    let speed = scrollSpeed * 0.024;
    if (this.isRushing) {
      speed += this.extraSpeed;
    }

    // Move along stage road path from distance towards foreground
    this.trackPos += speed * dt;

    // Wandering NPCs meander strictly inside the road
    if (this.typeKey === 'dog') {
      this.lanePos += Math.sin(this.animTime * 2.8) * 0.16 * dt;
      this.lanePos = Math.max(-0.8, Math.min(0.8, this.lanePos));
    } else if (this.typeKey === 'cow_rushing') {
      this.lanePos += Math.sin(this.animTime * 4.0) * 0.12 * dt;
      this.lanePos = Math.max(-0.8, Math.min(0.8, this.lanePos));
    }

    // Substantial 3D Motion based on NPC type
    let jumpBob = 0.35;
    const roadAngle = (this.renderer.getRoadAngle ? this.renderer.getRoadAngle(this.trackPos) : 0);

    if (this.typeKey === 'cow_rushing') {
      // 3D Charging Bull: heavy thundering gallop + aggressive head-down pitch
      jumpBob += Math.abs(Math.sin(this.animTime * 14)) * 0.42;
      this.mesh.rotation.x = 0.22 + Math.sin(this.animTime * 14) * 0.16; // Head down charge
      this.mesh.rotation.y = Math.sin(this.animTime * 7) * 0.22; // Side-to-side road sway
      this.mesh.rotation.z = roadAngle * 0.3 + Math.sin(this.animTime * 14) * 0.08;
    } else if (this.typeKey === 'dog') {
      // 3D Trotting Dog: bouncy galloping bounds + playful body tilt
      jumpBob += Math.abs(Math.sin(this.animTime * 18)) * 0.35;
      this.mesh.rotation.x = Math.sin(this.animTime * 18) * 0.15;
      this.mesh.rotation.y = Math.sin(this.animTime * 9) * 0.25;
      this.mesh.rotation.z = roadAngle * 0.3 + Math.sin(this.animTime * 18) * 0.12;
    } else if (this.typeKey === 'popcorn_machine') {
      // 3D Popcorn Machine: intense mechanical boiler rattle + steam puff hops
      const popCycle = (this.animTime % 1.6);
      const popHop = popCycle < 0.22 ? Math.sin((popCycle / 0.22) * Math.PI) * 0.45 : 0;
      jumpBob += popHop;
      this.mesh.rotation.x = Math.sin(this.animTime * 35) * 0.06;
      this.mesh.rotation.z = Math.sin(this.animTime * 45) * 0.08;
      this.mesh.rotation.y = Math.sin(this.animTime * 20) * 0.05;
    } else {
      // 3D Haystack & Wooden Fence: natural road alignment and perspective sway
      this.mesh.rotation.y = Math.sin(this.animTime * 2.5) * 0.12;
      this.mesh.rotation.z = roadAngle * 0.2;
    }

    const worldPos = this.renderer.getTrackWorldPos(this.trackPos, this.lanePos, jumpBob);
    this.mesh.position.copy(worldPos);

    // Growing perspective scale as it gets closer along the road
    const pScale = this.renderer.getPerspectiveScale(this.trackPos);
    this.mesh.scale.set(pScale, pScale, pScale);

    if (this.trackPos > 1.1) {
      this.deactivate();
    }
  }

  checkCollision(player) {
    if (!this.active) return false;

    // Jumping high avoids ground obstacles
    if (player.isJumping && player.y > 1.2) {
      return false;
    }

    const dTrack = Math.abs(this.trackPos - player.trackPos);
    const dLane = Math.abs(this.lanePos - player.lanePos);

    if (dTrack < 0.08 && dLane < 0.42) {
      const worldPos = this.renderer.getTrackWorldPos(this.trackPos, this.lanePos, 0.5);

      // Fever mode converts obstacle into Popcorn!
      if (player.isFever) {
        soundSynth.playEat();
        this.renderer.emitFeathers(worldPos, 20, 0xFFEB3B);
        this.deactivate();
        return 'FEVER_POPCORN';
      }

      // Spicy pepper destroys obstacle
      if (player.hasSpicyPepper) {
        soundSynth.playHit();
        this.renderer.emitFeathers(worldPos, 25, 0xFF4500);
        this.deactivate();
        return 'SMASHED';
      }

      return 'DAMAGE';
    }

    return false;
  }
}
