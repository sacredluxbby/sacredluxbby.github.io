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
const titleMain = document.querySelector(".title-wrap h1");
const titleSubtitle = document.querySelector(".title-wrap p");
const setupTitle = document.querySelector("#setup h2");
const setupText = document.querySelector("#setup > p");
const startButton = startForm.querySelector("button[type='submit']");
const statusTitle = document.querySelector(".status-panel-compact h3");
const statLabels = document.querySelectorAll(".stat-item label");
const statusPanel = document.querySelector(".status-panel-compact");
const settingsTitle = document.querySelector(".modal-header h2");
const languageLabel = document.querySelector("label[for='language-select']");
const volumeLabel = document.querySelector("label[for='volume-slider']");
const roomNav = document.querySelector(".room-nav");

const SLEEPING_IMAGE = "/%D1%81%D0%BF%D1%8F%D1%89%D0%B8%D0%B9%20%D0%BA%D0%BE%D1%82.svg";

const ACTION_META = {
  pet: { icon: "✋", image: "/рука.svg", imageAlt: "Рука" },
  feed_treat: { icon: "🐟", image: "/рыба.svg", imageAlt: "Рыба" },
  feed_cookie: { icon: "🍪", image: "/печенька.svg", imageAlt: "Печенька" },
  feed_drumstick: { icon: "🍗", image: "/нога.svg", imageAlt: "Куриная ножка" },
  groom: { icon: "🪮", image: "/расческа.svg", imageAlt: "Расческа" },
  play: { icon: "🐭", image: "/мышка.svg", imageAlt: "Игрушка-мышка" },
  train: { icon: "🏋️", image: "/гантелька.svg", imageAlt: "Гантелька" },
  adventure: { icon: "🧭" }
};

const KITCHEN_FOOD_ACTIONS = ["feed_cookie", "feed_treat", "feed_drumstick"];

const ACCESSORIES = {
  bow: { icon: "🎀", image: "/бант.svg", imageAlt: "Бантик", defaultPoint: { x: 47, y: 24 } },
  tie: { icon: "👔", image: "/галстук.svg", imageAlt: "Галстук", defaultPoint: { x: 50, y: 55 } },
  collar: { icon: "📿", image: "/ошейник.svg", imageAlt: "Ошейник", defaultPoint: { x: 49, y: 46 } }
};

