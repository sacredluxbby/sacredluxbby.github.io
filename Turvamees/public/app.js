const video = document.getElementById('camera');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');
const movementGrid = document.getElementById('movementGrid');
const themeSelect = document.getElementById('themeSelect');
const alarmModeSelect = document.getElementById('alarmModeSelect');

const overlayCtx = overlay.getContext('2d');
const analysisCanvas = document.createElement('canvas');
const analysisCtx = analysisCanvas.getContext('2d', { willReadFrequently: true });

let stream = null;
let rafId = null;
let prevGrayFrame = null;
let lastCentroid = null;
let lastArea = null;
let audioCtx = null;
const lastSoundByDirection = new Map();
const directionCounts = Object.create(null);
const eventLog = [];

let detectionThreshold = 28;
let motionPixelMinimum = 850;
let masterVolume = 0.18;
let isMuted = false;
let zoomLevel = 1;
let backwardEffectTimer = null;
let motionAlarmTimer = null;
let sceneNoiseLevel = 0;
let adaptivePixelFloor = 240;
let smoothedCentroid = null;
let eventCooldownMs = 300;
let lastAlarmAt = 0;

const DETECTION_MODE = 'fast';
const THEME_STORAGE_KEY = 'turvamees-theme';
const THEMES = ['neon-purple', 'blue-night', 'pink-pulse'];
const ALARM_MODE_STORAGE_KEY = 'turvamees-alarm-mode';
const ALARM_MODES = ['soft', 'hard'];
let alarmMode = 'hard';

// Selles objektis on kõigi liikumissuundade seadistused.
const movementConfig = {
  left: { label: 'Vasakule', info: 'Objekt liigub vasakule', color: '#1f7a8c' },
  right: { label: 'Paremale', info: 'Objekt liigub paremale', color: '#f4a261' },
  up: { label: 'Üles', info: 'Objekt liigub üles', color: '#577590' },
  down: { label: 'Alla', info: 'Objekt liigub alla', color: '#43aa8b' },
  forward: { label: 'Ette', info: 'Objekt liigub kaamera suunas', color: '#8f2d56' },
  backward: { label: 'Tagasi', info: 'Objekt liigub kaamerast eemale', color: '#b42318' }
};

// 1) Vormindab ajatembli logi ja staatuse jaoks.
function formatTimestamp(date = new Date()) {
  return date.toLocaleTimeString('et-EE', { hour12: false });
}

// 2) Salvestab viimased sündmused mällu, et hiljem oleks võimalik neid analüüsida.
function pushEventLog(direction, changedPixels) {
  eventLog.push({
    time: formatTimestamp(),
    direction,
    changedPixels
  });

  if (eventLog.length > 120) {
    eventLog.shift();
  }
}

// 3) Tagastab suuna jaoks lühikese visuaalse märgi.
function getDirectionEmoji(direction) {
  const icons = {
    left: '←',
    right: '→',
    up: '↑',
    down: '↓',
    forward: '⤢',
    backward: '⤡'
  };
  return icons[direction] || '?';
}

// 4) Uuendab iga suuna käivituste arvu kasutajaliideses.
function updateSignalCounters(direction) {
  directionCounts[direction] = (directionCounts[direction] || 0) + 1;
  const chip = document.getElementById(`chip-${direction}`);
  if (!chip) {
    return;
  }

  const counterEl = chip.querySelector('.counter');
  if (counterEl) {
    counterEl.textContent = `Käivitusi: ${directionCounts[direction]}`;
  }
}

// 5) Seadistab pikslite erinevuse lävendi ja hoiab väärtuse turvalises vahemikus.
function setDetectionThreshold(value) {
  detectionThreshold = Math.min(80, Math.max(8, Number(value) || 28));
}

