const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const SAVE_FILE = path.join(__dirname, "data", "save.json");

const MAX_STAT = 100;
const DECAY_PER_MINUTE = 1;

const ROOMS = [
  {
    key: "yard",
    name: "Двор",
    allowedActions: ["pet", "sleep", "play", "train", "adventure"]
  },
  {
    key: "kitchen",
    name: "Кухня",
    allowedActions: ["pet", "sleep", "feed_treat", "feed_cookie", "feed_drumstick"]
  },
  {
    key: "bedroom",
    name: "Спальня",
    allowedActions: ["pet", "sleep", "groom", "style"]
  }
];
const DEFAULT_ROOM = "kitchen";

const LEVELS = [
  { level: 1, name: "Котенок", minProgress: 0 },
  { level: 2, name: "Молодой кот", minProgress: 60 },
  { level: 3, name: "Взрослый кот", minProgress: 130 },
  { level: 4, name: "Крутой кот (аксессуары)", minProgress: 220 },
  { level: 5, name: "Легендарный кот", minProgress: 340 }
];

const ACTIONS = {
  pet: {
    label: "Погладить",
    minLevel: 1,
    apply: (state) => {
      state.happiness = clamp(state.happiness + 22, 0, MAX_STAT);
      state.energy = clamp(state.energy - 2, 0, MAX_STAT);
      state.totalProgress += 9;
    }
  },
  feed_treat: {
    label: "Рыбка-вкусняшка",
    minLevel: 1,
    apply: (state) => {
      state.fullness = MAX_STAT;
      state.happiness = MAX_STAT;
      state.energy = clamp(state.energy - 50, 0, MAX_STAT);
      state.totalProgress += 14;
    }
  },
  feed_cookie: {
    label: "Печенька",
    minLevel: 1,
    apply: (state) => {
      state.fullness = clamp(state.fullness + 14, 0, MAX_STAT);
      state.happiness = clamp(state.happiness + 12, 0, MAX_STAT);
      state.energy = clamp(state.energy - 10, 0, MAX_STAT);
      state.totalProgress += 10;
    }
  },
  feed_drumstick: {
    label: "Куриная ножка",
    minLevel: 1,
    apply: (state) => {
      state.fullness = clamp(state.fullness + 24, 0, MAX_STAT);
      state.happiness = clamp(state.happiness + 8, 0, MAX_STAT);
      state.energy = clamp(state.energy - 12, 0, MAX_STAT);
      state.totalProgress += 10;
    }
  },
  play: {
    label: "Поиграть",
    minLevel: 1,
    apply: (state) => {
      state.happiness = clamp(state.happiness + 20, 0, MAX_STAT);
      state.energy = clamp(state.energy - 8, 0, MAX_STAT);
      state.fullness = clamp(state.fullness - 6, 0, MAX_STAT);
      state.totalProgress += 10;
    }
  },
  sleep: {
    label: "Спать",
    minLevel: 1,
    apply: (state) => {
      state.energy = clamp(state.energy + 22, 0, MAX_STAT);
      state.totalProgress += 10;
    }
  },
  groom: {
    label: "Расчесать",
    minLevel: 2,
    apply: (state) => {
      state.happiness = clamp(state.happiness + 12, 0, MAX_STAT);
      state.energy = clamp(state.energy - 4, 0, MAX_STAT);
      state.totalProgress += 12;
    }
  },
  train: {
    label: "Тренировка",
    minLevel: 3,
    apply: (state) => {
      state.happiness = clamp(state.happiness + 10, 0, MAX_STAT);
      state.energy = clamp(state.energy - 12, 0, MAX_STAT);
      state.fullness = clamp(state.fullness - 8, 0, MAX_STAT);
      state.totalProgress += 16;
    }
  },
  style: {
    label: "Добавить аксессуар",
    minLevel: 4,
    apply: (state) => {
      state.happiness = clamp(state.happiness + 16, 0, MAX_STAT);
      state.energy = clamp(state.energy - 6, 0, MAX_STAT);
      state.totalProgress += 18;
    }
  },
  adventure: {
    label: "Эпичное приключение",
    minLevel: 5,
    apply: (state) => {
      state.happiness = clamp(state.happiness + 18, 0, MAX_STAT);
      state.energy = clamp(state.energy - 16, 0, MAX_STAT);
      state.fullness = clamp(state.fullness - 10, 0, MAX_STAT);
      state.totalProgress += 22;
    }
  }
};

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getLevel(totalProgress) {
  let current = 1;

  for (const levelInfo of LEVELS) {
    if (totalProgress >= levelInfo.minProgress) {
      current = levelInfo.level;
    }
  }

  return current;
}

function getLevelName(level) {
  const found = LEVELS.find((item) => item.level === level);
  return found ? found.name : "Кот";
}

function getUnlockedActions(level) {
  const result = [];

  for (const [key, action] of Object.entries(ACTIONS)) {
    if (level >= action.minLevel) {
      result.push({
        key,
        label: action.label,
        minLevel: action.minLevel
      });
    }
  }

  return result;
}

function getCurrentRoom(state) {
  const found = ROOMS.find((room) => room.key === state.currentRoom);
  return found || ROOMS.find((room) => room.key === DEFAULT_ROOM);
}

function getRoomIndex(roomKey) {
  return ROOMS.findIndex((room) => room.key === roomKey);
}

