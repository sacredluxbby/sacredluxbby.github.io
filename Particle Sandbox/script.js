// =============================================================================
// PARTICLE SANDBOX — симуляция клеточного автомата на базе HTML5 Canvas
//
// Принцип работы:
//  • Мир разбит на сетку ячеек (COLS × ROWS). Каждая ячейка хранит тип
//    материала, цвет (R/G/B) и «жизнь» (life) — счётчик тактов до исчезновения.
//  • Каждый кадр вызывается simulationStep(): обходит все ячейки снизу вверх
//    и применяет правила физики для каждого материала (падение, течение и т.д.).
//  • После шага симуляции draw() рисует мир на Canvas пикселями CELL_SIZE×CELL_SIZE.
//  • Пользователь рисует материалы мышью; кнопки управляют паузой, ветром,
//    тепловой картой и режимами кисти (рисование / притяжение / отталкивание).
// =============================================================================

// ── DOM-элементы ──────────────────────────────────────────────────────────────
const canvas = document.getElementById("sandbox");
const ctx = canvas.getContext("2d", { alpha: false }); // alpha:false ускоряет отрисовку

// Кнопки управления симуляцией
const pauseBtn = document.getElementById("pauseBtn");
const freezeBtn = document.getElementById("freezeBtn");
const organizeBtn = document.getElementById("organizeBtn");
const heatMapBtn = document.getElementById("heatMapBtn");
const stepBtn = document.getElementById("stepBtn");
const clearBtn = document.getElementById("clearBtn");
const saveBtn = document.getElementById("saveBtn");
const loadBtn = document.getElementById("loadBtn");

// Панели выбора материала, режима кисти и легенды
const palette = document.getElementById("palette");
const brushModePanel = document.getElementById("brushMode");
const legend = document.getElementById("legend");

// Ползунки настроек
const brushSizeInput = document.getElementById("brushSize");
const brushSizeValue = document.getElementById("brushSizeValue");
const simSpeedInput = document.getElementById("simSpeed");
const simSpeedValue = document.getElementById("simSpeedValue");
const windForceInput = document.getElementById("windForce");
const windForceValue = document.getElementById("windForceValue");

// ── Константы сетки ───────────────────────────────────────────────────────────
const CELL_SIZE = 4;                              // пикселей на одну ячейку
const COLS = Math.floor(canvas.width / CELL_SIZE);
const ROWS = Math.floor(canvas.height / CELL_SIZE);
const CELL_COUNT = COLS * ROWS;                   // общее число ячеек
const SAVE_KEY = "particle-sandbox-v4";           // ключ localStorage для сохранений
const LIFE_LIMIT_MS = 10000;                      // мс до «смерти» частицы (не бессмертной)
const MAX_RESPAWN_QUEUE = 18000;                  // макс. частиц в очереди возрождения

// ── Перечисление материалов ───────────────────────────────────────────────────
// Каждый материал — числовой идентификатор. Значение хранится в массиве world[].
const MATERIAL = {
  EMPTY: 0,
  SAND: 1,
  WATER: 2,
  GAS: 3,
  STONE: 4,
  WOOD: 5,
  OIL: 6,
  FIRE: 7,
  SMOKE: 8,
  STEAM: 9,
  ACID: 10,
  LAVA: 11,
  SEED: 12,
  FLOWER_STEM: 13,
  FLOWER_PETAL: 14,
  DIRT: 15,   // земля — статичная, кислота растворяет
  FUSE: 16,   // фитиль — проводник огня, сгорает
  SPROUT: 17, // росток — вырастает на дереве рядом с водой, расширяется в крону
  CANOPY: 18  // крона дерева — легко горит
};
const MATERIAL_COUNT = 19;

// ── Режимы кисти ──────────────────────────────────────────────────────────────
// PAINT  — рисует выбранный материал
// ATTRACT — притягивает частицы к курсору
// REPEL   — отталкивает частицы от курсора
const BRUSH_MODE = {
  PAINT: "paint",
  ATTRACT: "attract",
  REPEL: "repel"
};

// Карта «имя кнопки → идентификатор материала» для обработки кликов по палитре
const MATERIAL_FROM_NAME = {
  sand: MATERIAL.SAND,
  water: MATERIAL.WATER,
  gas: MATERIAL.GAS,
  stone: MATERIAL.STONE,
  wood: MATERIAL.WOOD,
  oil: MATERIAL.OIL,
  fire: MATERIAL.FIRE,
  smoke: MATERIAL.SMOKE,
  steam: MATERIAL.STEAM,
  acid: MATERIAL.ACID,
  lava: MATERIAL.LAVA,
  seed: MATERIAL.SEED,
  dirt: MATERIAL.DIRT,
  fuse: MATERIAL.FUSE,
  sprout: MATERIAL.SPROUT,
  canopy: MATERIAL.CANOPY,
  eraser: MATERIAL.EMPTY
};

// ── Метаданные материалов ─────────────────────────────────────────────────────
// baseColor — базовый RGB-цвет (при спавне добавляется случайный шум ±14)
// showInLegend — показывать ли материал в легенде интерфейса
const DATA = {
  [MATERIAL.EMPTY]: { name: "Empty", baseColor: [0, 0, 0], showInLegend: false },
  [MATERIAL.SAND]: { name: "Sand", baseColor: [225, 194, 106], showInLegend: true },
  [MATERIAL.WATER]: { name: "Water", baseColor: [80, 149, 236], showInLegend: true },
  [MATERIAL.GAS]: { name: "Gas", baseColor: [187, 218, 255], showInLegend: true },
  [MATERIAL.STONE]: { name: "Stone", baseColor: [136, 146, 160], showInLegend: true },
  [MATERIAL.WOOD]: { name: "Wood", baseColor: [139, 92, 56], showInLegend: true },
  [MATERIAL.OIL]: { name: "Oil", baseColor: [92, 81, 49], showInLegend: true },
  [MATERIAL.FIRE]: { name: "Fire", baseColor: [252, 132, 54], showInLegend: true },
  [MATERIAL.SMOKE]: { name: "Smoke", baseColor: [127, 132, 140], showInLegend: true },
  [MATERIAL.STEAM]: { name: "Steam", baseColor: [197, 212, 226], showInLegend: true },
  [MATERIAL.ACID]: { name: "Acid", baseColor: [138, 235, 96], showInLegend: true },
  [MATERIAL.LAVA]: { name: "Lava", baseColor: [235, 91, 24], showInLegend: true },
  [MATERIAL.SEED]: { name: "Flower Seed", baseColor: [154, 118, 74], showInLegend: true },
  [MATERIAL.FLOWER_STEM]: { name: "Stem", baseColor: [72, 170, 74], showInLegend: false },
  [MATERIAL.FLOWER_PETAL]: { name: "Petal", baseColor: [242, 122, 180], showInLegend: false },
  [MATERIAL.DIRT]: { name: "Dirt", baseColor: [101, 67, 33], showInLegend: true },
  [MATERIAL.FUSE]: { name: "Fuse", baseColor: [210, 190, 140], showInLegend: true },
  [MATERIAL.SPROUT]: { name: "Sprout", baseColor: [82, 180, 52], showInLegend: true },
  [MATERIAL.CANOPY]: { name: "Tree Crown", baseColor: [38, 110, 34], showInLegend: true }
};

// ── Буферы состояния мира ─────────────────────────────────────────────────────
// Для максимальной производительности состояние хранится в типизированных массивах.
// Индекс ячейки (x, y) вычисляется как y * COLS + x (функция toIndex).
const world = new Uint8Array(CELL_COUNT);      // тип материала в каждой ячейке
const colorR = new Uint8Array(CELL_COUNT);     // R-компонента цвета ячейки
const colorG = new Uint8Array(CELL_COUNT);     // G-компонента цвета ячейки
const colorB = new Uint8Array(CELL_COUNT);     // B-компонента цвета ячейки
const life = new Uint8Array(CELL_COUNT);       // оставшийся «ресурс жизни» (такты)
const birthMs = new Uint32Array(CELL_COUNT);   // время рождения частицы (мс, performance.now)
const updated = new Uint8Array(CELL_COUNT);    // флаг «уже обновлена в этом такте»