// 6) Seadistab minimaalse liikumispikslite hulga mürasummutuseks.
function setMotionPixelMinimum(value) {
  motionPixelMinimum = Math.min(4500, Math.max(120, Number(value) || 850));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function smoothPoint(current, previous, alpha = 0.62) {
  if (!previous) {
    return current;
  }

  return {
    x: previous.x + (current.x - previous.x) * alpha,
    y: previous.y + (current.y - previous.y) * alpha
  };
}

// 7) Vaigistab heli sisse-välja.
function toggleMute() {
  isMuted = !isMuted;
  updateStatus(`Heli: ${isMuted ? 'vaigistatud' : 'aktiivne'}`);
}

// 8) Muudab üldist helitugevust ühtselt kõikidele signaalidele.
function setMasterVolume(value) {
  masterVolume = Math.min(0.4, Math.max(0.02, Number(value) || 0.18));
}

// Muudab, kui kiiresti uus liikumissündmus võib uuesti käivituda.
function setEventCooldown(value) {
  eventCooldownMs = Math.min(650, Math.max(90, Number(value) || 300));
}

// Suurendab või vähendab kaamera vaadet digitaalse skaleerimisega.
function setVideoZoom(value) {
  zoomLevel = Math.min(2, Math.max(1, Number(value) || 1));
  const scaleValue = `scale(${zoomLevel.toFixed(2)})`;
  video.style.transform = scaleValue;
  overlay.style.transform = scaleValue;
}

// 9) Võtab hetkelise kaadri pildina.
function captureFrameSnapshot() {
  if (!video.videoWidth || !video.videoHeight) {
    return null;
  }

  const snapCanvas = document.createElement('canvas');
  snapCanvas.width = video.videoWidth;
  snapCanvas.height = video.videoHeight;
  const snapCtx = snapCanvas.getContext('2d');
  snapCtx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);
  return snapCanvas.toDataURL('image/png');
}

// 10) Laeb snapshoti kasutajale failina alla.
function saveSnapshotToDownload(dataUrl) {
  if (!dataUrl) {
    updateStatus('Snapshot ebaõnnestus: kaader puudub.', true);
    return;
  }

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `turvamees-${Date.now()}.png`;
  link.click();
  updateStatus('Snapshot salvestatud.');
}

function applyTheme(themeName) {
  const resolvedTheme = THEMES.includes(themeName) ? themeName : THEMES[0];
  document.body.setAttribute('data-theme', resolvedTheme);
  localStorage.setItem(THEME_STORAGE_KEY, resolvedTheme);

  if (themeSelect) {
    themeSelect.value = resolvedTheme;
  }
}

function cycleTheme() {
  const currentTheme = document.body.getAttribute('data-theme') || THEMES[0];
  const currentIndex = THEMES.indexOf(currentTheme);
  const nextTheme = THEMES[(currentIndex + 1) % THEMES.length];
  applyTheme(nextTheme);
  updateStatus(`Theme: ${nextTheme}`);
}

function setAlarmMode(mode) {
  const resolvedMode = ALARM_MODES.includes(mode) ? mode : 'hard';
  alarmMode = resolvedMode;
  document.body.setAttribute('data-alarm-mode', resolvedMode);
  localStorage.setItem(ALARM_MODE_STORAGE_KEY, resolvedMode);

  if (alarmModeSelect) {
    alarmModeSelect.value = resolvedMode;
  }
}

function cycleAlarmMode() {
  const currentIndex = ALARM_MODES.indexOf(alarmMode);
  const nextMode = ALARM_MODES[(currentIndex + 1) % ALARM_MODES.length];
  setAlarmMode(nextMode);
  updateStatus(`Alarm mode: ${nextMode}`);
}

function buildMovementUI() {
  const fragment = document.createDocumentFragment();

  Object.entries(movementConfig).forEach(([key, config]) => {
    directionCounts[key] = 0;
    const chip = document.createElement('article');
    chip.className = 'movement-chip';
    chip.id = `chip-${key}`;
    chip.innerHTML = `<strong>${config.label}</strong><span>${config.info}</span><span class="counter">Käivitusi: 0</span>`;
    fragment.appendChild(chip);
  });

  movementGrid.appendChild(fragment);
}

function updateStatus(text, isWarning = false) {
  statusEl.textContent = text;
  statusEl.style.color = isWarning ? '#ef4444' : 'var(--ink)';
}

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    });

    video.srcObject = stream;

    await video.play();

    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;

    // Analüüsi jaoks kasutame väiksemat kaadrit, et rakendus töötaks sujuvamalt.
    analysisCanvas.width = 320;
    analysisCanvas.height = 180;

    prevGrayFrame = null;
    lastCentroid = null;
    lastArea = null;
    smoothedCentroid = null;
    sceneNoiseLevel = 0;
    adaptivePixelFloor = Math.max(180, motionPixelMinimum * 0.32);

    startBtn.disabled = true;
    stopBtn.disabled = false;

    updateStatus('Kaamera töötab. Liikumise jälgimine on aktiivne.');
    runDetection();
  } catch (err) {
    console.error(err);
    updateStatus('Kaamera ligipääs ebaõnnestus. Kontrolli õigusi.', true);
  }
}

