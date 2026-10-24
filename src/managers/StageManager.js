import { Stages, ItemTypes } from '../core/GameState.js';
import { Item } from '../entities/Item.js';
import { Obstacle } from '../entities/Obstacle.js';

export class StageManager {
  constructor(renderer, scoreManager) {
    this.renderer = renderer;
    this.scoreManager = scoreManager;
    this.currentStageIndex = 0;
    this.stageConfig = Stages[0];

    this.elapsedTime = 0.0;
    this.stageDuration = 90.0;
    this.bossChaseTriggered = false;

    // Spawner pools
    this.items = [];
    this.obstacles = [];
    this.itemSpawnTimer = 0.0;
    this.obstacleSpawnTimer = 0.0;

    this.onStageProgress = null;
    this.onBossChaseStart = null;
    this.onWarning = null;

    this.initPools();
  }

  initPools() {
    // Pool of items
    const itemConfigList = [
      ItemTypes.RICE,
      ItemTypes.CORN,
      ItemTypes.PEPPER,
      ItemTypes.BANANA,
      ItemTypes.MAGNET
    ];

    for (let i = 0; i < 25; i++) {
      const cfg = itemConfigList[i % itemConfigList.length];
      this.items.push(new Item(this.renderer, cfg));
    }

    // Pool of obstacles
    const obsTypes = ['haystack', 'fence', 'cow_rushing', 'dog', 'popcorn_machine'];
    for (let i = 0; i < 15; i++) {
      const type = obsTypes[i % obsTypes.length];
      this.obstacles.push(new Obstacle(this.renderer, type));
    }
  }

  loadStage(stageIndex) {
    this.currentStageIndex = stageIndex;
    this.stageConfig = Stages[stageIndex] || Stages[0];
    this.elapsedTime = 0.0;
    this.stageDuration = this.stageConfig.duration;
    this.bossChaseTriggered = false;
    this.itemSpawnTimer = 0.0;
    this.obstacleSpawnTimer = 2.0;

    // Clear active items & obstacles
    this.items.forEach(it => it.deactivate());
    this.obstacles.forEach(ob => ob.deactivate());

    // Update renderer colors
    this.renderer.setStageColors(this.stageConfig);
  }

  getScrollSpeed() {
    return this.stageConfig.baseSpeed * this.stageConfig.speedMultiplier;
  }

  update(dt, player) {
    this.elapsedTime += dt;
    const progress = Math.min(1.0, this.elapsedTime / this.stageDuration);

    if (this.onStageProgress) {
      this.onStageProgress(progress, this.stageConfig.name);
    }

    // Boss Chase Trigger (Starts at 15s into the stage)
    if (!this.bossChaseTriggered && this.elapsedTime >= 15.0) {
      this.bossChaseTriggered = true;
      if (this.onBossChaseStart) {
        this.onBossChaseStart(this.stageConfig.id);
      }
    }

    const scrollSpeed = this.getScrollSpeed();
    this.renderer.updateBackgroundScroll(scrollSpeed, dt);

    // Spawning Items (lines of rice/corn, occasional power-up)
    this.itemSpawnTimer -= dt;
    if (this.itemSpawnTimer <= 0) {
      this.spawnItemPattern();
      this.itemSpawnTimer = 0.7 + Math.random() * 0.6;
    }

    // Spawning Obstacles (unless boss climax)
    if (!this.bossChaseTriggered) {
      this.obstacleSpawnTimer -= dt;
      if (this.obstacleSpawnTimer <= 0) {
        this.spawnObstaclePattern();
        this.obstacleSpawnTimer = 2.0 + Math.random() * 1.4;
      }
    }

    // Update active items
    this.items.forEach(item => {
      item.update(scrollSpeed, dt, player);
      if (item.checkCollision(player)) {
        if (item.config.power) {
          player.applyPowerup(item.config.power, item.config.duration);
        }
        this.scoreManager.addFood(item.config.score, item.config.feverInc);
      }
    });

    // Update active obstacles
    this.obstacles.forEach(obs => {
      obs.update(scrollSpeed, dt);
      const res = obs.checkCollision(player);
      if (res === 'DAMAGE') {
        player.takeDamage();
        this.scoreManager.breakCombo();
      } else if (res === 'FEVER_POPCORN') {
        this.scoreManager.addFood(50, 0); // Popcorn bonus
      } else if (res === 'SMASHED') {
        this.scoreManager.addFood(30, 0);
      }
    });
  }

  spawnItemPattern() {
    // Select available item from pool
    const lanePos = (Math.random() - 0.5) * 1.5;
    const isSpecial = Math.random() < 0.25;

    let available = this.items.filter(it => !it.active);
    if (isSpecial) {
      available = available.filter(it => it.config.power);
    }
    if (available.length > 0) {
      const item = available[Math.floor(Math.random() * available.length)];
      item.spawn(lanePos);
    }
  }

  spawnObstaclePattern() {
    const available = this.obstacles.filter(ob => !ob.active);
    if (available.length === 0) return;

    // Filter to stage specific obstacles
    const validObs = available.filter(ob => this.stageConfig.obstacles.includes(ob.typeKey));
    const targetObs = validObs.length > 0 ? validObs : available;
    const obs = targetObs[Math.floor(Math.random() * targetObs.length)];

    const lanePos = (Math.random() - 0.5) * 1.4;

    // If rushing enemy, trigger warning banner!
    if (obs.isRushing && this.onWarning) {
      this.onWarning(obs.def.name + ' 돌진 경고!');
    }

    obs.spawn(lanePos);
  }
}