// ── Переменные состояния симуляции ────────────────────────────────────────────
let selectedMaterial = MATERIAL.SAND; // текущий выбранный материал кисти
let brushMode = BRUSH_MODE.PAINT;     // режим кисти
let brushSize = Number(brushSizeInput.value);
let simSpeed = Number(simSpeedInput.value);   // кол-во шагов симуляции за кадр
let windForce = Number(windForceInput.value); // сила ветра (-5..+5)
let running = true;     // симуляция запущена
let freezeTime = false; // «заморозка»: физика стоит, но draw работает
let heatMapEnabled = false; // показывать тепловую карту плотности
let tick = 0;           // номер текущего такта (используется для чередования направления обхода)
let stepNowMs = 0;      // время начала текущего шага (для проверки lifetime)

// ── Состояние указателя ───────────────────────────────────────────────────────
let pointerDown = false;
let pointerX = 0;
let pointerY = 0;
let pointerRightButton = false; // ПКМ — режим ластика

// ── Очередь возрождения ───────────────────────────────────────────────────────
// Когда частица умирает (истёк LIFE_LIMIT_MS), она сохраняется в respawnQueue.
// При следующем рисовании тем же материалом «мёртвые» частицы появляются снова,
// что создаёт эффект бесконечного потока.
const respawnQueueByMaterial = Array.from({ length: MATERIAL_COUNT }, () => []);
let respawnQueueSize = 0;

// ── Аудио-состояние ───────────────────────────────────────────────────────────
// Звуки генерируются через Web Audio API на основе столкновений частиц.
let collisionsThisFrame = 0;
const collisionEnergyByMaterial = new Float32Array(MATERIAL_COUNT);
let mixedCollisionEnergy = 0;  // энергия смешанных столкновений (разные материалы)
let audioEnabled = false;
let audioCtx = null;
let lastSoundTime = 0;

// ── Вспомогательные функции ───────────────────────────────────────────────────

// Преобразует (x, y) в линейный индекс массива
function toIndex(x, y) {
  return y * COLS + x;
}

// Проверяет, что координаты внутри границ сетки
function inBounds(x, y) {
  return x >= 0 && x < COLS && y >= 0 && y < ROWS;
}