function stopCamera() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  video.srcObject = null;
  prevGrayFrame = null;
  lastCentroid = null;
  lastArea = null;
  smoothedCentroid = null;

  overlayCtx.clearRect(0, 0, overlay.width, overlay.height);

  startBtn.disabled = false;
  stopBtn.disabled = true;

  updateStatus('Kaamera peatatud.');
}

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new window.AudioContext();
  }
  return audioCtx;
}

function flashChip(direction) {
  const chip = document.getElementById(`chip-${direction}`);
  if (!chip) {
    return;
  }

  chip.classList.add('active');
  setTimeout(() => chip.classList.remove('active'), 280);
}

// Liikumisel "tagasi" teeme heli asemel taustale visuaalse alarmiefekti.
function triggerBackwardBackgroundEffect() {
  document.body.classList.remove('backward-alert');
  // Reflow tagab, et klassi uuesti lisamisel animatsioon käivitub iga kord.
  void document.body.offsetWidth;
  document.body.classList.add('backward-alert');

  if (backwardEffectTimer) {
    clearTimeout(backwardEffectTimer);
  }

  backwardEffectTimer = setTimeout(() => {
    document.body.classList.remove('backward-alert');
  }, 750);
}

// Käivitub kohe liikumisel: punane pulseeriv taust + lühike alarmiheli.
function triggerMotionAlarm() {
  document.body.classList.add('motion-alarm');

  if (motionAlarmTimer) {
    clearTimeout(motionAlarmTimer);
  }

  motionAlarmTimer = setTimeout(() => {
    document.body.classList.remove('motion-alarm');
  }, 520);

  // Alarmiheli mängime piiratud sagedusega, et see oleks kuulda, aga mitte liiga agressiivne.
  const nowMs = performance.now();
  if (isMuted || nowMs - lastAlarmAt < 220) {
    return;
  }

  lastAlarmAt = nowMs;
  const context = getAudioContext();
  const now = context.currentTime;
  const modeProfile = alarmMode === 'soft'
    ? { gain: 0.14, upFreq: 860, downFreq: 620, duration: 0.2 }
    : { gain: 0.26, upFreq: 980, downFreq: 640, duration: 0.18 };

  const gain = context.createGain();
  gain.connect(context.destination);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(modeProfile.gain, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + modeProfile.duration);

  const osc = context.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(modeProfile.upFreq, now);
  osc.frequency.exponentialRampToValueAtTime(modeProfile.downFreq, now + modeProfile.duration * 0.5);
  osc.frequency.exponentialRampToValueAtTime(modeProfile.upFreq - 40, now + modeProfile.duration);
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + modeProfile.duration);
}

// Loob lühikese "sammu" heli: madal löök + kerge krõbin.
function playFootstep(context, time, volume) {
  const stepGain = context.createGain();
  stepGain.connect(context.destination);
  stepGain.gain.setValueAtTime(0.0001, time);
  stepGain.gain.exponentialRampToValueAtTime(volume, time + 0.01);
  stepGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);

  const thumpOsc = context.createOscillator();
  thumpOsc.type = 'triangle';
  thumpOsc.frequency.setValueAtTime(92, time);
  thumpOsc.frequency.exponentialRampToValueAtTime(58, time + 0.1);
  thumpOsc.connect(stepGain);
  thumpOsc.start(time);
  thumpOsc.stop(time + 0.12);

  const noiseBuffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.11), context.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }

  const noiseSource = context.createBufferSource();
  noiseSource.buffer = noiseBuffer;

  const noiseFilter = context.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.setValueAtTime(620, time);

  const noiseGain = context.createGain();
  noiseGain.gain.setValueAtTime(volume * 0.32, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.11);

  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(context.destination);

  noiseSource.start(time);
  noiseSource.stop(time + 0.11);
}

