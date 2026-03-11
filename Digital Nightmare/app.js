const canvas = document.getElementById("nightmareCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const cameraFeed = document.getElementById("cameraFeed");
const uploadedImage = document.getElementById("uploadedImage");

const imageInput = document.getElementById("imageInput");
const startCameraBtn = document.getElementById("startCameraBtn");
const stopCameraBtn = document.getElementById("stopCameraBtn");
const toggleMicBtn = document.getElementById("toggleMicBtn");
const mirrorModeBtn = document.getElementById("mirrorModeBtn");
const freezeBtn = document.getElementById("freezeBtn");
const asciiModeBtn = document.getElementById("asciiModeBtn");
const edgeModeBtn = document.getElementById("edgeModeBtn");
const trailModeBtn = document.getElementById("trailModeBtn");
const solarModeBtn = document.getElementById("solarModeBtn");
const saveChaosBtn = document.getElementById("saveChaosBtn");
const chaosRange = document.getElementById("chaosRange");
const scanlineRange = document.getElementById("scanlineRange");
const vhsRange = document.getElementById("vhsRange");
const mirrorRange = document.getElementById("mirrorRange");
const freezeSizeRange = document.getElementById("freezeSizeRange");
const asciiDensityRange = document.getElementById("asciiDensityRange");
const artifactRange = document.getElementById("artifactRange");
const edgeRange = document.getElementById("edgeRange");
const trailRange = document.getElementById("trailRange");
const solarRange = document.getElementById("solarRange");
const statusText = document.getElementById("statusText");
const micLevelText = document.getElementById("micLevelText");
const fxText = document.getElementById("fxText");

const fxCanvas = document.createElement("canvas");
const fxCtx = fxCanvas.getContext("2d", { willReadFrequently: true });
const trailCanvas = document.createElement("canvas");
const trailCtx = trailCanvas.getContext("2d");

const state = {
  sourceType: null,
  stream: null,
  chaosBase: Number(chaosRange.value) / 100,
  pointer: { x: 0.5, y: 0.5 },
  pointerEnergy: 0,
  lastPointerMove: performance.now(),
  shock: 0,
  pulses: [],
  prevFrame: null,
  mirrorMode: 0,
  asciiMode: false,
  edgeMode: false,
  trailMode: false,
  solarMode: false,
  controls: {
    scanline: Number(scanlineRange.value) / 100,
    vhs: Number(vhsRange.value) / 100,
    mirrorBlend: Number(mirrorRange.value) / 100,
    freezeSize: Number(freezeSizeRange.value) / 100,
    asciiDensity: Number(asciiDensityRange.value) / 100,
    artifact: Number(artifactRange.value) / 100,
    edge: Number(edgeRange.value) / 100,
    trail: Number(trailRange.value) / 100,
    solar: Number(solarRange.value) / 100
  },
  freeze: {
    active: false,
    pending: false,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    data: null
  },
  lastX: null,
  lastY: null,
  lastTime: performance.now(),
  mic: {
    active: false,
    stream: null,
    audioCtx: null,
    analyser: null,
    buffer: null,
    level: 0
  }
};

function setStatus(text) {
  statusText.textContent = `Status: ${text}`;
}

function setFxText() {
  const mirrorLabel = state.mirrorMode === 0 ? "off" : `${state.mirrorMode}s`;
  const asciiLabel = state.asciiMode ? "on" : "off";
  const freezeLabel = state.freeze.active ? "on" : "off";
  const edgeLabel = state.edgeMode ? "on" : "off";
  const trailLabel = state.trailMode ? "on" : "off";
  const solarLabel = state.solarMode ? "on" : "off";
  fxText.textContent = `FX: mirror ${mirrorLabel} | freeze ${freezeLabel} | ascii ${asciiLabel} | edge ${edgeLabel} | trail ${trailLabel} | solar ${solarLabel}`;
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function wrapX(x, width) {
  if (x < 0) return (x % width + width) % width;
  if (x >= width) return x % width;
  return x;
}

function fitCover(sourceW, sourceH, targetW, targetH) {
  const sourceRatio = sourceW / sourceH;
  const targetRatio = targetW / targetH;

  if (sourceRatio > targetRatio) {
    const drawH = sourceH;
    const drawW = drawH * targetRatio;
    const sx = (sourceW - drawW) / 2;
    return { sx, sy: 0, sw: drawW, sh: drawH };
  }

  const drawW = sourceW;
  const drawH = drawW / targetRatio;
  const sy = (sourceH - drawH) / 2;
  return { sx: 0, sy, sw: drawW, sh: drawH };
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));

  const baseWidth = clamp(Math.floor(canvas.width / 4), 240, 520);
  const baseHeight = clamp(Math.floor(canvas.height / 4), 135, 340);
  fxCanvas.width = baseWidth;
  fxCanvas.height = baseHeight;
  trailCanvas.width = canvas.width;
  trailCanvas.height = canvas.height;
  trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
  state.prevFrame = null;

  ctx.imageSmoothingEnabled = false;
}

