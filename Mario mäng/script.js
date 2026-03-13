const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const coinsEl = document.getElementById("coins");
const timeEl = document.getElementById("time");
const livesEl = document.getElementById("lives");
const formEl = document.getElementById("form");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");

const W = canvas.width;
const H = canvas.height;
const TILE = 32;
const GRAVITY = 0.62;
const MAX_FALL = 13;

const keys = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowDown: false,
  ArrowUp: false,
  Space: false,
  KeyX: false,
  KeyZ: false,
  Enter: false
};

const justPressed = {};

const DIFFICULTIES = [
  { name: "EASY", lives: 5, timer: 520, enemyMode: "light", enemySpeed: 0.85, helperLedges: 2 },
  { name: "NORMAL", lives: 3, timer: 430, enemyMode: "medium", enemySpeed: 1.0, helperLedges: 1 },
  { name: "HARD", lives: 2, timer: 360, enemyMode: "full", enemySpeed: 1.15, helperLedges: 0 }
];

const game = {
  started: false,
  gameOver: false,
  won: false,
  zone: "overworld",
  difficultyIndex: 0,
  score: 0,
  coins: 0,
  lives: 3,
  timer: 400,
  clockTick: 0,
  cameraX: 0,
  mapCycle: -1,
  warpCooldown: 0,
  overworldSnapshot: null,
  returnX: 0
};

const world = {
  width: 194 * TILE,
  floorY: H - 78,
  platforms: [],
  blocks: [],
  coins: [],
  enemies: [],
  pipes: [],
  powerUps: [],
  fireballs: [],
  flag: { x: 185 * TILE, y: H - 266, width: 20, height: 190 }
};

const player = {
  x: 4 * TILE,
  y: 0,
  w: 28,
  h: 30,
  vx: 0,
  vy: 0,
  speed: 2.4,
  runBoost: 1.55,
  facing: 1,
  onGround: false,
  invuln: 0,
  animPhase: 0,
  fireCooldown: 0,
  form: "small",
  spawnX: 4 * TILE,
  spawnY: 0
};

const marioSmallFrames = [
  [
    "................",
    ".....RRRRRR.....",
    "....RRRRRRRR....",
    "....HHSSSS......",
    "...HSSSHSSS.....",
    "...HSSSSHHH.....",
    "...HHSSSSSS.....",
    "....RRBBBB......",
    "...RBBBBBBR.....",
    "...BBBBBBBB.....",
    "...BBYBBYBB.....",
    "...BBBBBBBB.....",
    "....BB....BB....",
    "...BBB....BBB...",
    "..KKK......KKK..",
    "................"
  ],
  [
    "................",
    ".....RRRRRR.....",
    "....RRRRRRRR....",
    "....HHSSSS......",
    "...HSSSHSSS.....",
    "...HSSSSHHH.....",
    "...HHSSSSSS.....",
    "....RRBBBB......",
    "...RBBBBBBR.....",
    "...BBBBBBBB.....",
    "...BBYBBYBB.....",
    "...BBBBBBBB.....",
    "....BBB...BB....",
    "...BB..B..BBB...",
    "..KK...K....KK..",
    "................"
  ]
];

const marioBigFrames = [
  [
    "................",
    ".....RRRRRR.....",
    "....RRRRRRRR....",
    "....HHSSSS......",
    "...HSSSHSSS.....",
    "...HSSSSHHH.....",
    "...HHSSSSSS.....",
    "....RRBBBB......",
    "...RBBBBBBR.....",
    "...BBBBBBBB.....",
    "..BBBBBBBBBB....",
    "..BBBYYBBBBB....",
    "..BBBBBBBBBBBB..",
    "..BBBBBBBBBB....",
    "...BBB..BBB.....",
    "...BBB..BBB.....",
    "...BBB..BBB.....",
    "...BBB..BBB.....",
    "...BBB..BBB.....",
    "..BBBB..BBBB....",
    "..KKK....KKK....",
    "..KKK....KKK....",
    "................",
    "................"
  ],
  [
    "................",
    ".....RRRRRR.....",
    "....RRRRRRRR....",
    "....HHSSSS......",
    "...HSSSHSSS.....",
    "...HSSSSHHH.....",
    "...HHSSSSSS.....",
    "....RRBBBB......",
    "...RBBBBBBR.....",
    "...BBBBBBBB.....",
    "..BBBBBBBBBB....",
    "..BBBYYBBBBB....",
    "..BBBBBBBBBBBB..",
    "..BBBBBBBBBB....",
    "...BBB..BBB.....",
    "...BBB..BBB.....",
    "....BB..BBBB....",
    "....BB...BBB....",
    "....BB....BB....",
    "..BBBB...BBBB...",
    "..KKK.....KKK...",
    "..KK.......KK...",
    "................",
    "................"
  ]
];

const goombaSprite = [
  "................",
  "................",
  "....MMMMMMMM....",
  "...MMMMMMMMMM...",
  "..MMMMMMMMMMMM..",
  "..MMEEMMMMEEMM..",
  "..MMMMMMMMMMMM..",
  "..MMBBBBBBBBMM..",
  "...BBBBBBBBBB...",
  "...BBBBBBBBBB...",
  "....BBBBBBBB....",
  "...DD......DD...",
  "..DDD......DDD..",
  "................",
  "................"
];

const mushroomSprite = [
  "................",
  "......RRRR......",
  "....RRRRRRRR....",
  "...RRWWRRWWRR...",
  "..RRRRRRRRRRRR..",
  "..RRRRRRRRRRRR..",
  "...SSSSSSSSSS...",
  "...SSBBSSBBSS...",
  "...SSSSSSSSSS...",
  "....SSSSSSSS....",
  ".....SSSSSS.....",
  "................",
  "................",
  "................",
  "................"
];

const flowerSprite = [
  "................",
  "......WWWW......",
  "....WWRRRRWW....",
  "...WWRRYYRRWW...",
  "...WWRRYYRRWW...",
  "....WWRRRRWW....",
  "......WWWW......",
  "......GGGG......",
  "......GGGG......",
  "......GGGG......",
  "......GGGG......",
  "................",
  "................",
  "................",
  "................",
  "................"
];

const palettes = {
  marioSmall: { R: "#d92525", H: "#5c2f0a", S: "#f2c7a3", B: "#1f4ecf", Y: "#f4d34c", K: "#3a1d04", ".": null },
  marioBig: { R: "#d92525", H: "#5c2f0a", S: "#f2c7a3", B: "#1f4ecf", Y: "#f4d34c", K: "#3a1d04", ".": null },
  marioFire: { R: "#f8f8f8", H: "#5c2f0a", S: "#f2c7a3", B: "#de3a2c", Y: "#f4d34c", K: "#3a1d04", ".": null },
  goomba: { M: "#8a4a1f", E: "#101010", B: "#d9c2a3", D: "#5d3114", ".": null },
  mushroom: { R: "#d92525", W: "#f5efe3", S: "#ead1b7", B: "#6b3f18", ".": null },
  flower: { W: "#f5efe3", R: "#d92525", Y: "#f2c230", G: "#29a74a", ".": null }
};

const spriteImages = {
  mario: new Image(),
  goomba: new Image(),
  mushroom: new Image(),
  luckyBlock: new Image()
};

spriteImages.mario.src = "Mario.svg";
spriteImages.goomba.src = "Goomba.svg";
spriteImages.mushroom.src = "Mushroom.svg";
spriteImages.luckyBlock.src = "luckyblock.svg";

