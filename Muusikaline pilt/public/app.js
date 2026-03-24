const form = document.getElementById("uploadForm");
const photoInput = document.getElementById("photoInput");
const generateBtn = document.getElementById("generateBtn");
const playBtn = document.getElementById("playBtn");
const stopBtn = document.getElementById("stopBtn");
const speedUpBtn = document.getElementById("speedUpBtn");
const slowedBtn = document.getElementById("slowedBtn");
const speedSlider = document.getElementById("speedSlider");
const speedValue = document.getElementById("speedValue");
const themeToggle = document.getElementById("themeToggle");
const moodPicker = document.getElementById("moodPicker");
const moodSummary = document.getElementById("moodSummary");
const moodOptions = Array.from(document.querySelectorAll(".mood-option"));
const fxButtons = Array.from(document.querySelectorAll(".fx-btn"));
const statusEl = document.getElementById("status");
const paletteEl = document.getElementById("palette");
const objectsEl = document.getElementById("objects");
const musicMetaEl = document.getElementById("musicMeta");
const previewImage = document.getElementById("previewImage");
const previewWrap = document.querySelector(".preview-wrap");

const THEME_STORAGE_KEY = "photo-to-music-theme";

let currentComposition = null;
let transportParts = [];
let previewUrl = null;
let baseTempo = 96;
let playbackRate = 1;
let selectedMoodPreset = "auto";

const fxState = {
  reverb: false,
  echo: false,
  bassBoost: false,
  swing: false,
  stutter: false,
  arpeggio: false,
  octaveUp: false,
  lofi: false
};

const fxNames = {
  reverb: "Reverb",
  echo: "Echo",
  bassBoost: "Bass Boost",
  swing: "Swing",
  stutter: "Stutter",
  arpeggio: "Arpeggio",
  octaveUp: "Octave Up",
  lofi: "Lo-Fi"
};

const masterGain = new Tone.Gain(0.92).toDestination();
const lofiFilter = new Tone.Filter(18000, "lowpass");
const bitCrusher = new Tone.BitCrusher(1);
const reverbFx = new Tone.Reverb({ decay: 2.4, wet: 0 });
const echoFx = new Tone.FeedbackDelay("8n", 0.32);
echoFx.wet.value = 0;

lofiFilter.connect(bitCrusher);
bitCrusher.connect(reverbFx);
reverbFx.connect(echoFx);
echoFx.connect(masterGain);

const leadSynth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "triangle8" },
  envelope: { attack: 0.02, decay: 0.16, sustain: 0.3, release: 0.8 }
}).connect(lofiFilter);

const padSynth = new Tone.PolySynth(Tone.AMSynth, {
  harmonicity: 1.8,
  envelope: { attack: 0.25, decay: 0.2, sustain: 0.45, release: 1.6 }
}).connect(lofiFilter);

const bassSynth = new Tone.MonoSynth({
  oscillator: { type: "square" },
  filterEnvelope: { attack: 0.02, decay: 0.3, sustain: 0.2, release: 0.5, baseFrequency: 120, octaves: 2.2 },
  envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.4 }
}).connect(lofiFilter);

const kick = new Tone.MembraneSynth().connect(lofiFilter);
const snare = new Tone.NoiseSynth({
  noise: { type: "white" },
  envelope: { attack: 0.001, decay: 0.16, sustain: 0 }
}).connect(lofiFilter);
const hat = new Tone.MetalSynth({
  frequency: 280,
  envelope: { attack: 0.001, decay: 0.08, release: 0.01 },
  harmonicity: 5.1,
  modulationIndex: 28,
  resonance: 3600
}).connect(lofiFilter);

function setStatus(message) {
  statusEl.textContent = message;
}

function setTheme(mode) {
  const isLight = mode === "light";
  document.body.classList.toggle("theme-light", isLight);
  themeToggle.textContent = isLight ? "Dark Theme" : "Light-Glass";
  themeToggle.setAttribute("aria-pressed", String(isLight));
}

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "light" || savedTheme === "dark") {
    setTheme(savedTheme);
    return;
  }

  setTheme("dark");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function moodLabel(preset) {
  if (preset === "calm") return "Calm (Major)";
  if (preset === "sad") return "Sad (Minor)";
  if (preset === "meme") return "Happy Meme (Major)";
  return "Auto (from image)";
}

function setMoodPreset(preset) {
  selectedMoodPreset = preset;
  moodSummary.textContent = `Mood: ${moodLabel(preset)}`;
  for (const option of moodOptions) {
    option.classList.toggle("active", option.dataset.mood === preset);
  }
}

