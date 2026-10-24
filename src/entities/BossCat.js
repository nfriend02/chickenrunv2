import { soundSynth } from '../audio/SoundSynth.js';

export class BossCat {
  constructor(renderer) {
    this.renderer = renderer;
    this.active = false;
    this.stageId = 1;
    this.trackPos = 1.15; // Starts at BOTTOM of the screen
    this.lanePos = 0.0;
    this.state = 'IDLE'; // IDLE, ENTERING, STALKING, CHARGING, LUNGING, EVADED, RETREAT, DEFEATED
    this.animTime = 0;
    this.stateTimer = 0;
    this.evadeCount = 0;
    this.targetEvades = 4;
    this.hasResolvedCurrentLunge = false;

    // Callbacks
    this.onAttackWarning = null;
    this.onEvaded = null;
    this.onMissionSuccess = null;
    this.onMissionFailed = null;

    this.mesh = null;
    this.setupMesh();
  }

  setupMesh() {
    // 2x Sized Boss Mesh (Width 5.2, Height 5.2)
    this.mesh = this.renderer.createEntityMesh('/assets/images/npcs/cat_grumpy.png', 0xFF5722, 2.6, 2.6);
    this.mesh.visible = false;
    this.renderer.scene.add(this.mesh);
  }

  startChase(stageId) {
    this.stageId = stageId;
    this.active = true;
    this.state = 'ENTERING';
    this.trackPos = 1.15; // Emerges from BOTTOM (하단)
    this.lanePos = 0.0;
    this.animTime = 0;
    this.stateTimer = 0;
    this.evadeCount = 0;
    this.hasResolvedCurrentLunge = false;

    let imgPath = '/assets/images/npcs/cat_grumpy.png';
    if (stageId === 2) imgPath = '/assets/images/npcs/cat_tractor.png';

    const texture = this.renderer.loadTexture(imgPath);
    if (this.mesh && this.mesh.children[0]) {
      this.mesh.children[0].material.map = texture;
      this.mesh.children[0].material.needsUpdate = true;
    }

    this.mesh.visible = true;
    soundSynth.playBossChase();
  }

