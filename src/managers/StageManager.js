import { Stages, ItemTypes } from '../core/GameState.js';
import { Item } from '../entities/Item.js';
import { Obstacle, ObstacleDefs } from '../entities/Obstacle.js';
import { obstacleName, stageName, t } from '../core/i18n.js';

// World units ahead of the camera anchor where new things appear (inside the fog).
const SPAWN_AHEAD = 62;
const RUSH_SPAWN_AHEAD = 48;
const BOSS_LEAD_TIME = 15.0;
// Stage baseSpeed (legacy units) to world units per second.
const SPEED_TO_WORLD = 0.75;

const LINE_PATTERNS = ['straight', 'zigzag', 'curve'];

export class StageManager {
  constructor(renderer, scoreManager) {
    this.renderer = renderer;
    this.scoreManager = scoreManager;
    this.currentStageIndex = 0;
    this.stageConfig = Stages[0];

    this.elapsedTime = 0.0;
    this.stageDuration = 90.0;
    this.bossChaseTriggered = false;

    this.items = [];
    this.obstacles = [];
    this.nextItemS = 0;
    this.nextObstacleS = 0;

    this.onStageProgress = null;
    this.onBossChaseStart = null;
    this.onWarning = null;

    this.initPools();
  }

  initPools() {
    const foodTypes = [ItemTypes.RICE, ItemTypes.CORN];
    for (let i = 0; i < 36; i++) {
      this.items.push(new Item(this.renderer, foodTypes[i % 2]));
    }
    for (const power of [ItemTypes.PEPPER, ItemTypes.BANANA, ItemTypes.MAGNET]) {
      for (let i = 0; i < 2; i++) this.items.push(new Item(this.renderer, power));
    }
    for (const key of Object.keys(ObstacleDefs)) {
      for (let i = 0; i < 4; i++) this.obstacles.push(new Obstacle(this.renderer, key));
    }
  }

  loadStage(stageIndex) {
    this.currentStageIndex = stageIndex;
    this.stageConfig = Stages[stageIndex] || Stages[0];
    this.elapsedTime = 0.0;
    this.stageDuration = this.stageConfig.duration;
    this.bossChaseTriggered = false;
    this.nextItemS = 12;
    this.nextObstacleS = 30;

    for (let i = 0; i < this.items.length; i++) this.items[i].deactivate();
    for (let i = 0; i < this.obstacles.length; i++) this.obstacles[i].deactivate();

    return this.renderer.setStageColors(this.stageConfig);
  }

  /** World units per second for the current stage. */
  getRunSpeed() {
    return this.stageConfig.baseSpeed * this.stageConfig.speedMultiplier * SPEED_TO_WORLD;
  }

  update(dt, player, anchorS) {
    this.elapsedTime += dt;
    const progress = Math.min(1.0, this.elapsedTime / this.stageDuration);
    if (this.onStageProgress) {
      this.onStageProgress(progress, stageName(this.stageConfig));
    }

    if (!this.bossChaseTriggered && this.elapsedTime >= this.stageDuration - BOSS_LEAD_TIME) {
      this.bossChaseTriggered = true;
      if (this.onBossChaseStart) this.onBossChaseStart(this.stageConfig.id);
    }

    const horizon = anchorS + SPAWN_AHEAD;
    while (this.nextItemS < horizon) {
      this.spawnItemPattern(this.nextItemS);
      this.nextItemS += 9 + Math.random() * 7;
    }
    if (!this.bossChaseTriggered) {
      while (this.nextObstacleS < horizon) {
        this.spawnObstacle(this.nextObstacleS, anchorS);
        this.nextObstacleS += 13 + Math.random() * 9;
      }
    } else {
      this.nextObstacleS = horizon;
    }

    const halfW = this.renderer.path.halfWidth;
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      if (!item.active) continue;
      item.update(dt, anchorS, player);
      if (item.checkCollision(player)) {
        if (item.config.power) player.applyPowerup(item.config.power, item.config.duration);
        this.scoreManager.addFood(item.config.score, item.config.feverInc);
      }
    }

    for (let i = 0; i < this.obstacles.length; i++) {
      const obs = this.obstacles[i];
      if (!obs.active) continue;
      obs.update(dt, anchorS);
      const res = obs.checkCollision(player, halfW);
      if (res === 'DAMAGE') {
        if (player.takeDamage()) this.scoreManager.breakCombo();
      } else if (res === 'SLOW') {
        player.pondTimer = 0.25;
      } else if (res === 'FEVER_POPCORN') {
        this.scoreManager.addFood(50, 0);
      } else if (res === 'SMASHED') {
        this.scoreManager.addFood(30, 0);
      }
    }
  }

  freeItem(predicate) {
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i];
      if (!it.active && predicate(it)) return it;
    }
    return null;
  }

  obstacleLaneNear(s, range) {
    for (let i = 0; i < this.obstacles.length; i++) {
      const o = this.obstacles[i];
      if (o.active && Math.abs(o.s - s) < range) return o.lane;
    }
    return null;
  }

  spawnItemPattern(s) {
    if (Math.random() < 0.18) {
      const power = this.freeItem(it => !!it.config.power);
      if (power) {
        power.spawn(s, (Math.random() - 0.5) * 1.4);
        return;
      }
    }

    const count = 5;
    const spacing = 1.5;
    const pattern = LINE_PATTERNS[Math.floor(Math.random() * LINE_PATTERNS.length)];
    let lane = (Math.random() - 0.5) * 1.2;
    const blocked = this.obstacleLaneNear(s + (count * spacing) / 2, count * spacing);
    if (blocked !== null) lane = blocked > 0 ? -0.55 : 0.55;
    const useCorn = Math.random() < 0.35;

    for (let i = 0; i < count; i++) {
      const it = this.freeItem(x => !x.config.power && (x.config.id === 'corn') === useCorn)
        || this.freeItem(x => !x.config.power);
      if (!it) return;
      let l = lane;
      if (pattern === 'zigzag') l = lane + (i % 2 === 0 ? -0.25 : 0.25);
      else if (pattern === 'curve') l = lane + Math.sin((i / (count - 1)) * Math.PI) * 0.45 * (lane > 0 ? -1 : 1);
      it.spawn(s + i * spacing, l);
    }
  }

  spawnObstacle(s, anchorS) {
    let pool = this.stageConfig.obstacles.filter(k => ObstacleDefs[k]);
    if (pool.length === 0) pool = ['haystack', 'fence', 'dog'];
    const weights = this.stageConfig.obstacleWeights || {};
    let total = 0;
    for (const k of pool) total += weights[k] ?? 1;
    let r = Math.random() * total;
    let type = pool[0];
    for (const k of pool) {
      r -= weights[k] ?? 1;
      if (r <= 0) { type = k; break; }
    }

    let obs = null;
    for (let i = 0; i < this.obstacles.length; i++) {
      const o = this.obstacles[i];
      if (!o.active && o.typeKey === type) { obs = o; break; }
    }
    if (!obs) return;

    const lane = (Math.random() - 0.5) * 1.6;
    if (obs.isRushing) {
      obs.spawn(Math.min(s, anchorS + RUSH_SPAWN_AHEAD), lane);
      if (this.onWarning) this.onWarning(t('warn.rush', { name: obstacleName(obs.typeKey) }));
    } else {
      obs.spawn(s, lane);
    }
  }
}