const I18N = {
  ru: {
    appTitle: "Симулятор кота",
    appSubtitle: "Вырастите своего пушистого героя от котенка до легенды",
    firstLaunch: "Первый запуск",
    setupHint: "Введите имя своего кота, чтобы начать игру.",
    start: "Начать",
    catPlaceholder: "Например: Барсик",
    catTitle: "Кот: {name}",
    status: "Состояние",
    fullness: "Сытость",
    happiness: "Радость",
    energy: "Энергия",
    progress: "Общий прогресс: {progress}. Среднее состояние: {mood}/100",
    settings: "Настройки",
    close: "Закрыть",
    language: "Язык:",
    volume: "Громкость:",
    reset: "Сбросить прогресс",
    resetConfirm: "Сбросить весь прогресс и начать заново?",
    roomNav: "Перемещение по комнатам",
    roomLeft: "Комната слева",
    roomRight: "Комната справа",
    sleep: "Спать",
    lightOn: "Вкл свет",
    sleepingCatAlt: "Спящий кот",
    accessories: "Аксессуары:",
    removeAccessory: "Снять",
    actions: {
      pet: "Погладить",
      feed_treat: "Рыбка-вкусняшка",
      feed_cookie: "Печенька",
      feed_drumstick: "Куриная ножка",
      groom: "Расческа",
      play: "Игрушка-мышка",
      train: "Тренировка",
      adventure: "Приключение",
      style: "Добавить аксессуар"
    },
    accessoriesNames: {
      bow: "Бантик",
      tie: "Галстук",
      collar: "Ошейник"
    },
    levels: {
      1: "Котенок",
      2: "Кот-подросток",
      3: "Взрослый кот",
      4: "Модный кот",
      5: "Идеальный кот"
    },
    rooms: {
      kitchen: "Кухня",
      yard: "Двор",
      bedroom: "Спальня"
    },
    errors: {
      emptyName: "Введите имя кота",
      unknownAction: "Неизвестное действие",
      createCatFirst: "Сначала создайте кота",
      unlockHigherLevel: "Это действие откроется на более высоком уровне",
      wrongDirection: "Некорректное направление",
      requestError: "Ошибка запроса",
      actionUnavailableInRoom: "Действие недоступно в комнате: {room}",
      sleepBedroomOnly: "Спать можно только в спальне",
      wakeUpFirst: "Сначала включите свет"
    },
    languageOptions: {
      ru: "Русский",
      en: "English",
      et: "Eesti"
    }
  },
  en: {
    appTitle: "Cat Simulator",
    appSubtitle: "Raise your fluffy hero from kitten to legend",
    firstLaunch: "First launch",
    setupHint: "Enter your cat's name to start the game.",
    start: "Start",
    catPlaceholder: "For example: Barsik",
    catTitle: "Cat: {name}",
    status: "Status",
    fullness: "Fullness",
    happiness: "Happiness",
    energy: "Energy",
    progress: "Total progress: {progress}. Average condition: {mood}/100",
    settings: "Settings",
    close: "Close",
    language: "Language:",
    volume: "Volume:",
    reset: "Reset progress",
    resetConfirm: "Reset all progress and start over?",
    roomNav: "Move between rooms",
    roomLeft: "Room to the left",
    roomRight: "Room to the right",
    sleep: "Sleep",
    lightOn: "Turn on light",
    sleepingCatAlt: "Sleeping cat",
    accessories: "Accessories:",
    removeAccessory: "Remove",
    actions: {
      pet: "Pet",
      feed_treat: "Fish treat",
      feed_cookie: "Cookie",
      feed_drumstick: "Chicken drumstick",
      groom: "Brush",
      play: "Toy mouse",
      train: "Workout",
      adventure: "Adventure",
      style: "Add accessory"
    },
    accessoriesNames: {
      bow: "Bow",
      tie: "Tie",
      collar: "Collar"
    },
    levels: {
      1: "Kitten",
      2: "Teen cat",
      3: "Adult cat",
      4: "Fashionable cat",
      5: "Perfect cat"
    },
    rooms: {
      kitchen: "Kitchen",
      yard: "Yard",
      bedroom: "Bedroom"
    },
    errors: {
      emptyName: "Please enter a cat name",
      unknownAction: "Unknown action",
      createCatFirst: "Create a cat first",
      unlockHigherLevel: "This action unlocks at a higher level",
      wrongDirection: "Invalid direction",
      requestError: "Request error",
      actionUnavailableInRoom: "Action is unavailable in room: {room}",
      sleepBedroomOnly: "Sleeping is only available in the bedroom",
      wakeUpFirst: "Turn on the light first"
    },
    languageOptions: {
      ru: "Russian",
      en: "English",
      et: "Estonian"
    }
  },
  et: {
    appTitle: "Kassi simulaator",
    appSubtitle: "Kasvata oma karvane kangelane kassipojast legendiks",
    firstLaunch: "Esimene käivitus",
    setupHint: "Mängu alustamiseks sisesta oma kassi nimi.",
    start: "Alusta",
    catPlaceholder: "Näiteks: Barsik",
    catTitle: "Kass: {name}",
    status: "Seisund",
    fullness: "Kõht täis",
    happiness: "Rõõm",
    energy: "Energia",
    progress: "Koguedu: {progress}. Keskmine seisund: {mood}/100",
    settings: "Seaded",
    close: "Sulge",
    language: "Keel:",
    volume: "Helitugevus:",
    reset: "Lähtesta edenemine",
    resetConfirm: "Lähtesta kogu edenemine ja alusta uuesti?",
    roomNav: "Liikumine tubade vahel",
    roomLeft: "Tuba vasakul",
    roomRight: "Tuba paremal",
    sleep: "Maga",
    lightOn: "Lülita tuli sisse",
    sleepingCatAlt: "Magav kass",
    accessories: "Aksessuaarid:",
    removeAccessory: "Eemalda",
    actions: {
      pet: "Silita",
      feed_treat: "Kalamaius",
      feed_cookie: "Küpsis",
      feed_drumstick: "Kanakints",
      groom: "Harja",
      play: "Hiire mänguasi",
      train: "Treening",
      adventure: "Seiklus",
      style: "Lisa aksessuaar"
    },
    accessoriesNames: {
      bow: "Lipsuke",
      tie: "Lips",
      collar: "Kaelarihm"
    },
    levels: {
      1: "Kassipoeg",
      2: "Teismeline kass",
      3: "Täiskasvanud kass",
      4: "Moodne kass",
      5: "Ideaalne kass"
    },
    rooms: {
      kitchen: "Köök",
      yard: "Õu",
      bedroom: "Magamistuba"
    },
    errors: {
      emptyName: "Sisesta kassi nimi",
      unknownAction: "Tundmatu tegevus",
      createCatFirst: "Loo kõigepealt kass",
      unlockHigherLevel: "See tegevus avaneb kõrgemal tasemel",
      wrongDirection: "Vale suund",
      requestError: "Päringu viga",
      actionUnavailableInRoom: "Tegevus pole toas saadaval: {room}",
      sleepBedroomOnly: "Magada saab ainult magamistoas",
      wakeUpFirst: "Lülita enne tuli sisse"
    },
    languageOptions: {
      ru: "Vene",
      en: "Inglise",
      et: "Eesti"
    }
  }
};