// Случайное целое число в диапазоне [min, max] включительно
function randomBetween(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

// Ограничивает значение цвета в диапазоне 0..255
function clampColor(v) {
  return Math.max(0, Math.min(255, v));
}

// Начальное значение «жизни» для материалов с конечным временем существования
function defaultLifeFor(type) {
  if (type === MATERIAL.FIRE) return randomBetween(12, 30);
  if (type === MATERIAL.SMOKE) return randomBetween(26, 64);
  if (type === MATERIAL.STEAM) return randomBetween(34, 86);
  return 0;
}

// Записывает материал и его цвет в ячейку по индексу.
// rgbOverride — если передан, использует точный цвет; иначе базовый цвет ± шум.
function setCell(index, type, rgbOverride) {
  world[index] = type;

  if (type === MATERIAL.EMPTY) {
    colorR[index] = 0;
    colorG[index] = 0;
    colorB[index] = 0;
    life[index] = 0;
    birthMs[index] = 0;
    return;
  }

  if (rgbOverride) {
    colorR[index] = clampColor(rgbOverride[0]);
    colorG[index] = clampColor(rgbOverride[1]);
    colorB[index] = clampColor(rgbOverride[2]);
  } else {
    const base = DATA[type].baseColor;
    const noise = randomBetween(-14, 14);
    colorR[index] = clampColor(base[0] + noise);
    colorG[index] = clampColor(base[1] + noise);
    colorB[index] = clampColor(base[2] + noise);
  }

  life[index] = defaultLifeFor(type);
  birthMs[index] = Math.floor(performance.now());
}

// Восстанавливает частицу из сохранённого объекта (используется при возрождении)
function setParticle(index, particle) {
  world[index] = particle.type;
  colorR[index] = particle.r;
  colorG[index] = particle.g;
  colorB[index] = particle.b;
  life[index] = particle.life;
  birthMs[index] = particle.birth;
}

// Меняет местами содержимое двух ячеек (тип, цвет, life, время рождения).
// Является основной операцией движения частиц в симуляции.
function swapCells(i1, i2) {
  const t = world[i1];
  world[i1] = world[i2];
  world[i2] = t;

  const r = colorR[i1];
  colorR[i1] = colorR[i2];
  colorR[i2] = r;

  const g = colorG[i1];
  colorG[i1] = colorG[i2];
  colorG[i2] = g;

  const b = colorB[i1];
  colorB[i1] = colorB[i2];
  colorB[i2] = b;

  const l = life[i1];
  life[i1] = life[i2];
  life[i2] = l;

  const born = birthMs[i1];
  birthMs[i1] = birthMs[i2];
  birthMs[i2] = born;

  updated[i1] = 1;
  updated[i2] = 1;
}

// Усредняет цвета двух ячеек — эффект визуального смешивания при столкновении
function blendColors(i1, i2) {
  const r = Math.floor((colorR[i1] + colorR[i2]) * 0.5);
  const g = Math.floor((colorG[i1] + colorG[i2]) * 0.5);
  const b = Math.floor((colorB[i1] + colorB[i2]) * 0.5);
  colorR[i1] = r;
  colorG[i1] = g;
  colorB[i1] = b;
  colorR[i2] = r;
  colorG[i2] = g;
  colorB[i2] = b;
}

// Помещает умершую частицу в очередь возрождения (если очередь не переполнена),
// затем очищает ячейку. Очередь сортирована по типу материала.
function queueDeadParticle(index) {
  const type = world[index];
  if (type === MATERIAL.EMPTY) return;

  if (respawnQueueSize < MAX_RESPAWN_QUEUE) {
    respawnQueueByMaterial[type].push({
      type,
      r: colorR[index],
      g: colorG[index],
      b: colorB[index],
      life: life[index]
    });
    respawnQueueSize += 1;
  }

  setCell(index, MATERIAL.EMPTY);
  updated[index] = 1;
}

// Регистрирует столкновение двух ячеек: накапливает энергию по типам материалов
// (используется для генерации звуков) и смешивает цвета при ярком контрасте.
function registerCollision(i, j, impact) {
  collisionsThisFrame += impact;
  const t1 = world[i];
  const t2 = world[j];

  if (t1 !== MATERIAL.EMPTY && t2 !== MATERIAL.EMPTY) {
    if (t1 === t2) {
      collisionEnergyByMaterial[t1] += impact;
    } else {
      collisionEnergyByMaterial[t1] += impact * 0.5;
      collisionEnergyByMaterial[t2] += impact * 0.5;
      mixedCollisionEnergy += impact;
    }

    const colorDelta = Math.abs(colorR[i] - colorR[j]) + Math.abs(colorG[i] - colorG[j]) + Math.abs(colorB[i] - colorB[j]);
    if (colorDelta > 18) {
      blendColors(i, j);
    }
  }
}

// Определяет, может ли частица type вытеснить (занять место) targetType.
// Это правило плотности: тяжёлое вытесняет лёгкое (песок → воду, огонь → газ и т.д.)
function canDisplace(type, targetType) {
  if (targetType === MATERIAL.EMPTY) return true;

  if (type === MATERIAL.SAND) {
    return targetType === MATERIAL.WATER || targetType === MATERIAL.OIL || targetType === MATERIAL.SMOKE || targetType === MATERIAL.STEAM;
  }
  if (type === MATERIAL.SEED) {
    return targetType === MATERIAL.WATER || targetType === MATERIAL.OIL || targetType === MATERIAL.SMOKE || targetType === MATERIAL.STEAM;
  }
  if (type === MATERIAL.WATER) {
    return targetType === MATERIAL.GAS || targetType === MATERIAL.SMOKE || targetType === MATERIAL.STEAM;
  }
  if (type === MATERIAL.OIL) {
    return targetType === MATERIAL.GAS || targetType === MATERIAL.SMOKE || targetType === MATERIAL.STEAM;
  }
  if (type === MATERIAL.GAS || type === MATERIAL.SMOKE || type === MATERIAL.STEAM) {
    return false;
  }
  if (type === MATERIAL.FIRE) {
    return targetType === MATERIAL.GAS || targetType === MATERIAL.SMOKE || targetType === MATERIAL.STEAM;
  }
  if (type === MATERIAL.ACID) {
    return targetType === MATERIAL.WATER || targetType === MATERIAL.OIL || targetType === MATERIAL.GAS || targetType === MATERIAL.SMOKE || targetType === MATERIAL.STEAM;
  }
  if (type === MATERIAL.LAVA) {
    return targetType === MATERIAL.WATER || targetType === MATERIAL.OIL || targetType === MATERIAL.GAS || targetType === MATERIAL.SMOKE || targetType === MATERIAL.STEAM || targetType === MATERIAL.FIRE;
  }
  return false;
}

// Статичные материалы не двигаются сами по себе (камень, дерево, части цветка, земля, фитиль, ростки, крона)
function isStatic(type) {
  return type === MATERIAL.STONE || type === MATERIAL.WOOD || type === MATERIAL.FLOWER_STEM || type === MATERIAL.FLOWER_PETAL || type === MATERIAL.DIRT || type === MATERIAL.FUSE || type === MATERIAL.SPROUT || type === MATERIAL.CANOPY;
}

// Подвижные материалы — все не-пустые и не-статичные
function isMovable(type) {
  return type !== MATERIAL.EMPTY && !isStatic(type);
}

// Бессмертные материалы — не истекают по таймеру LIFE_LIMIT_MS
function isImmortal(type) {
  return type === MATERIAL.STONE || type === MATERIAL.SEED || type === MATERIAL.FLOWER_STEM || type === MATERIAL.FLOWER_PETAL || type === MATERIAL.DIRT || type === MATERIAL.FUSE || type === MATERIAL.SPROUT || type === MATERIAL.CANOPY;
}

// Проверяет, есть ли в соседних 8 ячейках хотя бы одна ячейка заданного типа
function nearElement(x, y, type) {
  for (let oy = -1; oy <= 1; oy += 1) {
    for (let ox = -1; ox <= 1; ox += 1) {
      if (ox === 0 && oy === 0) continue;
      const nx = x + ox;
      const ny = y + oy;
      if (!inBounds(nx, ny)) continue;
      if (world[toIndex(nx, ny)] === type) return true;
    }
  }
  return false;
}

// Возвращает индекс первой соседней ячейки заданного типа, или -1 если не найдено
function findAdjacentElement(x, y, type) {
  for (let oy = -1; oy <= 1; oy += 1) {
    for (let ox = -1; ox <= 1; ox += 1) {
      if (ox === 0 && oy === 0) continue;
      const nx = x + ox;
      const ny = y + oy;
      if (!inBounds(nx, ny)) continue;
      const i = toIndex(nx, ny);
      if (world[i] === type) {
        return i;
      }
    }
  }
  return -1;
}

// Пробует переместить частицу из (x,y) в (nx,ny).
// Если целевая ячейка доступна по правилу canDisplace — меняет местами.
// Иначе регистрирует столкновение. Возвращает true при успешном перемещении.
function tryMove(x, y, nx, ny) {
  if (!inBounds(nx, ny)) return false;
  const i = toIndex(x, y);
  const ni = toIndex(nx, ny);
  const t = world[i];
  const nt = world[ni];

  if (canDisplace(t, nt)) {
    swapCells(i, ni);
    return true;
  }

  if (nt !== MATERIAL.EMPTY) {
    registerCollision(i, ni, 0.6);
  }
  return false;
}

// ── Правила физики для каждого материала ─────────────────────────────────────

// Песок: падает вниз, затем по диагонали (случайный приоритет), не течёт горизонтально
function updateSand(x, y) {
  if (tryMove(x, y, x, y + 1)) return;
  const first = Math.random() < 0.5 ? -1 : 1;
  const second = -first;
  if (tryMove(x, y, x + first, y + 1)) return;
  tryMove(x, y, x + second, y + 1);
}

// Вода: падает вниз, по диагонали вниз, затем растекается горизонтально
function updateWater(x, y) {
  if (tryMove(x, y, x, y + 1)) return;

  const firstDiag = Math.random() < 0.5 ? -1 : 1;
  const secondDiag = -firstDiag;
  if (tryMove(x, y, x + firstDiag, y + 1)) return;
  if (tryMove(x, y, x + secondDiag, y + 1)) return;

  const firstSide = Math.random() < 0.5 ? -1 : 1;
  const secondSide = -firstSide;
  if (tryMove(x, y, x + firstSide, y)) return;
  if (Math.random() < 0.85) {
    tryMove(x, y, x + secondSide, y);
  }
}

// Газ: всплывает вверх, по диагонали вверх, затем растекается горизонтально
function updateGas(x, y) {
  if (tryMove(x, y, x, y - 1)) return;

  const firstDiag = Math.random() < 0.5 ? -1 : 1;
  const secondDiag = -firstDiag;
  if (tryMove(x, y, x + firstDiag, y - 1)) return;
  if (tryMove(x, y, x + secondDiag, y - 1)) return;

  const firstSide = Math.random() < 0.5 ? -1 : 1;
  const secondSide = -firstSide;
  if (tryMove(x, y, x + firstSide, y)) return;
  if (Math.random() < 0.7) {
    tryMove(x, y, x + secondSide, y);
  }
}

// Дым: тает (уменьшает life каждый такт), при life==0 исчезает; поднимается вверх
function updateSmoke(x, y) {
  const i = toIndex(x, y);
  if (life[i] > 0) life[i] -= 1;
  if (life[i] === 0) {
    setCell(i, MATERIAL.EMPTY);
    updated[i] = 1;
    return;
  }

  if (tryMove(x, y, x, y - 1)) return;
  const first = Math.random() < 0.5 ? -1 : 1;
  const second = -first;
  if (tryMove(x, y, x + first, y - 1)) return;
  if (tryMove(x, y, x + second, y - 1)) return;
  if (tryMove(x, y, x + first, y)) return;
  tryMove(x, y, x + second, y);
}

// Пар: тает аналогично дыму; при истечении life с вероятностью 55% конденсируется в воду
function updateSteam(x, y) {
  const i = toIndex(x, y);
  if (life[i] > 0) life[i] -= 1;
  if (life[i] === 0) {
    setCell(i, Math.random() < 0.55 ? MATERIAL.WATER : MATERIAL.EMPTY);
    updated[i] = 1;
    return;
  }

  if (tryMove(x, y, x, y - 1)) return;
  const first = Math.random() < 0.5 ? -1 : 1;
  const second = -first;
  if (tryMove(x, y, x + first, y - 1)) return;
  if (tryMove(x, y, x + second, y - 1)) return;
  if (tryMove(x, y, x + first, y)) return;
  tryMove(x, y, x + second, y);
}

// Поджигает соседние горючие ячейки (дерево, масло, газ) с заданной вероятностью
function igniteNeighbors(x, y, chance) {
  for (let oy = -1; oy <= 1; oy += 1) {
    for (let ox = -1; ox <= 1; ox += 1) {
      if (ox === 0 && oy === 0) continue;
      const nx = x + ox;
      const ny = y + oy;
      if (!inBounds(nx, ny)) continue;
      const ni = toIndex(nx, ny);
      const t = world[ni];
      if ((t === MATERIAL.WOOD || t === MATERIAL.OIL || t === MATERIAL.GAS) && Math.random() < chance) {
        setCell(ni, MATERIAL.FIRE);
        updated[ni] = 1;
      }
      // Фитиль воспламеняется от огня быстрее чем дерево (chance × 2.5)
      if (t === MATERIAL.FUSE && Math.random() < Math.min(0.92, chance * 2.5)) {
        setCell(ni, MATERIAL.FIRE);
        updated[ni] = 1;
      }
      // Крона горит в ~5× быстрее дерева — очень лёгкий материал
      if (t === MATERIAL.CANOPY && Math.random() < Math.min(0.98, chance * 5)) {
        setCell(ni, MATERIAL.FIRE);
        updated[ni] = 1;
      }
      // Росток тоже горит — чуть медленнее кроны
      if (t === MATERIAL.SPROUT && Math.random() < Math.min(0.95, chance * 3)) {
        setCell(ni, MATERIAL.FIRE);
        updated[ni] = 1;
      }
    }
  }
}

// Огонь: уменьшает life, поджигает соседей, гасится водой (→ пар/дым),
// при сгорании превращается в дым или исчезает; поднимается вверх
function updateFire(x, y) {
  const i = toIndex(x, y);
  if (life[i] > 0) life[i] -= 1;

  if (nearElement(x, y, MATERIAL.WATER) && Math.random() < 0.35) {
    setCell(i, Math.random() < 0.6 ? MATERIAL.STEAM : MATERIAL.SMOKE);
    updated[i] = 1;
    return;
  }

  igniteNeighbors(x, y, 0.2);

  if (life[i] === 0) {
    setCell(i, Math.random() < 0.72 ? MATERIAL.SMOKE : MATERIAL.EMPTY);
    updated[i] = 1;
    return;
  }

  if (tryMove(x, y, x, y - 1)) return;
  const drift = Math.random() < 0.5 ? -1 : 1;
  if (tryMove(x, y, x + drift, y - 1)) return;
  tryMove(x, y, x - drift, y - 1);
}

// Масло: воспламеняется рядом с огнём/лавой; течёт как вода, но медленнее
function updateOil(x, y) {
  const i = toIndex(x, y);
  if ((nearElement(x, y, MATERIAL.FIRE) || nearElement(x, y, MATERIAL.LAVA)) && Math.random() < 0.16) {
    setCell(i, MATERIAL.FIRE);
    updated[i] = 1;
    return;
  }

  if (tryMove(x, y, x, y + 1)) return;
  const firstDiag = Math.random() < 0.5 ? -1 : 1;
  const secondDiag = -firstDiag;
  if (tryMove(x, y, x + firstDiag, y + 1)) return;
  if (tryMove(x, y, x + secondDiag, y + 1)) return;

  const firstSide = Math.random() < 0.5 ? -1 : 1;
  const secondSide = -firstSide;
  if (tryMove(x, y, x + firstSide, y)) return;
  if (Math.random() < 0.85) {
    tryMove(x, y, x + secondSide, y);
  }
}

// Кислота: разъедает дерево (превращает в газ/пустоту), нейтрализуется лавой;
// течёт как вода
function updateAcid(x, y) {
  const i = toIndex(x, y);

  for (let oy = -1; oy <= 1; oy += 1) {
    for (let ox = -1; ox <= 1; ox += 1) {
      if (ox === 0 && oy === 0) continue;
      const nx = x + ox;
      const ny = y + oy;
      if (!inBounds(nx, ny)) continue;
      const ni = toIndex(nx, ny);
      const t = world[ni];
      if ((t === MATERIAL.WOOD) && Math.random() < 0.03) {
        setCell(ni, Math.random() < 0.55 ? MATERIAL.GAS : MATERIAL.EMPTY);
      }
      // Кислота медленно разъедает землю
      if (t === MATERIAL.DIRT && Math.random() < 0.022) {
        setCell(ni, MATERIAL.EMPTY);
      }
    }
  }

  if (nearElement(x, y, MATERIAL.LAVA) && Math.random() < 0.12) {
    setCell(i, MATERIAL.SMOKE);
    updated[i] = 1;
    return;
  }

  if (tryMove(x, y, x, y + 1)) return;
  const firstDiag = Math.random() < 0.5 ? -1 : 1;
  const secondDiag = -firstDiag;
  if (tryMove(x, y, x + firstDiag, y + 1)) return;
  if (tryMove(x, y, x + secondDiag, y + 1)) return;

  const firstSide = Math.random() < 0.5 ? -1 : 1;
  const secondSide = -firstSide;
  if (tryMove(x, y, x + firstSide, y)) return;
  if (Math.random() < 0.8) {
    tryMove(x, y, x + secondSide, y);
  }
}

// Лава: испаряет воду (→ пар), поджигает дерево/масло/газ, может застыть в камень;
// медленно течёт как вязкая жидкость
function updateLava(x, y) {
  const i = toIndex(x, y);

  for (let oy = -1; oy <= 1; oy += 1) {
    for (let ox = -1; ox <= 1; ox += 1) {
      if (ox === 0 && oy === 0) continue;
      const nx = x + ox;
      const ny = y + oy;
      if (!inBounds(nx, ny)) continue;
      const ni = toIndex(nx, ny);
      const t = world[ni];

      if (t === MATERIAL.WATER && Math.random() < 0.28) {
        setCell(ni, MATERIAL.STEAM);
        if (Math.random() < 0.08) {
          setCell(i, MATERIAL.STONE);
          updated[i] = 1;
          return;
        }
      }

      if ((t === MATERIAL.WOOD || t === MATERIAL.OIL || t === MATERIAL.GAS) && Math.random() < 0.24) {
        setCell(ni, MATERIAL.FIRE);
      }
      // Лава поджигает фитиль
      if (t === MATERIAL.FUSE && Math.random() < 0.35) {
        setCell(ni, MATERIAL.FIRE);
      }
      // Лава превращает землю в камень
      if (t === MATERIAL.DIRT && Math.random() < 0.07) {
        setCell(ni, MATERIAL.STONE);
      }
    }
  }

  if (tryMove(x, y, x, y + 1)) return;
  const firstDiag = Math.random() < 0.5 ? -1 : 1;
  const secondDiag = -firstDiag;
  if (tryMove(x, y, x + firstDiag, y + 1)) return;
  if (tryMove(x, y, x + secondDiag, y + 1)) return;

  if (Math.random() < 0.55) {
    const firstSide = Math.random() < 0.5 ? -1 : 1;
    const secondSide = -firstSide;
    if (tryMove(x, y, x + firstSide, y)) return;
    tryMove(x, y, x + secondSide, y);
  }
}

// ── Цветы ─────────────────────────────────────────────────────────────────────

// Случайный цвет лепестка из предустановленной палитры
function flowerPaletteColor() {
  const palette = [
    [255, 105, 155],
    [255, 170, 72],
    [255, 212, 77],
    [170, 105, 255],
    [120, 205, 255],
    [255, 128, 210]
  ];
  return palette[randomBetween(0, palette.length - 1)];
}

// Запускает рост цветка из точки (x, y):
// строит стебель вверх (3–8 ячеек), затем рисует лепестки вокруг верхушки
function growFlowerAt(x, y) {
  const seedIndex = toIndex(x, y);
  const stemColor = [66 + randomBetween(-6, 6), 172 + randomBetween(-10, 10), 74 + randomBetween(-8, 8)];
  const petalColor = flowerPaletteColor();
  const stemHeight = randomBetween(3, 8);

  setCell(seedIndex, MATERIAL.FLOWER_STEM, stemColor);
  updated[seedIndex] = 1;

  let topY = y;
  for (let i = 1; i <= stemHeight; i += 1) {
    const sy = y - i;
    if (!inBounds(x, sy)) break;
    const si = toIndex(x, sy);
    if (world[si] !== MATERIAL.EMPTY && world[si] !== MATERIAL.GAS && world[si] !== MATERIAL.SMOKE && world[si] !== MATERIAL.STEAM) break;
    setCell(si, MATERIAL.FLOWER_STEM, stemColor);
    updated[si] = 1;
    topY = sy;
  }

  const petalRadius = randomBetween(1, 2);
  for (let oy = -petalRadius; oy <= petalRadius; oy += 1) {
    for (let ox = -petalRadius; ox <= petalRadius; ox += 1) {
      const nx = x + ox;
      const ny = topY + oy;
      if (!inBounds(nx, ny)) continue;
      if (ox === 0 && oy === 0) continue;

      const dist = Math.abs(ox) + Math.abs(oy);
      if (dist > petalRadius + 1) continue;

      const ni = toIndex(nx, ny);
      if (world[ni] !== MATERIAL.EMPTY && world[ni] !== MATERIAL.GAS && world[ni] !== MATERIAL.SMOKE && world[ni] !== MATERIAL.STEAM) continue;

      const jittered = [
        clampColor(petalColor[0] + randomBetween(-12, 12)),
        clampColor(petalColor[1] + randomBetween(-12, 12)),
        clampColor(petalColor[2] + randomBetween(-12, 12))
      ];
      setCell(ni, MATERIAL.FLOWER_PETAL, jittered);
      updated[ni] = 1;
    }
  }

  const coreIndex = toIndex(x, topY);
  setCell(coreIndex, MATERIAL.FLOWER_PETAL, [255, 215, 78]);
  updated[coreIndex] = 1;
}

// Земля: статична и постоянна. Взаимодействия — через updateAcid и updateLava.
// Отдельная функция нужна только для расширяемости.
function updateDirt(_x, _y) {
  // Земля не движется сама по себе; все реакции инициируются соседними материалами.
}

// Дерево: статично, но при контакте с водой прорастает ростком.
// С малой вероятностью помещает SPROUT в первую пустую ячейку прямо над собой.
function updateWood(x, y) {
  if (!nearElement(x, y, MATERIAL.WATER)) return;
  if (Math.random() > 0.003) return;

  // Ищем первую пустую ячейку над деревом (до 6 клеток вверх)
  for (let dy = 1; dy <= 6; dy += 1) {
    const ny = y - dy;
    if (!inBounds(x, ny)) break;
    const ni = toIndex(x, ny);
    const nt = world[ni];
    if (nt === MATERIAL.WOOD || nt === MATERIAL.SPROUT || nt === MATERIAL.CANOPY || nt === MATERIAL.STONE || nt === MATERIAL.DIRT) break;
    if (nt === MATERIAL.EMPTY || nt === MATERIAL.GAS || nt === MATERIAL.SMOKE || nt === MATERIAL.STEAM) {
      setCell(ni, MATERIAL.SPROUT, [
        clampColor(82 + randomBetween(-10, 20)),
        clampColor(180 + randomBetween(-15, 25)),
        clampColor(52 + randomBetween(-10, 15))
      ]);
      updated[ni] = 1;
      break;
    }
  }
}

// Росток: статичный, медленно разрастается в крону (CANOPY) вверх и в стороны.
// Каждый такт с малой вероятностью помещает одну клетку CANOPY в соседнюю пустую ячейку.
function updateSprout(x, y) {
  if (Math.random() > 0.008) return;

  // Приоритетные направления роста: вверх, по диагонали вверх, в стороны
  const dirs = [
    [0, -1], [-1, -1], [1, -1],
    [-2, -1], [2, -1],
    [-1, -2], [0, -2], [1, -2],
    [-1, 0], [1, 0]
  ];
  const [ox, oy] = dirs[randomBetween(0, dirs.length - 1)];
  const nx = x + ox;
  const ny = y + oy;
  if (!inBounds(nx, ny)) return;
  const ni = toIndex(nx, ny);
  const nt = world[ni];
  if (nt === MATERIAL.EMPTY || nt === MATERIAL.GAS || nt === MATERIAL.SMOKE || nt === MATERIAL.STEAM) {
    const base = DATA[MATERIAL.CANOPY].baseColor;
    setCell(ni, MATERIAL.CANOPY, [
      clampColor(base[0] + randomBetween(-8, 14)),
      clampColor(base[1] + randomBetween(-12, 22)),
      clampColor(base[2] + randomBetween(-8, 10))
    ]);
    updated[ni] = 1;
  }
}

// Крона: статична. Медленно продолжает расти от уже существующих клеток кроны.
// Горит очень легко — через igniteNeighbors из updateFire.
function updateCanopy(x, y) {
  if (Math.random() > 0.003) return;

  const dirs = [[0, -1], [-1, -1], [1, -1], [-1, 0], [1, 0], [-2, 0], [2, 0]];
  const [ox, oy] = dirs[randomBetween(0, dirs.length - 1)];
  const nx = x + ox;
  const ny = y + oy;
  if (!inBounds(nx, ny)) return;
  const ni = toIndex(nx, ny);
  const nt = world[ni];
  if (nt === MATERIAL.EMPTY || nt === MATERIAL.GAS || nt === MATERIAL.SMOKE || nt === MATERIAL.STEAM) {
    const base = DATA[MATERIAL.CANOPY].baseColor;
    setCell(ni, MATERIAL.CANOPY, [
      clampColor(base[0] + randomBetween(-10, 16)),
      clampColor(base[1] + randomBetween(-14, 24)),
      clampColor(base[2] + randomBetween(-8, 12))
    ]);
    updated[ni] = 1;
  }
}

// Фитиль: статичный проводник огня. При контакте с огнём/лавой вспыхивает сам
// (превращается в FIRE), огонь затем распространяется дальше по соседним фитилям
// через igniteNeighbors. После сгорания остаётся дым как от обычного огня.
function updateFuse(x, y) {
  const i = toIndex(x, y);
  if ((nearElement(x, y, MATERIAL.FIRE) || nearElement(x, y, MATERIAL.LAVA)) && Math.random() < 0.38) {
    setCell(i, MATERIAL.FIRE);
    updated[i] = 1;
  }
}

// Семя: при контакте с водой поглощает её и проращивает цветок;
// иначе падает вниз как песок
function updateSeed(x, y) {
  const waterIndex = findAdjacentElement(x, y, MATERIAL.WATER);
  if (waterIndex !== -1) {
    setCell(waterIndex, MATERIAL.EMPTY);
    growFlowerAt(x, y);
    return;
  }

  if (tryMove(x, y, x, y + 1)) return;
  const first = Math.random() < 0.5 ? -1 : 1;
  const second = -first;
  if (tryMove(x, y, x + first, y + 1)) return;
  tryMove(x, y, x + second, y + 1);
}

// ── Глобальный ветер ──────────────────────────────────────────────────────────
// Обходит все подвижные частицы и с вероятностью пропорциональной windForce
// смещает их в сторону ветра. Газообразные летят по диагонали вверх,
// тяжёлые — по диагонали вниз.
function applyGlobalWind() {
  if (windForce === 0) return;

  const dir = windForce > 0 ? 1 : -1;
  const chance = Math.min(0.72, 0.16 * Math.abs(windForce));

  for (let y = 1; y < ROWS - 1; y += 1) {
    if (dir > 0) {
      for (let x = COLS - 2; x >= 1; x -= 1) {
        if (Math.random() > chance) continue;
        const i = toIndex(x, y);
        const t = world[i];
        if (!isMovable(t)) continue;
        if (tryMove(x, y, x + dir, y)) continue;

        if (t === MATERIAL.GAS || t === MATERIAL.SMOKE || t === MATERIAL.STEAM || t === MATERIAL.FIRE) {
          tryMove(x, y, x + dir, y - 1);
        } else {
          tryMove(x, y, x + dir, y + 1);
        }
      }
    } else {
      for (let x = 1; x < COLS - 1; x += 1) {
        if (Math.random() > chance) continue;
        const i = toIndex(x, y);
        const t = world[i];
        if (!isMovable(t)) continue;
        if (tryMove(x, y, x + dir, y)) continue;

        if (t === MATERIAL.GAS || t === MATERIAL.SMOKE || t === MATERIAL.STEAM || t === MATERIAL.FIRE) {
          tryMove(x, y, x + dir, y - 1);
        } else {
          tryMove(x, y, x + dir, y + 1);
        }
      }
    }
  }
}

// ── Кисть притяжения/отталкивания ────────────────────────────────────────────
// Для каждой частицы в радиусе кисти вычисляет направление к курсору (attract)
// или от курсора (repel) и пытается переместить туда частицу.
function applyForceBrush(gx, gy, mode) {
  for (let oy = -brushSize; oy <= brushSize; oy += 1) {
    for (let ox = -brushSize; ox <= brushSize; ox += 1) {
      const distSq = ox * ox + oy * oy;
      if (distSq > brushSize * brushSize || distSq === 0) continue;

      const x = gx + ox;
      const y = gy + oy;
      if (!inBounds(x, y)) continue;

      const i = toIndex(x, y);
      const t = world[i];
      if (updated[i] || !isMovable(t)) continue;

      const dirX = mode === BRUSH_MODE.ATTRACT ? -Math.sign(ox) : Math.sign(ox);
      const dirY = mode === BRUSH_MODE.ATTRACT ? -Math.sign(oy) : Math.sign(oy);
      const nx = x + dirX;
      const ny = y + dirY;

      if (!inBounds(nx, ny)) continue;
      const ni = toIndex(nx, ny);
      if (world[ni] === MATERIAL.EMPTY) {
        swapCells(i, ni);
      } else {
        registerCollision(i, ni, 0.8);
      }
    }
  }
}

// Диспетчер обновления ячейки: проверяет флаг updated (чтобы не обновлять дважды
// за такт), проверяет истечение lifetime и вызывает нужный update* в зависимости
// от типа материала.
function updateCell(x, y) {
  const i = toIndex(x, y);
  if (updated[i]) return;

  const t = world[i];
  if (t === MATERIAL.EMPTY) return;

  if (t === MATERIAL.SAND) {
    updateSand(x, y);
    return;
  }
  if (t === MATERIAL.WATER) {
    updateWater(x, y);
    return;
  }
  if (t === MATERIAL.OIL) {
    updateOil(x, y);
    return;
  }
  if (t === MATERIAL.GAS) {
    updateGas(x, y);
    return;
  }
  if (t === MATERIAL.SMOKE) {
    updateSmoke(x, y);
    return;
  }
  if (t === MATERIAL.STEAM) {
    updateSteam(x, y);
    return;
  }
  if (t === MATERIAL.FIRE) {
    updateFire(x, y);
    return;
  }
  if (t === MATERIAL.ACID) {
    updateAcid(x, y);
    return;
  }
  if (t === MATERIAL.LAVA) {
    updateLava(x, y);
    return;
  }
  if (t === MATERIAL.SEED) {
    updateSeed(x, y);
    return;
  }
  if (t === MATERIAL.WOOD) {
    updateWood(x, y);
    return;
  }
  if (t === MATERIAL.DIRT) {
    updateDirt(x, y);
    return;
  }
  if (t === MATERIAL.FUSE) {
    updateFuse(x, y);
    return;
  }
  if (t === MATERIAL.SPROUT) {
    updateSprout(x, y);
    return;
  }
  if (t === MATERIAL.CANOPY) {
    updateCanopy(x, y);
  }
}

// ── Один шаг симуляции ────────────────────────────────────────────────────────
// Сбрасывает флаги updated, обходит сетку снизу вверх (чтобы гравитация работала
// корректно). Направление обхода по X чередуется каждый такт (по чётности y+tick),
// устраняя артефакты однонаправленного смещения. После обхода применяет ветер
// и кисть притяжения/отталкивания, затем воспроизводит звуки столкновений.
function simulationStep() {
  updated.fill(0);
  tick += 1;
  stepNowMs = Math.floor(performance.now());
  collisionsThisFrame = 0;
  collisionEnergyByMaterial.fill(0);
  mixedCollisionEnergy = 0;

  for (let y = ROWS - 1; y >= 0; y -= 1) {
    const leftToRight = ((y + tick) & 1) === 0;
    if (leftToRight) {
      for (let x = 0; x < COLS; x += 1) {
        updateCell(x, y);
      }
    } else {
      for (let x = COLS - 1; x >= 0; x -= 1) {
        updateCell(x, y);
      }
    }
  }

  applyGlobalWind();

  if (pointerDown && !pointerRightButton && brushMode !== BRUSH_MODE.PAINT) {
    const gridPos = pointerToGrid(pointerX, pointerY);
    applyForceBrush(gridPos.gx, gridPos.gy, brushMode);
  }

  playCollisionSounds();
}

// ── Тепловая карта ────────────────────────────────────────────────────────────
// Разбивает холст на блоки 8×8 ячеек. Для каждого блока вычисляет плотность
// (доля непустых ячеек) и закрашивает его полупрозрачным цветом от синего (малая
// плотность) до красного (высокая плотность). Накладывается поверх мира.
function drawHeatMapOverlay() {
  if (!heatMapEnabled) return;

  const block = 8;
  for (let gy = 0; gy < ROWS; gy += block) {
    for (let gx = 0; gx < COLS; gx += block) {
      let count = 0;
      let total = 0;

      for (let oy = 0; oy < block; oy += 1) {
        const y = gy + oy;
        if (y >= ROWS) continue;
        for (let ox = 0; ox < block; ox += 1) {
          const x = gx + ox;
          if (x >= COLS) continue;
          total += 1;
          if (world[toIndex(x, y)] !== MATERIAL.EMPTY) {
            count += 1;
          }
        }
      }

      if (total === 0) continue;
      const density = count / total;
      if (density < 0.12) continue;

      const t = Math.min(1, (density - 0.12) / 0.88);
      const hue = 220 - 220 * t;
      const alpha = 0.09 + 0.33 * t;
      ctx.fillStyle = `hsla(${hue}, 96%, 56%, ${alpha})`;
      ctx.fillRect(gx * CELL_SIZE, gy * CELL_SIZE, block * CELL_SIZE, block * CELL_SIZE);
    }
  }
}

// ── Отрисовка кадра ───────────────────────────────────────────────────────────
// Заливает фон чёрным, затем рисует каждую непустую ячейку прямоугольником
// CELL_SIZE × CELL_SIZE. Огонь, дым и пар получают динамическую окраску на
// основе life (имитация горения, затухания). Поверх накладывается тепловая карта.
function draw() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const i = toIndex(x, y);
      if (world[i] === MATERIAL.EMPTY) continue;

      let r = colorR[i];
      let g = colorG[i];
      let b = colorB[i];
      const t = world[i];
      if (t === MATERIAL.FIRE) {
        const heat = life[i] / 30;
        r = Math.min(255, 210 + randomBetween(0, 45));
        g = Math.floor(65 + heat * 140);
        b = Math.floor(20 + randomBetween(0, 25));
      } else if (t === MATERIAL.SMOKE) {
        const fade = life[i] / 64;
        r = Math.floor(80 + fade * 70);
        g = Math.floor(84 + fade * 70);
        b = Math.floor(90 + fade * 66);
      } else if (t === MATERIAL.STEAM) {
        const fade = life[i] / 86;
        r = Math.floor(154 + fade * 90);
        g = Math.floor(170 + fade * 80);
        b = Math.floor(185 + fade * 70);
      }

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  }

  drawHeatMapOverlay();
}

