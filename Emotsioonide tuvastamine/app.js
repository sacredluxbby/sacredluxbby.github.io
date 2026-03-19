const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");
const stage = document.getElementById("stage");
const fallLayer = document.getElementById("fallLayer");

const startBtn = document.getElementById("startBtn");
const statusEl = document.getElementById("status");
const emotionNameEl = document.getElementById("emotionName");
const confidenceBar = document.getElementById("confidenceBar");
const confidenceText = document.getElementById("confidenceText");
const confidenceWrap = document.getElementById("confidenceWrap");
const snapBtn = document.getElementById("snapBtn");

const optMirror = document.getElementById("optMirror");
const optConfidence = document.getElementById("optConfidence");
const optHistory = document.getElementById("optHistory");
const optSnapshot = document.getElementById("optSnapshot");
const optGallery = document.getElementById("optGallery");

const historyWrap = document.getElementById("historyWrap");
const historyList = document.getElementById("historyList");
const snapshotTools = document.getElementById("snapshotTools");
const snapshotWrap = document.getElementById("snapshotWrap");
const snapshots = document.getElementById("snapshots");

const moodMap = {
  happy: { et: "Rõõm", body: "happy" },
  sad: { et: "Kurbus", body: "sad" },
  neutral: { et: "Neutraalne", body: "neutral" },
  angry: { et: "Viha", body: "angry" }
};

const detectionHistory = [];
const MOOD_HOLD_MS = 2000;
let isRunning = false;
let animationId = null;
let currentEmotionLabel = "Neutraalne";
let currentVisualMood = "neutral";
let visualAnimationTimer = null;
let visualTransitionUntil = 0;
let activeEmotionKey = "neutral";
let pendingEmotionKey = null;
let pendingSince = 0;

const visualAssets = {
  angry: ["fire.svg", "boom.svg"],
  sad: ["cloud.svg", "water.svg"],
  neutral: ["forest.svg", "stars.svg"],
  positive: ["hearts.svg", "flower.svg"]
};

function setStatus(message) {
  statusEl.textContent = message;
}

function updateOptionsUI() {
  confidenceWrap.classList.toggle("hidden", !optConfidence.checked);
  historyWrap.classList.toggle("hidden", !optHistory.checked);
  snapshotTools.classList.toggle("hidden", !optSnapshot.checked);
  snapshotWrap.classList.toggle("hidden", !optGallery.checked);
  stage.classList.toggle("mirrored", optMirror.checked);
}

function addHistoryRow(text) {
  detectionHistory.unshift(text);
  while (detectionHistory.length > 10) {
    detectionHistory.pop();
  }

  historyList.innerHTML = "";
  for (const item of detectionHistory) {
    const li = document.createElement("li");
    li.textContent = item;
    historyList.appendChild(li);
  }
}

function resizeCanvas() {
  const { videoWidth, videoHeight } = video;
  if (!videoWidth || !videoHeight) {
    return;
  }
  canvas.width = videoWidth;
  canvas.height = videoHeight;
}