let isBusy = false;
let currentLanguage = localStorage.getItem("language") || "ru";
let currentVolume = Number(localStorage.getItem("volume") || 50);
let isSleeping = false;
let currentState = null;
let selectedAccessory = localStorage.getItem("selectedAccessory") || "";
let selectedAccessoryPoint = loadStoredAccessoryPoint();
let currentDragAction = "";
let currentDragAccessory = "";
let petContactActive = false;
let petActionTimer = null;
let petTickInProgress = false;
let activeDragGhost = null;
const PET_TICK_INTERVAL_MS = 2200;
let sleepActionTimer = null;
let sleepTickInProgress = false;
const SLEEP_TICK_INTERVAL_MS = 5200;
const INTERACTION_IMAGES = {
  1: "/%D0%B3%D0%BB%D0%B0%D0%B4%D1%8F%D1%82%20%D0%BB%D0%B2%D0%BB%201.svg",
  2: "/%D0%B3%D0%BB%D0%B0%D0%B4%D1%8F%D1%82%20%D0%BB%D0%B2%D0%BB%202.svg",
  3: "/%D0%B3%D0%BB%D0%B0%D0%B4%D1%8F%D1%82%20%D0%BB%D0%B2%D0%BB%203.svg",
  4: "/%D0%B3%D0%BB%D0%B0%D0%B4%D1%8F%D1%82%20%D0%BB%D0%B2%D0%BB%204.svg",
  5: "/%D0%B3%D0%BB%D0%B0%D0%B4%D1%8F%D1%82%20%D0%BB%D0%B2%D0%BB%205.svg"
};
const INTERACTION_IMAGE_DURATION_MS = 1600;
let interactionImageTimeout = null;
const barDisplayValues = new WeakMap();
const barAnimationFrames = new WeakMap();
const BAR_MAX_STEP_PER_FRAME = 0.08;
let adventureAwayTimeout = null;
let isAdventureAway = false;

function loadStoredAccessoryPoint() {
  try {
    const parsed = JSON.parse(localStorage.getItem("selectedAccessoryPoint") || "null");

    if (
      parsed &&
      typeof parsed.x === "number" &&
      typeof parsed.y === "number" &&
      Number.isFinite(parsed.x) &&
      Number.isFinite(parsed.y)
    ) {
      return {
        x: Math.max(0, Math.min(100, parsed.x)),
        y: Math.max(0, Math.min(100, parsed.y))
      };
    }
  } catch (error) {
    return null;
  }

  return null;
}

function persistAccessoryState() {
  if (!selectedAccessory || !selectedAccessoryPoint) {
    localStorage.removeItem("selectedAccessory");
    localStorage.removeItem("selectedAccessoryPoint");
    return;
  }

  localStorage.setItem("selectedAccessory", selectedAccessory);
  localStorage.setItem("selectedAccessoryPoint", JSON.stringify(selectedAccessoryPoint));
}

function getCatPercentPoint(clientX, clientY) {
  const catRect = catImage.getBoundingClientRect();

  if (!catRect.width || !catRect.height) {
    return null;
  }

  const x = ((clientX - catRect.left) / catRect.width) * 100;
  const y = ((clientY - catRect.top) / catRect.height) * 100;

  return {
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y))
  };
}

function getScenePointFromCatPercent(point) {
  const catRect = catImage.getBoundingClientRect();
  const sceneRect = roomScene.getBoundingClientRect();

  if (!catRect.width || !catRect.height || !sceneRect.width || !sceneRect.height) {
    return null;
  }

  return {
    x: ((catRect.left - sceneRect.left) + (catRect.width * point.x) / 100) / sceneRect.width,
    y: ((catRect.top - sceneRect.top) + (catRect.height * point.y) / 100) / sceneRect.height
  };
}

function setCatContactHighlight(active) {
  roomScene.classList.toggle("cat-contact", active);
}

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
  applyTranslations();

  if (currentState) {
    renderState(currentState);
  }
}

function t(key, params = {}) {
  const langPack = I18N[currentLanguage] || I18N.ru;
  const fallbackPack = I18N.ru;
  const path = key.split(".");

  let value = langPack;

  for (const part of path) {
    value = value?.[part];
  }

  if (typeof value !== "string") {
    value = fallbackPack;

    for (const part of path) {
      value = value?.[part];
    }
  }

  if (typeof value !== "string") {
    return key;
  }

  return value.replace(/\{(\w+)\}/g, (_, token) => String(params[token] ?? ""));
}

function getRoomName(roomKey) {
  return t(`rooms.${roomKey}`);
}

function getLevelName(level) {
  return t(`levels.${level}`);
}

function getLevelCatImage(level, fallbackImage = "") {
  const levelImages = {
    1: "/кот лвл 1.svg",
    2: "/кот лвл 2.svg",
    3: "/кот лвл 3.svg",
    4: "/кот лвл 4.svg",
    5: "/кот лвл 5.svg"
  };

  return levelImages[level] || fallbackImage || levelImages[1];
}

