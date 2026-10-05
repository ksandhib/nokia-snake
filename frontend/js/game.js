// Pure game engine + canvas renderer. UI/state handling lives in app.js.
const CELL = 16;                                  // internal pixels per grid cell
const GRIDS = { small: 15, medium: 20, large: 25 };
const DIRS = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
const APPLE = ["00001100","00010000","01111110","11111111","11111111","11111111","01111110","00100100"];
const LCD = "#a3b88c", INK = "#1c2616";
const APPLES_PER_LEVEL = 5;

export class Game {
  constructor(canvas, cb) {
    this.canvas = canvas; this.ctx = canvas.getContext("2d"); this.cb = cb;
    this.running = false; this.raf = 0;
  }

  start({ grid = "medium", speed = "normal" } = {}) {
    this.stop();
    this.n = GRIDS[grid] || 20;
    this.base = speed === "fast" ? 110 : 160;     // ms per step at level 1
    this.canvas.width = this.canvas.height = this.n * CELL;
    const m = Math.floor(this.n / 2);
    this.snake = [{ x: m, y: m }, { x: m - 1, y: m }, { x: m - 2, y: m }];
    this.dir = DIRS.right; this.queue = [];
    this.score = 0; this.apples = 0; this.level = 1;
    this.spawnFood();
    this.cb.onScore(this.score, this.level);
    this.draw();
    this.resume();
  }

  get interval() { return Math.max(55, this.base - (this.level - 1) * 10); }

  resume() {
    if (this.running) return;
    this.running = true; this.last = null; this.acc = 0;
    this.raf = requestAnimationFrame(this.frame);
  }
  pause() { this.running = false; cancelAnimationFrame(this.raf); }
  stop() { this.pause(); }

  frame = (t) => {
    if (!this.running) return;
    if (this.last == null) this.last = t;
    this.acc = Math.min(this.acc + (t - this.last), 300); // clamp after tab switches
    this.last = t;
    while (this.acc >= this.interval && this.running) { this.acc -= this.interval; this.step(); }
    this.draw();
    if (this.running) this.raf = requestAnimationFrame(this.frame);
  };

  // Queue up to 2 turns so quick key combos register; reject reversals vs. last queued dir.
  turn(name) {
    const next = DIRS[name]; if (!next) return;
    const ref = this.queue.length ? this.queue[this.queue.length - 1] : this.dir;
    if (next.x === -ref.x && next.y === -ref.y) return;
    if (next === ref || this.queue.length >= 2) return;
    this.queue.push(next);
  }

  step() {
    if (this.queue.length) this.dir = this.queue.shift();
    const h = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };
    if (h.x < 0 || h.x >= this.n || h.y < 0 || h.y >= this.n) return this.over();
    const eating = h.x === this.food.x && h.y === this.food.y;
    // The tail cell is vacated this move, so it is not a collision unless we are growing.
    const body = eating ? this.snake : this.snake.slice(0, -1);
    if (body.some((s) => s.x === h.x && s.y === h.y)) return this.over();
    this.snake.unshift(h);
    if (!eating) { this.snake.pop(); return; }
    this.score += 10; this.apples++;
    this.level = 1 + Math.floor(this.apples / APPLES_PER_LEVEL);
    this.cb.onScore(this.score, this.level); this.cb.onEat();
    if (!this.spawnFood()) this.over();           // board full = perfect game
  }

  spawnFood() {
    const taken = new Set(this.snake.map((s) => s.y * this.n + s.x));
    const free = [];
    for (let i = 0; i < this.n * this.n; i++) if (!taken.has(i)) free.push(i);
    if (!free.length) return false;
    const i = free[Math.floor(Math.random() * free.length)];
    this.food = { x: i % this.n, y: Math.floor(i / this.n) };
    return true;
  }

  over() { this.stop(); this.draw(); this.cb.onOver(this.score); }

  draw() {
    const c = this.ctx;
    c.fillStyle = LCD; c.fillRect(0, 0, this.canvas.width, this.canvas.height);
    c.fillStyle = INK;
    this.snake.forEach((s, i) => {
      c.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
      if (i === 0) { c.fillStyle = LCD; c.fillRect(s.x * CELL + 6, s.y * CELL + 6, 4, 4); c.fillStyle = INK; }
    });
    const px = CELL / 8, fx = this.food.x * CELL, fy = this.food.y * CELL;
    APPLE.forEach((row, y) => [...row].forEach((v, x) => {
      if (v === "1") c.fillRect(fx + x * px, fy + y * px, px, px);
    }));
  }
}