// Переводит координаты указателя (CSS-пиксели) в координаты ячейки сетки,
// учитывая масштабирование Canvas через CSS (rect.width vs canvas.width)
function pointerToGrid(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const px = (clientX - rect.left) * scaleX;
  const py = (clientY - rect.top) * scaleY;

  return {
    gx: Math.floor(px / CELL_SIZE),
    gy: Math.floor(py / CELL_SIZE)
  };
}

// Берёт частицы из очереди возрождения и расставляет их случайно вокруг курсора.
// Благодаря этому суммарное количество частиц выбранного материала остаётся
// примерно постоянным при непрерывном рисовании.
function reviveDeadParticles(gx, gy) {
  if (selectedMaterial === MATERIAL.EMPTY) return;
  const queue = respawnQueueByMaterial[selectedMaterial];
  if (queue.length === 0) return;

  const maxRevive = Math.min(queue.length, Math.max(12, brushSize * brushSize * 3));
  let revived = 0;
  let attempts = 0;

  while (revived < maxRevive && attempts < maxRevive * 12 && queue.length > 0) {
    attempts += 1;
    const x = gx + randomBetween(-brushSize * 2, brushSize * 2);
    const y = gy + randomBetween(-brushSize * 2, brushSize * 2);
    if (!inBounds(x, y)) continue;

    const i = toIndex(x, y);
    if (world[i] !== MATERIAL.EMPTY) continue;

    const particle = queue.pop();
    respawnQueueSize -= 1;
    setParticle(i, {
      type: particle.type,
      r: particle.r,
      g: particle.g,
      b: particle.b,
      life: particle.life,
      birth: Math.floor(performance.now())
    });
    revived += 1;
  }
}