function getActionLabel(actionKey, fallback = "") {
  const translated = t(`actions.${actionKey}`);
  return translated === `actions.${actionKey}` ? (fallback || actionKey) : translated;
}

function getAccessoryLabel(accessoryKey) {
  const translated = t(`accessoriesNames.${accessoryKey}`);
  return translated === `accessoriesNames.${accessoryKey}` ? accessoryKey : translated;
}

function translateServerMessage(message) {
  if (!message) {
    return t("errors.requestError");
  }

  const roomPrefix = "Действие недоступно в комнате: ";

  if (message.startsWith(roomPrefix)) {
    const roomNameRu = message.slice(roomPrefix.length).trim();
    const roomMap = {
      "Кухня": "kitchen",
      "Двор": "yard",
      "Спальня": "bedroom"
    };
    const roomKey = roomMap[roomNameRu] || "kitchen";
    return t("errors.actionUnavailableInRoom", { room: getRoomName(roomKey) });
  }

  const directMap = {
    "Введите имя кота": "errors.emptyName",
    "Неизвестное действие": "errors.unknownAction",
    "Сначала создайте кота": "errors.createCatFirst",
    "Это действие откроется на более высоком уровне": "errors.unlockHigherLevel",
    "Некорректное направление": "errors.wrongDirection",
    "Ошибка запроса": "errors.requestError"
  };

  return directMap[message] ? t(directMap[message]) : message;
}

function applyTranslations() {
  document.documentElement.lang = currentLanguage;
  titleMain.textContent = t("appTitle");
  titleSubtitle.textContent = t("appSubtitle");
  setupTitle.textContent = t("firstLaunch");
  setupText.textContent = t("setupHint");
  startButton.textContent = t("start");
  catNameInput.placeholder = t("catPlaceholder");
  statusTitle.textContent = t("status");
  statLabels[0].textContent = t("fullness");
  statLabels[1].textContent = t("happiness");
  statLabels[2].textContent = t("energy");
  settingsTitle.textContent = t("settings");
  languageLabel.textContent = t("language");
  volumeLabel.textContent = t("volume");
  modalResetBtn.textContent = t("reset");
  roomNav.setAttribute("aria-label", t("roomNav"));
  moveLeftButton.setAttribute("aria-label", t("roomLeft"));
  moveRightButton.setAttribute("aria-label", t("roomRight"));
  settingsBtn.setAttribute("aria-label", t("settings"));
  closeSettingsBtn.setAttribute("aria-label", t("close"));

  const languageOptions = languageSelect.options;
  languageOptions[0].textContent = t("languageOptions.ru");
  languageOptions[1].textContent = t("languageOptions.en");
  languageOptions[2].textContent = t("languageOptions.et");

  if (!setupError.classList.contains("hidden") && setupError.textContent) {
    setupError.textContent = translateServerMessage(setupError.textContent);
  }
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
    setupError.textContent = translateServerMessage(error);
  } else {
    setupError.classList.add("hidden");
    setupError.textContent = "";
  }
}

function showGame() {
  setupSection.classList.add("hidden");
  gameSection.classList.remove("hidden");
}

function updateRoomControlsAvailability() {
  const disabled = isSleeping;
  moveLeftButton.disabled = disabled;
  moveRightButton.disabled = disabled;
}

function animateBarValue(barElement, valueElement, targetValue) {
  const safeTarget = Math.max(0, Math.min(100, Number(targetValue)));
  const previousFrame = barAnimationFrames.get(barElement);

  if (previousFrame) {
    cancelAnimationFrame(previousFrame);
  }

  const startValue = barDisplayValues.has(barElement)
    ? barDisplayValues.get(barElement)
    : safeTarget;
  const delta = Math.abs(safeTarget - startValue);

  if (delta < 0.01) {
    barElement.style.width = `${safeTarget}%`;
    valueElement.textContent = `${Math.round(safeTarget)}/100`;
    barDisplayValues.set(barElement, safeTarget);
    return;
  }

  const stepDirection = safeTarget > startValue ? 1 : -1;

  const step = () => {
    const currentValue = barDisplayValues.has(barElement)
      ? barDisplayValues.get(barElement)
      : startValue;
    const nextValue = currentValue + (BAR_MAX_STEP_PER_FRAME * stepDirection);
    const reachedTarget = stepDirection > 0 ? nextValue >= safeTarget : nextValue <= safeTarget;
    const current = reachedTarget ? safeTarget : nextValue;

    barElement.style.width = `${current}%`;
    valueElement.textContent = `${Math.round(current)}/100`;
    barDisplayValues.set(barElement, current);

    if (!reachedTarget) {
      const frameId = requestAnimationFrame(step);
      barAnimationFrames.set(barElement, frameId);
      return;
    }

    barDisplayValues.set(barElement, safeTarget);
    barAnimationFrames.delete(barElement);
  };

  const frameId = requestAnimationFrame(step);
  barAnimationFrames.set(barElement, frameId);
}