function getPrimaryEmotion(expressions) {
  const filtered = {
    happy: expressions.happy || 0,
    sad: expressions.sad || 0,
    neutral: expressions.neutral || 0,
    angry: expressions.angry || 0
  };

  let bestKey = "neutral";
  let bestValue = -1;

  for (const [key, value] of Object.entries(filtered)) {
    if (value > bestValue) {
      bestKey = key;
      bestValue = value;
    }
  }

  return { key: bestKey, score: bestValue };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getMoodScore(expressions) {
  const happy = expressions.happy || 0;
  const neutral = expressions.neutral || 0;
  const sad = expressions.sad || 0;
  const angry = expressions.angry || 0;

  // Teisenda emotsioonide tõenäosused üheks tujuväärtuseks vahemikus -1 (kuri) kuni +1 (lahke).
  const rawScore = happy * 1.0 + neutral * 0.2 - sad * 0.6 - angry * 1.0;
  return clamp(rawScore, -1, 1);
}

function getMoodLabel(score) {
  if (score <= -0.6) {
    return "Väga kuri";
  }
  if (score <= -0.2) {
    return "Pigem kuri";
  }
  if (score < 0.2) {
    return "Neutraalne";
  }
  if (score < 0.6) {
    return "Pigem lahke";
  }
  return "Väga lahke";
}

function getBackgroundMood(emotionKey, moodScore) {
  if (emotionKey === "angry") {
    return "angry";
  }
  if (emotionKey === "sad") {
    return "sad";
  }
  if (emotionKey === "neutral" && moodScore < 0.25) {
    return "neutral";
  }
  if (emotionKey === "happy" && moodScore >= 0.55) {
    return "cheerful";
  }
  if (moodScore >= 0.2) {
    return "kind";
  }
  return "neutral";
}

function getVisualSetByMood(mood) {
  if (mood === "angry") {
    return visualAssets.angry;
  }
  if (mood === "sad") {
    return visualAssets.sad;
  }
  if (mood === "kind" || mood === "cheerful") {
    return visualAssets.positive;
  }
  return visualAssets.neutral;
}

function clearVisualLayer() {
  if (!fallLayer) {
    return;
  }

  const existing = Array.from(fallLayer.children);
  if (existing.length === 0) {
    return;
  }

  visualTransitionUntil = Date.now() + 420;
  for (const node of existing) {
    node.classList.add("visual-fade-out");
    window.setTimeout(() => {
      if (node.parentNode === fallLayer) {
        node.remove();
      }
    }, 420);
  }
}

function spawnFallingVisual() {
  if (!fallLayer) {
    return;
  }

  const sourceSet = getVisualSetByMood(currentVisualMood);
  const src = sourceSet[Math.floor(Math.random() * sourceSet.length)];

  const item = document.createElement("img");
  item.className = "mood-visual";
  item.src = src;
  item.alt = "";

  const size = 24 + Math.random() * 48;
  const left = Math.random() * 100;
  const x = -120 + Math.random() * 240;
  const spin = -210 + Math.random() * 420;
  const alpha = 0.45 + Math.random() * 0.45;

  item.style.left = `${left}vw`;
  item.style.width = `${size}px`;
  item.style.setProperty("--x", `${x}px`);
  item.style.setProperty("--spin", `${spin}deg`);
  item.style.setProperty("--alpha", alpha.toFixed(2));

  if (currentVisualMood === "sad") {
    item.classList.add("mood-sad");
    item.style.top = `${Math.random() * 78 + 10}vh`;
    item.style.animationDuration = `${2.8 + Math.random() * 2.8}s`;
  } else if (currentVisualMood === "angry") {
    item.classList.add("mood-angry");
    item.style.top = `${Math.random() * 78 + 8}vh`;
    item.style.animationDuration = `${1.1 + Math.random() * 1.3}s`;
  } else if (currentVisualMood === "kind" || currentVisualMood === "cheerful") {
    item.classList.add("mood-positive");
    item.style.top = `${Math.random() * 24 + 78}vh`;
    item.style.animationDuration = `${7.5 + Math.random() * 5}s`;
  } else {
    item.classList.add("mood-neutral");
    item.style.top = "-14vh";
    item.style.animationDuration = `${11 + Math.random() * 10}s`;
  }

  item.addEventListener("animationend", () => {
    item.remove();
  });

  fallLayer.appendChild(item);

  while (fallLayer.children.length > 82) {
    fallLayer.removeChild(fallLayer.firstElementChild);
  }
}

function getSpawnCountByMood(mood) {
  if (mood === "angry") {
    return 4;
  }
  if (mood === "sad") {
    return 2;
  }
  if (mood === "kind" || mood === "cheerful") {
    return 3;
  }
  return 2;
}

function getSpawnDelayByMood(mood) {
  if (mood === "angry") {
    return 210;
  }
  if (mood === "sad") {
    return 390;
  }
  if (mood === "kind" || mood === "cheerful") {
    return 300;
  }
  return 470;
}

function runVisualEffectsLoop() {
  if (Date.now() < visualTransitionUntil) {
    visualAnimationTimer = window.setTimeout(runVisualEffectsLoop, 80);
    return;
  }

  const spawnCount = getSpawnCountByMood(currentVisualMood);
  for (let i = 0; i < spawnCount; i += 1) {
    spawnFallingVisual();
  }
  const delay = getSpawnDelayByMood(currentVisualMood);
  visualAnimationTimer = window.setTimeout(runVisualEffectsLoop, delay);
}

function startVisualEffects() {
  if (visualAnimationTimer) {
    return;
  }

  for (let i = 0; i < 8; i += 1) {
    spawnFallingVisual();
  }
  runVisualEffectsLoop();
}

function updateEmotionUI(emotionKey, expressions, shouldRecordHistory = true) {
  const info = moodMap[emotionKey] || moodMap.neutral;
  const moodScore = getMoodScore(expressions);
  const moodPercent = Math.round(((moodScore + 1) / 2) * 100);
  const moodSigned = Math.round(moodScore * 100);
  const backgroundMood = getBackgroundMood(emotionKey, moodScore);

  document.body.dataset.emotion = backgroundMood;
  currentVisualMood = backgroundMood;
  emotionNameEl.textContent = info.et;
  currentEmotionLabel = info.et;

  confidenceBar.style.width = `${moodPercent}%`;
  confidenceText.textContent = `${getMoodLabel(moodScore)} (${moodSigned})`;

  if (shouldRecordHistory) {
    const time = new Date().toLocaleTimeString("et-EE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    addHistoryRow(`${time} - ${info.et}, tuju ${moodSigned}`);
  }
}

async function detectLoop() {
  if (!isRunning) {
    return;
  }

  const result = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceExpressions();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!result) {
    setStatus("Nägu ei leitud");
    pendingEmotionKey = null;
    updateEmotionUI(activeEmotionKey, { happy: 0, sad: 0, neutral: 1, angry: 0 }, false);
    currentEmotionLabel = "Nägu puudub";
  } else {
    const now = Date.now();
    const { key } = getPrimaryEmotion(result.expressions);
    setStatus("Nägu tuvastatud");

    if (key === activeEmotionKey) {
      pendingEmotionKey = null;
      pendingSince = 0;
      updateEmotionUI(activeEmotionKey, result.expressions, false);
    } else {
      if (pendingEmotionKey !== key) {
        pendingEmotionKey = key;
        pendingSince = now;
      }

      if (now - pendingSince >= MOOD_HOLD_MS) {
        activeEmotionKey = pendingEmotionKey;
        pendingEmotionKey = null;
        pendingSince = 0;
        clearVisualLayer();
        updateEmotionUI(activeEmotionKey, result.expressions, true);
      } else {
        updateEmotionUI(activeEmotionKey, result.expressions, false);
      }
    }
  }

  animationId = window.setTimeout(detectLoop, 320);
}

async function loadModels() {
  const modelBase = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";
  await faceapi.nets.tinyFaceDetector.loadFromUri(modelBase);
  await faceapi.nets.faceExpressionNet.loadFromUri(modelBase);
}

async function startCamera() {
  if (isRunning) {
    return;
  }

  const isSecureLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  if (!window.isSecureContext && !isSecureLocal) {
    setStatus("Kaamera jaoks ava leht localhost serverist (mitte file://)");
    return;
  }

  try {
    startBtn.disabled = true;
    setStatus("Laen mudeleid...");
    await loadModels();

    setStatus("Küsin kaameraluba...");
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });

    video.srcObject = stream;
    await video.play();

    resizeCanvas();
    isRunning = true;
    setStatus("Kaamera töötab");
    detectLoop();
  } catch (error) {
    setStatus("Viga: " + error.message);
  } finally {
    startBtn.disabled = false;
  }
}