function drawImageSprite(img, x, y, w, h, flip = false) {
  if (!img || !img.complete || img.naturalWidth === 0) return false;

  if (flip) {
    ctx.save();
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0, w, h);
    ctx.restore();
    return true;
  }

  ctx.drawImage(img, x, y, w, h);
  return true;
}

function drawSprite(pattern, palette, x, y, pixelSize, flip = false) {
  for (let row = 0; row < pattern.length; row++) {
    const line = pattern[row];
    for (let col = 0; col < line.length; col++) {
      const char = line[col];
      const color = palette[char];
      if (!color) continue;
      const drawX = flip ? x + (line.length - 1 - col) * pixelSize : x + col * pixelSize;
      ctx.fillStyle = color;
      ctx.fillRect(drawX, y + row * pixelSize, pixelSize, pixelSize);
    }
  }
}

function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}

function getDifficulty() {
  return DIFFICULTIES[game.difficultyIndex] || DIFFICULTIES[0];
}

function createUndergroundLayout() {
  const width = 74 * TILE;
  const floorY = H - 78;
  const blocks = [];
  const coins = [];
  const platforms = [];
  const pipes = [
    { x: 6 * TILE, y: H - 174, w: TILE * 1.8, h: 100, warpTo: "overworld" },
    { x: 62 * TILE, y: H - 206, w: TILE * 1.8, h: 132 }
  ];

  for (let i = 0; i < 16; i++) {
    blocks.push({
      x: (18 + i) * TILE,
      y: H - 242,
      type: "brick",
      used: false,
      broken: false,
      content: null
    });
  }

  for (let i = 0; i < 7; i++) {
    platforms.push({ x: (31 + i) * TILE, y: H - 306, w: TILE, h: TILE });
  }

  for (let i = 0; i < 40; i++) {
    coins.push({
      x: (10 + i * 1.4) * TILE,
      y: H - 275 - (i % 3) * 20,
      r: 9,
      taken: false,
      phase: i * 0.29
    });
  }

  return {
    width,
    floorY,
    platforms,
    blocks,
    coins,
    enemies: [],
    pipes,
    powerUps: [],
    fireballs: [],
    flag: { x: width + TILE * 10, y: H - 260, width: 20, height: 180 }
  };
}

function enterUnderground(pipe) {
  if (game.zone !== "overworld") return;

  game.overworldSnapshot = {
    width: world.width,
    floorY: world.floorY,
    platforms: cloneData(world.platforms),
    blocks: cloneData(world.blocks),
    coins: cloneData(world.coins),
    enemies: cloneData(world.enemies),
    pipes: cloneData(world.pipes),
    powerUps: cloneData(world.powerUps),
    fireballs: [],
    flag: cloneData(world.flag)
  };

  const underground = createUndergroundLayout();
  world.width = underground.width;
  world.floorY = underground.floorY;
  world.platforms = underground.platforms;
  world.blocks = underground.blocks;
  world.coins = underground.coins;
  world.enemies = underground.enemies;
  world.pipes = underground.pipes;
  world.powerUps = underground.powerUps;
  world.fireballs = underground.fireballs;
  world.flag = underground.flag;

  game.returnX = pipe.x + pipe.w + 12;
  game.zone = "underground";
  game.warpCooldown = 45;
  game.cameraX = 0;

  player.x = 9 * TILE;
  player.y = world.floorY - player.h;
  player.vx = 0;
  player.vy = 0;
}

function exitUnderground() {
  if (game.zone !== "underground" || !game.overworldSnapshot) return;

  world.width = game.overworldSnapshot.width;
  world.floorY = game.overworldSnapshot.floorY;
  world.platforms = game.overworldSnapshot.platforms;
  world.blocks = game.overworldSnapshot.blocks;
  world.coins = game.overworldSnapshot.coins;
  world.enemies = game.overworldSnapshot.enemies;
  world.pipes = game.overworldSnapshot.pipes;
  world.powerUps = game.overworldSnapshot.powerUps;
  world.fireballs = [];
  world.flag = game.overworldSnapshot.flag;

  game.overworldSnapshot = null;
  game.zone = "overworld";
  game.warpCooldown = 45;
  player.x = game.returnX;
  player.y = world.floorY - player.h;
  player.vx = 0;
  player.vy = 0;
}