function updateBar(barElement, valueElement, value) {
  const safeValue = Math.max(0, Math.min(100, Number(value)));
  animateBarValue(barElement, valueElement, safeValue);

  if (barElement === happinessBar) {
    const hue = Math.round((safeValue / 100) * 120);
    const startHue = Math.max(0, hue - 15);
    barElement.style.background = `linear-gradient(90deg, hsl(${startHue}, 82%, 45%), hsl(${hue}, 76%, 48%))`;
  }
}

function createDragGhost(content) {
  const ghost = document.createElement("div");
  ghost.className = "drag-sticker";

  if (content instanceof Element) {
    ghost.classList.add("with-image");
    const clone = content.cloneNode(true);
    ghost.appendChild(clone);
  } else {
    ghost.textContent = content;
  }

  document.body.appendChild(ghost);
  return ghost;
}

function clearDragGhost() {
  if (!activeDragGhost) {
    return;
  }

  activeDragGhost.remove();
  activeDragGhost = null;
}

function isPointInsideElement(x, y, element) {
  const rect = element.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function isPointInsideLamp(clientX, clientY) {
  const sceneRect = roomScene.getBoundingClientRect();

  if (!sceneRect.width || !sceneRect.height) {
    return false;
  }

  const lampWidth = 86;
  const lampHeight = 176;
  const rightOffset = sceneRect.width * 0.08;
  const bottomOffset = sceneRect.height * 0.17;

  const lampLeft = sceneRect.right - rightOffset - lampWidth;
  const lampTop = sceneRect.bottom - bottomOffset - lampHeight;
  const lampRight = lampLeft + lampWidth;
  const lampBottom = lampTop + lampHeight;

  return clientX >= lampLeft && clientX <= lampRight && clientY >= lampTop && clientY <= lampBottom;
}

function setPetContact(active) {
  petContactActive = active;
  setCatContactHighlight(active);

  const interactionImage = currentState ? INTERACTION_IMAGES[currentState.level] : "";

  if (currentState && interactionImage && !isSleeping) {
    if (active) {
      catImage.src = interactionImage;
    } else if (!interactionImageTimeout) {
      catImage.src = getLevelCatImage(currentState.level, currentState.catImage);
    }
  }

  if (active) {
    startPetLoop();
  }
}

function setGroomContact(active) {
  setCatContactHighlight(active);

  const interactionImage = currentState ? INTERACTION_IMAGES[currentState.level] : "";

  if (currentState && interactionImage && !isSleeping) {
    if (active) {
      catImage.src = interactionImage;
    } else if (!interactionImageTimeout) {
      catImage.src = getLevelCatImage(currentState.level, currentState.catImage);
    }
  }
}

function stopPetLoop() {
  if (!petActionTimer) {
    return;
  }

  clearInterval(petActionTimer);
  petActionTimer = null;
}

function resetDragInteraction() {
  const dragAction = currentDragAction;
  currentDragAction = "";
  currentDragAccessory = "";
  setPetContact(false);
  if (dragAction === "groom") {
    setGroomContact(false);
  }
  stopPetLoop();
  roomScene.classList.remove("drop-target", "pet-drag-mode", "accessory-drag-mode", "cat-contact");
  clearDragGhost();
}

function setAdventureAway(active) {
  isAdventureAway = active;
  roomScene.classList.toggle("adventure-away", active);
}

function triggerAdventureDisappear() {
  if (adventureAwayTimeout) {
    clearTimeout(adventureAwayTimeout);
  }

  setAdventureAway(true);

  adventureAwayTimeout = setTimeout(() => {
    setAdventureAway(false);
    adventureAwayTimeout = null;
  }, 5000);
}

function startPetLoop() {
  if (petActionTimer || !petContactActive) {
    return;
  }

  petActionTimer = setInterval(async () => {
    if (petTickInProgress || !petContactActive || isSleeping) {
      return;
    }

    petTickInProgress = true;

    try {
      await performAction("pet", { skipActions: true, suppressError: true });
    } finally {
      petTickInProgress = false;
    }
  }, PET_TICK_INTERVAL_MS);
}

function stopSleepLoop() {
  if (!sleepActionTimer) {
    return;
  }

  clearInterval(sleepActionTimer);
  sleepActionTimer = null;
}

function startSleepLoop() {
  if (sleepActionTimer || !isSleeping) {
    return;
  }

  sleepActionTimer = setInterval(async () => {
    if (sleepTickInProgress || !isSleeping) {
      return;
    }

    if (!currentState || currentState.currentRoom !== "bedroom") {
      setSleepMode(false);
      return;
    }

    if (currentState && currentState.energy >= 100) {
      return;
    }

    sleepTickInProgress = true;

    try {
      await performAction("sleep", { skipActions: true, suppressError: true });
    } finally {
      sleepTickInProgress = false;
    }
  }, SLEEP_TICK_INTERVAL_MS);
}

function setSleepMode(enabled) {
  if (enabled && (!currentState || currentState.currentRoom !== "bedroom")) {
    alert(t("errors.sleepBedroomOnly"));
    return;
  }

  isSleeping = enabled;
  updateRoomControlsAvailability();

  if (enabled) {
    if (interactionImageTimeout) {
      clearTimeout(interactionImageTimeout);
      interactionImageTimeout = null;
    }

    sleepOverlay.classList.remove("hidden");
    roomScene.classList.add("sleeping");
    catImage.src = SLEEPING_IMAGE;
    catImage.alt = t("sleepingCatAlt");
    startSleepLoop();
  } else {
    stopSleepLoop();
    sleepOverlay.classList.add("hidden");
    roomScene.classList.remove("sleeping");

    if (currentState) {
      catImage.src = getLevelCatImage(currentState.level, currentState.catImage);
      catImage.alt = t("catTitle", { name: currentState.catName });
    }
  }

  renderActions(currentState?.availableActions || []);
}

function showInteractionImage(action, state) {
  if (!state || isSleeping) {
    return;
  }

  if (action !== "pet" && action !== "groom") {
    return;
  }

  const interactionImage = INTERACTION_IMAGES[state.level];

  if (!interactionImage) {
    return;
  }

  if (interactionImageTimeout) {
    clearTimeout(interactionImageTimeout);
  }

  catImage.src = interactionImage;

  interactionImageTimeout = setTimeout(() => {
    interactionImageTimeout = null;

    if (!currentState || isSleeping) {
      return;
    }

    catImage.src = getLevelCatImage(currentState.level, currentState.catImage);
  }, INTERACTION_IMAGE_DURATION_MS);
}

function applyAccessoryVisual() {
  if (!selectedAccessory || !ACCESSORIES[selectedAccessory] || !selectedAccessoryPoint) {
    catAccessory.className = "cat-accessory hidden";
    catAccessory.innerHTML = "";
    catAccessory.style.left = "";
    catAccessory.style.top = "";
    return;
  }

  const config = ACCESSORIES[selectedAccessory];
  const scenePoint = getScenePointFromCatPercent(selectedAccessoryPoint);

  if (!scenePoint) {
    return;
  }

  catAccessory.className = "cat-accessory";

  if (config.image) {
    catAccessory.innerHTML = `<img class="cat-accessory-image" src="${config.image}" alt="${config.imageAlt || getAccessoryLabel(selectedAccessory)}">`;
  } else {
    catAccessory.textContent = config.icon;
  }

  catAccessory.style.left = `${scenePoint.x * 100}%`;
  catAccessory.style.top = `${scenePoint.y * 100}%`;
}

function equipAccessory(accessoryKey, point = null) {
  if (!ACCESSORIES[accessoryKey]) {
    return;
  }

  selectedAccessory = accessoryKey;
  selectedAccessoryPoint = point || selectedAccessoryPoint || ACCESSORIES[accessoryKey].defaultPoint;
  persistAccessoryState();
  applyAccessoryVisual();
}

function removeAccessory() {
  selectedAccessory = "";
  selectedAccessoryPoint = null;
  persistAccessoryState();
  applyAccessoryVisual();
  renderActions(currentState?.availableActions || []);
}

function renderState(state, options = {}) {
  currentState = state;

  if (isSleeping && state.currentRoom !== "bedroom") {
    setSleepMode(false);
  }

  catTitle.textContent = t("catTitle", { name: state.catName });
  levelName.textContent = getLevelName(state.level);
  roomName.textContent = getRoomName(state.currentRoom);

  if (!isSleeping) {
    catImage.src = getLevelCatImage(state.level, state.catImage);
    catImage.alt = t("catTitle", { name: state.catName });
  }

  document.body.dataset.level = String(state.level);
  document.body.dataset.room = String(state.currentRoom || "kitchen");

  updateBar(fullnessBar, fullnessValue, state.fullness);
  updateBar(happinessBar, happinessValue, state.happiness);
  updateBar(energyBar, energyValue, state.energy);

  progressText.textContent = t("progress", {
    progress: state.totalProgress,
    mood: state.averageMood
  });

  renderKitchenTable(state.availableActions || []);
  applyAccessoryVisual();

  if (!options.skipActions) {
    renderActions(state.availableActions || []);
  }
}

function findAction(availableActions, key) {
  return availableActions.find((action) => action.key === key);
}

function clearKitchenTable() {
  const existing = roomScene.querySelector(".kitchen-table");

  if (existing) {
    existing.remove();
  }
}

function renderKitchenTable(availableActions) {
  clearKitchenTable();

  if (!currentState || currentState.currentRoom !== "kitchen") {
    return;
  }

  const table = document.createElement("div");
  table.className = "kitchen-table";

  const top = document.createElement("div");
  top.className = "kitchen-table-top";

  for (const actionKey of KITCHEN_FOOD_ACTIONS) {
    if (!findAction(availableActions, actionKey)) {
      continue;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "kitchen-food-item";
    button.draggable = true;
    button.dataset.action = actionKey;

    const actionMeta = ACTION_META[actionKey] || {};

    if (actionMeta.image) {
      button.innerHTML = `<img class="kitchen-food-image" src="${actionMeta.image}" alt="${actionMeta.imageAlt || getActionLabel(actionKey)}">`;
    } else {
      button.textContent = actionMeta.icon || "🍽";
    }

    button.setAttribute("aria-label", getActionLabel(actionKey));
    button.title = getActionLabel(actionKey);

    button.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", actionKey);
      event.dataTransfer.effectAllowed = "move";

      currentDragAction = actionKey;
      const imageIcon = button.querySelector(".kitchen-food-image");

      if (imageIcon) {
        activeDragGhost = createDragGhost(imageIcon);
        event.dataTransfer.setDragImage(activeDragGhost, 14, 14);
      } else {
        activeDragGhost = createDragGhost(button.textContent);
        event.dataTransfer.setDragImage(activeDragGhost, 18, 18);
      }
    });

    button.addEventListener("dragend", () => {
      resetDragInteraction();
    });

    top.appendChild(button);
  }

  table.appendChild(top);
  roomScene.appendChild(table);
}