function makeSnapshot() {
  if (!optSnapshot.checked) {
    return;
  }

  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) {
    setStatus("Snapshot ei õnnestunud: kaamera ei tööta");
    return;
  }

  const temp = document.createElement("canvas");
  temp.width = w;
  temp.height = h;
  const tctx = temp.getContext("2d");

  if (optMirror.checked) {
    tctx.translate(w, 0);
    tctx.scale(-1, 1);
  }
  tctx.drawImage(video, 0, 0, w, h);

  const card = document.createElement("figure");
  card.className = "snapshot-card";

  const img = document.createElement("img");
  img.src = temp.toDataURL("image/png");
  img.alt = "Snapshot";

  const caption = document.createElement("figcaption");
  const time = new Date().toLocaleTimeString("et-EE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  caption.textContent = `${time} - ${currentEmotionLabel}`;

  card.appendChild(img);
  card.appendChild(caption);
  snapshots.prepend(card);

  while (snapshots.children.length > 8) {
    snapshots.removeChild(snapshots.lastElementChild);
  }
}

startBtn.addEventListener("click", startCamera);
snapBtn.addEventListener("click", makeSnapshot);
video.addEventListener("loadedmetadata", resizeCanvas);
window.addEventListener("resize", resizeCanvas);

[optMirror, optConfidence, optHistory, optSnapshot, optGallery].forEach((checkbox) => {
  checkbox.addEventListener("change", updateOptionsUI);
});

updateOptionsUI();
startVisualEffects();

window.addEventListener("beforeunload", () => {
  if (animationId) {
    window.clearTimeout(animationId);
  }

  if (visualAnimationTimer) {
    window.clearTimeout(visualAnimationTimer);
  }

  const stream = video.srcObject;
  if (stream && stream.getTracks) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
  }
});
