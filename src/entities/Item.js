export class Item {
  constructor(renderer, itemConfig) {
    this.renderer = renderer;
    this.config = itemConfig;

    this.s = 0;
    this.lane = 0;
    this.active = false;
    this.animTime = Math.random() * 10;

    const height = itemConfig.power ? 0.85 : (itemConfig.id === 'rice' ? 0.42 : 0.6);
    this.sprite = renderer.createBillboard(itemConfig.image, height, 0xffffff);
  }

  spawn(s, lane) {
    this.s = s;
    this.lane = Math.max(-0.85, Math.min(0.85, lane));
    this.active = true;
    this.sprite.visible = true;
    this.place();
  }

  deactivate() {
    this.active = false;
    this.sprite.visible = false;
  }

  place() {
    const bob = 0.35 + Math.sin(this.animTime * 5.0) * 0.12;
    this.renderer.path.point(this.s, this.lane, bob, this.sprite.position);
  }

  update(dt, anchorS, player) {
    if (!this.active) return;
    this.animTime += dt;

    if (player && (player.hasMagnet || player.isFever)) {
      const halfW = this.renderer.path.halfWidth;
      const ds = player.s - this.s;
      const dx = (player.lane - this.lane) * halfW;
      const dist = Math.sqrt(ds * ds + dx * dx);
      if (dist < player.magnetRadius && dist > 0.01) {
        const pull = 14 * dt;
        this.s += (ds / dist) * Math.min(pull, dist);
        this.lane += ((dx / dist) * Math.min(pull, dist)) / halfW;
      }
    }

    this.sprite.material.rotation = Math.sin(this.animTime * 3.0) * 0.15;
    this.place();

    if (this.s < anchorS - 6) {
      this.deactivate();
    }
  }

  checkCollision(player) {
    if (!this.active) return false;
    const ds = Math.abs(this.s - player.s);
    const dx = Math.abs(this.lane - player.lane) * this.renderer.path.halfWidth;
    if (ds < 0.75 && dx < 0.8 && player.y < 2.2) {
      this.renderer.emitFeathers(this.sprite.position, 6, this.config.color);
      this.deactivate();
      return true;
    }
    return false;
  }
}