function createDraggableAction(actionKey, availableActions) {
  const action = findAction(availableActions, actionKey);

  if (!action) {
    return null;
  }

  const meta = ACTION_META[actionKey] || { icon: "✨" };
  const actionLabel = getActionLabel(actionKey, action.label);
  const token = document.createElement("button");
  token.type = "button";
  token.className = "tool-token";
  token.draggable = true;
  token.dataset.action = actionKey;

  const iconMarkup = meta.image
    ? `<img class="tool-icon-image" src="${meta.image}" alt="${meta.imageAlt || actionLabel}">`
    : `<span class="tool-icon">${meta.icon}</span>`;

  token.innerHTML = `${iconMarkup}<span class="tool-label">${actionLabel}</span>`;

  token.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData("text/plain", actionKey);
    event.dataTransfer.effectAllowed = "move";

    currentDragAction = actionKey;
    const imageIcon = token.querySelector(".tool-icon-image");

    if (imageIcon) {
      activeDragGhost = createDragGhost(imageIcon);
      event.dataTransfer.setDragImage(activeDragGhost, 14, 14);
    } else {
      activeDragGhost = createDragGhost(meta.icon);
      event.dataTransfer.setDragImage(activeDragGhost, 18, 18);
    }

    if (actionKey === "pet") {
      roomScene.classList.add("pet-drag-mode");
    }
  });

  token.addEventListener("dragend", () => {
    resetDragInteraction();
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
  title.textContent = t("accessories");
  wrap.appendChild(title);

  const row = document.createElement("div");
  row.className = "accessory-row";

  for (const [key, item] of Object.entries(ACCESSORIES)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `accessory-option${selectedAccessory === key ? " active" : ""}`;
    button.draggable = true;

    const iconMarkup = item.image
      ? `<img class="accessory-option-image" src="${item.image}" alt="${item.imageAlt || getAccessoryLabel(key)}">`
      : `<span>${item.icon}</span>`;

    button.innerHTML = `${iconMarkup}${getAccessoryLabel(key)}`;

    button.addEventListener("dragstart", (event) => {
      currentDragAccessory = key;
      if (item.image) {
        const imageIcon = document.createElement("img");
        imageIcon.className = "accessory-option-image";
        imageIcon.src = item.image;
        imageIcon.alt = item.imageAlt || getAccessoryLabel(key);
        activeDragGhost = createDragGhost(imageIcon);
        event.dataTransfer.setDragImage(activeDragGhost, 14, 14);
      } else {
        activeDragGhost = createDragGhost(item.icon);
        event.dataTransfer.setDragImage(activeDragGhost, 18, 18);
      }

      event.dataTransfer.setData("application/x-accessory", key);
      event.dataTransfer.effectAllowed = "move";
      roomScene.classList.add("accessory-drag-mode");
    });

    button.addEventListener("dragend", () => {
      resetDragInteraction();
    });

    row.appendChild(button);
  }

  wrap.appendChild(row);

  const controls = document.createElement("div");
  controls.className = "accessory-controls";

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "mini-btn";
  removeButton.textContent = t("removeAccessory");
  removeButton.disabled = !selectedAccessory;
  removeButton.addEventListener("click", removeAccessory);

  controls.appendChild(removeButton);
  wrap.appendChild(controls);

  return wrap;
}

function renderAccessoryPanel(availableActions) {
  const existing = statusPanel.querySelector(".accessory-picker.status-accessory-picker");

  if (existing) {
    existing.remove();
  }

  if (!findAction(availableActions, "style")) {
    return;
  }

  const picker = createAccessoryPicker();
  picker.classList.add("status-accessory-picker");
  statusPanel.appendChild(picker);
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

  const isKitchen = currentState?.currentRoom === "kitchen";

  for (const key of preferredOrder) {
    if (isKitchen && KITCHEN_FOOD_ACTIONS.includes(key)) {
      continue;
    }

    const tool = createDraggableAction(key, availableActions);

    if (tool) {
      toolsRow.appendChild(tool);
    }
  }

  actionsContainer.appendChild(toolsRow);

  renderAccessoryPanel(availableActions);
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
    showSetup(translateServerMessage(error.message));
  }
}