function moveRoom(currentRoom, direction) {
  const fromIndex = getRoomIndex(currentRoom);
  const baseIndex = fromIndex >= 0 ? fromIndex : getRoomIndex(DEFAULT_ROOM);

  if (direction === "left") {
    return ROOMS[(baseIndex - 1 + ROOMS.length) % ROOMS.length].key;
  }

  if (direction === "right") {
    return ROOMS[(baseIndex + 1) % ROOMS.length].key;
  }

  return currentRoom;
}

function withComputedFields(state) {
  const level = getLevel(state.totalProgress);
  const avg = Math.round((state.fullness + state.happiness + state.energy) / 3);
  const room = getCurrentRoom(state);
  const unlockedActions = getUnlockedActions(level);
  const availableActions = unlockedActions.filter((action) => room.allowedActions.includes(action.key));

  return {
    ...state,
    level,
    levelName: getLevelName(level),
    averageMood: avg,
    catImage: `/images/cat-level-${level}.svg`,
    currentRoom: room.key,
    currentRoomName: room.name,
    rooms: ROOMS.map((roomItem) => ({
      key: roomItem.key,
      name: roomItem.name
    })),
    availableActions
  };
}

function normalizeLoadedState(loadedState) {
  if (!loadedState || typeof loadedState !== "object") {
    return null;
  }

  return {
    catName: String(loadedState.catName || "").trim() || "Кот",
    fullness: clamp(Number(loadedState.fullness ?? 70), 0, MAX_STAT),
    happiness: clamp(Number(loadedState.happiness ?? 70), 0, MAX_STAT),
    energy: clamp(Number(loadedState.energy ?? 70), 0, MAX_STAT),
    totalProgress: Math.max(0, Number(loadedState.totalProgress ?? 0)),
    lastUpdated: Number(loadedState.lastUpdated || Date.now()),
    currentRoom: ROOMS.some((room) => room.key === loadedState.currentRoom)
      ? loadedState.currentRoom
      : DEFAULT_ROOM
  };
}

function loadState() {
  if (!fs.existsSync(SAVE_FILE)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(SAVE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return normalizeLoadedState(parsed);
  } catch (error) {
    console.error("Не удалось прочитать сохранение:", error.message);
    return null;
  }
}

function saveState(state) {
  const directory = path.dirname(SAVE_FILE);

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  fs.writeFileSync(SAVE_FILE, JSON.stringify(state, null, 2), "utf8");
}

function applyDecay(state) {
  const now = Date.now();
  const elapsedMs = now - state.lastUpdated;
  const elapsedMinutes = elapsedMs / 60000;
  const decayAmount = Math.floor(elapsedMinutes * DECAY_PER_MINUTE);

  // Уменьшаем показатели только если прошел достаточный промежуток времени.
  if (decayAmount > 0) {
    state.fullness = clamp(state.fullness - decayAmount, 0, MAX_STAT);
    state.happiness = clamp(state.happiness - decayAmount, 0, MAX_STAT);
    state.energy = clamp(state.energy - decayAmount, 0, MAX_STAT);
    state.lastUpdated = now;
  }

  return decayAmount > 0;
}

let state = loadState();

app.get("/api/state", (req, res) => {
  if (!state) {
    return res.json({ started: false });
  }

  const changed = applyDecay(state);

  if (changed) {
    saveState(state);
  }

  return res.json({
    started: true,
    ...withComputedFields(state)
  });
});

app.post("/api/start", (req, res) => {
  const name = String(req.body?.name || "").trim();

  if (!name) {
    return res.status(400).json({ error: "Введите имя кота" });
  }

  state = {
    catName: name,
    fullness: 70,
    happiness: 70,
    energy: 70,
    totalProgress: 0,
    lastUpdated: Date.now(),
    currentRoom: DEFAULT_ROOM
  };

  saveState(state);

  return res.status(201).json({
    started: true,
    ...withComputedFields(state)
  });
});

app.post("/api/action", (req, res) => {
  if (!state) {
    return res.status(400).json({ error: "Сначала создайте кота" });
  }

  applyDecay(state);

  const action = req.body?.action;
  const actionConfig = ACTIONS[action];
  const level = getLevel(state.totalProgress);
  const room = getCurrentRoom(state);

  if (!actionConfig) {
    return res.status(400).json({ error: "Неизвестное действие" });
  }

  if (level < actionConfig.minLevel) {
    return res.status(403).json({ error: "Это действие откроется на более высоком уровне" });
  }

  if (!room.allowedActions.includes(action)) {
    return res.status(403).json({ error: `Действие недоступно в комнате: ${room.name}` });
  }

  actionConfig.apply(state);

  state.lastUpdated = Date.now();
  saveState(state);

  return res.json({
    started: true,
    ...withComputedFields(state)
  });
});

app.post("/api/move", (req, res) => {
  if (!state) {
    return res.status(400).json({ error: "Сначала создайте кота" });
  }

  const direction = req.body?.direction;

  if (direction !== "left" && direction !== "right") {
    return res.status(400).json({ error: "Некорректное направление" });
  }

  state.currentRoom = moveRoom(state.currentRoom, direction);
  state.lastUpdated = Date.now();
  saveState(state);

  return res.json({
    started: true,
    ...withComputedFields(state)
  });
});

app.post("/api/reset", (req, res) => {
  state = null;

  try {
    if (fs.existsSync(SAVE_FILE)) {
      fs.unlinkSync(SAVE_FILE);
    }
  } catch (error) {
    return res.status(500).json({ error: "Не удалось удалить сохранение" });
  }

  return res.json({ started: false });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});