// Iga liikumissuund saab oma helimustri.
function playDirectionSound(direction) {
  // Lühike cooldown väldib sama heli liiga kiiret kordumist.
  const lastPlayedAt = lastSoundByDirection.get(direction) || 0;
  if (performance.now() - lastPlayedAt < eventCooldownMs) {
    return;
  }

  lastSoundByDirection.set(direction, performance.now());

  if (isMuted) {
    return;
  }

  const context = getAudioContext();
  const now = context.currentTime;

  // Kõik suunad kasutavad "sammude" tüüpi heli, kuid erineva valjuse ja tempoga.
  const directionProfile = {
    left: { volume: 0.09, steps: 2, spacing: 0.12 },
    right: { volume: 0.11, steps: 2, spacing: 0.12 },
    up: { volume: 0.08, steps: 1, spacing: 0.1 },
    down: { volume: 0.13, steps: 2, spacing: 0.14 },
    forward: { volume: 0.16, steps: 3, spacing: 0.11 },
    backward: { volume: 0.19, steps: 3, spacing: 0.1 }
  };

  const profile = directionProfile[direction] || { volume: 0.1, steps: 2, spacing: 0.12 };
  const finalVolume = Math.max(0.02, Math.min(0.35, profile.volume * (masterVolume / 0.18)));

  for (let i = 0; i < profile.steps; i += 1) {
    playFootstep(context, now + i * profile.spacing, finalVolume);
  }

  if (direction === 'backward') {
    triggerBackwardBackgroundEffect();
  }

  flashChip(direction);
}

function detectDirection(current, previous, area, previousArea) {
  if (!previous) {
    return null;
  }

  const dx = current.x - previous.x;
  const dy = current.y - previous.y;

  // Liikumine kaamera suunas kasvatab tavaliselt silueti pindala, eemaldumine vähendab.
  const areaRatio = previousArea ? (area - previousArea) / previousArea : 0;

  if (areaRatio > 0.14) {
    return 'forward';
  }

  if (areaRatio < -0.14) {
    return 'backward';
  }

  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 1.35) {
    return dx > 0 ? 'right' : 'left';
  }

  if (Math.abs(dy) > 1.35) {
    return dy > 0 ? 'down' : 'up';
  }

  return null;
}