function transposeNote(note, semitones) {
  return Tone.Frequency(note).transpose(semitones).toNote();
}

function renderFxButtons() {
  for (const button of fxButtons) {
    const key = button.dataset.fx;
    if (!key) continue;
    button.classList.toggle("active", Boolean(fxState[key]));
  }
}

function applyFxState() {
  reverbFx.wet.rampTo(fxState.reverb ? 0.4 : 0, 0.12);
  echoFx.wet.rampTo(fxState.echo ? 0.3 : 0, 0.12);
  Tone.Transport.swing = fxState.swing ? 0.28 : 0;
  Tone.Transport.swingSubdivision = "16n";

  bassSynth.volume.value = fxState.bassBoost ? 3 : -2;
  kick.volume.value = fxState.bassBoost ? 2 : 0;

  lofiFilter.frequency.rampTo(fxState.lofi ? 2100 : 18000, 0.14);
  bitCrusher.bits = fxState.lofi ? 4 : 1;

  renderFxButtons();
}

function setFxEnabled(enabled) {
  for (const button of fxButtons) {
    button.disabled = !enabled;
  }
}

function renderSpeedValue() {
  speedValue.textContent = `${playbackRate.toFixed(2)}x`;
  speedSlider.value = playbackRate.toFixed(2);
}

function applyPlaybackRate(nextRate) {
  playbackRate = clamp(nextRate, 0.6, 1.8);
  const targetTempo = Math.round(baseTempo * playbackRate);
  Tone.Transport.bpm.rampTo(targetTempo, 0.08);
  renderSpeedValue();
  return targetTempo;
}

function clearPreview() {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }

  previewImage.removeAttribute("src");
  previewWrap.classList.remove("has-image");
}

function updatePreview(file) {
  if (!file) {
    clearPreview();
    return;
  }

  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
  }

  previewUrl = URL.createObjectURL(file);
  previewImage.src = previewUrl;
  previewWrap.classList.add("has-image");
}

function clearParts() {
  for (const part of transportParts) {
    part.dispose();
  }
  transportParts = [];
  Tone.Transport.stop();
  Tone.Transport.cancel(0);
}

function renderPalette(colors) {
  paletteEl.innerHTML = "";
  for (const color of colors) {
    const swatch = document.createElement("div");
    swatch.className = "swatch";
    swatch.style.background = color.hex;
    swatch.title = `${color.hex} (${Math.round(color.ratio * 100)}%)`;
    paletteEl.appendChild(swatch);
  }
}

function renderObjects(objects) {
  objectsEl.innerHTML = "";

  if (!objects.length) {
    const empty = document.createElement("span");
    empty.className = "chip";
    empty.textContent = "No objects detected";
    objectsEl.appendChild(empty);
    return;
  }

  for (const obj of objects) {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = `${obj.label} (${Math.round(obj.score * 100)}%)`;
    objectsEl.appendChild(chip);
  }
}

function renderMeta(comp, analysis) {
  const items = [
    ["Tempo", `${comp.tempo} BPM`],
    ["Key", comp.key],
    ["Scale", comp.scale],
    ["Preset", moodLabel(comp.moodPreset || "auto")],
    ["Mood", comp.mood],
    ["Brightness", analysis.averageBrightness],
    ["Saturation", analysis.averageSaturation]
  ];

  musicMetaEl.innerHTML = "";
  for (const [k, v] of items) {
    const el = document.createElement("div");
    el.className = "meta-item";
    el.innerHTML = `<div class="k">${k}</div><div class="v">${v}</div>`;
    musicMetaEl.appendChild(el);
  }
}