function getAudioLevel() {
  const mic = state.mic;
  if (!mic.active || !mic.analyser || !mic.buffer) {
    return 0;
  }

  mic.analyser.getByteTimeDomainData(mic.buffer);
  let sum = 0;
  for (let i = 0; i < mic.buffer.length; i += 1) {
    const n = (mic.buffer[i] - 128) / 128;
    sum += n * n;
  }

  const rms = Math.sqrt(sum / mic.buffer.length);
  const normalized = clamp((rms - 0.02) * 5.2, 0, 1.4);
  mic.level = mic.level * 0.78 + normalized * 0.22;
  micLevelText.textContent = `Mic: ${Math.round(mic.level * 100)}%`;
  return mic.level;
}

function applyMirrorDimension(buffer, width, height, mirrorMode) {
  if (mirrorMode !== 4 && mirrorMode !== 8) {
    return buffer;
  }

  const cols = mirrorMode === 4 ? 2 : 4;
  const rows = 2;
  const sectorW = Math.max(1, Math.floor(width / cols));
  const sectorH = Math.max(1, Math.floor(height / rows));
  const mirrored = new Uint8ClampedArray(buffer.length);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const col = Math.floor(x / sectorW);
      const row = Math.floor(y / sectorH);
      const localX = x % sectorW;
      const localY = y % sectorH;

      const sampleX = col % 2 === 0 ? localX : sectorW - 1 - localX;
      const sampleY = row % 2 === 0 ? localY : sectorH - 1 - localY;

      const sx = clamp(sampleX, 0, width - 1);
      const sy = clamp(sampleY, 0, height - 1);
      const src = (sy * width + sx) * 4;
      const dst = (y * width + x) * 4;

      mirrored[dst] = buffer[src];
      mirrored[dst + 1] = buffer[src + 1];
      mirrored[dst + 2] = buffer[src + 2];
      mirrored[dst + 3] = 255;
    }
  }

  return mirrored;
}

function blendBuffers(source, overlay, amount) {
  const mix = clamp(amount, 0, 1);
  if (mix <= 0) {
    return source;
  }

  const out = new Uint8ClampedArray(source.length);
  for (let i = 0; i < source.length; i += 4) {
    out[i] = source[i] * (1 - mix) + overlay[i] * mix;
    out[i + 1] = source[i + 1] * (1 - mix) + overlay[i + 1] * mix;
    out[i + 2] = source[i + 2] * (1 - mix) + overlay[i + 2] * mix;
    out[i + 3] = 255;
  }

  return out;
}

function captureFreezeRegion(buffer, width, height) {
  const freezeScale = clamp(0.12 + state.controls.freezeSize * 0.52, 0.12, 0.64);
  const regionW = clamp(Math.floor(width * freezeScale), 48, width);
  const regionH = clamp(Math.floor(height * freezeScale), 36, height);
  const x = clamp(Math.floor(state.pointer.x * width - regionW / 2), 0, width - regionW);
  const y = clamp(Math.floor(state.pointer.y * height - regionH / 2), 0, height - regionH);

  const frozenData = new Uint8ClampedArray(regionW * regionH * 4);

  for (let yy = 0; yy < regionH; yy += 1) {
    for (let xx = 0; xx < regionW; xx += 1) {
      const src = ((y + yy) * width + (x + xx)) * 4;
      const dst = (yy * regionW + xx) * 4;
      frozenData[dst] = buffer[src];
      frozenData[dst + 1] = buffer[src + 1];
      frozenData[dst + 2] = buffer[src + 2];
      frozenData[dst + 3] = 255;
    }
  }

  state.freeze.active = true;
  state.freeze.pending = false;
  state.freeze.x = x;
  state.freeze.y = y;
  state.freeze.w = regionW;
  state.freeze.h = regionH;
  state.freeze.data = frozenData;
  freezeBtn.textContent = "Unfreeze Region";
  setFxText();
}

