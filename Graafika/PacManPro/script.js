const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const livesEl = document.getElementById('lives');
const messageEl = document.getElementById('message');

const TILE_SIZE = 20;
const COLS = 28;
const ROWS = 31;
canvas.width = COLS * TILE_SIZE;
canvas.height = ROWS * TILE_SIZE;

const DIRECTION = {
    UP: { x: 0, y: -1, angle: -Math.PI / 2, opposite: 'DOWN' },
    DOWN: { x: 0, y: 1, angle: Math.PI / 2, opposite: 'UP' },
    LEFT: { x: -1, y: 0, angle: Math.PI, opposite: 'RIGHT' },
    RIGHT: { x: 1, y: 0, angle: 0, opposite: 'LEFT' }
};

const MODE = { SCATTER: 'SCATTER', CHASE: 'CHASE', FRIGHTENED: 'FRIGHTENED', EATEN: 'EATEN' };

const MAP = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
    [1,2,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,2,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
    [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,0,1,1,1,1,1,3,1,1,3,1,1,1,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,1,1,1,3,1,1,3,1,1,1,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,3,3,3,3,3,3,3,3,3,3,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,3,1,1,1,4,4,1,1,1,3,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,3,1,5,5,5,5,5,5,1,3,1,1,0,1,1,1,1,1,1],
    [6,3,3,3,3,3,0,3,3,3,1,5,5,5,5,5,5,1,3,3,3,0,3,3,3,3,3,6],
    [1,1,1,1,1,1,0,1,1,3,1,5,5,5,5,5,5,1,3,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,3,1,1,1,1,1,1,1,1,3,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,3,3,3,3,3,3,3,3,3,3,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,3,1,1,1,1,1,1,1,1,3,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,3,1,1,1,1,1,1,1,1,3,1,1,0,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
    [1,2,0,0,1,1,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,1,1,0,0,2,1],
    [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
    [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
    [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    beep(freq, duration, type = 'sine', volume = 0.1) {
        if (this.ctx.state === 'suspended') return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }
    waka() { this.beep(440, 0.1, 'triangle', 0.05); }
    powerPellet() { this.beep(220, 0.3, 'sawtooth', 0.05); }
    eatGhost() { this.beep(880, 0.5, 'square', 0.1); }
    death() { 
        for(let i=0; i<10; i++) {
            setTimeout(() => this.beep(800 - i*70, 0.15, 'sawtooth', 0.1), i * 100);
        }
    }
}

const sounds = new SoundManager();

const assets = {
    pacman: new Image(),
    ghostCyan: new Image(),
    ghostGreen: new Image(),
    ghostPink: new Image(),
    ghostPurple: new Image(),
    ghostScared: new Image(),
    strawberry: new Image(),
};
assets.pacman.src = 'assets/pacman.svg';
assets.ghostCyan.src = 'assets/ghost-cyan.svg';
assets.ghostPink.src = 'assets/ghost-pink.svg';
assets.ghostGreen.src = 'assets/ghost-green.svg';
assets.ghostPurple.src = 'assets/ghost-purple.svg';
assets.ghostScared.src = 'assets/ghost-scared.svg';
assets.strawberry.src = 'assets/strawberry.svg';

class Entity {
    constructor(x, y, speed) {
        this.x = x * TILE_SIZE;
        this.y = y * TILE_SIZE;
        this.speed = speed;
        this.dir = DIRECTION.LEFT;
        this.nextDir = null;
    }
    getTile() {
        return { 
            x: Math.floor((this.x + TILE_SIZE / 2) / TILE_SIZE), 
            y: Math.floor((this.y + TILE_SIZE / 2) / TILE_SIZE) 
        };
    }
    isCentered() {
        const centerX = Math.round(this.x / TILE_SIZE) * TILE_SIZE;
        const centerY = Math.round(this.y / TILE_SIZE) * TILE_SIZE;
        return Math.abs(this.x - centerX) < this.speed && Math.abs(this.y - centerY) < this.speed;
    }
    canMove(dir) {
        if (!dir) return false;
        const tile = this.getTile();
        const nx = (tile.x + dir.x + COLS) % COLS;
        const ny = tile.y + dir.y;
        if (ny < 0 || ny >= ROWS) return false;
        const val = MAP[ny][nx];
        if (val === 1) return false;
        if (val === 4 && !(this instanceof Ghost)) return false; 
        return true;
    }
    move() {
        // Immediate reverse support
        if (this.nextDir && this.dir && this.nextDir.x === -this.dir.x && this.nextDir.y === -this.dir.y) {
            this.dir = this.nextDir;
            this.nextDir = null;
        }

        if (this.isCentered()) {
            this.x = Math.round(this.x / TILE_SIZE) * TILE_SIZE;
            this.y = Math.round(this.y / TILE_SIZE) * TILE_SIZE;
            
            if (this.nextDir && this.canMove(this.nextDir)) {
                this.dir = this.nextDir;
                this.nextDir = null;
            }
            
            if (!this.canMove(this.dir)) {
                if (this instanceof Ghost) {
                    this.chooseDirection();
                } else {
                    return false;
                }
            } else if (this instanceof Ghost) {
                this.chooseDirection();
            }
        }
        this.x += this.dir.x * this.speed;
        this.y += this.dir.y * this.speed;
        
        if (this.x < -TILE_SIZE/2) this.x = (COLS - 0.5) * TILE_SIZE;
        if (this.x > (COLS - 0.5) * TILE_SIZE) this.x = -TILE_SIZE/2;
        return true;
    }
}

class Pacman extends Entity {
    constructor() {
        super(13, 23, 2.5);
        this.mouth = 0;
        this.mouthSpeed = 0.2;
    }
    update() {
        const tile = this.getTile();
        this.speed = (MAP[tile.y] && MAP[tile.y][tile.x] === 6) ? 1.5 : 2.5;
        if (this.move()) {
            this.mouth += this.mouthSpeed;
            if (this.mouth > 0.2 || this.mouth < 0) this.mouthSpeed *= -1;
            this.checkCollisions();
        }
    }
    checkCollisions() {
        const tile = this.getTile();
        if (!game.currentMap[tile.y]) return;
        const val = game.currentMap[tile.y][tile.x];
        if (val === 0) {
            game.currentMap[tile.y][tile.x] = 3;
            game.score += 10;
            game.dots--;
            sounds.waka();
        } else if (val === 2) {
            game.currentMap[tile.y][tile.x] = 3;
            game.score += 50;
            game.dots--;
            game.frightenGhosts();
            sounds.powerPellet();
        }
        if (game.dots === 0) game.nextLevel();
    }
    draw() {
        ctx.save();
        ctx.translate(this.x + TILE_SIZE/2, this.y + TILE_SIZE/2);
        ctx.rotate(this.dir.angle);
        if (assets.pacman.complete && assets.pacman.naturalWidth !== 0) {
            ctx.drawImage(assets.pacman, -TILE_SIZE/2, -TILE_SIZE/2, TILE_SIZE, TILE_SIZE);
        } else {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            const open = this.mouth * Math.PI;
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, TILE_SIZE/2 - 1, open, 2*Math.PI - open);
            ctx.fill();
        }
        ctx.restore();
    }
}

class Ghost extends Entity {
    constructor(x, y, color, scatterTarget, img) {
        super(x, y, 2);
        this.color = color;
        this.scatterTarget = scatterTarget;
        this.img = img;
        this.mode = MODE.SCATTER;
        this.timer = 0;
    }
    update() {
        const tile = this.getTile();
        const inTunnel = MAP[tile.y] && MAP[tile.y][tile.x] === 6;
        if (this.mode === MODE.FRIGHTENED) {
            this.speed = inTunnel ? 0.8 : 1.2;
            this.timer--;
            if (this.timer <= 0) this.mode = game.globalMode;
        } else if (this.mode === MODE.EATEN) {
            this.speed = 5;
            if (tile.x === 13 && (tile.y === 14 || tile.y === 13)) {
                this.mode = game.globalMode;
                this.speed = 2;
            }
        } else {
            this.speed = inTunnel ? 1 : 2;
            this.mode = game.globalMode;
        }
        
        this.move();
        
        const pTile = game.pacman.getTile();
        const gTile = this.getTile();
        if (pTile.x === gTile.x && pTile.y === gTile.y) {
            if (this.mode === MODE.FRIGHTENED) {
                this.mode = MODE.EATEN;
                game.score += 200 * Math.pow(2, game.ghostsEaten);
                game.ghostsEaten++;
                sounds.eatGhost();
            } else if (this.mode !== MODE.EATEN) game.die();
        }
    }
    chooseDirection() {
        let target = this.scatterTarget;
        if (this.mode === MODE.CHASE) target = this.getChaseTarget();
        if (this.mode === MODE.FRIGHTENED) target = { x: Math.random() * COLS, y: Math.random() * ROWS };
        if (this.mode === MODE.EATEN) target = { x: 13, y: 14 };
        const possible = [];
        for (const [key, d] of Object.entries(DIRECTION)) {
            if (key === this.dir.opposite) continue;
            if (this.canMove(d)) {
                const nt = { x: this.getTile().x + d.x, y: this.getTile().y + d.y };
                const dist = Math.hypot(nt.x - target.x, nt.y - target.y);
                possible.push({ dir: d, dist });
            }
        }
        if (possible.length > 0) {
            possible.sort((a, b) => a.dist - b.dist);
            this.dir = possible[0].dir;
        } else {
            this.dir = DIRECTION[this.dir.opposite];
        }
    }
    getChaseTarget() { return { x: 13, y: 14 }; }
    draw() {
        let currentImg = (this.mode === MODE.FRIGHTENED) ? assets.ghostScared : (this.mode === MODE.EATEN ? null : this.img);
        if (currentImg && currentImg.complete && currentImg.naturalWidth !== 0) {
            if (this.mode === MODE.FRIGHTENED && this.timer < 100 && Math.floor(this.timer/10)%2) {
                 ctx.fillStyle = 'white'; this.drawBody();
            } else ctx.drawImage(currentImg, this.x, this.y, TILE_SIZE, TILE_SIZE);
        } else {
            ctx.fillStyle = this.mode === MODE.FRIGHTENED ? (this.timer < 100 && Math.floor(this.timer/10)%2 ? 'white' : 'blue') : (this.mode === MODE.EATEN ? 'transparent' : this.color);
            this.drawBody();
        }
    }
    drawBody() {
        if (this.mode === MODE.EATEN) {
            ctx.strokeStyle = '#fff'; ctx.strokeRect(this.x + 4, this.y + 4, 12, 12);
        } else {
            ctx.beginPath(); ctx.arc(this.x + TILE_SIZE/2, this.y + TILE_SIZE/2, TILE_SIZE/2 - 1, Math.PI, 0);
            ctx.lineTo(this.x + TILE_SIZE - 1, this.y + TILE_SIZE - 1); ctx.lineTo(this.x + 1, this.y + TILE_SIZE - 1); ctx.fill();
        }
    }
}

class Blinky extends Ghost { constructor() { super(13, 11, '#ff00ff', { x: 25, y: -2 }, assets.ghostPurple); } getChaseTarget() { return game.pacman.getTile(); } }
class Pinky extends Ghost { constructor() { super(13, 14, '#ff69b4', { x: 2, y: -2 }, assets.ghostPink); } getChaseTarget() { const pt = game.pacman.getTile(); return { x: pt.x + game.pacman.dir.x * 4, y: pt.y + game.pacman.dir.y * 4 }; } }
class Inky extends Ghost { constructor() { super(11, 14, '#bc13fe', { x: 27, y: 31 }, assets.ghostCyan); } getChaseTarget() { const pt = game.pacman.getTile(); const blinky = game.ghosts[0]; const tx = pt.x + game.pacman.dir.x * 2; const ty = pt.y + game.pacman.dir.y * 2; return { x: tx + (tx - blinky.getTile().x), y: ty + (ty - blinky.getTile().y) }; } }
class Clyde extends Ghost { constructor() { super(15, 14, '#ff1493', { x: 0, y: 31 }, assets.ghostGreen); } getChaseTarget() { const pt = game.pacman.getTile(); const gt = this.getTile(); return Math.hypot(pt.x - gt.x, pt.y - gt.y) > 8 ? pt : this.scatterTarget; } }

const game = {
    score: 0, highScore: localStorage.getItem('pacman_pro_highscore') || 0,
    lives: 3, dots: 0, globalMode: MODE.SCATTER, modeTimer: 0, modeIndex: 0, ghostsEaten: 0, isGameOver: false, isPaused: true,
    init() {
        this.dots = 0; this.currentMap = JSON.parse(JSON.stringify(MAP));
        for(let r=0; r<ROWS; r++) for(let c=0; c<COLS; c++) if (this.currentMap[r][c] === 0 || this.currentMap[r][c] === 2) this.dots++;
        this.pacman = new Pacman(); this.ghosts = [new Blinky(), new Pinky(), new Inky(), new Clyde()];
        this.modeTimer = 420; this.updateUI();
    },
    update() {
        if (this.isPaused || this.isGameOver) return;
        if (--this.modeTimer <= 0) {
            this.modeIndex++; const cycles = [420, 1200, 420, 1200, 300, 1200, 300, Infinity];
            this.globalMode = this.modeIndex % 2 === 0 ? MODE.SCATTER : MODE.CHASE;
            this.modeTimer = cycles[Math.min(this.modeIndex, cycles.length-1)];
        }
        this.pacman.update(); this.ghosts.forEach(g => g.update()); this.updateUI();
    },
    frightenGhosts() {
        this.ghostsEaten = 0;
        this.ghosts.forEach(g => { if (g.mode !== MODE.EATEN) { g.mode = MODE.FRIGHTENED; g.timer = 600; g.dir = DIRECTION[g.dir.opposite]; } });
    },
    die() {
        if (--this.lives <= 0) {
            this.isGameOver = true; 
            messageEl.innerHTML = 'GAME OVER<br><span class="restart-hint">Press R to Restart</span>'; 
            messageEl.classList.add('visible', 'game-over');
            if (this.score > this.highScore) localStorage.setItem('pacman_pro_highscore', (this.highScore = this.score));
        } else { sounds.death(); this.resetPositions(); }
    },
    resetPositions() {
        this.isPaused = true; messageEl.innerHTML = 'READY!'; messageEl.classList.add('visible');
        setTimeout(() => { 
            this.pacman = new Pacman(); this.ghosts = [new Blinky(), new Pinky(), new Inky(), new Clyde()];
            messageEl.classList.remove('visible'); this.isPaused = false; 
        }, 2000);
    },
    nextLevel() { this.init(); this.resetPositions(); },
    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); this.drawMap();
        this.pacman.draw(); this.ghosts.forEach(g => g.draw());
    },
    drawMap() {
        for(let r=0; r<ROWS; r++) {
            for(let c=0; c<COLS; c++) {
                const val = this.currentMap[r][c]; const x = c * TILE_SIZE, y = r * TILE_SIZE;
                if (val === 1) { ctx.strokeStyle = '#bc13fe'; ctx.lineWidth = 3; ctx.strokeRect(x+3, y+3, TILE_SIZE-6, TILE_SIZE-6); }
                else if (val === 0) { ctx.fillStyle = '#fff'; ctx.fillRect(x + TILE_SIZE/2 - 1, y + TILE_SIZE/2 - 1, 3, 3); }
                else if (val === 2) {
                    if (Math.floor(Date.now() / 200) % 2 === 0) {
                        if (assets.strawberry.complete && assets.strawberry.naturalWidth !== 0) {
                            ctx.drawImage(assets.strawberry, x, y, TILE_SIZE, TILE_SIZE);
                        } else {
                            ctx.fillStyle = '#ff00ff'; ctx.beginPath(); ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, 6, 0, Math.PI * 2); ctx.fill();
                        }
                    }
                }
                else if (val === 4) { ctx.fillStyle = '#fff'; ctx.fillRect(x, y + TILE_SIZE/2 - 2, TILE_SIZE, 4); }
            }
        }
    },
    updateUI() {
        scoreEl.innerText = this.score.toString().padStart(2, '0');
        highScoreEl.innerText = this.highScore.toString().padStart(2, '0');
        livesEl.innerHTML = '';
        for(let i=0; i<this.lives-1; i++) {
            const icon = document.createElement('div'); icon.className = 'life-icon';
            icon.style.backgroundColor = '#fff'; icon.style.borderRadius = '50%'; livesEl.appendChild(icon);
        }
    }
};

window.addEventListener('keydown', e => {
    if (sounds.ctx.state === 'suspended') sounds.ctx.resume();
    if (game.isPaused && !game.isGameOver && document.getElementById('start-screen').classList.contains('hidden')) { 
        game.isPaused = false; messageEl.classList.remove('visible'); 
    }
    
    let key = e.key.toUpperCase();
    if (key === 'W' || key === 'ARROWUP') game.pacman.nextDir = DIRECTION.UP;
    if (key === 'S' || key === 'ARROWDOWN') game.pacman.nextDir = DIRECTION.DOWN;
    if (key === 'A' || key === 'ARROWLEFT') game.pacman.nextDir = DIRECTION.LEFT;
    if (key === 'D' || key === 'ARROWRIGHT') game.pacman.nextDir = DIRECTION.RIGHT;
    
    if (game.isGameOver && key === 'R') location.reload();
});

document.getElementById('start-button').addEventListener('click', () => {
    if (sounds.ctx.state === 'suspended') sounds.ctx.resume();
    document.getElementById('start-screen').classList.add('hidden');
    game.isPaused = false;
    messageEl.classList.remove('visible');
});

game.init();
(function loop() { game.update(); game.draw(); requestAnimationFrame(loop); })();