function configureTransport(composition) {
  clearParts();

  baseTempo = composition.tempo;
  applyPlaybackRate(1);
  Tone.Transport.loop = true;
  Tone.Transport.loopStart = 0;
  Tone.Transport.loopEnd = "1m";

  const melodyPart = new Tone.Sequence(
    (time, step) => {
      const slot = composition.melody[step];
      if (!slot) return;

      const melodyNote = fxState.octaveUp ? transposeNote(slot.note, 12) : slot.note;
      leadSynth.triggerAttackRelease(melodyNote, "16n", time, slot.velocity);

      if (fxState.stutter) {
        const offset = Tone.Time("32n").toSeconds();
        leadSynth.triggerAttackRelease(melodyNote, "32n", time + offset, Math.max(0.2, slot.velocity * 0.75));
      }
    },
    Array.from({ length: composition.loopLength }, (_, i) => i),
    "16n"
  ).start(0);

  const bassPart = new Tone.Sequence(
    (time, step) => {
      const slot = composition.bass[step];
      if (!slot) return;
      bassSynth.triggerAttackRelease(slot.note, "8n", time, slot.velocity);
    },
    Array.from({ length: composition.loopLength }, (_, i) => i),
    "16n"
  ).start(0);

  const chordPart = new Tone.Sequence(
    (time, step) => {
      const slot = composition.chords[step];
      if (!slot) return;

      if (fxState.arpeggio) {
        const jump = Tone.Time("16n").toSeconds() * 0.5;
        slot.notes.forEach((note, idx) => {
          padSynth.triggerAttackRelease(note, "8n", time + idx * jump, slot.velocity);
        });
      } else {
        padSynth.triggerAttackRelease(slot.notes, "4n", time, slot.velocity);
      }
    },
    Array.from({ length: composition.loopLength }, (_, i) => i),
    "16n"
  ).start(0);

  const drumPart = new Tone.Sequence(
    (time, step) => {
      if (composition.drums.kick[step]) {
        kick.triggerAttackRelease("C1", "8n", time, 0.85);
      }
      if (composition.drums.snare[step]) {
        snare.triggerAttackRelease("16n", time, 0.3);
      }
      if (composition.drums.hat[step]) {
        hat.triggerAttackRelease("32n", time, 0.18);
      }
    },
    Array.from({ length: composition.loopLength }, (_, i) => i),
    "16n"
  ).start(0);

  transportParts.push(melodyPart, bassPart, chordPart, drumPart);
}

photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];
  updatePreview(file);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const file = photoInput.files[0];
  if (!file) {
    clearPreview();
    setStatus("Please choose an image first.");
    return;
  }

  updatePreview(file);

  const payload = new FormData();
  payload.append("photo", file);
  payload.append("moodPreset", selectedMoodPreset);

  generateBtn.disabled = true;
  setStatus("Analyzing image and composing track...");

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      body: payload
    });

    if (!response.ok) {
      throw new Error("Request failed.");
    }

    const data = await response.json();
    currentComposition = data.composition;

    renderPalette(data.analysis.dominantColors);
    renderObjects(data.analysis.objects);
    renderMeta(data.composition, data.analysis);

    configureTransport(data.composition);

    playBtn.disabled = false;
    stopBtn.disabled = false;
    speedUpBtn.disabled = false;
    slowedBtn.disabled = false;
    speedSlider.disabled = false;
    setFxEnabled(true);
    applyFxState();
    setStatus("Track generated. Press Play.");
  } catch (error) {
    setStatus("Generation failed. Try another image.");
    console.error(error);
  } finally {
    generateBtn.disabled = false;
  }
});

playBtn.addEventListener("click", async () => {
  if (!currentComposition) return;

  await Tone.start();
  Tone.Transport.start();
  setStatus("Playing generated track...");
});

stopBtn.addEventListener("click", () => {
  Tone.Transport.stop();
  setStatus("Playback stopped.");
});

speedUpBtn.addEventListener("click", () => {
  const tempo = applyPlaybackRate(playbackRate + 0.1);
  setStatus(`Speedup active: ${tempo} BPM (${playbackRate.toFixed(2)}x)`);
});

slowedBtn.addEventListener("click", () => {
  const tempo = applyPlaybackRate(playbackRate - 0.1);
  setStatus(`Slowed active: ${tempo} BPM (${playbackRate.toFixed(2)}x)`);
});

speedSlider.addEventListener("input", (event) => {
  const nextRate = Number(event.target.value);
  const tempo = applyPlaybackRate(nextRate);
  setStatus(`Speed set: ${tempo} BPM (${playbackRate.toFixed(2)}x)`);
});

for (const button of fxButtons) {
  button.addEventListener("click", () => {
    const fx = button.dataset.fx;
    if (!fx || !(fx in fxState)) return;

    fxState[fx] = !fxState[fx];
    applyFxState();
    setStatus(`${fxNames[fx]} ${fxState[fx] ? "enabled" : "disabled"}.`);
  });
}

for (const option of moodOptions) {
  option.addEventListener("click", () => {
    const preset = option.dataset.mood || "auto";
    setMoodPreset(preset);
    moodPicker.open = false;
    setStatus(`Mood preset selected: ${moodLabel(preset)}.`);
  });
}

themeToggle.addEventListener("click", () => {
  const isLightActive = document.body.classList.contains("theme-light");
  const nextTheme = isLightActive ? "dark" : "light";
  setTheme(nextTheme);
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
});

setMoodPreset("auto");
setFxEnabled(false);
applyFxState();
initTheme();