  update(dt, player) {
    if (!this.active) return;
    this.animTime += dt;
    this.stateTimer += dt;

    const roadAngle = (this.renderer.getRoadAngle ? this.renderer.getRoadAngle(this.trackPos) : 0);
    const pScale = this.renderer.getPerspectiveScale(this.trackPos);

    // --- State Machine ---
    switch (this.state) {
      case 'ENTERING': {
        // Rises up from screen BOTTOM into stalking range
        this.trackPos -= 0.35 * dt;
        this.lanePos += (player.lanePos * 0.7 - this.lanePos) * 2.0 * dt;

        if (this.trackPos <= 0.94) {
          this.trackPos = 0.94;
          this.state = 'STALKING';
          this.stateTimer = 0;
          if (this.onAttackWarning) {
            this.onAttackWarning(`🚨 늙은 고양이 하단 출현! (회피 목표: 4회)`);
          }
        }
        break;
      }

      case 'STALKING': {
        // Stalks directly beneath player along the road for 2.2 seconds
        const targetLane = Math.max(-0.8, Math.min(0.8, player.lanePos * 0.9));
        this.lanePos += (targetLane - this.lanePos) * 2.8 * dt;
        this.trackPos = 0.94 + Math.sin(this.animTime * 6) * 0.02;

        if (this.stateTimer >= 2.0) {
          this.state = 'CHARGING';
          this.stateTimer = 0;
          soundSynth.playWarning();
          if (this.onAttackWarning) {
            this.onAttackWarning(`⚠️ 고양이 하단 급습 임박! JUMP 버튼으로 회피하세요! 🪶`);
          }
        }
        break;
      }

      case 'CHARGING': {
        // Crouches low, eyes glow red, prepares upward lunge
        this.lanePos += (player.lanePos - this.lanePos) * 3.5 * dt;
        this.trackPos = 0.96;

        // Visual crouch rumble
        if (this.mesh) {
          this.mesh.rotation.x = 0.45;
          this.mesh.rotation.y = Math.sin(this.animTime * 30) * 0.12;
        }

        if (this.stateTimer >= 0.85) {
          this.state = 'LUNGING';
          this.stateTimer = 0;
          this.hasResolvedCurrentLunge = false;
          soundSynth.playBossChase();
        }
        break;
      }

      case 'LUNGING': {
        // Surges rapidly UPWARD from bottom towards top (overtaking player)
        this.trackPos -= 1.85 * dt; // Moving upward towards player

        // Check evade window right as cat reaches the protagonist
        const dTrack = Math.abs(this.trackPos - player.trackPos);
        const dLane = Math.abs(this.lanePos - player.lanePos);

        if (!this.hasResolvedCurrentLunge && dTrack < 0.11 && dLane < 0.65) {
          this.hasResolvedCurrentLunge = true;

          // EVADE CHECK: Player is jumping (airborne / in jump)
          if (player.isJumping || player.y > 0.45) {
            // --- SUCCESSFUL EVADE! ---
            this.evadeCount++;
            soundSynth.playEvadeSuccess();

            const worldPos = this.renderer.getTrackWorldPos(player.trackPos, player.lanePos, player.y);
            this.renderer.emitFeathers(worldPos, 22, 0x00FFFF);
            this.renderer.emitFeathers(worldPos, 14, 0xFFD700);

            if (this.onEvaded) {
              this.onEvaded(this.evadeCount, this.targetEvades);
            }

            // Cat misses, overshoots upward
            this.state = 'EVADED';
            this.stateTimer = 0;
          } else {
            // --- FAILED TO EVADE: PLAYER HIT! ---
            const damaged = player.takeDamage();
            soundSynth.playHit();
            const worldPos = this.renderer.getTrackWorldPos(this.trackPos, this.lanePos, 0.5);
            this.renderer.emitFeathers(worldPos, 25, 0xE53935);

            if (player.feathers <= 0) {
              this.state = 'DEFEATED';
              if (this.onMissionFailed) {
                this.onMissionFailed(this.evadeCount);
              }
              return;
            } else {
              this.state = 'RETREAT';
              this.stateTimer = 0;
            }
          }
        }

        // Overshot without collision
        if (this.trackPos < 0.35) {
          this.state = 'RETREAT';
          this.stateTimer = 0;
        }
        break;
      }

      case 'EVADED': {
        // Cat overshoots upward, spins around in confusion
        this.trackPos += (0.40 - this.trackPos) * 2.0 * dt;
        if (this.mesh) {
          this.mesh.rotation.y += 12.0 * dt;
          this.mesh.rotation.z += 8.0 * dt;
        }

        if (this.stateTimer >= 0.7) {
          // Check if 4 evades achieved!
          if (this.evadeCount >= this.targetEvades) {
            this.state = 'DEFEATED';
            soundSynth.playThunderLightning();
            const worldPos = this.renderer.getTrackWorldPos(this.trackPos, this.lanePos, 0.5);
            this.renderer.emitFeathers(worldPos, 35, 0xFFEB3B);

            if (this.onMissionSuccess) {
              this.onMissionSuccess();
            }
            return;
          } else {
            this.state = 'RETREAT';
            this.stateTimer = 0;
          }
        }
        break;
      }

      case 'RETREAT': {
        // Cat slides back down to BOTTOM of the screen to prepare next attack
        this.trackPos += 0.95 * dt;
        if (this.trackPos >= 1.05) {
          this.trackPos = 0.96;
          this.state = 'STALKING';
          this.stateTimer = 0;
          this.hasResolvedCurrentLunge = false;
        }
        break;
      }

      case 'DEFEATED': {
        // Cat knocked out of bounds
        this.trackPos += 1.5 * dt;
        if (this.mesh) {
          this.mesh.rotation.z += 10 * dt;
          this.mesh.position.y -= 8 * dt;
        }
        if (this.trackPos > 1.4) {
          this.mesh.visible = false;
        }
        break;
      }
    }

    // Update 3D Transform
    const bob = Math.abs(Math.sin(this.animTime * 14)) * 0.35;
    const worldPos = this.renderer.getTrackWorldPos(this.trackPos, this.lanePos, 0.45 + bob);
    this.mesh.position.copy(worldPos);
    this.mesh.scale.set(pScale, pScale, pScale);

    if (this.state !== 'EVADED' && this.state !== 'DEFEATED') {
      this.mesh.rotation.z = roadAngle * 0.3 + Math.sin(this.animTime * 12) * 0.08;
      this.mesh.rotation.y = Math.sin(this.animTime * 6) * 0.15;
      this.mesh.rotation.x = this.state === 'LUNGING' ? -0.35 : 0.22;
    }
  }

  reset() {
    this.active = false;
    this.state = 'IDLE';
    this.evadeCount = 0;
    this.hasResolvedCurrentLunge = false;
    if (this.mesh) {
      this.mesh.visible = false;
      this.mesh.position.set(0, -100, 0);
      this.mesh.rotation.set(0, 0, 0);
    }
  }
}