function applyFreezeRegion(buffer, width, height) {
  if (!state.freeze.active || !state.freeze.data) {
    return;
  }

  const x0 = state.freeze.x;
  const y0 = state.freeze.y;
  const w = state.freeze.w;
  const h = state.freeze.h;

  for (let yy = 0; yy < h; yy += 1) {
    for (let xx = 0; xx < w; xx += 1) {
      const x = x0 + xx;
      const y = y0 + yy;
      if (x < 0 || x >= width || y < 0 || y >= height) {
        continue;
      }

      const dst = (y * width + x) * 4;
      const src = (yy * w + xx) * 4;
      buffer[dst] = state.freeze.data[src];
      buffer[dst + 1] = state.freeze.data[src + 1];
      buffer[dst + 2] = state.freeze.data[src + 2];
      buffer[dst + 3] = 255;
    }
  }
}

function luminance(r, g, b) {
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}

function applyPixelSorting(buffer, width, height, time, amount) {
  const regionW = clamp(Math.floor(width * (0.2 + amount * 0.24)), 48, Math.floor(width * 0.72));
  const regionH = clamp(Math.floor(height * (0.15 + amount * 0.2)), 36, Math.floor(height * 0.5));
  const sweep = (Math.sin(time * 0.0013) * 0.5 + 0.5);
  const yDrift = (Math.cos(time * 0.0019) * 0.5 + 0.5);

  const x0 = Math.floor((width - regionW) * sweep);
  const y0 = Math.floor((height - regionH) * yDrift);
  const rowStep = amount > 0.8 ? 1 : 2;

  for (let y = y0; y < y0 + regionH; y += rowStep) {
    const rowPixels = [];
    for (let x = x0; x < x0 + regionW; x += 1) {
      const idx = (y * width + x) * 4;
      rowPixels.push({
        r: buffer[idx],
        g: buffer[idx + 1],
        b: buffer[idx + 2],
        a: buffer[idx + 3],
        l: luminance(buffer[idx], buffer[idx + 1], buffer[idx + 2])
      });
    }

    rowPixels.sort((a, b) => b.l - a.l);

    for (let x = 0; x < rowPixels.length; x += 1) {
      const idx = (y * width + (x0 + x)) * 4;
      const p = rowPixels[x];
      buffer[idx] = p.r;
      buffer[idx + 1] = p.g;
      buffer[idx + 2] = p.b;
      buffer[idx + 3] = p.a;
    }
  }
}

function applyEdgePulse(buffer, width, height, amount, time) {
  if (amount <= 0.01) {
    return buffer;
  }

  const out = new Uint8ClampedArray(buffer);
  const pulse = 0.45 + (Math.sin(time * 0.007) * 0.5 + 0.5) * 0.8;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const idx = (y * width + x) * 4;
      const left = ((y * width + (x - 1)) * 4);
      const right = ((y * width + (x + 1)) * 4);
      const top = (((y - 1) * width + x) * 4);
      const bottom = (((y + 1) * width + x) * 4);

      const gx = Math.abs(luminance(buffer[right], buffer[right + 1], buffer[right + 2]) - luminance(buffer[left], buffer[left + 1], buffer[left + 2]));
      const gy = Math.abs(luminance(buffer[bottom], buffer[bottom + 1], buffer[bottom + 2]) - luminance(buffer[top], buffer[top + 1], buffer[top + 2]));
      const edge = clamp((gx + gy) * 0.7, 0, 255);
      const edgeMix = (edge / 255) * amount * pulse;

      out[idx] = clamp(out[idx] + 220 * edgeMix, 0, 255);
      out[idx + 1] = clamp(out[idx + 1] + 60 * edgeMix, 0, 255);
      out[idx + 2] = clamp(out[idx + 2] + 255 * edgeMix, 0, 255);
    }
  }

  return out;
}

function applySolarize(buffer, amount) {
  if (amount <= 0.01) {
    return buffer;
  }

  const out = new Uint8ClampedArray(buffer.length);
  const threshold = 90 + amount * 120;

  for (let i = 0; i < buffer.length; i += 4) {
    const invertR = buffer[i] > threshold ? 255 - buffer[i] : buffer[i];
    const invertG = buffer[i + 1] > threshold ? 255 - buffer[i + 1] : buffer[i + 1];
    const invertB = buffer[i + 2] > threshold ? 255 - buffer[i + 2] : buffer[i + 2];

    out[i] = buffer[i] * (1 - amount) + invertR * amount;
    out[i + 1] = buffer[i + 1] * (1 - amount) + invertG * amount;
    out[i + 2] = buffer[i + 2] * (1 - amount) + invertB * amount;
    out[i + 3] = 255;
  }

  return out;
}

