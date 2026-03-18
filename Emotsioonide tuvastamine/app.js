const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const snapBtn = document.getElementById("snapBtn");
const statusEl = document.getElementById("status");
const emotionNameEl = document.getElementById("emotionName");
const confidenceBar = document.getElementById("confidenceBar");
const confidenceText = document.getElementById("confidenceText");
const confidenceWrap = document.getElementById("confidenceWrap");

const optFigma = document.getElementById("optFigma");
const optConfidence = document.getElementById("optConfidence");
const optHistory = document.getElementById("optHistory");
const optPulse = document.getElementById("optPulse");
const optSnapshot = document.getElementById("optSnapshot");

const figmaPanel = document.getElementById("figmaPanel");
const historyWrap = document.getElementById("historyWrap");
const historyList = document.getElementById("historyList");
const snapshots = document.getElementById("snapshots");
const figmaSticker = document.getElementById("figmaSticker");

const uploadHappy = document.getElementById("uploadHappy");
const uploadSad = document.getElementById("uploadSad");
const uploadNeutral = document.getElementById("uploadNeutral");
const uploadAngry = document.getElementById("uploadAngry");

const moodMap = {
  happy: { et: "Rõõm", body: "happy", fallbackSticker: "😀" },
  sad: { et: "Kurbus", body: "sad", fallbackSticker: "😢" },
  neutral: { et: "Neutraalne", body: "neutral", fallbackSticker: "😐" },
  angry: { et: "Viha", body: "angry", fallbackSticker: "😠" }
};

const figmaStickers = {
  happy: null,
  sad: null,
  neutral: null,
  angry: null
};

const detectionHistory = [];
let isRunning = false;
let animationId = null;

function setStatus(message) {
  statusEl.textContent = message;
}

function updateOptionsUI() {
  confidenceWrap.classList.toggle("hidden", !optConfidence.checked);
  historyWrap.classList.toggle("hidden", !optHistory.checked);
  figmaPanel.classList.toggle("hidden", !optFigma.checked);
  snapBtn.classList.toggle("hidden", !optSnapshot.checked);
  document.body.classList.toggle("pulse-on", optPulse.checked);

  if (!optFigma.checked) {
    figmaSticker.style.display = "none";
  }
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

function updateSticker(emotionKey, faceBox) {
  if (!optFigma.checked || !faceBox) {
    figmaSticker.style.display = "none";
    return;
  }

  const userSticker = figmaStickers[emotionKey];
  if (userSticker) {
    figmaSticker.src = userSticker;
    figmaSticker.style.background = "transparent";
    figmaSticker.textContent = "";
  } else {
    // When user has not uploaded Figma image yet, show a readable fallback label.
    const fallback = moodMap[emotionKey].fallbackSticker;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='84' height='84'><rect rx='20' ry='20' width='100%' height='100%' fill='rgba(2,6,23,0.7)'/><text x='50%' y='58%' dominant-baseline='middle' text-anchor='middle' font-size='44'>${fallback}</text></svg>`;
    figmaSticker.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  const x = Math.min(faceBox.x + faceBox.width + 16, canvas.width - 90);
  const y = Math.max(faceBox.y - 10, 6);

  figmaSticker.style.left = `${x}px`;
  figmaSticker.style.top = `${y}px`;
  figmaSticker.style.display = "block";
}

function updateEmotionUI(emotionKey, confidence, faceBox) {
  const info = moodMap[emotionKey] || moodMap.neutral;
  document.body.dataset.emotion = info.body;
  emotionNameEl.textContent = info.et;

  confidenceBar.style.width = `${Math.round(confidence * 100)}%`;
  confidenceText.textContent = `${Math.round(confidence * 100)}%`;

  const time = new Date().toLocaleTimeString("et-EE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  addHistoryRow(`${time} - ${info.et} (${Math.round(confidence * 100)}%)`);

  updateSticker(emotionKey, faceBox);
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
    figmaSticker.style.display = "none";
  } else {
    const { key, score } = getPrimaryEmotion(result.expressions);
    setStatus("Nägu tuvastatud");
    updateEmotionUI(key, score, result.detection.box);

    const drawBox = {
      x: result.detection.box.x,
      y: result.detection.box.y,
      width: result.detection.box.width,
      height: result.detection.box.height,
      label: `${moodMap[key].et} ${Math.round(score * 100)}%`
    };
    faceapi.draw.drawDetections(canvas, [drawBox]);
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

function readStickerFile(input, key) {
  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    if (!file) {
      return;
    }

    const url = URL.createObjectURL(file);
    figmaStickers[key] = url;
    setStatus(`Laetud: ${moodMap[key].et} kleeps`);
  });
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
  tctx.drawImage(video, 0, 0, w, h);

  const data = temp.toDataURL("image/png");
  const img = document.createElement("img");
  img.src = data;
  img.alt = "Snapshot";
  snapshots.prepend(img);

  while (snapshots.children.length > 6) {
    snapshots.removeChild(snapshots.lastElementChild);
  }
}

startBtn.addEventListener("click", startCamera);
snapBtn.addEventListener("click", makeSnapshot);
video.addEventListener("loadedmetadata", resizeCanvas);
window.addEventListener("resize", resizeCanvas);

[optFigma, optConfidence, optHistory, optPulse, optSnapshot].forEach((checkbox) => {
  checkbox.addEventListener("change", updateOptionsUI);
});

readStickerFile(uploadHappy, "happy");
readStickerFile(uploadSad, "sad");
readStickerFile(uploadNeutral, "neutral");
readStickerFile(uploadAngry, "angry");

updateOptionsUI();

window.addEventListener("beforeunload", () => {
  if (animationId) {
    window.clearTimeout(animationId);
  }

  const stream = video.srcObject;
  if (stream && stream.getTracks) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
  }
});