function runDetection() {
  analysisCtx.drawImage(video, 0, 0, analysisCanvas.width, analysisCanvas.height);
  const frame = analysisCtx.getImageData(0, 0, analysisCanvas.width, analysisCanvas.height);

  const gray = new Uint8Array(frame.data.length / 4);

  for (let i = 0, p = 0; i < frame.data.length; i += 4, p += 1) {
    const r = frame.data[i];
    const g = frame.data[i + 1];
    const b = frame.data[i + 2];
    gray[p] = r * 0.299 + g * 0.587 + b * 0.114;
  }

  if (prevGrayFrame) {
    let changedPixels = 0;
    let totalDiff = 0;
    let sumX = 0;
    let sumY = 0;
    let minX = analysisCanvas.width;
    let minY = analysisCanvas.height;
    let maxX = 0;
    let maxY = 0;

    const dynamicDiffThreshold = clamp(
      detectionThreshold + sceneNoiseLevel * 0.9,
      detectionThreshold * 0.55,
      detectionThreshold * 1.9
    );

    for (let y = 0; y < analysisCanvas.height; y += 1) {
      for (let x = 0; x < analysisCanvas.width; x += 1) {
        const idx = y * analysisCanvas.width + x;
        const diff = Math.abs(gray[idx] - prevGrayFrame[idx]);
        totalDiff += diff;

        if (diff > dynamicDiffThreshold) {
          changedPixels += 1;
          sumX += x;
          sumY += y;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    overlayCtx.clearRect(0, 0, overlay.width, overlay.height);

    const averageDiff = totalDiff / (analysisCanvas.width * analysisCanvas.height);
    sceneNoiseLevel = sceneNoiseLevel * 0.9 + averageDiff * 0.1;

    const dynamicMotionMinimum = clamp(
      adaptivePixelFloor * 1.55 + sceneNoiseLevel * 11,
      motionPixelMinimum * 0.3,
      motionPixelMinimum * 1.05
    );

    // Vaiksetes kaadrites kohandame mürabaasi, et liikumist tuvastataks kiiremini ja täpsemalt.
    if (changedPixels < dynamicMotionMinimum * 0.85) {
      adaptivePixelFloor = adaptivePixelFloor * 0.9 + changedPixels * 0.1;
    }

    // Filtreerime väikese müra välja, et heli ei käivituks juhuslikult.
    if (changedPixels > dynamicMotionMinimum) {
      triggerMotionAlarm();

      const centroid = {
        x: sumX / changedPixels,
        y: sumY / changedPixels
      };

      smoothedCentroid = smoothPoint(centroid, smoothedCentroid);

      const area = Math.max(1, (maxX - minX + 1) * (maxY - minY + 1));
      const direction = detectDirection(smoothedCentroid, lastCentroid, area, lastArea);

      const scaleX = overlay.width / analysisCanvas.width;
      const scaleY = overlay.height / analysisCanvas.height;
      overlayCtx.strokeStyle = 'rgba(206,79,47,0.95)';
      overlayCtx.lineWidth = 2;
      overlayCtx.strokeRect(
        minX * scaleX,
        minY * scaleY,
        (maxX - minX) * scaleX,
        (maxY - minY) * scaleY
      );

      overlayCtx.fillStyle = 'rgba(0,0,0,0.55)';
      overlayCtx.fillRect(12, 12, 250, 32);
      overlayCtx.fillStyle = '#ffffff';
      overlayCtx.font = '16px IBM Plex Mono';
      overlayCtx.fillText(
        `Muutus: ${changedPixels}px${direction ? ` | Suund: ${movementConfig[direction].label}` : ''}`,
        18,
        33
      );

      if (direction) {
        pushEventLog(direction, changedPixels);
        updateSignalCounters(direction);
        playDirectionSound(direction);
        updateStatus(
          `${movementConfig[direction].label} ${getDirectionEmoji(direction)} | px: ${changedPixels} | ${formatTimestamp()}`
        );
      }

      lastCentroid = smoothedCentroid;
      lastArea = area;
    }
  }

  prevGrayFrame = gray;
  rafId = requestAnimationFrame(runDetection);
}

startBtn.addEventListener('click', startCamera);
stopBtn.addEventListener('click', stopCamera);

// Kiirklahvid: M = mute, C = snapshot, nooltega reaktsioonikiirus ja zoom.
window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyM') {
    toggleMute();
  }

  if (event.code === 'KeyC') {
    const snapshot = captureFrameSnapshot();
    saveSnapshotToDownload(snapshot);
  }

  if (event.code === 'ArrowUp') {
    setEventCooldown(eventCooldownMs - 20);
    updateStatus(`Reaktsiooni kiirus: ${eventCooldownMs} ms`);
  }

  if (event.code === 'ArrowDown') {
    setEventCooldown(eventCooldownMs + 20);
    updateStatus(`Reaktsiooni kiirus: ${eventCooldownMs} ms`);
  }

  if (event.code === 'ArrowRight') {
    setVideoZoom(zoomLevel + 0.1);
    updateStatus(`Zoom: ${zoomLevel.toFixed(2)}x`);
  }

  if (event.code === 'ArrowLeft') {
    setVideoZoom(zoomLevel - 0.1);
    updateStatus(`Zoom: ${zoomLevel.toFixed(2)}x`);
  }

  if (event.code === 'Digit0') {
    setMotionPixelMinimum(850);
    setDetectionThreshold(28);
    setVideoZoom(1);
    setEventCooldown(300);
    updateStatus('Filtrid taastatud vaikeseadetele.');
  }

  if (event.code === 'KeyT') {
    cycleTheme();
  }

  if (event.code === 'KeyA') {
    cycleAlarmMode();
  }
});

if (themeSelect) {
  themeSelect.addEventListener('change', (event) => {
    applyTheme(event.target.value);
    updateStatus(`Theme: ${event.target.value}`);
  });
}

if (alarmModeSelect) {
  alarmModeSelect.addEventListener('change', (event) => {
    setAlarmMode(event.target.value);
    updateStatus(`Alarm mode: ${event.target.value}`);
  });
}

applyTheme(localStorage.getItem(THEME_STORAGE_KEY) || THEMES[0]);
setAlarmMode(localStorage.getItem(ALARM_MODE_STORAGE_KEY) || 'hard');

setDetectionThreshold(28);
setMotionPixelMinimum(DETECTION_MODE === 'fast' ? 540 : 850);
setMasterVolume(0.18);
setVideoZoom(1);
setEventCooldown(300);

buildMovementUI();