function applyGhostTrail(time) {
  if (!state.trailMode || state.controls.trail <= 0.01) {
    return;
  }

  const amount = state.controls.trail;
  const driftX = Math.sin(time * 0.002) * (1 + amount * 8);
  const driftY = Math.cos(time * 0.0017) * (1 + amount * 5);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.09 + amount * 0.28;
  ctx.drawImage(trailCanvas, driftX, driftY, canvas.width, canvas.height);
  ctx.restore();
}

function updateTrailBuffer() {
  if (!state.trailMode || state.controls.trail <= 0.01) {
    trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
    return;
  }

  const amount = state.controls.trail;
  trailCtx.save();
  trailCtx.globalCompositeOperation = "source-over";
  trailCtx.fillStyle = `rgba(0,0,0,${0.18 + (1 - amount) * 0.25})`;
  trailCtx.fillRect(0, 0, trailCanvas.width, trailCanvas.height);
  trailCtx.globalCompositeOperation = "lighter";
  trailCtx.globalAlpha = 0.42 + amount * 0.46;
  trailCtx.drawImage(canvas, 0, 0);
  trailCtx.restore();
}

function drawScanlineOverlay(time, intensity) {
  const scanlinePower = clamp(state.controls.scanline, 0, 1);
  if (scanlinePower <= 0.01) {
    return;
  }

  const weighted = intensity * (0.25 + scanlinePower * 1.4);
  const lineGap = Math.max(2, Math.floor(5 - Math.min(2.2, weighted)));
  const offset = Math.floor((time * 0.02) % lineGap);
  const alpha = clamp((0.04 + weighted * 0.06) * (0.25 + scanlinePower), 0.01, 0.22);

  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  for (let y = offset; y < canvas.height; y += lineGap) {
    ctx.fillRect(0, y, canvas.width, 1);
  }

  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 6; i += 1) {
    const y = Math.floor(((Math.sin(time * 0.001 + i * 0.7) * 0.5 + 0.5) * canvas.height));
    ctx.fillStyle = `rgba(0,240,200,${(0.015 + weighted * 0.03) * scanlinePower})`;
    ctx.fillRect(0, y, canvas.width, 2);
  }
  ctx.restore();
}

function drawVhsNoise(time, intensity) {
  const vhsPower = clamp(state.controls.vhs, 0, 1);
  if (vhsPower <= 0.01) {
    return;
  }

  const weighted = intensity * (0.2 + vhsPower * 1.35);
  const snowCount = Math.floor(40 + weighted * 1200);
  const lineCount = Math.floor(1 + weighted * 8);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < snowCount; i += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const a = Math.random() * (0.015 + weighted * 0.12);
    const s = Math.random() > 0.8 ? 2 : 1;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(x, y, s, s);
  }

  for (let i = 0; i < lineCount; i += 1) {
    const y = Math.floor(Math.random() * canvas.height);
    const wobble = Math.sin(time * 0.02 + i) * (1 + weighted * 10);
    ctx.fillStyle = `rgba(255,95,46,${0.015 + weighted * 0.14})`;
    ctx.fillRect(wobble, y, canvas.width, 1 + Math.floor(Math.random() * 2));
  }
  ctx.restore();
}

function renderAscii(buffer, width, height) {
  const chars = " .,:;irsXA253hMHGS#9B&@";
  const density = clamp(state.controls.asciiDensity, 0.2, 1);
  const cols = clamp(Math.floor(34 + density * 136), 34, 170);
  const rows = clamp(Math.floor(20 + density * 88), 20, 108);
  const cellW = canvas.width / cols;
  const cellH = canvas.height / rows;

  ctx.save();
  ctx.fillStyle = "#030506";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = `${Math.max(9, Math.floor(cellH * 1.08))}px "Space Grotesk"`;
  ctx.textBaseline = "top";

  for (let row = 0; row < rows; row += 1) {
    const sy = clamp(Math.floor((row / rows) * height), 0, height - 1);
    for (let col = 0; col < cols; col += 1) {
      const sx = clamp(Math.floor((col / cols) * width), 0, width - 1);
      const idx = (sy * width + sx) * 4;
      const r = buffer[idx];
      const g = buffer[idx + 1];
      const b = buffer[idx + 2];
      const l = luminance(r, g, b);
      const ci = Math.floor((l / 255) * (chars.length - 1));
      const ch = chars[ci];

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillText(ch, col * cellW, row * cellH);
    }
  }

  ctx.restore();
}

