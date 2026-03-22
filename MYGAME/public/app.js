const setupSection = document.getElementById("setup");
const gameSection = document.getElementById("game");
const startForm = document.getElementById("start-form");
const catNameInput = document.getElementById("cat-name");
const setupError = document.getElementById("setup-error");

const catTitle = document.getElementById("cat-title");
const levelName = document.getElementById("level-name");
const roomName = document.getElementById("room-name");
const roomScene = document.getElementById("room-scene");
const catImage = document.getElementById("cat-image");
const sleepOverlay = document.getElementById("sleep-overlay");
const catAccessory = document.getElementById("cat-accessory");
const progressText = document.getElementById("progress-text");
const actionsContainer = document.getElementById("actions");
const moveLeftButton = document.getElementById("move-left");
const moveRightButton = document.getElementById("move-right");

const fullnessBar = document.getElementById("fullness-bar");
const happinessBar = document.getElementById("happiness-bar");
const energyBar = document.getElementById("energy-bar");

const fullnessValue = document.getElementById("fullness-value");
const happinessValue = document.getElementById("happiness-value");
const energyValue = document.getElementById("energy-value");

const settingsBtn = document.getElementById("settings-btn");
const settingsModal = document.getElementById("settings-modal");
const closeSettingsBtn = document.getElementById("close-settings");
const modalResetBtn = document.getElementById("modal-reset-btn");
const languageSelect = document.getElementById("language-select");
const volumeSlider = document.getElementById("volume-slider");
const volumeValue = document.getElementById("volume-value");

const SLEEPING_IMAGE = "/images/cat-sleeping.svg";

const ACTION_META = {
  pet: { icon: "✋", label: "Погладить" },
  feed_treat: { icon: "🐟", label: "Рыбка-вкусняшка" },
  feed_cookie: { icon: "🍪", label: "Печенька" },
  feed_drumstick: { icon: "🍗", label: "Куриная ножка" },
  groom: { icon: "🪮", label: "Расческа" },
  play: { icon: "🐭", label: "Игрушка-мышка" },
  train: { icon: "🏋️", label: "Тренировка" },
  adventure: { icon: "🧭", label: "Приключение" }
};

const ACCESSORIES = {
  bow: { icon: "🎀", label: "Бантик", className: "accessory-bow" },
  tie: { icon: "👔", label: "Галстук", className: "accessory-tie" },
  collar: { icon: "📿", label: "Ошейник", className: "accessory-collar" }
};

let isBusy = false;
let currentLanguage = localStorage.getItem("language") || "ru";
let currentVolume = Number(localStorage.getItem("volume") || 50);
let isSleeping = false;
let currentState = null;
let selectedAccessory = localStorage.getItem("selectedAccessory") || "";

function showSettings() {
  settingsModal.classList.remove("hidden");
  languageSelect.value = currentLanguage;
  volumeSlider.value = String(currentVolume);
  volumeValue.textContent = `${currentVolume}%`;
}

function closeSettings() {
  settingsModal.classList.add("hidden");
}

function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem("language", lang);
}

function setVolume(value) {
  currentVolume = Number(value);
  localStorage.setItem("volume", String(currentVolume));
  volumeValue.textContent = `${currentVolume}%`;
}

function showSetup(error = "") {
  setupSection.classList.remove("hidden");
  gameSection.classList.add("hidden");

  if (error) {
    setupError.classList.remove("hidden");
    setupError.textContent = error;
  } else {
    setupError.classList.add("hidden");
    setupError.textContent = "";
  }
}

function showGame() {
  setupSection.classList.add("hidden");
  gameSection.classList.remove("hidden");
}

function updateBar(barElement, valueElement, value) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));
  barElement.style.width = `${safeValue}%`;
  valueElement.textContent = `${safeValue}/100`;
}