// Рисует выбранный материал в радиусе кисти вокруг курсора (или стирает при ПКМ).
// Перед рисованием пробует возродить частицы из очереди, чтобы восполнить убыль.
function sprinkleAt(clientX, clientY, useEraser) {
  const { gx, gy } = pointerToGrid(clientX, clientY);

  if (!useEraser) {
    reviveDeadParticles(gx, gy);
  }

  for (let oy = -brushSize; oy <= brushSize; oy += 1) {
    for (let ox = -brushSize; ox <= brushSize; ox += 1) {
      const distSq = ox * ox + oy * oy;
      if (distSq > brushSize * brushSize) continue;
      if (Math.random() > 0.78) continue;

      const x = gx + ox + randomBetween(-1, 1);
      const y = gy + oy + randomBetween(-1, 1);
      if (!inBounds(x, y)) continue;

      const i = toIndex(x, y);
      if (useEraser) {
        setCell(i, MATERIAL.EMPTY);
        continue;
      }

      if (world[i] !== MATERIAL.EMPTY) {
        registerCollision(i, i, 0.4);
      }
      setCell(i, selectedMaterial);
    }
  }
}

// ── "Организация" текста ──────────────────────────────────────────────────────

// Рисует текст на невидимом оффскрин-холсте и возвращает массив индексов ячеек,
// которые попали под нарисованные пиксели (белые пиксели = цель для частиц)
function createTextTargets(text) {
  const offscreen = document.createElement("canvas");
  offscreen.width = COLS;
  offscreen.height = ROWS;
  const octx = offscreen.getContext("2d");

  octx.fillStyle = "black";
  octx.fillRect(0, 0, offscreen.width, offscreen.height);
  octx.fillStyle = "white";
  octx.textAlign = "center";
  octx.textBaseline = "middle";
  octx.font = `bold ${Math.floor(ROWS * 0.22)}px Arial Black, sans-serif`;
  octx.fillText(text, COLS * 0.5, ROWS * 0.5);

  const image = octx.getImageData(0, 0, COLS, ROWS).data;
  const targets = [];

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const p = (y * COLS + x) * 4;
      if (image[p + 3] > 20) {
        targets.push(toIndex(x, y));
      }
    }
  }

  return targets;
}