function addChaosArtifact(targetCanvas, targetCtx) {
  const strength = clamp(state.controls.artifact, 0, 1);
  if (strength <= 0.01) {
    return;
  }

  const w = targetCanvas.width;
  const h = targetCanvas.height;

  const snap = document.createElement("canvas");
  snap.width = w;
  snap.height = h;
  const snapCtx = snap.getContext("2d");
  snapCtx.drawImage(targetCanvas, 0, 0);

  const tears = 1 + Math.floor(strength * 12) + Math.floor(Math.random() * 3);
  for (let i = 0; i < tears; i += 1) {
    const y = Math.floor(Math.random() * h);
    const th = 2 + Math.floor(Math.random() * (4 + strength * 24));
    const shift = Math.floor((Math.random() - 0.5) * (28 + strength * 130));
    targetCtx.drawImage(snap, 0, y, w, th, shift, y, w, th);
  }

  targetCtx.globalCompositeOperation = "screen";
  const burns = 2 + Math.floor(strength * 10);
  for (let i = 0; i < burns; i += 1) {
    targetCtx.fillStyle = `rgba(${80 + Math.floor(Math.random() * 175)},${20 + Math.floor(Math.random() * 100)},${80 + Math.floor(Math.random() * 175)},${0.04 + Math.random() * (0.08 + strength * 0.22)})`;
    const rx = Math.random() * w;
    const ry = Math.random() * h;
    const rw = 20 + Math.random() * (w * (0.08 + strength * 0.24));
    const rh = 4 + Math.random() * (h * (0.04 + strength * 0.1));
    targetCtx.fillRect(rx, ry, rw, rh);
  }
  targetCtx.globalCompositeOperation = "source-over";
}

function saveChaosImage() {
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = canvas.width;
  outputCanvas.height = canvas.height;
  const outputCtx = outputCanvas.getContext("2d");

  outputCtx.drawImage(canvas, 0, 0);
  addChaosArtifact(outputCanvas, outputCtx);

  const a = document.createElement("a");
  a.href = outputCanvas.toDataURL("image/png");
  a.download = `digital-nightmare-chaos-${Date.now()}.png`;
  a.click();

  setStatus("chaos frame saved with random artifact");
}

function getActiveSource() {
  if (state.sourceType === "camera" && cameraFeed.readyState >= 2) {
    return cameraFeed;
  }

  if (state.sourceType === "image" && uploadedImage.complete && uploadedImage.naturalWidth > 0) {
    return uploadedImage;
  }

  return null;
}

function drawFallbackBackground() {
  const time = performance.now() * 0.0012;
  const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  g.addColorStop(0, "#041011");
  g.addColorStop(0.55, "#2a120b");
  g.addColorStop(1, "#020304");

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 22; i += 1) {
    const wobble = Math.sin(time + i * 0.7) * canvas.width * 0.1;
    ctx.strokeStyle = `rgba(0, 240, 200, ${0.06 + (i % 4) * 0.02})`;
    ctx.beginPath();
    ctx.moveTo(-80, i * (canvas.height / 20) + wobble * 0.06);
    ctx.lineTo(canvas.width + 80, i * (canvas.height / 20) - wobble * 0.06);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(232,255,248,0.85)";
  ctx.font = `${Math.max(18, Math.floor(canvas.width * 0.024))}px \"Space Grotesk\"`;
  ctx.fillText("UPLOAD PHOTO OR START CAMERA", 22, canvas.height - 28);
}

function updatePulses() {
  state.pulses = state.pulses
    .map((pulse) => ({
      ...pulse,
      radius: pulse.radius + pulse.speed,
      alpha: pulse.alpha * 0.965
    }))
    .filter((pulse) => pulse.alpha > 0.025);
}