function setSleepMode(enabled) {
  isSleeping = enabled;

  if (enabled) {
    sleepOverlay.classList.remove("hidden");
    roomScene.classList.add("sleeping");
    catImage.src = SLEEPING_IMAGE;
    catImage.alt = "Спящий кот";
  } else {
    sleepOverlay.classList.add("hidden");
    roomScene.classList.remove("sleeping");

    if (currentState) {
      catImage.src = currentState.catImage;
      catImage.alt = `Кот ${currentState.catName} (уровень ${currentState.level})`;
    }
  }

  renderActions(currentState?.availableActions || []);
}

function applyAccessoryVisual() {
  if (!selectedAccessory || !ACCESSORIES[selectedAccessory]) {
    catAccessory.className = "cat-accessory hidden";
    catAccessory.textContent = "";
    return;
  }

  const config = ACCESSORIES[selectedAccessory];
  catAccessory.className = `cat-accessory ${config.className}`;
  catAccessory.textContent = config.icon;
}

function equipAccessory(accessoryKey) {
  selectedAccessory = accessoryKey;
  localStorage.setItem("selectedAccessory", accessoryKey);
  applyAccessoryVisual();
}

function renderState(state) {
  currentState = state;
  catTitle.textContent = `Кот: ${state.catName}`;
  levelName.textContent = state.levelName;
  roomName.textContent = state.currentRoomName;

  if (!isSleeping) {
    catImage.src = state.catImage;
    catImage.alt = `Кот ${state.catName} (уровень ${state.level})`;
  }

  document.body.dataset.level = String(state.level);
  document.body.dataset.room = String(state.currentRoom || "kitchen");

  updateBar(fullnessBar, fullnessValue, state.fullness);
  updateBar(happinessBar, happinessValue, state.happiness);
  updateBar(energyBar, energyValue, state.energy);

  progressText.textContent = `Общий прогресс: ${state.totalProgress}. Среднее состояние: ${state.averageMood}/100`;

  applyAccessoryVisual();
  renderActions(state.availableActions || []);
}

function findAction(availableActions, key) {
  return availableActions.find((action) => action.key === key);
}

function createDraggableAction(actionKey, availableActions) {
  const action = findAction(availableActions, actionKey);

  if (!action) {
    return null;
  }

  const meta = ACTION_META[actionKey] || { icon: "✨", label: action.label };
  const token = document.createElement("button");
  token.type = "button";
  token.className = "tool-token";
  token.draggable = true;
  token.dataset.action = actionKey;
  token.innerHTML = `<span class="tool-icon">${meta.icon}</span><span class="tool-label">${meta.label}</span>`;

  token.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData("text/plain", actionKey);
    event.dataTransfer.effectAllowed = "move";
  });

  token.addEventListener("click", () => {
    performAction(actionKey);
  });

  return token;
}

function createAccessoryPicker() {
  const wrap = document.createElement("div");
  wrap.className = "accessory-picker";

  const title = document.createElement("p");
  title.className = "picker-title";
  title.textContent = "Аксессуары:";
  wrap.appendChild(title);

  const row = document.createElement("div");
  row.className = "accessory-row";

  for (const [key, item] of Object.entries(ACCESSORIES)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `accessory-option${selectedAccessory === key ? " active" : ""}`;
    button.innerHTML = `<span>${item.icon}</span>${item.label}`;
    button.addEventListener("click", async () => {
      equipAccessory(key);
      await performAction("style");
    });
    row.appendChild(button);
  }

  wrap.appendChild(row);
  return wrap;
}