// Собирает все частицы с поля, перемешивает их, затем расставляет в позиции,
// образующие надпись text. Лишние частицы сбрасываются в нижнюю часть поля.
function organizeParticlesToText(text) {
  const particles = [];
  for (let i = 0; i < CELL_COUNT; i += 1) {
    const t = world[i];
    if (t === MATERIAL.EMPTY) continue;
    particles.push({
      type: t,
      r: colorR[i],
      g: colorG[i],
      b: colorB[i],
      life: life[i],
      birth: Math.floor(performance.now())
    });
  }

  if (particles.length === 0) return;

  const targets = createTextTargets(text);
  if (targets.length === 0) return;

  clearWorld();

  for (let i = particles.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = particles[i];
    particles[i] = particles[j];
    particles[j] = tmp;
  }

  const placeCount = Math.min(particles.length, targets.length);
  for (let i = 0; i < placeCount; i += 1) {
    setParticle(targets[i], particles[i]);
  }

  for (let i = placeCount; i < particles.length; i += 1) {
    const x = randomBetween(0, COLS - 1);
    const y = randomBetween(Math.floor(ROWS * 0.7), ROWS - 1);
    const index = toIndex(x, y);
    if (world[index] === MATERIAL.EMPTY) {
      setParticle(index, particles[i]);
    }
  }
}