function resetLevel(mapId = 0) {
  const difficulty = getDifficulty();
  const variant = ((mapId % 3) + 3) % 3;

  world.width = 194 * TILE;
  world.flag = { x: 185 * TILE, y: H - 266, width: 20, height: 190 };

  world.platforms = [
    { x: 14 * TILE, y: H - 214, w: 4 * TILE, h: 18 },
    { x: 24 * TILE, y: H - 182, w: 6 * TILE, h: 18 },
    { x: 37 * TILE, y: H - 246, w: 4 * TILE, h: 18 },
    { x: 50 * TILE, y: H - 214, w: 3 * TILE, h: 18 },
    { x: 59 * TILE, y: H - 278, w: 5 * TILE, h: 18 },
    { x: 74 * TILE, y: H - 214, w: 5 * TILE, h: 18 },
    { x: 88 * TILE, y: H - 182, w: 4 * TILE, h: 18 },
    { x: 100 * TILE, y: H - 246, w: 5 * TILE, h: 18 },
    { x: 116 * TILE, y: H - 214, w: 4 * TILE, h: 18 },
    { x: 128 * TILE, y: H - 278, w: 3 * TILE, h: 18 },
    { x: 138 * TILE, y: H - 214, w: 6 * TILE, h: 18 },
    { x: 154 * TILE, y: H - 246, w: 5 * TILE, h: 18 }
  ];

  // Triple-step finish pattern.
  for (let i = 0; i < 5; i++) {
    world.platforms.push({
      x: (171 + i) * TILE,
      y: world.floorY - (i + 1) * TILE,
      w: TILE,
      h: TILE
    });
  }
  for (let i = 0; i < 4; i++) {
    world.platforms.push({
      x: (177 + i) * TILE,
      y: world.floorY - (i + 1) * TILE,
      w: TILE,
      h: TILE
    });
  }
  for (let i = 0; i < 3; i++) {
    world.platforms.push({
      x: (182 + i) * TILE,
      y: world.floorY - (i + 1) * TILE,
      w: TILE,
      h: TILE
    });
  }

  world.blocks = [];
  const pushBlockRow = (startTile, y, layout) => {
    for (let i = 0; i < layout.length; i++) {
      const type = layout[i];
      if (!type) continue;
      world.blocks.push({
        x: (startTile + i) * TILE,
        y,
        type,
        used: false,
        broken: false,
        content: type === "question" ? "coin" : null
      });
    }
  };

  pushBlockRow(8, H - 210, ["question", "brick", "brick", "question", "brick"]);
  pushBlockRow(22, H - 242, ["brick", "question", "brick", "question", "brick", "brick"]);
  pushBlockRow(43, H - 210, ["question", "brick", "question", "brick"]);
  pushBlockRow(58, H - 274, ["brick", "brick", "question", "brick"]);
  pushBlockRow(80, H - 210, ["question", "brick", "brick", "question", "brick"]);
  pushBlockRow(101, H - 242, ["brick", "question", "brick", "brick", "question"]);
  pushBlockRow(125, H - 274, ["brick", "question", "brick"]);
  pushBlockRow(146, H - 210, ["question", "brick", "question", "brick", "brick"]);

  const mushroomBlock = world.blocks.find((b) => b.x === 8 * TILE && b.y === H - 210);
  const flowerBlock = world.blocks.find((b) => b.x === 23 * TILE && b.y === H - 242);
  if (mushroomBlock) mushroomBlock.content = "mushroom";
  if (flowerBlock) flowerBlock.content = "flower";

  world.coins = [];
  const addCoinArc = (startTile, count, yBase, lift = 0) => {
    for (let i = 0; i < count; i++) {
      world.coins.push({
        x: (startTile + i) * TILE + TILE * 0.5,
        y: yBase - Math.sin((i / (count - 1 || 1)) * Math.PI) * lift,
        r: 9,
        taken: false,
        phase: (startTile + i) * 0.37
      });
    }
  };
  addCoinArc(5, 9, H - 252, 44);
  addCoinArc(21, 10, H - 294, 54);
  addCoinArc(42, 8, H - 258, 40);
  addCoinArc(57, 9, H - 312, 48);
  addCoinArc(79, 10, H - 262, 46);
  addCoinArc(99, 9, H - 294, 40);
  addCoinArc(123, 8, H - 308, 34);
  addCoinArc(145, 10, H - 258, 50);
  addCoinArc(171, 8, H - 244, 28);

  world.enemies = [
    { x: 16 * TILE, y: world.floorY - 30, w: 30, h: 30, vx: -0.9, vy: 0, dead: false },
    { x: 29 * TILE, y: world.floorY - 30, w: 30, h: 30, vx: -1.0, vy: 0, dead: false },
    { x: 46 * TILE, y: world.floorY - 30, w: 30, h: 30, vx: -1.15, vy: 0, dead: false },
    { x: 61 * TILE, y: world.floorY - 30, w: 30, h: 30, vx: -1.1, vy: 0, dead: false },
    { x: 78 * TILE, y: world.floorY - 30, w: 30, h: 30, vx: -1.25, vy: 0, dead: false },
    { x: 95 * TILE, y: world.floorY - 30, w: 30, h: 30, vx: -1.05, vy: 0, dead: false },
    { x: 113 * TILE, y: world.floorY - 30, w: 30, h: 30, vx: -1.2, vy: 0, dead: false },
    { x: 132 * TILE, y: world.floorY - 30, w: 30, h: 30, vx: -1.3, vy: 0, dead: false },
    { x: 150 * TILE, y: world.floorY - 30, w: 30, h: 30, vx: -1.15, vy: 0, dead: false },
    { x: 169 * TILE, y: world.floorY - 30, w: 30, h: 30, vx: -1.2, vy: 0, dead: false }
  ];

  world.pipes = [
    { x: 19 * TILE, y: H - 142, w: TILE * 1.8, h: 68 },
    { x: 36 * TILE, y: H - 174, w: TILE * 1.8, h: 100 },
    { x: 54 * TILE, y: H - 206, w: TILE * 1.8, h: 132 },
    { x: 72 * TILE, y: H - 174, w: TILE * 1.8, h: 100, warpTo: "underground" },
    { x: 94 * TILE, y: H - 206, w: TILE * 1.8, h: 132 },
    { x: 118 * TILE, y: H - 174, w: TILE * 1.8, h: 100 },
    { x: 143 * TILE, y: H - 206, w: TILE * 1.8, h: 132 },
    { x: 166 * TILE, y: H - 174, w: TILE * 1.8, h: 100 }
  ];

  if (variant === 1) {
    world.width = 202 * TILE;
    world.flag = { x: 193 * TILE, y: H - 266, width: 20, height: 190 };

    world.platforms = [
      { x: 12 * TILE, y: H - 182, w: 5 * TILE, h: 18 },
      { x: 24 * TILE, y: H - 246, w: 4 * TILE, h: 18 },
      { x: 34 * TILE, y: H - 214, w: 6 * TILE, h: 18 },
      { x: 49 * TILE, y: H - 278, w: 4 * TILE, h: 18 },
      { x: 61 * TILE, y: H - 214, w: 4 * TILE, h: 18 },
      { x: 72 * TILE, y: H - 182, w: 5 * TILE, h: 18 },
      { x: 86 * TILE, y: H - 246, w: 5 * TILE, h: 18 },
      { x: 103 * TILE, y: H - 214, w: 4 * TILE, h: 18 },
      { x: 117 * TILE, y: H - 278, w: 4 * TILE, h: 18 },
      { x: 131 * TILE, y: H - 214, w: 5 * TILE, h: 18 },
      { x: 147 * TILE, y: H - 246, w: 4 * TILE, h: 18 },
      { x: 162 * TILE, y: H - 214, w: 5 * TILE, h: 18 }
    ];

    for (let i = 0; i < 6; i++) {
      world.platforms.push({ x: (176 + i) * TILE, y: world.floorY - (i + 1) * TILE, w: TILE, h: TILE });
    }
    for (let i = 0; i < 5; i++) {
      world.platforms.push({ x: (184 + i) * TILE, y: world.floorY - (i + 1) * TILE, w: TILE, h: TILE });
    }

    world.blocks = [];
    pushBlockRow(7, H - 210, ["question", "brick", "brick", "question", "brick", "question"]);
    pushBlockRow(21, H - 242, ["brick", "question", "brick", "brick", "question"]);
    pushBlockRow(44, H - 210, ["question", "brick", "question", "brick", "brick"]);
    pushBlockRow(66, H - 274, ["brick", "question", "brick", "question"]);
    pushBlockRow(91, H - 210, ["brick", "question", "brick", "question", "brick"]);
    pushBlockRow(114, H - 242, ["question", "brick", "brick", "question"]);
    pushBlockRow(140, H - 274, ["brick", "question", "brick"]);
    pushBlockRow(163, H - 210, ["question", "brick", "question", "brick"]);

    const m = world.blocks.find((b) => b.x === 7 * TILE && b.y === H - 210);
    const f = world.blocks.find((b) => b.x === 22 * TILE && b.y === H - 242);
    if (m) m.content = "mushroom";
    if (f) f.content = "flower";

    world.coins = [];
    addCoinArc(4, 9, H - 248, 40);
    addCoinArc(20, 10, H - 296, 56);
    addCoinArc(43, 8, H - 258, 36);
    addCoinArc(64, 9, H - 314, 46);
    addCoinArc(90, 10, H - 264, 48);
    addCoinArc(113, 9, H - 290, 42);
    addCoinArc(138, 8, H - 312, 34);
    addCoinArc(160, 11, H - 256, 50);
    addCoinArc(182, 8, H - 244, 28);

    world.enemies = [
      { x: 15 * TILE, y: world.floorY - 30, w: 30, h: 30, vx: -0.95, vy: 0, dead: false },
      { x: 27 * TILE, y: world.floorY - 30, w: 30, h: 30, vx: -1.05, vy: 0, dead: false },
      { x: 41 * TILE, y: world.floorY - 30, w: 30, h: 30, vx: -1.15, vy: 0, dead: false },
      { x: 59 * TILE, y: world.floorY - 30, w: 30, h: 30, vx: -1.2, vy: 0, dead: false },
      { x: 77 * TILE, y: world.floorY - 30, w: 30, h: 30, vx: -1.1, vy: 0, dead: false },
      { x: 98 * TILE, y: world.floorY - 30, w: 30, h: 30, vx: -1.25, vy: 0, dead: false },
      { x: 121 * TILE, y: world.floorY - 30, w: 30, h: 30, vx: -1.2, vy: 0, dead: false },
      { x: 144 * TILE, y: world.floorY - 30, w: 30, h: 30, vx: -1.3, vy: 0, dead: false },
      { x: 169 * TILE, y: world.floorY - 30, w: 30, h: 30, vx: -1.15, vy: 0, dead: false }
    ];

    world.pipes = [
      { x: 18 * TILE, y: H - 142, w: TILE * 1.8, h: 68 },
      { x: 35 * TILE, y: H - 174, w: TILE * 1.8, h: 100 },
      { x: 53 * TILE, y: H - 206, w: TILE * 1.8, h: 132 },
      { x: 70 * TILE, y: H - 174, w: TILE * 1.8, h: 100, warpTo: "underground" },
      { x: 93 * TILE, y: H - 206, w: TILE * 1.8, h: 132 },
      { x: 120 * TILE, y: H - 174, w: TILE * 1.8, h: 100 },
      { x: 148 * TILE, y: H - 206, w: TILE * 1.8, h: 132 },
      { x: 174 * TILE, y: H - 174, w: TILE * 1.8, h: 100 }
    ];
  }

  if (variant === 2) {
    world.width = 186 * TILE;
    world.flag = { x: 177 * TILE, y: H - 266, width: 20, height: 190 };

    world.platforms = [
      { x: 13 * TILE, y: H - 246, w: 3 * TILE, h: 18 },
      { x: 20 * TILE, y: H - 214, w: 5 * TILE, h: 18 },
      { x: 31 * TILE, y: H - 182, w: 6 * TILE, h: 18 },
      { x: 46 * TILE, y: H - 246, w: 4 * TILE, h: 18 },
      { x: 56 * TILE, y: H - 214, w: 5 * TILE, h: 18 },
      { x: 70 * TILE, y: H - 278, w: 3 * TILE, h: 18 },
      { x: 79 * TILE, y: H - 214, w: 4 * TILE, h: 18 },
      { x: 92 * TILE, y: H - 246, w: 5 * TILE, h: 18 },
      { x: 108 * TILE, y: H - 182, w: 4 * TILE, h: 18 },
      { x: 120 * TILE, y: H - 246, w: 4 * TILE, h: 18 },
      { x: 132 * TILE, y: H - 214, w: 5 * TILE, h: 18 },
      { x: 148 * TILE, y: H - 278, w: 4 * TILE, h: 18 }
    ];

    for (let i = 0; i < 6; i++) {
      world.platforms.push({ x: (166 + i) * TILE, y: world.floorY - (i + 1) * TILE, w: TILE, h: TILE });
    }

    world.blocks = [];
    pushBlockRow(9, H - 242, ["question", "brick", "question", "brick"]);
    pushBlockRow(24, H - 210, ["brick", "question", "brick", "brick", "question"]);
    pushBlockRow(42, H - 242, ["question", "brick", "brick", "question", "brick"]);
    pushBlockRow(64, H - 274, ["brick", "question", "brick"]);
    pushBlockRow(85, H - 210, ["question", "brick", "question", "brick", "brick"]);
    pushBlockRow(106, H - 242, ["brick", "question", "brick", "question"]);
    pushBlockRow(129, H - 210, ["brick", "question", "brick", "brick", "question"]);
    pushBlockRow(151, H - 274, ["brick", "question", "brick"]);

    const m = world.blocks.find((b) => b.x === 9 * TILE && b.y === H - 242);
    const f = world.blocks.find((b) => b.x === 25 * TILE && b.y === H - 210);
    if (m) m.content = "mushroom";
    if (f) f.content = "flower";

    world.coins = [];
    addCoinArc(6, 8, H - 286, 36);
    addCoinArc(22, 11, H - 258, 52);
    addCoinArc(41, 9, H - 294, 44);
    addCoinArc(63, 8, H - 316, 34);
    addCoinArc(84, 10, H - 262, 48);
    addCoinArc(104, 8, H - 294, 38);
    addCoinArc(127, 10, H - 264, 46);
    addCoinArc(149, 9, H - 314, 40);
    addCoinArc(168, 7, H - 242, 24);

    world.enemies = [
      { x: 17 * TILE, y: world.floorY - 30, w: 30, h: 30, vx: -0.9, vy: 0, dead: false },
      { x: 33 * TILE, y: world.floorY - 30, w: 30, h: 30, vx: -1.1, vy: 0, dead: false },
      { x: 49 * TILE, y: world.floorY - 30, w: 30, h: 30, vx: -1.2, vy: 0, dead: false },
      { x: 67 * TILE, y: world.floorY - 30, w: 30, h: 30, vx: -1.15, vy: 0, dead: false },
      { x: 86 * TILE, y: world.floorY - 30, w: 30, h: 30, vx: -1.25, vy: 0, dead: false },
      { x: 103 * TILE, y: world.floorY - 30, w: 30, h: 30, vx: -1.05, vy: 0, dead: false },
      { x: 124 * TILE, y: world.floorY - 30, w: 30, h: 30, vx: -1.2, vy: 0, dead: false },
      { x: 146 * TILE, y: world.floorY - 30, w: 30, h: 30, vx: -1.3, vy: 0, dead: false },
      { x: 164 * TILE, y: world.floorY - 30, w: 30, h: 30, vx: -1.2, vy: 0, dead: false }
    ];

    world.pipes = [
      { x: 16 * TILE, y: H - 174, w: TILE * 1.8, h: 100 },
      { x: 34 * TILE, y: H - 142, w: TILE * 1.8, h: 68 },
      { x: 52 * TILE, y: H - 206, w: TILE * 1.8, h: 132 },
      { x: 76 * TILE, y: H - 174, w: TILE * 1.8, h: 100 },
      { x: 93 * TILE, y: H - 206, w: TILE * 1.8, h: 132, warpTo: "underground" },
      { x: 116 * TILE, y: H - 174, w: TILE * 1.8, h: 100 },
      { x: 139 * TILE, y: H - 206, w: TILE * 1.8, h: 132 },
      { x: 161 * TILE, y: H - 174, w: TILE * 1.8, h: 100 }
    ];
  }

  if (difficulty.enemyMode === "light") {
    world.enemies = world.enemies.filter((_, i) => i % 2 === 0);
  } else if (difficulty.enemyMode === "medium") {
    world.enemies = world.enemies.filter((_, i) => i % 3 !== 2);
  }

  world.enemies = world.enemies.map((e) => ({
    ...e,
    vx: Math.sign(e.vx || -1) * Math.max(0.65, Math.abs(e.vx) * difficulty.enemySpeed)
  }));

  if (difficulty.helperLedges >= 1) {
    world.platforms.push({ x: (world.flag.x / TILE - 9) * TILE, y: H - 182, w: 3 * TILE, h: 18 });
  }
  if (difficulty.helperLedges >= 2) {
    world.platforms.push({ x: (world.flag.x / TILE - 5) * TILE, y: H - 214, w: 3 * TILE, h: 18 });
  }

  world.powerUps = [];
  world.fireballs = [];

  player.x = player.spawnX;
  player.y = world.floorY - player.h;
  player.vx = 0;
  player.vy = 0;
  player.form = "small";
  player.h = 30;
  player.onGround = true;
  player.invuln = 0;
  player.fireCooldown = 0;
  game.cameraX = 0;
  game.zone = "overworld";
  game.warpCooldown = 0;
  game.overworldSnapshot = null;
}