async function performAction(action, options = {}) {
  if (isBusy) {
    return;
  }

  isBusy = true;

  try {
    const state = await requestJson("/api/action", {
      method: "POST",
      body: JSON.stringify({ action })
    });

    renderState(state, options);
    showInteractionImage(action, state);

    if (action === "adventure") {
      triggerAdventureDisappear();
    }
  } catch (error) {
    if (!options.suppressError) {
      alert(translateServerMessage(error.message));
    }
  } finally {
    isBusy = false;
  }
}

async function moveRoom(direction) {
  if (isSleeping) {
    alert(t("errors.wakeUpFirst"));
    return;
  }

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
    alert(translateServerMessage(error.message));
  } finally {
    isBusy = false;
  }
}

async function resetProgress() {
  if (isBusy) {
    return;
  }

  const confirmed = confirm(t("resetConfirm"));

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
    alert(translateServerMessage(error.message));
  } finally {
    isBusy = false;
  }
}

startForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = catNameInput.value.trim();

  if (!name) {
    showSetup(t("errors.emptyName"));
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
    showSetup(translateServerMessage(error.message));
  }
});

roomScene.addEventListener("dragover", (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  roomScene.classList.add("drop-target");

  if (currentDragAccessory) {
    const touchingCat = isPointInsideElement(event.clientX, event.clientY, catImage);
    setCatContactHighlight(touchingCat);
  }

  if (currentDragAction === "pet") {
    const touchingCat = isPointInsideElement(event.clientX, event.clientY, catImage);
    setPetContact(touchingCat);
  }

  if (currentDragAction === "groom") {
    const touchingCat = isPointInsideElement(event.clientX, event.clientY, catImage);
    setGroomContact(touchingCat);
  }
});