// Полностью очищает мир и сбрасывает очереди возрождения
function clearWorld() {
  world.fill(MATERIAL.EMPTY);
  colorR.fill(0);
  colorG.fill(0);
  colorB.fill(0);
  life.fill(0);
  birthMs.fill(0);
  for (let i = 0; i < MATERIAL_COUNT; i += 1) {
    respawnQueueByMaterial[i].length = 0;
  }
  respawnQueueSize = 0;
}

// Динамически строит список-легенду на основе DATA, показывая только материалы
// с showInLegend: true
function buildLegend() {
  legend.innerHTML = "";
  Object.entries(DATA).forEach(([, def]) => {
    if (!def.showInLegend) return;

    const item = document.createElement("span");
    item.className = "legend-item";

    const swatch = document.createElement("span");
    swatch.className = "swatch";
    swatch.style.backgroundColor = `rgb(${def.baseColor[0]}, ${def.baseColor[1]}, ${def.baseColor[2]})`;

    const text = document.createElement("span");
    text.textContent = def.name;

    item.appendChild(swatch);
    item.appendChild(text);
    legend.appendChild(item);
  });
}

// ── Сохранение и загрузка ─────────────────────────────────────────────────────

// Сериализует всё состояние мира (буферы + очереди возрождения + настройки)
// в JSON и сохраняет в localStorage
function saveState() {
  const serializedQueues = respawnQueueByMaterial.map((queue) => queue.slice(-MAX_RESPAWN_QUEUE));
  const payload = {
    world: Array.from(world),
    colorR: Array.from(colorR),
    colorG: Array.from(colorG),
    colorB: Array.from(colorB),
    life: Array.from(life),
    birthMs: Array.from(birthMs),
    respawnQueueByMaterial: serializedQueues,
    windForce,
    heatMapEnabled
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
}

// Загружает состояние из localStorage с полной валидацией данных:
// проверяет длины массивов, типы полей, sanitize очередей (защита от инъекций
// некорректных данных при загрузке сохранений из внешних источников).
function loadState() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.world) || parsed.world.length !== CELL_COUNT) return;
    if (!Array.isArray(parsed.colorR) || !Array.isArray(parsed.colorG) || !Array.isArray(parsed.colorB)) return;
    if (!Array.isArray(parsed.life) || !Array.isArray(parsed.birthMs)) return;
    if (parsed.colorR.length !== CELL_COUNT || parsed.colorG.length !== CELL_COUNT || parsed.colorB.length !== CELL_COUNT) return;
    if (parsed.life.length !== CELL_COUNT || parsed.birthMs.length !== CELL_COUNT) return;

    world.set(parsed.world);
    colorR.set(parsed.colorR);
    colorG.set(parsed.colorG);
    colorB.set(parsed.colorB);
    life.set(parsed.life);
    birthMs.set(parsed.birthMs);

    for (let i = 0; i < MATERIAL_COUNT; i += 1) {
      respawnQueueByMaterial[i].length = 0;
    }
    respawnQueueSize = 0;

    if (Array.isArray(parsed.respawnQueueByMaterial)) {
      for (let material = 0; material < MATERIAL_COUNT; material += 1) {
        const sourceQueue = parsed.respawnQueueByMaterial[material];
        if (!Array.isArray(sourceQueue)) continue;

        const sanitized = [];
        for (const p of sourceQueue) {
          if (!p || typeof p.type !== "number") continue;
          if (p.type !== material) continue;
          sanitized.push({
            type: p.type,
            r: clampColor(Number(p.r) || 0),
            g: clampColor(Number(p.g) || 0),
            b: clampColor(Number(p.b) || 0),
            life: Math.max(0, Math.min(255, Number(p.life) || 0))
          });
          if (sanitized.length >= MAX_RESPAWN_QUEUE) break;
        }

        respawnQueueByMaterial[material].push(...sanitized);
        respawnQueueSize += sanitized.length;
      }
    }

    if (respawnQueueSize > MAX_RESPAWN_QUEUE) {
      let overflow = respawnQueueSize - MAX_RESPAWN_QUEUE;
      for (let material = 0; material < MATERIAL_COUNT && overflow > 0; material += 1) {
        const q = respawnQueueByMaterial[material];
        while (q.length > 0 && overflow > 0) {
          q.shift();
          overflow -= 1;
          respawnQueueSize -= 1;
        }
      }
    }

    if (typeof parsed.windForce === "number") {
      windForce = Math.max(-5, Math.min(5, parsed.windForce));
      windForceInput.value = String(windForce);
      windForceValue.textContent = String(windForce);
    }

    heatMapEnabled = Boolean(parsed.heatMapEnabled);
    heatMapBtn.textContent = heatMapEnabled ? "Heat Map: On" : "Heat Map: Off";

    const now = Math.floor(performance.now());
    for (let i = 0; i < CELL_COUNT; i += 1) {
      if (world[i] !== MATERIAL.EMPTY && birthMs[i] === 0) {
        birthMs[i] = now;
      }
    }
  } catch {
    // Ignore broken save data.
  }
}