function renderActions(availableActions) {
  actionsContainer.innerHTML = "";

  const toolsRow = document.createElement("div");
  toolsRow.className = "tools-row";

  const preferredOrder = [
    "pet",
    "feed_treat",
    "feed_cookie",
    "feed_drumstick",
    "groom",
    "play",
    "train",
    "adventure"
  ];

  for (const key of preferredOrder) {
    const tool = createDraggableAction(key, availableActions);

    if (tool) {
      toolsRow.appendChild(tool);
    }
  }

  actionsContainer.appendChild(toolsRow);

  if (findAction(availableActions, "sleep")) {
    const sleepControls = document.createElement("div");
    sleepControls.className = "sleep-controls";

    const sleepButton = document.createElement("button");
    sleepButton.type = "button";
    sleepButton.className = "mini-btn";
    sleepButton.textContent = "Спать";
    sleepButton.disabled = isSleeping;
    sleepButton.addEventListener("click", async () => {
      await performAction("sleep");
      setSleepMode(true);
    });

    sleepControls.appendChild(sleepButton);

    if (isSleeping) {
      const lightButton = document.createElement("button");
      lightButton.type = "button";
      lightButton.className = "mini-btn";
      lightButton.textContent = "Вкл свет";
      lightButton.addEventListener("click", () => setSleepMode(false));
      sleepControls.appendChild(lightButton);
    }

    actionsContainer.appendChild(sleepControls);
  }

  if (findAction(availableActions, "style")) {
    actionsContainer.appendChild(createAccessoryPicker());
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Ошибка запроса");
  }

  return data;
}

async function loadState() {
  try {
    const state = await requestJson("/api/state");

    if (!state.started) {
      showSetup();
      return;
    }

    showGame();
    renderState(state);
  } catch (error) {
    showSetup(error.message);
  }
}

async function performAction(action) {
  if (isBusy) {
    return;
  }

  isBusy = true;

  try {
    const state = await requestJson("/api/action", {
      method: "POST",
      body: JSON.stringify({ action })
    });

    renderState(state);
  } catch (error) {
    alert(error.message);
  } finally {
    isBusy = false;
  }
}

async function moveRoom(direction) {
  if (isBusy) {
    return;
  }

  isBusy = true;

  try {
    const state = await requestJson("/api/move", {
      method: "POST",
      body: JSON.stringify({ direction })
    });

    renderState(state);
  } catch (error) {
    alert(error.message);
  } finally {
    isBusy = false;
  }
}

async function resetProgress() {
  if (isBusy) {
    return;
  }

  const confirmed = confirm("Сбросить весь прогресс и начать заново?");

  if (!confirmed) {
    return;
  }

  isBusy = true;

  try {
    await requestJson("/api/reset", {
      method: "POST",
      body: JSON.stringify({})
    });

    setSleepMode(false);
    document.body.dataset.level = "1";
    document.body.dataset.room = "kitchen";
    showSetup();
  } catch (error) {
    alert(error.message);
  } finally {
    isBusy = false;
  }
}

startForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = catNameInput.value.trim();

  if (!name) {
    showSetup("Введите имя кота");
    return;
  }

  try {
    const state = await requestJson("/api/start", {
      method: "POST",
      body: JSON.stringify({ name })
    });

    showGame();
    renderState(state);
  } catch (error) {
    showSetup(error.message);
  }
});

roomScene.addEventListener("dragover", (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  roomScene.classList.add("drop-target");
});

roomScene.addEventListener("dragleave", () => {
  roomScene.classList.remove("drop-target");
});

roomScene.addEventListener("drop", async (event) => {
  event.preventDefault();
  roomScene.classList.remove("drop-target");

  const action = event.dataTransfer.getData("text/plain");

  if (action) {
    await performAction(action);
  }
});

moveLeftButton.addEventListener("click", () => moveRoom("left"));
moveRightButton.addEventListener("click", () => moveRoom("right"));

settingsBtn.addEventListener("click", showSettings);
closeSettingsBtn.addEventListener("click", closeSettings);

settingsModal.addEventListener("click", (event) => {
  if (event.target === settingsModal) {
    closeSettings();
  }
});

modalResetBtn.addEventListener("click", async () => {
  closeSettings();
  await resetProgress();
});

languageSelect.addEventListener("change", (event) => {
  setLanguage(event.target.value);
});

volumeSlider.addEventListener("input", (event) => {
  setVolume(event.target.value);
});

document.addEventListener("keydown", (event) => {
  if (gameSection.classList.contains("hidden")) {
    return;
  }

  if (event.key === "ArrowLeft") {
    moveRoom("left");
  }

  if (event.key === "ArrowRight") {
    moveRoom("right");
  }
});

setInterval(loadState, 10000);

loadState();