roomScene.addEventListener("dragleave", () => {
  roomScene.classList.remove("drop-target");
  setCatContactHighlight(false);
  setPetContact(false);
  if (currentDragAction === "groom") {
    setGroomContact(false);
  }
});

roomScene.addEventListener("drop", async (event) => {
  event.preventDefault();
  const action = event.dataTransfer.getData("text/plain") || currentDragAction;
  const accessoryKey = event.dataTransfer.getData("application/x-accessory") || currentDragAccessory;
  const touchedCat = isPointInsideElement(event.clientX, event.clientY, catImage);

  if (accessoryKey) {
    const touchedCat = isPointInsideElement(event.clientX, event.clientY, catImage);

    if (touchedCat) {
      const point = getCatPercentPoint(event.clientX, event.clientY);
      const wasSelected = selectedAccessory;
      const changedAccessory = selectedAccessory !== accessoryKey;

      if (point) {
        equipAccessory(accessoryKey, point);

        if (!wasSelected || changedAccessory) {
          await performAction("style", { skipActions: true, suppressError: true });
        }
      }
    }

    resetDragInteraction();
    renderActions(currentState?.availableActions || []);
    return;
  }

  if (action === "pet") {
    // For pet action we only apply ticks while the hand is held on kitten.
  } else if (action && KITCHEN_FOOD_ACTIONS.includes(action)) {
    if (touchedCat) {
      await performAction(action);
    }
  } else if (action) {
    await performAction(action);
  }

  resetDragInteraction();
});

roomScene.addEventListener("click", (event) => {
  if (currentDragAction || currentDragAccessory || !currentState) {
    return;
  }

  if (currentState.currentRoom !== "bedroom") {
    return;
  }

  if (isPointInsideLamp(event.clientX, event.clientY)) {
    setSleepMode(!isSleeping);
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

  if (isSleeping) {
    return;
  }

  if (event.key === "ArrowLeft") {
    moveRoom("left");
  }

  if (event.key === "ArrowRight") {
    moveRoom("right");
  }
});

window.addEventListener("resize", applyAccessoryVisual);

setInterval(loadState, 10000);

applyTranslations();
updateRoomControlsAvailability();
loadState();