function drawHudOverlay() {
  const now = performance.now() * 0.001;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (const pulse of state.pulses) {
    ctx.strokeStyle = `rgba(255,95,46,${pulse.alpha})`;
    ctx.lineWidth = Math.max(1, canvas.width * 0.0015);
    ctx.beginPath();
    ctx.arc(pulse.x * canvas.width, pulse.y * canvas.height, pulse.radius * canvas.width, 0, Math.PI * 2);
    ctx.stroke();
  }

  const mx = state.pointer.x * canvas.width;
  const my = state.pointer.y * canvas.height;
  const crossSize = Math.max(6, canvas.width * 0.015 + state.pointerEnergy * 8);
  ctx.strokeStyle = `rgba(0,240,200,${0.45 + state.pointerEnergy * 0.45})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(mx - crossSize, my);
  ctx.lineTo(mx + crossSize, my);
  ctx.moveTo(mx, my - crossSize);
  ctx.lineTo(mx, my + crossSize);
  ctx.stroke();

  ctx.globalAlpha = 0.22;
  for (let y = 0; y < canvas.height; y += 3) {
    const drift = Math.sin(now * 8 + y * 0.03) * (1 + state.shock * 4);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(drift, y, canvas.width, 1);
  }

  ctx.restore();
}

function processFrame(source, time) {
  const sw = source.videoWidth || source.naturalWidth;
  const sh = source.videoHeight || source.naturalHeight;
  if (!sw || !sh) return;

  const cover = fitCover(sw, sh, fxCanvas.width, fxCanvas.height);
  fxCtx.drawImage(source, cover.sx, cover.sy, cover.sw, cover.sh, 0, 0, fxCanvas.width, fxCanvas.height);

  const frame = fxCtx.getImageData(0, 0, fxCanvas.width, fxCanvas.height);
  const src = frame.data;
  const out = new Uint8ClampedArray(src.length);
  const audioLevel = getAudioLevel();

  const px = state.pointer.x * fxCanvas.width;
  const py = state.pointer.y * fxCanvas.height;
  const chaos = clamp(state.chaosBase + state.pointerEnergy * 0.6 + state.shock * 0.75 + audioLevel * 1.1, 0, 2.3);
  const radius = 16 + chaos * 18;
  const rgbSplit = Math.floor(2 + state.pointerEnergy * 18 + audioLevel * 20);
  const moshMix = clamp(0.08 + chaos * 0.14 + audioLevel * 0.25, 0, 0.66);
  const moshOffsetX = Math.floor(Math.sin(time * 0.004) * (2 + chaos * 12 + audioLevel * 10));
  const moshOffsetY = Math.floor(Math.cos(time * 0.0032) * (1 + chaos * 7 + audioLevel * 6));
  const hasPrev = state.prevFrame && state.prevFrame.length === src.length;

  for (let y = 0; y < fxCanvas.height; y += 1) {
    const wave = Math.sin(y * 0.22 + time * 0.006) * (5 + chaos * 22);

    for (let x = 0; x < fxCanvas.width; x += 1) {
      const idx = (y * fxCanvas.width + x) * 4;
      const dx = x - px;
      const dy = y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const focus = clamp(1 - dist / radius, 0, 1);
      const xShift = Math.floor(wave + focus * (18 + chaos * 15));
      const yShift = Math.floor(Math.sin(x * 0.17 + time * 0.005) * (1 + chaos * 4));

      const sy = clamp(y + yShift, 0, fxCanvas.height - 1);

      const sx = wrapX(x + xShift, fxCanvas.width);
      const rPos = (sy * fxCanvas.width + wrapX(sx + rgbSplit, fxCanvas.width)) * 4;
      const gPos = (sy * fxCanvas.width + sx) * 4;
      const bPos = (sy * fxCanvas.width + wrapX(sx - rgbSplit, fxCanvas.width)) * 4;

      let r = src[rPos];
      let g = src[gPos + 1];
      let b = src[bPos + 2];

      if (hasPrev) {
        const prevX = wrapX(sx + moshOffsetX, fxCanvas.width);
        const prevY = clamp(sy + moshOffsetY, 0, fxCanvas.height - 1);
        const prevPos = (prevY * fxCanvas.width + prevX) * 4;
        r = r * (1 - moshMix) + state.prevFrame[prevPos] * moshMix;
        g = g * (1 - moshMix) + state.prevFrame[prevPos + 1] * moshMix;
        b = b * (1 - moshMix) + state.prevFrame[prevPos + 2] * moshMix;
      }

      const noise = (Math.random() - 0.5) * (22 + chaos * 70);
      out[idx] = clamp(r + 24 + noise + focus * 36, 0, 255);
      out[idx + 1] = clamp(g - 14 + noise * 0.3 + focus * 14, 0, 255);
      out[idx + 2] = clamp(b + 32 + noise * 0.5, 0, 255);
      out[idx + 3] = 255;
    }
  }

  applyPixelSorting(out, fxCanvas.width, fxCanvas.height, time, clamp(chaos * 0.55 + audioLevel * 0.7, 0.25, 1.25));

  const mirrored = applyMirrorDimension(out, fxCanvas.width, fxCanvas.height, state.mirrorMode);
  let finalBuffer = state.mirrorMode === 0 ? out : blendBuffers(out, mirrored, state.controls.mirrorBlend);

  if (state.freeze.pending) {
    captureFreezeRegion(finalBuffer, fxCanvas.width, fxCanvas.height);
    setStatus("freeze region captured");
  }

  applyFreezeRegion(finalBuffer, fxCanvas.width, fxCanvas.height);

  if (state.edgeMode) {
    finalBuffer = applyEdgePulse(finalBuffer, fxCanvas.width, fxCanvas.height, state.controls.edge, time);
  }

  if (state.solarMode) {
    finalBuffer = applySolarize(finalBuffer, state.controls.solar);
  }

  state.prevFrame = new Uint8ClampedArray(finalBuffer);

  frame.data.set(finalBuffer);
  fxCtx.putImageData(frame, 0, 0);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (state.asciiMode) {
    renderAscii(finalBuffer, fxCanvas.width, fxCanvas.height);
  } else {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(fxCanvas, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  applyGhostTrail(time);

  drawScanlineOverlay(time, chaos);
  drawVhsNoise(time, clamp(chaos * 0.8 + audioLevel * 0.9, 0.1, 1.4));
  updateTrailBuffer();
}

function tick(now) {
  const activeSource = getActiveSource();

  if (!activeSource) {
    drawFallbackBackground();
  } else {
    processFrame(activeSource, now);
  }

  drawHudOverlay();
  updatePulses();

  state.pointerEnergy *= 0.93;
  state.shock *= 0.9;

  requestAnimationFrame(tick);
}

function stopCamera() {
  if (state.stream) {
    for (const track of state.stream.getTracks()) {
      track.stop();
    }
  }

  state.stream = null;
  state.sourceType = null;
  cameraFeed.srcObject = null;
  startCameraBtn.disabled = false;
  stopCameraBtn.disabled = true;
  setStatus("camera stopped");
}

async function startMic() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.82;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    state.mic.active = true;
    state.mic.stream = stream;
    state.mic.audioCtx = audioCtx;
    state.mic.analyser = analyser;
    state.mic.buffer = new Uint8Array(analyser.fftSize);
    state.mic.level = 0;

    toggleMicBtn.textContent = "Disable Mic";
    micLevelText.textContent = "Mic: on";
  } catch (error) {
    micLevelText.textContent = "Mic: denied";
    console.error(error);
  }
}

function stopMic() {
  if (state.mic.stream) {
    for (const track of state.mic.stream.getTracks()) {
      track.stop();
    }
  }

  if (state.mic.audioCtx) {
    state.mic.audioCtx.close();
  }

  state.mic.active = false;
  state.mic.stream = null;
  state.mic.audioCtx = null;
  state.mic.analyser = null;
  state.mic.buffer = null;
  state.mic.level = 0;

  toggleMicBtn.textContent = "Enable Mic";
  micLevelText.textContent = "Mic: off";
}

async function toggleMic() {
  if (state.mic.active) {
    stopMic();
    return;
  }

  await startMic();
}

function toggleMirrorMode() {
  if (state.mirrorMode === 0) {
    state.mirrorMode = 4;
  } else if (state.mirrorMode === 4) {
    state.mirrorMode = 8;
  } else {
    state.mirrorMode = 0;
  }

  mirrorModeBtn.textContent = `Mirror: ${state.mirrorMode === 0 ? "Off" : state.mirrorMode}`;
  setFxText();
}

function toggleFreeze() {
  if (state.freeze.active || state.freeze.pending) {
    state.freeze.active = false;
    state.freeze.pending = false;
    state.freeze.data = null;
    freezeBtn.textContent = "Freeze Region";
    setStatus("freeze disabled");
    setFxText();
    return;
  }

  state.freeze.pending = true;
  freezeBtn.textContent = "Freeze: Armed";
  setStatus("click/hover target area, freeze captures on next frame");
}

function toggleAsciiMode() {
  state.asciiMode = !state.asciiMode;
  asciiModeBtn.textContent = `ASCII: ${state.asciiMode ? "On" : "Off"}`;
  setFxText();
}

function toggleEdgeMode() {
  state.edgeMode = !state.edgeMode;
  edgeModeBtn.textContent = `Edge Pulse: ${state.edgeMode ? "On" : "Off"}`;
  setFxText();
}

function toggleTrailMode() {
  state.trailMode = !state.trailMode;
  trailModeBtn.textContent = `Ghost Trail: ${state.trailMode ? "On" : "Off"}`;
  if (!state.trailMode) {
    trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
  }
  setFxText();
}

function toggleSolarMode() {
  state.solarMode = !state.solarMode;
  solarModeBtn.textContent = `Solarize: ${state.solarMode ? "On" : "Off"}`;
  setFxText();
}

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });

    stopCamera();
    state.stream = stream;
    cameraFeed.srcObject = stream;
    state.sourceType = "camera";
    await cameraFeed.play();

    startCameraBtn.disabled = true;
    stopCameraBtn.disabled = false;
    setStatus("camera feed active");
  } catch (error) {
    setStatus("camera permission denied or unavailable");
    console.error(error);
  }
}

function handleImageUpload(event) {
  const [file] = event.target.files || [];
  if (!file) return;

  stopCamera();

  const url = URL.createObjectURL(file);
  uploadedImage.onload = () => {
    URL.revokeObjectURL(url);
    state.sourceType = "image";
    setStatus(`image loaded: ${file.name}`);
  };

  uploadedImage.src = url;
}

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
  const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);

  const now = performance.now();
  if (state.lastX !== null && state.lastY !== null) {
    const dt = Math.max(1, now - state.lastTime);
    const speed = Math.hypot(event.clientX - state.lastX, event.clientY - state.lastY) / dt;
    state.pointerEnergy = clamp(state.pointerEnergy + speed * 0.08, 0, 1.2);
  }

  state.pointer.x = x;
  state.pointer.y = y;
  state.lastX = event.clientX;
  state.lastY = event.clientY;
  state.lastTime = now;
  state.lastPointerMove = now;
});

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
  const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);

  state.shock = clamp(state.shock + 0.9, 0, 1.8);
  state.pulses.push({ x, y, radius: 0.01, speed: 0.02, alpha: 0.8 });
});

chaosRange.addEventListener("input", () => {
  state.chaosBase = Number(chaosRange.value) / 100;
});

scanlineRange.addEventListener("input", () => {
  state.controls.scanline = Number(scanlineRange.value) / 100;
});

vhsRange.addEventListener("input", () => {
  state.controls.vhs = Number(vhsRange.value) / 100;
});

mirrorRange.addEventListener("input", () => {
  state.controls.mirrorBlend = Number(mirrorRange.value) / 100;
});

freezeSizeRange.addEventListener("input", () => {
  state.controls.freezeSize = Number(freezeSizeRange.value) / 100;
});

asciiDensityRange.addEventListener("input", () => {
  state.controls.asciiDensity = Number(asciiDensityRange.value) / 100;
});

artifactRange.addEventListener("input", () => {
  state.controls.artifact = Number(artifactRange.value) / 100;
});

edgeRange.addEventListener("input", () => {
  state.controls.edge = Number(edgeRange.value) / 100;
});

trailRange.addEventListener("input", () => {
  state.controls.trail = Number(trailRange.value) / 100;
});

solarRange.addEventListener("input", () => {
  state.controls.solar = Number(solarRange.value) / 100;
});

imageInput.addEventListener("change", handleImageUpload);
startCameraBtn.addEventListener("click", startCamera);
stopCameraBtn.addEventListener("click", stopCamera);
toggleMicBtn.addEventListener("click", toggleMic);
mirrorModeBtn.addEventListener("click", toggleMirrorMode);
freezeBtn.addEventListener("click", toggleFreeze);
asciiModeBtn.addEventListener("click", toggleAsciiMode);
edgeModeBtn.addEventListener("click", toggleEdgeMode);
trailModeBtn.addEventListener("click", toggleTrailMode);
solarModeBtn.addEventListener("click", toggleSolarMode);
saveChaosBtn.addEventListener("click", saveChaosImage);
window.addEventListener("resize", resizeCanvas);

resizeCanvas();
setFxText();
requestAnimationFrame(tick);