function setPlayerForm(newForm) {
  const oldHeight = player.h;
  player.form = newForm;
  player.h = newForm === "small" ? 30 : 46;
  player.y -= player.h - oldHeight;
  if (player.y + player.h > world.floorY) {
    player.y = world.floorY - player.h;
  }
}

function addScore(points) {
  game.score += points;
}

function updateHUD() {
  scoreEl.textContent = String(game.score).padStart(6, "0");
  coinsEl.textContent = `x${String(game.coins).padStart(2, "0")}`;
  timeEl.textContent = String(Math.max(0, Math.floor(game.timer))).padStart(3, "0");
  livesEl.textContent = `x${game.lives}`;
  formEl.textContent = player.form.toUpperCase();
}

function showOverlay(title, text) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlay.hidden = false;
}

function hideOverlay() {
  overlay.hidden = true;
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function getSolidBodies() {
  return [
    ...world.platforms,
    ...world.blocks.filter((b) => !b.broken).map((b) => ({ x: b.x, y: b.y, w: TILE, h: TILE, ref: b })),
    ...world.pipes
  ];
}

function getFirstCollision(entity, solids) {
  for (const body of solids) {
    if (intersects(entity, body)) {
      return body;
    }
  }
  return null;
}

function spawnFromBlock(block) {
  if (block.content === "coin") {
    game.coins += 1;
    addScore(200);
    return;
  }

  if (block.content === "mushroom") {
    world.powerUps.push({
      type: "mushroom",
      x: block.x + 4,
      y: block.y - 24,
      w: 24,
      h: 24,
      vx: 1.1,
      vy: 0,
      active: true
    });
    return;
  }

  if (block.content === "flower") {
    world.powerUps.push({
      type: "flower",
      x: block.x + 4,
      y: block.y - 24,
      w: 24,
      h: 24,
      vx: 0,
      vy: 0,
      active: true
    });
  }
}

function handleBlockHit(block) {
  if (block.type === "brick") {
    if (player.form !== "small") {
      block.broken = true;
      addScore(50);
    }
    return;
  }

  if (block.type === "question" && !block.used) {
    block.used = true;
    spawnFromBlock(block);
  }
}

function shootFireball() {
  if (player.form !== "fire" || player.fireCooldown > 0) return;
  world.fireballs.push({
    x: player.facing > 0 ? player.x + player.w - 2 : player.x - 8,
    y: player.y + 18,
    w: 10,
    h: 10,
    vx: player.facing * 6,
    vy: -1.8,
    life: 130,
    bounces: 4,
    active: true
  });
  player.fireCooldown = 16;
}

function updatePlayer() {
  const moveAxis = Number(keys.ArrowRight) - Number(keys.ArrowLeft);
  const maxSpeed = player.speed * (keys.KeyX ? player.runBoost : 1);

  if (moveAxis !== 0) {
    player.vx += moveAxis * 0.36;
    player.facing = moveAxis;
  } else {
    player.vx *= 0.82;
  }

  player.vx = Math.max(-maxSpeed, Math.min(maxSpeed, player.vx));

  if ((justPressed.ArrowUp || justPressed.Space) && player.onGround) {
    player.vy = player.form === "small" ? -13.1 : -13.6;
    player.onGround = false;
  }

  if (justPressed.KeyZ) {
    shootFireball();
  }

  player.vy = Math.min(MAX_FALL, player.vy + GRAVITY);

  const solids = getSolidBodies();

  player.x += player.vx;
  let hit = getFirstCollision(player, solids);
  if (hit) {
    if (player.vx > 0) {
      player.x = hit.x - player.w;
    } else if (player.vx < 0) {
      player.x = hit.x + hit.w;
    }
    player.vx = 0;
  }

  player.y += player.vy;
  player.onGround = false;
  hit = getFirstCollision(player, solids);
  if (hit) {
    if (player.vy > 0) {
      player.y = hit.y - player.h;
      player.onGround = true;
    } else if (player.vy < 0) {
      player.y = hit.y + hit.h;
      if (hit.ref) {
        handleBlockHit(hit.ref);
      }
    }
    player.vy = 0;
  }

  if (player.y + player.h >= world.floorY) {
    player.y = world.floorY - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  player.x = Math.max(0, Math.min(world.width - player.w, player.x));
  player.animPhase += Math.abs(player.vx) * 0.2;

  if (game.warpCooldown <= 0) {
    for (const pipe of world.pipes) {
      const onPipeTop =
        player.x + player.w > pipe.x + 6 &&
        player.x < pipe.x + pipe.w - 6 &&
        Math.abs(player.y + player.h - pipe.y) <= 7;

      if (!onPipeTop) continue;

      if (pipe.warpTo === "underground" && keys.ArrowDown && player.onGround) {
        enterUnderground(pipe);
        return;
      }

      if (pipe.warpTo === "overworld" && (keys.ArrowUp || keys.Space) && player.onGround) {
        exitUnderground();
        return;
      }
    }
  }

  if (player.y > H + 220) {
    loseLife();
  }

  if (player.invuln > 0) {
    player.invuln -= 1;
  }

  if (player.fireCooldown > 0) {
    player.fireCooldown -= 1;
  }

  if (game.warpCooldown > 0) {
    game.warpCooldown -= 1;
  }
}

function updatePowerUps() {
  const solids = getSolidBodies();

  for (const p of world.powerUps) {
    if (!p.active) continue;

    if (p.type === "mushroom") {
      p.vy = Math.min(MAX_FALL, p.vy + GRAVITY * 0.8);
      p.x += p.vx;

      for (const s of solids) {
        if (intersects(p, s)) {
          if (p.vx > 0) {
            p.x = s.x - p.w;
          } else {
            p.x = s.x + s.w;
          }
          p.vx *= -1;
        }
      }

      p.y += p.vy;
      for (const s of solids) {
        if (intersects(p, s)) {
          if (p.vy > 0) {
            p.y = s.y - p.h;
          } else {
            p.y = s.y + s.h;
          }
          p.vy = 0;
        }
      }

      if (p.y + p.h >= world.floorY) {
        p.y = world.floorY - p.h;
        p.vy = 0;
      }
    }

    if (intersects(player, p)) {
      p.active = false;
      if (p.type === "mushroom") {
        if (player.form === "small") setPlayerForm("super");
        addScore(1000);
      } else if (p.type === "flower") {
        if (player.form === "small") setPlayerForm("super");
        setPlayerForm("fire");
        addScore(1000);
      }
    }
  }
}

function updateCoins(dt) {
  for (const c of world.coins) {
    c.phase += dt * 0.008;
    if (c.taken) continue;

    const hitbox = { x: c.x - c.r, y: c.y - c.r, w: c.r * 2, h: c.r * 2 };
    if (intersects(player, hitbox)) {
      c.taken = true;
      game.coins += 1;
      addScore(100);
      if (game.coins % 50 === 0) {
        game.lives += 1;
      }
    }
  }
}

function damagePlayer() {
  if (player.invuln > 0) return;

  if (player.form === "fire") {
    setPlayerForm("super");
    player.invuln = 120;
    return;
  }

  if (player.form === "super") {
    setPlayerForm("small");
    player.invuln = 120;
    return;
  }

  loseLife();
}

function updateEnemies() {
  const solids = getSolidBodies();

  for (const e of world.enemies) {
    if (e.dead) continue;

    e.vy = Math.min(MAX_FALL, e.vy + GRAVITY * 0.8);

    e.x += e.vx;
    for (const s of solids) {
      if (intersects(e, s)) {
        if (e.vx > 0) {
          e.x = s.x - e.w;
        } else {
          e.x = s.x + s.w;
        }
        e.vx *= -1;
      }
    }

    e.y += e.vy;
    for (const s of solids) {
      if (intersects(e, s)) {
        if (e.vy > 0) {
          e.y = s.y - e.h;
        } else {
          e.y = s.y + s.h;
        }
        e.vy = 0;
      }
    }

    if (e.y + e.h >= world.floorY) {
      e.y = world.floorY - e.h;
      e.vy = 0;
    }

    if (intersects(player, e)) {
      const stomp = player.vy > 0 && player.y + player.h - e.y < 15;
      if (stomp) {
        e.dead = true;
        player.vy = -7.8;
        addScore(200);
      } else {
        damagePlayer();
      }
    }
  }
}

function updateFireballs() {
  const solids = getSolidBodies();

  for (const b of world.fireballs) {
    if (!b.active) continue;

    b.life -= 1;
    if (b.life <= 0) {
      b.active = false;
      continue;
    }

    b.vy = Math.min(MAX_FALL, b.vy + GRAVITY * 0.2);
    b.x += b.vx;

    for (const s of solids) {
      if (intersects(b, s)) {
        b.active = false;
      }
    }

    b.y += b.vy;

    if (b.y + b.h >= world.floorY) {
      b.y = world.floorY - b.h;
      b.vy = -4.8;
      b.bounces -= 1;
      if (b.bounces <= 0) b.active = false;
    }

    for (const e of world.enemies) {
      if (!e.dead && intersects(b, e)) {
        e.dead = true;
        b.active = false;
        addScore(250);
      }
    }

    if (b.x < 0 || b.x > world.width) {
      b.active = false;
    }
  }
}

function loseLife() {
  game.lives -= 1;
  if (game.lives <= 0) {
    game.gameOver = true;
    showOverlay("Game Over", "Press Enter or Space to restart");
    return;
  }

  player.form = "small";
  player.h = 30;
  player.x = player.spawnX;
  player.y = world.floorY - player.h;
  player.vx = 0;
  player.vy = 0;
  player.invuln = 140;
  game.timer = Math.max(game.timer, 120);
}

function updateCamera() {
  const target = player.x - W * 0.35;
  game.cameraX += (target - game.cameraX) * 0.1;
  game.cameraX = Math.max(0, Math.min(world.width - W, game.cameraX));
}

function checkWin() {
  if (game.zone !== "overworld") return;
  const flagRect = { x: world.flag.x, y: world.flag.y, w: world.flag.width, h: world.flag.height };
  if (intersects(player, flagRect)) {
    game.won = true;
    addScore(1000 + Math.floor(game.timer) * 3);
    showOverlay("You Win", "Press Enter or Space to play again");
  }
}

function update(dt) {
  if (!game.started || game.gameOver || game.won) {
    Object.keys(justPressed).forEach((k) => {
      justPressed[k] = false;
    });
    return;
  }

  game.clockTick += dt;
  if (game.clockTick >= 1000) {
    game.clockTick -= 1000;
    game.timer -= 1;
    if (game.timer <= 0) {
      loseLife();
      game.timer = 400;
    }
  }

  updatePlayer();
  updatePowerUps();
  updateCoins(dt);
  updateEnemies();
  updateFireballs();
  updateCamera();
  checkWin();
  updateHUD();

  Object.keys(justPressed).forEach((k) => {
    justPressed[k] = false;
  });
}

function drawBackground() {
  if (game.zone === "underground") {
    ctx.fillStyle = "#17122b";
    ctx.fillRect(0, 0, W, H);

    for (let y = 0; y < H; y += TILE) {
      for (let x = -TILE; x < W + TILE; x += TILE) {
        const px = x - (game.cameraX % TILE);
        ctx.fillStyle = ((x / TILE + y / TILE) % 2 === 0) ? "#2a2044" : "#241b3a";
        ctx.fillRect(px, y, TILE, TILE);
        ctx.fillStyle = "#3a2b5a";
        ctx.fillRect(px + 4, y + 6, 8, 4);
        ctx.fillRect(px + 18, y + 18, 10, 5);
      }
    }
    return;
  }

  const skyGradient = ctx.createLinearGradient(0, 0, 0, H);
  skyGradient.addColorStop(0, "#eefbff");
  skyGradient.addColorStop(0.35, "#d7f1fb");
  skyGradient.addColorStop(1, "#6ec0e8");
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, W, H);

  const sunX = W - 170 - (game.cameraX * 0.08) % 120;
  const sunY = H - 172;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 18, sunX, sunY, 150);
  sunGlow.addColorStop(0, "rgba(255, 244, 182, 0.55)");
  sunGlow.addColorStop(0.45, "rgba(255, 232, 150, 0.22)");
  sunGlow.addColorStop(1, "rgba(255, 232, 150, 0)");
  ctx.fillStyle = sunGlow;
  ctx.fillRect(sunX - 150, sunY - 150, 300, 300);
  ctx.fillStyle = "#ffe79a";
  ctx.beginPath();
  ctx.arc(sunX, sunY, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff3c6";
  ctx.beginPath();
  ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 10; i++) {
    const x = ((i * 260 - game.cameraX * 0.2) % (W + 280)) - 140;
    const y = 78 + (i % 3) * 34;
    ctx.fillStyle = "#d9eef8";
    ctx.fillRect(x + 8, y + 8, 176, 14);
    ctx.fillRect(x + 24, y - 6, 136, 16);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x, y, 184, 18);
    ctx.fillRect(x + 16, y - 14, 152, 16);
    ctx.fillRect(x + 36, y - 28, 112, 14);
    ctx.fillRect(x + 60, y - 40, 64, 12);
  }

  const farFieldTop = H - 132;
  const nearFieldTop = H - 102;

  ctx.fillStyle = "#7acc58";
  ctx.fillRect(0, farFieldTop, W, H - farFieldTop);

  for (let i = 0; i < 8; i++) {
    const fieldX = ((i * 170 - game.cameraX * 0.18) % (W + 220)) - 110;
    ctx.beginPath();
    ctx.ellipse(fieldX, farFieldTop, 120, 30, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 40; i++) {
    const flowerX = ((i * 31 + (i % 5) * 17 - game.cameraX * 0.18) % (W + 84)) - 32;
    const flowerY = farFieldTop - 14 + ((i * 11) % 9) * 3;
    ctx.fillStyle = i % 3 === 0 ? "#ff9fd1" : "#ffb15a";
    ctx.fillRect(flowerX, flowerY, 4, 4);
    ctx.fillStyle = "#f7d8ea";
    ctx.fillRect(flowerX + 1, flowerY + 1, 2, 2);
  }

  ctx.fillStyle = "#5fbc45";
  ctx.fillRect(0, nearFieldTop, W, H - nearFieldTop);

  for (let i = 0; i < 7; i++) {
    const fieldX = ((i * 190 - game.cameraX * 0.32) % (W + 260)) - 130;
    ctx.beginPath();
    ctx.ellipse(fieldX, nearFieldTop, 136, 34, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 52; i++) {
    const flowerX = ((i * 27 + (i % 7) * 13 - game.cameraX * 0.32) % (W + 88)) - 26;
    const flowerY = nearFieldTop - 18 + ((i * 7) % 11) * 4;
    ctx.fillStyle = i % 3 === 0 ? "#ff93c8" : "#ff9b3d";
    ctx.fillRect(flowerX, flowerY + 2, 3, 3);
    ctx.fillRect(flowerX + 3, flowerY, 3, 3);
    ctx.fillRect(flowerX + 6, flowerY + 2, 3, 3);
    ctx.fillRect(flowerX + 3, flowerY + 4, 3, 3);
    ctx.fillStyle = "#ffe7a9";
    ctx.fillRect(flowerX + 3, flowerY + 2, 3, 3);
  }
}

function drawGround() {
  if (game.zone === "underground") {
    const offset = -(game.cameraX % TILE);
    for (let x = offset - TILE; x < W + TILE; x += TILE) {
      ctx.fillStyle = "#5a3a23";
      ctx.fillRect(x, world.floorY, TILE, H - world.floorY);
      ctx.fillStyle = "#3c2615";
      ctx.fillRect(x + 2, world.floorY + 3, TILE - 4, 6);
      ctx.fillRect(x + 6, world.floorY + 14, 8, 6);
      ctx.fillRect(x + 19, world.floorY + 16, 9, 6);
    }
    return;
  }

  const offset = -(game.cameraX % TILE);
  for (let x = offset - TILE; x < W + TILE; x += TILE) {
    ctx.fillStyle = "#9a5a2a";
    ctx.fillRect(x, world.floorY, TILE, H - world.floorY);
    ctx.fillStyle = "#4fb44a";
    ctx.fillRect(x, world.floorY, TILE, 6);
    ctx.fillStyle = "#79d35f";
    ctx.fillRect(x + 2, world.floorY + 1, 8, 3);
    ctx.fillRect(x + 14, world.floorY + 1, 10, 3);
    ctx.fillRect(x + 26, world.floorY + 1, 4, 3);
    ctx.fillStyle = "#7a431f";
    ctx.fillRect(x + 3, world.floorY + 9, 9, 6);
    ctx.fillRect(x + 18, world.floorY + 12, 10, 6);
    ctx.fillRect(x + 7, world.floorY + 22, 12, 7);
    ctx.fillStyle = "#c98343";
    ctx.fillRect(x + 14, world.floorY + 8, 3, 3);
    ctx.fillRect(x + 24, world.floorY + 20, 4, 4);
    ctx.fillRect(x + 4, world.floorY + 18, 3, 3);
  }
}

function drawPlatform(p) {
  const sx = p.x - game.cameraX;
  ctx.fillStyle = "#66be4f";
  ctx.fillRect(sx, p.y, p.w, p.h);
  ctx.fillStyle = "#8cdd72";
  ctx.fillRect(sx + 2, p.y + 2, Math.max(6, p.w - 8), 4);
  ctx.fillRect(sx + 4, p.y + 7, Math.max(4, p.w * 0.28), 3);
  ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
  ctx.fillRect(sx + 3, p.y + 3, Math.max(4, p.w * 0.18), 2);
  ctx.fillStyle = "#58aa45";
  ctx.fillRect(sx + 2, p.y + 10, Math.max(6, p.w - 8), Math.max(2, p.h - 14));
  ctx.fillStyle = "#489539";
  ctx.fillRect(sx, p.y + p.h - 4, p.w, 4);
  ctx.fillStyle = "#34712c";
  ctx.fillRect(sx + p.w - 4, p.y + 2, 4, Math.max(4, p.h - 2));
}

function drawBlock(b) {
  if (b.broken) return;

  const x = b.x - game.cameraX;

  if (b.type === "question" && !b.used) {
    if (drawImageSprite(spriteImages.luckyBlock, x, b.y, TILE, TILE)) {
      return;
    }

    ctx.fillStyle = "#ffb03b";
    ctx.fillRect(x, b.y, TILE, TILE);
    ctx.fillStyle = "#d78221";
    ctx.fillRect(x + 2, b.y + 2, TILE - 4, TILE - 4);
    ctx.fillStyle = "#fff7cc";
    ctx.fillRect(x + 12, b.y + 8, 8, 8);
    ctx.fillRect(x + 10, b.y + 18, 12, 4);
  } else {
    ctx.fillStyle = "#b56f2d";
    ctx.fillRect(x, b.y, TILE, TILE);
    ctx.fillStyle = "#84461d";
    ctx.fillRect(x + 4, b.y + 4, 8, 8);
    ctx.fillRect(x + 18, b.y + 7, 10, 10);
    ctx.fillRect(x + 8, b.y + 20, 16, 8);
  }
}

function drawPipe(p) {
  const x = p.x - game.cameraX;
  ctx.fillStyle = "#1faa48";
  ctx.fillRect(x, p.y, p.w, p.h);
  ctx.fillStyle = "#54e07a";
  ctx.fillRect(x + 4, p.y + 4, 6, p.h - 8);
  ctx.fillStyle = "#2ec45d";
  ctx.fillRect(x + 12, p.y + 4, Math.max(8, p.w - 24), p.h - 8);
  ctx.fillStyle = "#35d464";
  ctx.fillRect(x - 6, p.y - 10, p.w + 12, 12);
  ctx.fillStyle = "#7cf09d";
  ctx.fillRect(x - 2, p.y - 8, Math.max(12, p.w * 0.45), 4);
  ctx.fillRect(x + 2, p.y - 4, Math.max(10, p.w * 0.3), 3);
  ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
  ctx.fillRect(x + 4, p.y - 7, 10, 2);
  ctx.fillStyle = "#137531";
  ctx.fillRect(x + p.w - 6, p.y, 6, p.h);
  ctx.fillStyle = "#0d5f26";
  ctx.fillRect(x + p.w - 12, p.y + 3, 6, p.h - 3);
  ctx.fillRect(x + p.w - 8, p.y - 10, 8, 12);
}

function drawCoin(c) {
  if (c.taken) return;
  const x = c.x - game.cameraX;
  const bob = Math.sin(c.phase) * 3;
  ctx.strokeStyle = "#cc8d11";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(x, c.y + bob, c.r - 3, c.r, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawEnemy(e) {
  if (e.dead) return;

  if (drawImageSprite(spriteImages.goomba, e.x - game.cameraX, e.y, e.w, e.h, e.vx > 0)) {
    return;
  }

  drawSprite(goombaSprite, palettes.goomba, e.x - game.cameraX, e.y - 2, 2, e.vx > 0);
}

function drawPowerUp(p) {
  if (!p.active) return;

  if (p.type === "mushroom") {
    if (drawImageSprite(spriteImages.mushroom, p.x - game.cameraX, p.y, p.w, p.h)) {
      return;
    }

    drawSprite(mushroomSprite, palettes.mushroom, p.x - game.cameraX - 4, p.y - 4, 2);
  } else {
    drawSprite(flowerSprite, palettes.flower, p.x - game.cameraX - 4, p.y - 4, 2);
  }
}

function drawFireball(b) {
  if (!b.active) return;
  const x = b.x - game.cameraX;
  ctx.fillStyle = "#f26f2c";
  ctx.beginPath();
  ctx.arc(x + b.w / 2, b.y + b.h / 2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffd669";
  ctx.beginPath();
  ctx.arc(x + b.w / 2, b.y + b.h / 2, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlag() {
  const x = world.flag.x - game.cameraX;
  ctx.strokeStyle = "#f5f5f5";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, world.flag.y);
  ctx.lineTo(x, world.flag.y + world.flag.height);
  ctx.stroke();

  ctx.fillStyle = "#2aa545";
  ctx.fillRect(x + 2, world.flag.y + 20, 46, 28);
  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(x + 20, world.flag.y + 30, 8, 8);
}

function drawCastle() {
  const x = world.flag.x - game.cameraX + TILE * 2;
  const y = world.floorY - 148;

  ctx.fillStyle = "#7c4725";
  ctx.fillRect(x - 6, y + 136, 144, 12);

  ctx.fillStyle = "#b97842";
  ctx.fillRect(x, y + 18, 132, 118);

  ctx.fillStyle = "#cf9057";
  ctx.fillRect(x + 10, y + 28, 112, 96);

  ctx.fillStyle = "#8f552d";
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 8; col++) {
      ctx.fillRect(x + 8 + col * 14 + ((row % 2) ? 7 : 0), y + 24 + row * 16, 10, 8);
    }
  }

  ctx.fillStyle = "#a66535";
  ctx.fillRect(x + 18, y, 16, 18);
  ctx.fillRect(x + 42, y, 16, 18);
  ctx.fillRect(x + 66, y, 16, 18);
  ctx.fillRect(x + 90, y, 16, 18);
  ctx.fillRect(x + 114, y, 16, 18);

  ctx.fillStyle = "#b97842";
  ctx.fillRect(x + 10, y - 18, 30, 36);
  ctx.fillRect(x + 92, y - 18, 30, 36);

  ctx.fillStyle = "#cf9057";
  ctx.fillRect(x + 14, y - 14, 22, 28);
  ctx.fillRect(x + 96, y - 14, 22, 28);

  ctx.fillStyle = "#a66535";
  ctx.fillRect(x + 12, y - 30, 10, 12);
  ctx.fillRect(x + 26, y - 30, 10, 12);
  ctx.fillRect(x + 94, y - 30, 10, 12);
  ctx.fillRect(x + 108, y - 30, 10, 12);

  ctx.fillStyle = "#7a4423";
  ctx.fillRect(x + 18, y - 38, 14, 8);
  ctx.fillRect(x + 100, y - 38, 14, 8);

  ctx.fillStyle = "#5d3419";
  ctx.fillRect(x + 50, y + 82, 32, 54);
  ctx.beginPath();
  ctx.arc(x + 66, y + 82, 16, Math.PI, 0);
  ctx.fill();

  ctx.fillStyle = "#1c120d";
  ctx.fillRect(x + 56, y + 94, 20, 42);

  ctx.fillStyle = "#4f2d17";
  ctx.fillRect(x + 22, y + 62, 14, 22);
  ctx.fillRect(x + 96, y + 62, 14, 22);
  ctx.fillRect(x + 59, y + 42, 14, 18);

  ctx.fillStyle = "#d8b07a";
  ctx.fillRect(x + 25, y + 66, 8, 14);
  ctx.fillRect(x + 99, y + 66, 8, 14);
  ctx.fillRect(x + 62, y + 45, 8, 10);

  ctx.fillStyle = "#f1d9a7";
  ctx.fillRect(x + 62, y + 102, 3, 26);
  ctx.fillRect(x + 68, y + 102, 3, 26);

  ctx.fillStyle = "#d84b3c";
  ctx.fillRect(x + 27, y - 50, 12, 6);
  ctx.fillRect(x + 109, y - 50, 12, 6);
  ctx.fillRect(x + 38, y - 50, 2, 14);
  ctx.fillRect(x + 120, y - 50, 2, 14);
}

function drawMario() {
  if (player.invuln > 0 && Math.floor(player.invuln / 6) % 2 === 0) return;

  const x = player.x - game.cameraX - 2;
  const y = player.y - (player.form === "small" ? 2 : 0);
  const frame = Math.floor(player.animPhase) % 2;
  const flip = player.facing < 0;

  if (drawImageSprite(spriteImages.mario, x, y, player.w + 4, player.h + 2, flip)) {
    return;
  }

  if (player.form === "small") {
    drawSprite(marioSmallFrames[frame], palettes.marioSmall, x, y, 2, flip);
    return;
  }

  if (player.form === "fire") {
    drawSprite(marioBigFrames[frame], palettes.marioFire, x, y, 2, flip);
    return;
  }

  drawSprite(marioBigFrames[frame], palettes.marioBig, x, y, 2, flip);
}

function render() {
  drawBackground();
  drawGround();

  for (const p of world.platforms) drawPlatform(p);
  for (const b of world.blocks) drawBlock(b);
  for (const pipe of world.pipes) drawPipe(pipe);
  for (const c of world.coins) drawCoin(c);
  for (const e of world.enemies) drawEnemy(e);
  for (const p of world.powerUps) drawPowerUp(p);
  for (const b of world.fireballs) drawFireball(b);

  if (game.zone === "overworld") {
    drawCastle();
    drawFlag();
  }
  drawMario();
}

let last = performance.now();
function loop(now) {
  const dt = now - last;
  last = now;

  update(dt);
  render();
  requestAnimationFrame(loop);
}

function restartGame() {
  game.mapCycle = (game.mapCycle + 1) % 3;
  const difficulty = getDifficulty();
  game.started = true;
  game.gameOver = false;
  game.won = false;
  game.score = 0;
  game.coins = 0;
  game.lives = difficulty.lives;
  game.timer = difficulty.timer;
  game.clockTick = 0;
  game.zone = "overworld";
  game.warpCooldown = 0;
  game.overworldSnapshot = null;
  resetLevel(game.mapCycle);
  hideOverlay();
  updateHUD();
}

window.addEventListener("keydown", (e) => {
  if (e.code in keys) {
    if (!keys[e.code]) {
      justPressed[e.code] = true;
    }
    keys[e.code] = true;

    if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "Space"].includes(e.code)) {
      e.preventDefault();
    }
  }

  if ((e.code === "Enter" || e.code === "Space") && (!game.started || game.gameOver || game.won)) {
    restartGame();
  }

  if (e.code === "KeyC" && (!game.started || game.gameOver || game.won)) {
    game.difficultyIndex = (game.difficultyIndex + 1) % DIFFICULTIES.length;
    showOverlay(
      "Mario Mang v4",
      `Enter/Space start | C difficulty: ${getDifficulty().name} | Left/Right move | Down pipe warp`
    );
  }
});

window.addEventListener("keyup", (e) => {
  if (e.code in keys) {
    keys[e.code] = false;
  }
});

for (const btn of document.querySelectorAll(".ctrl")) {
  const key = btn.dataset.key;
  const press = () => {
    if (!(key in keys)) return;
    if (!keys[key]) {
      justPressed[key] = true;
    }
    keys[key] = true;
  };

  const release = () => {
    if (key in keys) {
      keys[key] = false;
    }
  };

  btn.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      press();
    },
    { passive: false }
  );

  btn.addEventListener("touchend", release);
  btn.addEventListener("touchcancel", release);
  btn.addEventListener("mousedown", press);
  btn.addEventListener("mouseup", release);
  btn.addEventListener("mouseleave", release);
}

showOverlay(
  "Mario Mang v4",
  `Enter/Space start | C difficulty: ${getDifficulty().name} | Left/Right move | Down pipe warp`
);
resetLevel(0);
updateHUD();
requestAnimationFrame(loop);