// ── Аудио ─────────────────────────────────────────────────────────────────────

// Инициализирует AudioContext при первом взаимодействии пользователя.
// Браузer требует жест пользователя перед созданием AudioContext.
function ensureAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  audioEnabled = true;
}

// Генерирует короткий тон через осциллятор с затуханием (envelope):
// type — форма волны, frequency/endFrequency — частотный глиссандо
function triggerTone(type, frequency, volume, duration, endFrequency) {
  const now = audioCtx.currentTime;
  const gainNode = audioCtx.createGain();
  gainNode.connect(audioCtx.destination);

  const oscillator = audioCtx.createOscillator();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  if (typeof endFrequency === "number") {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, endFrequency), now + duration);
  }
  oscillator.connect(gainNode);

  gainNode.gain.setValueAtTime(volume, now);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.start(now);
  oscillator.stop(now + duration + 0.004);
}

// Воспроизводит звук, соответствующий доминирующему материалу по энергии столкновений.
// Ограничение по частоте (40 мс) предотвращает звуковые артефакты.
// Дополнительно воспроизводит «щелчок» при смешанных столкновениях высокой энергии.
function playCollisionSounds() {
  if (!audioEnabled || !audioCtx || collisionsThisFrame < 1.2) return;

  const now = audioCtx.currentTime;
  if (now - lastSoundTime < 0.04) return;
  lastSoundTime = now;

  let dominant = MATERIAL.SAND;
  let dominantEnergy = 0;
  for (let i = 1; i < MATERIAL_COUNT; i += 1) {
    if (collisionEnergyByMaterial[i] > dominantEnergy) {
      dominantEnergy = collisionEnergyByMaterial[i];
      dominant = i;
    }
  }

  if (dominant === MATERIAL.WATER || dominant === MATERIAL.STEAM) {
    const freq = 290 + Math.min(420, dominantEnergy * 15) + randomBetween(-35, 35);
    const vol = Math.min(0.095, 0.016 + dominantEnergy * 0.0028);
    triggerTone("sine", freq, vol, 0.075, freq * 0.5);
  } else if (dominant === MATERIAL.GAS || dominant === MATERIAL.SMOKE) {
    const freq = 420 + Math.min(530, dominantEnergy * 18) + randomBetween(-45, 40);
    const vol = Math.min(0.07, 0.011 + dominantEnergy * 0.0019);
    triggerTone("sawtooth", freq, vol, 0.05, freq * 0.8);
  } else if (dominant === MATERIAL.FIRE || dominant === MATERIAL.LAVA) {
    const freq = 210 + Math.min(390, dominantEnergy * 24) + randomBetween(-25, 35);
    const vol = Math.min(0.11, 0.02 + dominantEnergy * 0.0031);
    triggerTone("square", freq, vol, 0.058, freq * 0.7);
  } else if (dominant === MATERIAL.ACID) {
    const freq = 510 + Math.min(360, dominantEnergy * 20) + randomBetween(-30, 45);
    const vol = Math.min(0.085, 0.015 + dominantEnergy * 0.0024);
    triggerTone("triangle", freq, vol, 0.048, freq * 0.58);
  } else {
    const freq = 150 + Math.min(280, dominantEnergy * 22) + randomBetween(-20, 30);
    const vol = Math.min(0.11, 0.02 + dominantEnergy * 0.0032);
    triggerTone("triangle", freq, vol, 0.055, freq * 0.65);
  }

  if (mixedCollisionEnergy > 1.8) {
    const snapFreq = 620 + Math.min(900, mixedCollisionEnergy * 60) + randomBetween(-60, 60);
    const snapVol = Math.min(0.08, 0.01 + mixedCollisionEnergy * 0.0025);
    triggerTone("square", snapFreq, snapVol, 0.028, snapFreq * 0.55);
  }
}

// ── Главный цикл ─────────────────────────────────────────────────────────────
// Запускается через requestAnimationFrame (~60 fps).
// За один кадр выполняет simSpeed шагов симуляции, затем один draw().
function animate() {
  if (running && !freezeTime) {
    for (let i = 0; i < simSpeed; i += 1) {
      simulationStep();
    }
  }

  draw();
  requestAnimationFrame(animate);
}

// ── Обработчики событий ───────────────────────────────────────────────────────

// Клик по палитре — выбор материала кисти
palette.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-element]");
  if (!button) return;
  const elementName = button.dataset.element;
  selectedMaterial = MATERIAL_FROM_NAME[elementName] ?? MATERIAL.SAND;
  palette.querySelectorAll("button").forEach((el) => el.classList.remove("is-active"));
  button.classList.add("is-active");
});

// Клик по панели режима кисти — переключение между paint/attract/repel
brushModePanel.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-mode]");
  if (!button) return;
  brushMode = button.dataset.mode;
  brushModePanel.querySelectorAll("button").forEach((el) => el.classList.remove("is-active"));
  button.classList.add("is-active");
});

// Ползунок размера кисти
brushSizeInput.addEventListener("input", () => {
  brushSize = Number(brushSizeInput.value);
  brushSizeValue.textContent = String(brushSize);
});

// Ползунок скорости симуляции (кол-во шагов за кадр)
simSpeedInput.addEventListener("input", () => {
  simSpeed = Number(simSpeedInput.value);
  simSpeedValue.textContent = `${simSpeed}x`;
});

// Ползунок силы ветра
windForceInput.addEventListener("input", () => {
  windForce = Number(windForceInput.value);
  windForceValue.textContent = String(windForce);
});

// ── Кнопки управления ────────────────────────────────────────────────────────
pauseBtn.addEventListener("click", () => {
  running = !running;
  pauseBtn.textContent = running ? "Pause" : "Resume";
});

freezeBtn.addEventListener("click", () => {
  freezeTime = !freezeTime;
  freezeBtn.textContent = freezeTime ? "Unfreeze Time" : "Freeze Time";
});

// Organize: переставляет частицы в форму надписи "NPMM25"
organizeBtn.addEventListener("click", () => {
  organizeParticlesToText("NPMM25");
});

heatMapBtn.addEventListener("click", () => {
  heatMapEnabled = !heatMapEnabled;
  heatMapBtn.textContent = heatMapEnabled ? "Heat Map: On" : "Heat Map: Off";
});

// Step: выполнить ровно один шаг симуляции (для пошагового отладочного режима)
stepBtn.addEventListener("click", () => {
  simulationStep();
  draw();
});

clearBtn.addEventListener("click", clearWorld);
saveBtn.addEventListener("click", saveState);
loadBtn.addEventListener("click", loadState);

// ── Ввод с холста ─────────────────────────────────────────────────────────────
// Блокируем контекстное меню, чтобы ПКМ работал как ластик
canvas.addEventListener("contextmenu", (event) => event.preventDefault());

canvas.addEventListener("pointerdown", (event) => {
  ensureAudio();
  pointerDown = true;
  pointerRightButton = event.button === 2;
  pointerX = event.clientX;
  pointerY = event.clientY;
  canvas.setPointerCapture(event.pointerId);

  if (pointerRightButton || brushMode === BRUSH_MODE.PAINT) {
    sprinkleAt(pointerX, pointerY, pointerRightButton);
  }
});

canvas.addEventListener("pointermove", (event) => {
  pointerX = event.clientX;
  pointerY = event.clientY;
  if (!pointerDown) return;

  pointerRightButton = (event.buttons & 2) === 2;
  if (pointerRightButton || brushMode === BRUSH_MODE.PAINT) {
    sprinkleAt(pointerX, pointerY, pointerRightButton);
  }
});

canvas.addEventListener("pointerup", () => {
  pointerDown = false;
  pointerRightButton = false;
});

canvas.addEventListener("pointerleave", () => {
  pointerDown = false;
  pointerRightButton = false;
});

// ── Инициализация ─────────────────────────────────────────────────────────────
buildLegend();   // строим легенду цветов
clearWorld();    // обнуляем мир
animate();       // запускаем главный цикл
