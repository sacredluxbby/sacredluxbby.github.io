const canvas = document.getElementById('synthCanvas');
const ctx = canvas.getContext('2d');

const strokeCountValue = document.getElementById('strokeCountValue');
const noteCountValue = document.getElementById('noteCountValue');
const modeValue = document.getElementById('modeValue');
const scaleValue = document.getElementById('scaleValue');
const lastNoteValue = document.getElementById('lastNoteValue');
const energyValue = document.getElementById('energyValue');
const loopValue = document.getElementById('loopValue');
const magnetValue = document.getElementById('magnetValue');
const statusText = document.getElementById('statusText');

const densityFill = document.getElementById('densityFill');
const resonanceLabel = document.getElementById('resonanceLabel');
const resonanceFill = document.getElementById('resonanceFill');
const echoLabel = document.getElementById('echoLabel');
const echoFill = document.getElementById('echoFill');
const spreadLabel = document.getElementById('spreadLabel');
const spreadFill = document.getElementById('spreadFill');

const instrumentSelect = document.getElementById('instrumentSelect');
const scaleSelect = document.getElementById('scaleSelect');
const brushSizeInput = document.getElementById('brushSizeInput');
const densityInput = document.getElementById('densityInput');
const echoInput = document.getElementById('echoInput');
const symmetryToggle = document.getElementById('symmetryToggle');
const addMagnetButton = document.getElementById('addMagnetButton');
const clearMagnetsButton = document.getElementById('clearMagnetsButton');

const overlay = document.getElementById('overlay');
const overlayButton = document.getElementById('overlayButton');
const startButton = document.getElementById('startButton');
const clearButton = document.getElementById('clearButton');
const recordButton = document.getElementById('recordButton');
const shakeButton = document.getElementById('shakeButton');
const bgVibeToggle = document.getElementById('bgVibeToggle');
const waveBars = document.getElementById('waveBars');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const TRAIL_LIFE = 6.6;
const LOOP_DURATION_MS = 5000;
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const KEYBOARD_ROWS = [
    ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal'],
    ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight'],
    ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote'],
    ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash'],
];
const KEYBOARD_NOTE_CODES = KEYBOARD_ROWS.flat();
const KEYBOARD_BASE_MIDI = 48;
const pressedKeyboardCodes = new Set();

const instrumentPresets = {
    red: {
        label: 'Roosa bass',
        hue: 328,
        oscA: 'sawtooth',
        oscB: 'square',
        detune: -8,
        filter: 'lowpass',
        filterBase: 100,
        filterRange: 1800,
        qBase: 2.2,
        attack: 0.006,
    },
    blue: {
        label: 'Violetne klaver',
        hue: 275,
        oscA: 'sine',
        oscB: 'triangle',
        detune: 5,
        filter: 'lowpass',
        filterBase: 340,
        filterRange: 2600,
        qBase: 1.2,
        attack: 0.012,
    },
    yellow: {
        label: 'Lavendel sünt',
        hue: 300,
        oscA: 'triangle',
        oscB: 'sawtooth',
        detune: 9,
        filter: 'highpass',
        filterBase: 180,
        filterRange: 4200,
        qBase: 1.8,
        attack: 0.007,
    },
    green: {
        label: 'Neoon mint',
        hue: 155,
        oscA: 'triangle',
        oscB: 'sine',
        detune: 3,
        filter: 'lowpass',
        filterBase: 280,
        filterRange: 3200,
        qBase: 1.4,
        attack: 0.01,
    },
    cyan: {
        label: 'Jaasinine pluck',
        hue: 196,
        oscA: 'square',
        oscB: 'triangle',
        detune: -2,
        filter: 'bandpass',
        filterBase: 520,
        filterRange: 3600,
        qBase: 2.4,
        attack: 0.005,
    },
    orange: {
        label: 'Korall lead',
        hue: 18,
        oscA: 'sawtooth',
        oscB: 'triangle',
        detune: 7,
        filter: 'highpass',
        filterBase: 220,
        filterRange: 3900,
        qBase: 1.9,
        attack: 0.008,
    },
};

const scalePresets = {
    cMinorPent: { label: 'C min pentatoonika', rootMidi: 48, intervals: [0, 3, 5, 7, 10] },
    dDorian: { label: 'D dooria', rootMidi: 50, intervals: [0, 2, 3, 5, 7, 9, 10] },
    fLydian: { label: 'F lüüdia', rootMidi: 53, intervals: [0, 2, 4, 6, 7, 9, 11] },
    aHarmonic: { label: 'A harmooniline moll', rootMidi: 57, intervals: [0, 2, 3, 5, 7, 8, 11] },
    gMajor: { label: 'G duur', rootMidi: 55, intervals: [0, 2, 4, 5, 7, 9, 11] },
    eNaturalMinor: { label: 'E naturaalne moll', rootMidi: 52, intervals: [0, 2, 3, 5, 7, 8, 10] },
    bPhrygian: { label: 'B friigia', rootMidi: 59, intervals: [0, 1, 3, 5, 7, 8, 10] },
    ebBlues: { label: 'Eb blues', rootMidi: 51, intervals: [0, 3, 5, 6, 7, 10] },
    cWholeTone: { label: 'C täistoon', rootMidi: 48, intervals: [0, 2, 4, 6, 8, 10] },
};

for (let index = 0; index < 24; index += 1) {
    const bar = document.createElement('span');
    bar.className = 'wave-bar';
    bar.style.setProperty('--bar-scale', '0.18');
    waveBars.appendChild(bar);
}

const barNodes = [...waveBars.children];

let audioContext = null;
let masterGain = null;
let delayNode = null;
let feedbackGain = null;
let analyserNode = null;
let analyserData = null;
let bgVibeNodes = null;

const state = {
    awake: false,
    time: 0,
    lastFrame: performance.now(),
    strokeCount: 0,
    noteCount: 0,
    lastNote: '-',
    status: 'Arata heli ja hakka joonistama.',

    instrumentKey: instrumentSelect.value,
    scaleKey: scaleSelect.value,
    brushSize: Number(brushSizeInput.value),
    density: Number(densityInput.value),
    echoAmount: Number(echoInput.value),
    symmetryEnabled: Boolean(symmetryToggle.checked),
    magnetPlacementMode: false,

    activeStroke: null,
    trails: [],
    trailBuses: [],
    nextTrailId: 1,
    particles: [],
    ripples: [],
    magnets: [],
    nextMagnetId: 1,

    noteTimes: [],
    recentMidis: [],
    resonance: 0,
    spread: 0,
    energy: 0,
    pointer: { x: WIDTH * 0.5, y: HEIGHT * 0.5 },

    looper: {
        recording: false,
        enabled: false,
        events: [],
        startMs: 0,
        durationMs: LOOP_DURATION_MS,
        playheadMs: 0,
        nextEventIndex: 0,
        lastNoteRecordMs: -Infinity,
        lastTrailRecordMs: -Infinity,
    },

    bgVibeEnabled: false,
    bgVibeDensity: 0,
    shakeDebounce: 0,

    networkNodes: Array.from({ length: 10 }, (_, index) => ({
        angle: (Math.PI * 2 * index) / 10,
        radius: 110 + Math.random() * 180,
        speed: 0.12 + Math.random() * 0.18,
        offset: Math.random() * Math.PI * 2,
    })),
};

function ensureAudio() {
    if (audioContext) {
        return true;
    }

    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) {
        state.status = 'See brauser ei toeta Web Audio mootorit.';
        return false;
    }

    audioContext = new AudioCtor();
    masterGain = audioContext.createGain();
    delayNode = audioContext.createDelay(1.4);
    feedbackGain = audioContext.createGain();
    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 256;
    analyserData = new Uint8Array(analyserNode.frequencyBinCount);

    masterGain.gain.value = 0.2;
    delayNode.delayTime.value = 0.24;
    feedbackGain.gain.value = 0.24;

    delayNode.connect(feedbackGain);
    feedbackGain.connect(delayNode);

    masterGain.connect(analyserNode);
    delayNode.connect(analyserNode);
    analyserNode.connect(audioContext.destination);

    applyAudioSettings();
    return true;
}

function applyAudioSettings() {
    const echoRatio = state.echoAmount / 100;
    echoLabel.textContent = `${Math.round(state.echoAmount)}%`;
    echoFill.style.width = `${state.echoAmount}%`;

    if (!delayNode || !feedbackGain || !masterGain || !audioContext) {
        return;
    }

    delayNode.delayTime.setTargetAtTime(0.14 + echoRatio * 0.42, audioContext.currentTime, 0.06);
    feedbackGain.gain.setTargetAtTime(0.05 + echoRatio * 0.52, audioContext.currentTime, 0.06);
    masterGain.gain.setTargetAtTime(0.14 + echoRatio * 0.08, audioContext.currentTime, 0.06);

    state.trailBuses.forEach((bus) => {
        if (!bus.gainNode) {
            return;
        }
        const ratio = Math.max(0, Math.min(1, bus.life / bus.maxLife));
        bus.gainNode.gain.setTargetAtTime(echoRatio * 0.8 * ratio, audioContext.currentTime, 0.08);
    });
}

function awakenStudio() {
    if (!ensureAudio()) {
        updateHud();
        return;
    }

    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    state.awake = true;
    overlay.classList.remove('visible');
    state.status = 'Helimootor aktiivne. Joonista louendile.';
    playWakeChord();
    updateHud();
}

function createTrailBus() {
    const bus = {
        id: state.nextTrailId,
        life: TRAIL_LIFE,
        maxLife: TRAIL_LIFE,
        gainNode: null,
    };
    state.nextTrailId += 1;

    if (audioContext && delayNode) {
        bus.gainNode = audioContext.createGain();
        bus.gainNode.gain.value = 0;
        bus.gainNode.connect(delayNode);
    }

    state.trailBuses.push(bus);
    return bus;
}

function getTrailBus(trailId) {
    if (!trailId) {
        return null;
    }
    return state.trailBuses.find((bus) => bus.id === trailId) || null;
}

function refreshTrailBus(trailId) {
    const bus = getTrailBus(trailId);
    if (!bus) {
        return;
    }
    bus.life = TRAIL_LIFE;
}

function playWakeChord() {
    playTone({ frequency: 220, duration: 0.24, intensity: 0.2, pan: 0, brightness: 0.65, sharpness: 0.35, width: 0.45 });
    playTone({ frequency: 329.63, duration: 0.24, intensity: 0.16, pan: -0.12, brightness: 0.68, sharpness: 0.4, width: 0.5 });
    playTone({ frequency: 493.88, duration: 0.28, intensity: 0.15, pan: 0.12, brightness: 0.7, sharpness: 0.45, width: 0.52 });
}

function playTone({
    frequency,
    duration,
    intensity,
    pan,
    brightness,
    sharpness,
    width,
    trailBus = null,
    instrumentKey = state.instrumentKey,
}) {
    if (!audioContext || !masterGain) {
        return;
    }

    const preset = instrumentPresets[instrumentKey] || instrumentPresets.blue;
    const now = audioContext.currentTime;

    const voiceGain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    const panNode = typeof audioContext.createStereoPanner === 'function'
        ? audioContext.createStereoPanner()
        : null;

    const oscA = audioContext.createOscillator();
    const oscB = audioContext.createOscillator();
    oscA.type = preset.oscA;
    oscB.type = preset.oscB;
    oscA.frequency.setValueAtTime(frequency, now);
    oscB.frequency.setValueAtTime(frequency * (1 + width * 0.018), now);
    oscB.detune.value = preset.detune;

    filter.type = preset.filter;
    filter.frequency.setValueAtTime(
        preset.filterBase + brightness * preset.filterRange + sharpness * 2200,
        now,
    );
    filter.Q.value = preset.qBase + sharpness * 7;

    const attack = Math.max(0.004, preset.attack - sharpness * 0.003);
    const sustain = Math.max(0.05, duration - 0.05);
    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.linearRampToValueAtTime(intensity, now + attack);
    voiceGain.gain.linearRampToValueAtTime(intensity * 0.48, now + sustain * 0.55);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscA.connect(filter);
    oscB.connect(filter);
    filter.connect(voiceGain);

    if (panNode) {
        panNode.pan.value = pan;
        voiceGain.connect(panNode);
        panNode.connect(masterGain);
    } else {
        voiceGain.connect(masterGain);
    }

    if (trailBus && trailBus.gainNode) {
        const sendGain = audioContext.createGain();
        sendGain.gain.value = intensity * (0.42 + sharpness * 0.85);
        voiceGain.connect(sendGain);
        sendGain.connect(trailBus.gainNode);
    }

    oscA.start(now);
    oscB.start(now);
    oscA.stop(now + duration + 0.02);
    oscB.stop(now + duration + 0.02);
}

function midiToFrequency(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

function midiToName(midi) {
    const note = NOTE_NAMES[midi % 12];
    const octave = Math.floor(midi / 12) - 1;
    return `${note}${octave}`;
}

function mapPointToNote(_x, y) {
    const scale = scalePresets[state.scaleKey] || scalePresets.cMinorPent;
    const scaleLength = scale.intervals.length;
    const slots = scaleLength * 4;
    const yRatio = 1 - Math.max(0, Math.min(1, y / HEIGHT));
    const slot = Math.max(0, Math.min(slots - 1, Math.floor(yRatio * (slots - 1))));
    const interval = scale.intervals[slot % scaleLength] + 12 * Math.floor(slot / scaleLength);
    const midi = scale.rootMidi + interval;
    return {
        midi,
        frequency: midiToFrequency(midi),
        name: midiToName(midi),
        brightness: yRatio,
    };
}

function makeBrushPalette(x, y, velocity, instrumentKey = state.instrumentKey) {
    const preset = instrumentPresets[instrumentKey] || instrumentPresets.blue;
    const hue = (preset.hue + Math.sin(state.time * 2 + x * 0.008) * 10 + Math.min(10, velocity * 0.01)) % 360;
    const yRatio = 1 - (y / HEIGHT);
    const light = 42 + yRatio * 20 + Math.min(15, velocity * 0.016);
    return {
        core: `hsl(${hue} 90% ${light}%)`,
        glow: `hsl(${hue} 100% ${Math.min(92, light + 12)}%)`,
        particle: `hsl(${hue} 100% ${Math.min(94, light + 16)}%)`,
    };
}

function setStatus(message) {
    state.status = message;
}

function startRecording() {
    if (!state.awake) {
        awakenStudio();
    }

    state.looper.recording = true;
    state.looper.enabled = false;
    state.looper.events = [];
    state.looper.startMs = performance.now();
    state.looper.playheadMs = 0;
    state.looper.nextEventIndex = 0;
    state.looper.lastNoteRecordMs = -Infinity;
    state.looper.lastTrailRecordMs = -Infinity;
    setStatus('Salvestan 5s. Joonista!');
}

function stopRecording(startLoop) {
    if (!state.looper.recording) {
        return;
    }

    state.looper.recording = false;
    state.looper.events.sort((a, b) => a.t - b.t);

    if (startLoop && state.looper.events.length > 0) {
        state.looper.enabled = true;
        state.looper.playheadMs = 0;
        state.looper.nextEventIndex = 0;
        setStatus('Looper aktiivne. Muster ringleb.');
    } else {
        state.looper.enabled = false;
        setStatus('Salvestus peatatud.');
    }
}

function stopLoop() {
    if (!state.looper.enabled) {
        return;
    }
    state.looper.enabled = false;
    state.looper.playheadMs = 0;
    state.looper.nextEventIndex = 0;
    setStatus('Looper peatatud.');
}

function recordLoopEvent(event) {
    if (!state.looper.recording) {
        return;
    }

    const now = performance.now();
    const elapsed = now - state.looper.startMs;
    if (elapsed < 0 || elapsed > state.looper.durationMs || state.looper.events.length > 2200) {
        return;
    }

    if (event.kind === 'note') {
        if (now - state.looper.lastNoteRecordMs < 24) {
            return;
        }
        state.looper.lastNoteRecordMs = now;
    }

    if ((event.kind === 'segment' || event.kind === 'dot') && now - state.looper.lastTrailRecordMs < 18) {
        return;
    }

    if (event.kind === 'segment' || event.kind === 'dot') {
        state.looper.lastTrailRecordMs = now;
    }

    state.looper.events.push({ ...event, t: elapsed });
}

function playLoopEvent(event) {
    if (event.kind === 'note') {
        const trailBus = null;
        playTone({
            frequency: event.frequency,
            duration: event.duration,
            intensity: event.intensity,
            pan: event.pan,
            brightness: event.brightness,
            sharpness: event.sharpness,
            width: event.width,
            trailBus,
            instrumentKey: event.instrumentKey,
        });

        state.lastNote = event.noteName;
        state.noteCount += 1;
        state.noteTimes.push(performance.now());
        state.recentMidis.push(event.midi);
        if (state.recentMidis.length > 18) {
            state.recentMidis.shift();
        }

        spawnRipple(event.x, event.y, event.glow, event.intensity * 2.4);
        spawnParticles(event.x, event.y, {
            core: event.core,
            glow: event.glow,
            particle: event.particle,
        }, event.intensity * 2.2);
        pushTrailDot(event.x, event.y, Math.max(2, event.width * 0.32), {
            core: event.core,
            glow: event.glow,
        }, null, 'loop', false, TRAIL_LIFE * 0.5);
        return;
    }

    if (event.kind === 'segment') {
        pushTrailSegment(
            event.x1,
            event.y1,
            event.x2,
            event.y2,
            event.width,
            { core: event.core, glow: event.glow },
            null,
            'loop',
            false,
            TRAIL_LIFE * 0.45,
        );
        return;
    }

    if (event.kind === 'dot') {
        pushTrailDot(
            event.x,
            event.y,
            event.radius,
            { core: event.core, glow: event.glow },
            null,
            'loop',
            false,
            TRAIL_LIFE * 0.45,
        );
    }
}

function updateLooper(dt) {
    const now = performance.now();

    if (state.looper.recording) {
        const elapsed = now - state.looper.startMs;
        if (elapsed >= state.looper.durationMs) {
            stopRecording(true);
        }
    }

    if (!state.looper.enabled || state.looper.events.length === 0) {
        return;
    }

    const previousPlayhead = state.looper.playheadMs;
    state.looper.playheadMs += dt * 1000;

    if (state.looper.playheadMs >= state.looper.durationMs) {
        while (state.looper.nextEventIndex < state.looper.events.length) {
            playLoopEvent(state.looper.events[state.looper.nextEventIndex]);
            state.looper.nextEventIndex += 1;
        }

        state.looper.playheadMs %= state.looper.durationMs;
        state.looper.nextEventIndex = 0;
    }

    while (
        state.looper.nextEventIndex < state.looper.events.length &&
        state.looper.events[state.looper.nextEventIndex].t <= state.looper.playheadMs
    ) {
        if (state.looper.events[state.looper.nextEventIndex].t > previousPlayhead || state.looper.playheadMs < previousPlayhead) {
            playLoopEvent(state.looper.events[state.looper.nextEventIndex]);
        }
        state.looper.nextEventIndex += 1;
    }
}

function updateRecordButton() {
    if (state.looper.recording) {
        const elapsed = Math.max(0, performance.now() - state.looper.startMs);
        const left = Math.max(0, (state.looper.durationMs - elapsed) / 1000);
        recordButton.textContent = `SALVESTAB ${left.toFixed(1)}s`;
        return;
    }

    if (state.looper.enabled) {
        recordButton.textContent = 'PEATA LOOP';
        return;
    }

    recordButton.textContent = 'SALVESTA 5S LOOP';
}

function addMagnetAt(x, y) {
    if (state.magnets.length >= 8) {
        setStatus('Maksimaalselt 8 magnetit.');
        return;
    }

    state.magnets.push({
        id: state.nextMagnetId,
        x,
        y,
        radius: 38 + Math.random() * 28,
        speed: 0.8 + Math.random() * 1.2,
        phase: Math.random() * Math.PI * 2,
        particleCount: 6 + Math.floor(Math.random() * 3),
        pulseTimer: Math.random() * 0.35,
        pulseInterval: 0.26 + Math.random() * 0.24,
    });
    state.nextMagnetId += 1;
    setStatus('Magnet lisatud.');
}

function clearMagnets() {
    state.magnets = [];
    setStatus('Magnetid eemaldatud.');
}

function emitMagnetPulse(magnet) {
    if (!state.awake) {
        return;
    }

    const angle = magnet.phase * 1.45 + magnet.id;
    const x = magnet.x + Math.cos(angle) * magnet.radius;
    const y = magnet.y + Math.sin(angle) * (magnet.radius * 0.82);
    const palette = makeBrushPalette(x, y, 440, state.instrumentKey);

    pushTrailDot(x, y, 2.4, palette, null, 'magnet', false, TRAIL_LIFE * 0.6);
    emitNote(x, y, 420, palette, null, {
        source: 'magnet',
        allowRecord: false,
        intensityScale: 0.72,
        instrumentKey: state.instrumentKey,
    });
}

function updateMagnets(dt) {
    state.magnets.forEach((magnet) => {
        magnet.phase += dt * magnet.speed;
        magnet.pulseTimer += dt;
        if (magnet.pulseTimer >= magnet.pulseInterval) {
            magnet.pulseTimer -= magnet.pulseInterval;
            emitMagnetPulse(magnet);
        }
    });
}

function getSymmetryPairs(x1, y1, x2, y2) {
    if (!state.symmetryEnabled) {
        return [{ from: { x: x1, y: y1 }, to: { x: x2, y: y2 } }];
    }

    const transforms = [
        (x, y) => ({ x, y }),
        (x, y) => ({ x: WIDTH - x, y }),
        (x, y) => ({ x, y: HEIGHT - y }),
        (x, y) => ({ x: WIDTH - x, y: HEIGHT - y }),
    ];

    const map = new Map();
    transforms.forEach((transform) => {
        const from = transform(x1, y1);
        const to = transform(x2, y2);
        const key = `${Math.round(from.x)}:${Math.round(from.y)}:${Math.round(to.x)}:${Math.round(to.y)}`;
        if (!map.has(key)) {
            map.set(key, { from, to });
        }
    });

    return [...map.values()];
}

function getSymmetryPoints(x, y) {
    if (!state.symmetryEnabled) {
        return [{ x, y }];
    }

    const points = [
        { x, y },
        { x: WIDTH - x, y },
        { x, y: HEIGHT - y },
        { x: WIDTH - x, y: HEIGHT - y },
    ];

    const map = new Map();
    points.forEach((point) => {
        const key = `${Math.round(point.x)}:${Math.round(point.y)}`;
        if (!map.has(key)) {
            map.set(key, point);
        }
    });
    return [...map.values()];
}

function pushTrailSegment(
    x1,
    y1,
    x2,
    y2,
    width,
    palette,
    trailId,
    source = 'draw',
    shouldRecord = true,
    life = TRAIL_LIFE,
) {
    state.trails.push({
        kind: 'line',
        x1,
        y1,
        x2,
        y2,
        width,
        core: palette.core,
        glow: palette.glow,
        life,
        maxLife: life,
        trailId,
    });

    if (source === 'draw' && shouldRecord) {
        recordLoopEvent({
            kind: 'segment',
            x1,
            y1,
            x2,
            y2,
            width,
            core: palette.core,
            glow: palette.glow,
        });
    }
}

function pushTrailDot(
    x,
    y,
    radius,
    palette,
    trailId,
    source = 'draw',
    shouldRecord = true,
    life = TRAIL_LIFE,
) {
    state.trails.push({
        kind: 'dot',
        x,
        y,
        radius,
        core: palette.core,
        glow: palette.glow,
        life,
        maxLife: life,
        trailId,
    });

    if (source === 'draw' && shouldRecord) {
        recordLoopEvent({
            kind: 'dot',
            x,
            y,
            radius,
            core: palette.core,
            glow: palette.glow,
        });
    }
}

function pushWaveformTrail(from, to, width, palette, trailId, speedNorm, source = 'draw') {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 1) {
        return;
    }

    const normalX = -dy / distance;
    const normalY = dx / distance;
    const segments = Math.max(2, Math.ceil(distance / 7));
    const amplitude = width * (0.08 + state.resonance * 0.85 + speedNorm * 0.35);
    const frequency = 1.8 + speedNorm * 3.2 + state.energy * 1.5;

    let previousX = from.x;
    let previousY = from.y;
    for (let index = 1; index <= segments; index += 1) {
        const t = index / segments;
        const baseX = from.x + dx * t;
        const baseY = from.y + dy * t;
        const wobble = Math.sin(state.time * 16 + t * Math.PI * frequency * 2) * amplitude;
        const x = baseX + normalX * wobble;
        const y = baseY + normalY * wobble;

        pushTrailSegment(
            previousX,
            previousY,
            x,
            y,
            width,
            palette,
            trailId,
            source,
            source === 'draw' ? index % 3 === 0 : false,
        );

        previousX = x;
        previousY = y;
    }
}

function spawnParticles(x, y, palette, strength) {
    const count = 3 + Math.floor(strength * 5);
    for (let index = 0; index < count; index += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 18 + Math.random() * 70 + strength * 30;
        const life = 0.25 + Math.random() * 0.45;
        state.particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life,
            maxLife: life,
            radius: Math.random() * 2.2 + 1,
            color: palette.particle,
        });
    }
}

function spawnRipple(x, y, color, strength) {
    state.ripples.push({
        x,
        y,
        radius: 10,
        life: 0.6,
        width: 1.8 + strength * 2.4,
        color,
    });
}

function getDensitySpacing() {
    return 36 - ((state.density - 20) / 80) * 28;
}

function emitNote(x, y, velocity, palette, trailId, options = {}) {
    const source = options.source || 'draw';
    const allowRecord = options.allowRecord !== false;
    const instrumentKey = options.instrumentKey || state.instrumentKey;
    const intensityScale = options.intensityScale || 1;

    const note = mapPointToNote(x, y);
    const speedNorm = Math.max(0, Math.min(1, velocity / 950));
    const intensity = Math.max(0.1, Math.min(0.48, (0.1 + speedNorm * 0.38) * intensityScale));
    const sharpness = Math.max(0, Math.min(1, velocity / 1100));
    const pan = (x / WIDTH) * 2 - 1;
    const duration = 0.11 + (1 - speedNorm) * 0.18;
    const width = state.brushSize / 12;
    const trailBus = getTrailBus(trailId);

    playTone({
        frequency: note.frequency,
        duration,
        intensity,
        pan,
        brightness: note.brightness,
        sharpness,
        width,
        trailBus,
        instrumentKey,
    });

    state.noteCount += 1;
    state.lastNote = note.name;
    state.noteTimes.push(performance.now());
    state.recentMidis.push(note.midi);
    if (state.recentMidis.length > 18) {
        state.recentMidis.shift();
    }

    if (trailId) {
        refreshTrailBus(trailId);
    }

    spawnRipple(x, y, palette.glow, intensity * 3.2);
    spawnParticles(x, y, palette, intensity * 3.4);

    if (source === 'draw' && allowRecord) {
        recordLoopEvent({
            kind: 'note',
            x,
            y,
            frequency: note.frequency,
            noteName: note.name,
            midi: note.midi,
            duration,
            intensity,
            pan,
            brightness: note.brightness,
            sharpness,
            width,
            instrumentKey,
            core: palette.core,
            glow: palette.glow,
            particle: palette.particle,
        });
    }
}

function isTypingTarget(target) {
    if (!target) {
        return false;
    }
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

function playKeyboardNote(code) {
    const keyIndex = KEYBOARD_NOTE_CODES.indexOf(code);
    if (keyIndex === -1) {
        return false;
    }

    let rowIndex = 0;
    let rowPosition = keyIndex;
    for (let index = 0; index < KEYBOARD_ROWS.length; index += 1) {
        const found = KEYBOARD_ROWS[index].indexOf(code);
        if (found !== -1) {
            rowIndex = index;
            rowPosition = found;
            break;
        }
    }

    if (!state.awake) {
        awakenStudio();
    }
    if (!audioContext || !masterGain) {
        return true;
    }

    const midi = KEYBOARD_BASE_MIDI + keyIndex;
    const frequency = midiToFrequency(midi);
    const noteName = midiToName(midi);
    const xPad = WIDTH * 0.1;
    const rowWidth = Math.max(1, KEYBOARD_ROWS[rowIndex].length - 1);
    const x = xPad + (rowPosition / rowWidth) * (WIDTH - xPad * 2);
    const y = HEIGHT * (0.32 + rowIndex * 0.14);
    const palette = makeBrushPalette(x, y, 420 + rowIndex * 60, state.instrumentKey);
    const intensity = 0.18 + rowIndex * 0.03;
    const sharpness = 0.3 + rowIndex * 0.1;
    const brightness = 1 - (y / HEIGHT);
    const pan = (x / WIDTH) * 2 - 1;
    const width = state.brushSize / 12;

    playTone({
        frequency,
        duration: 0.2,
        intensity,
        pan,
        brightness,
        sharpness,
        width,
        trailBus: null,
        instrumentKey: state.instrumentKey,
    });

    state.noteCount += 1;
    state.lastNote = noteName;
    state.noteTimes.push(performance.now());
    state.recentMidis.push(midi);
    if (state.recentMidis.length > 18) {
        state.recentMidis.shift();
    }

    pushTrailDot(x, y, Math.max(2, state.brushSize * 0.22), palette, null, 'keyboard', false, TRAIL_LIFE * 0.55);
    spawnRipple(x, y, palette.glow, intensity * 2.7);
    spawnParticles(x, y, palette, intensity * 2.5);
    setStatus(`Klahv ${code} -> ${noteName}`);
    return true;
}

function beginStroke(point, pointerId) {
    if (state.magnetPlacementMode) {
        addMagnetAt(point.x, point.y);
        return;
    }

    if (!state.awake) {
        awakenStudio();
    }

    const trailBus = createTrailBus();
    state.activeStroke = {
        pointerId,
        trailId: trailBus.id,
        lastX: point.x,
        lastY: point.y,
        lastTime: performance.now(),
        emitDistance: 999,
        lastEmitAt: 0,
    };
    state.strokeCount += 1;

    getSymmetryPoints(point.x, point.y).forEach((symPoint) => {
        const palette = makeBrushPalette(symPoint.x, symPoint.y, 120, state.instrumentKey);
        pushTrailDot(symPoint.x, symPoint.y, state.brushSize * 0.5, palette, trailBus.id, 'draw', true);
        emitNote(symPoint.x, symPoint.y, 120, palette, trailBus.id, {
            source: 'draw',
            allowRecord: true,
            intensityScale: state.symmetryEnabled ? 0.9 : 1,
            instrumentKey: state.instrumentKey,
        });
    });

    setStatus('Lõuend kuulab sinu zesti.');
}

function continueStroke(point) {
    const stroke = state.activeStroke;
    if (!stroke) {
        return;
    }

    const now = performance.now();
    const dx = point.x - stroke.lastX;
    const dy = point.y - stroke.lastY;
    const distance = Math.hypot(dx, dy);
    if (distance < 1.5) {
        return;
    }

    const dt = Math.max(0.016, (now - stroke.lastTime) / 1000);
    const velocity = distance / dt;
    const speedNorm = Math.max(0, Math.min(1, velocity / 950));
    const steps = Math.max(1, Math.ceil(distance / 4));
    const spacing = getDensitySpacing();

    for (let index = 1; index <= steps; index += 1) {
        const t = index / steps;
        const x = stroke.lastX + dx * t;
        const y = stroke.lastY + dy * t;
        const pairSet = getSymmetryPairs(stroke.lastX, stroke.lastY, x, y);

        pairSet.forEach((pair) => {
            const palette = makeBrushPalette(pair.to.x, pair.to.y, velocity, state.instrumentKey);
            const width = state.brushSize * (0.5 + Math.min(0.95, velocity / 950));
            pushWaveformTrail(pair.from, pair.to, width, palette, stroke.trailId, speedNorm, 'draw');
        });

        stroke.emitDistance += distance / steps;
        if (stroke.emitDistance >= spacing && now - stroke.lastEmitAt > 34) {
            getSymmetryPoints(x, y).forEach((symPoint) => {
                const palette = makeBrushPalette(symPoint.x, symPoint.y, velocity, state.instrumentKey);
                emitNote(symPoint.x, symPoint.y, velocity, palette, stroke.trailId, {
                    source: 'draw',
                    allowRecord: true,
                    intensityScale: state.symmetryEnabled ? 0.86 : 1,
                    instrumentKey: state.instrumentKey,
                });
            });
            stroke.emitDistance = 0;
            stroke.lastEmitAt = now;
        }
    }

    stroke.lastX = point.x;
    stroke.lastY = point.y;
    stroke.lastTime = now;
}

function endStroke(pointerId) {
    if (state.activeStroke && state.activeStroke.pointerId === pointerId) {
        state.activeStroke = null;
        setStatus('Uus joon voib alata.');
    }
}

function playShakeSound() {
    if (!audioContext) return;
    const now = audioContext.currentTime;
    [1320, 880, 660, 440, 330].forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const g = audioContext.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.14, now + i * 0.042);
        g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.042 + 0.12);
        osc.connect(g);
        g.connect(audioContext.destination);
        osc.start(now + i * 0.042);
        osc.stop(now + i * 0.042 + 0.15);
    });
}

function shakeToExplode() {
    if (!state.awake || state.shakeDebounce > 0) return;
    state.shakeDebounce = 1.6;

    let sparkCount = 0;
    const maxSparks = 900;
    state.trails.forEach((segment) => {
        if (sparkCount >= maxSparks) return;
        const x = segment.kind === 'dot' ? segment.x : (segment.x1 + segment.x2) * 0.5;
        const y = segment.kind === 'dot' ? segment.y : (segment.y1 + segment.y2) * 0.5;
        const color = segment.glow || segment.core || 'rgba(255,220,100,0.9)';
        const count = 2 + Math.floor(Math.random() * 3);
        for (let index = 0; index < count; index += 1) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 55 + Math.random() * 220;
            const life = 0.3 + Math.random() * 0.7;
            state.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life,
                maxLife: life,
                radius: 1.2 + Math.random() * 3.2,
                color,
            });
        }
        sparkCount += count;
    });

    [[0.5, 0.5], [0.22, 0.3], [0.78, 0.3], [0.22, 0.7], [0.78, 0.7]].forEach(([rx, ry], i) => {
        state.ripples.push({
            x: WIDTH * rx,
            y: HEIGHT * ry,
            radius: 16 + i * 12,
            life: 0.72 + i * 0.07,
            width: 3.8 - i * 0.5,
            color: `hsl(${46 + i * 22}, 100%, 70%)`,
        });
    });

    state.trails = [];
    state.activeStroke = null;
    state.trailBuses.forEach((bus) => { if (bus.gainNode) bus.gainNode.disconnect(); });
    state.trailBuses = [];

    if (masterGain && audioContext) {
        masterGain.gain.cancelScheduledValues(audioContext.currentTime);
        masterGain.gain.setTargetAtTime(0.001, audioContext.currentTime, 0.032);
        const targetGain = 0.14 + (state.echoAmount / 100) * 0.08;
        masterGain.gain.setTargetAtTime(targetGain, audioContext.currentTime + 0.32, 0.28);
        playShakeSound();
    }

    setStatus('Raputasid – kõik puhkesid sädemetes laiali!');
}

function createBgVibe() {
    if (!audioContext || !masterGain || bgVibeNodes) return;
    const scale = scalePresets[state.scaleKey] || scalePresets.cMinorPent;
    const rootFreq = midiToFrequency(scale.rootMidi - 24);

    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 80;
    filter.Q.value = 0.9;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0;

    const oscs = [rootFreq, rootFreq * 2, rootFreq * 3].map((freq, i) => {
        const osc = audioContext.createOscillator();
        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.value = freq;
        osc.detune.value = (i - 1) * 5;
        osc.connect(filter);
        osc.start();
        return osc;
    });

    filter.connect(gainNode);
    gainNode.connect(masterGain);
    bgVibeNodes = { oscs, filter, gainNode };
}

function destroyBgVibe() {
    if (!bgVibeNodes) return;
    const nodes = bgVibeNodes;
    bgVibeNodes = null;
    if (audioContext) {
        nodes.gainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0.1);
    }
    setTimeout(() => {
        nodes.oscs.forEach((osc) => { try { osc.stop(); osc.disconnect(); } catch (e) {} });
        try { nodes.filter.disconnect(); } catch (e) {}
        try { nodes.gainNode.disconnect(); } catch (e) {}
    }, 700);
}

function updateBgVibe(dt) {
    if (!state.bgVibeEnabled || !bgVibeNodes || !audioContext) return;
    const trailMass = state.trails.reduce((sum, seg) => sum + (seg.life / seg.maxLife), 0);
    const targetDensity = Math.min(1, trailMass / 380);
    state.bgVibeDensity += (targetDensity - state.bgVibeDensity) * Math.min(1, dt * 1.1);
    const d = state.bgVibeDensity;
    const tremolo = 1 + Math.sin(state.time * 1.12) * 0.09;
    const targetGain = d * 0.088 * tremolo;
    const targetFilterFreq = 85 + d * 740;
    bgVibeNodes.gainNode.gain.setTargetAtTime(targetGain, audioContext.currentTime, 0.55);
    bgVibeNodes.filter.frequency.setTargetAtTime(targetFilterFreq, audioContext.currentTime, 0.55);
}

function clearComposition() {
    stopRecording(false);
    stopLoop();

    state.strokeCount = 0;
    state.noteCount = 0;
    state.lastNote = '-';
    state.noteTimes = [];
    state.recentMidis = [];
    state.trails = [];
    state.particles = [];
    state.ripples = [];
    state.activeStroke = null;
    state.energy = 0;
    state.spread = 0;

    state.trailBuses.forEach((bus) => {
        if (bus.gainNode) {
            bus.gainNode.disconnect();
        }
    });
    state.trailBuses = [];

    setStatus('Lõuend puhastatud.');
    if (state.awake) {
        playTone({ frequency: 196, duration: 0.14, intensity: 0.12, pan: 0, brightness: 0.5, sharpness: 0.2, width: 0.4 });
    }
}

function updateHud() {
    const instrument = instrumentPresets[state.instrumentKey] || instrumentPresets.blue;
    const scale = scalePresets[state.scaleKey] || scalePresets.cMinorPent;
    const now = performance.now();

    state.noteTimes = state.noteTimes.filter((time) => now - time < 2200);

    const densityRatio = Math.min(1, state.noteTimes.length / 18);
    const spreadRatio = state.recentMidis.length > 1
        ? Math.min(1, (Math.max(...state.recentMidis) - Math.min(...state.recentMidis)) / 24)
        : 0;

    state.spread += (spreadRatio - state.spread) * 0.12;
    state.energy += (((state.resonance * 0.58) + (densityRatio * 0.42)) - state.energy) * 0.12;

    strokeCountValue.textContent = String(state.strokeCount);
    noteCountValue.textContent = String(state.noteCount);
    modeValue.textContent = instrument.label;
    scaleValue.textContent = scale.label;
    lastNoteValue.textContent = state.lastNote;
    energyValue.textContent = `${Math.round(state.energy * 100)}%`;
    magnetValue.textContent = String(state.magnets.length);
    statusText.textContent = state.status;

    if (state.looper.recording) {
        const elapsed = Math.max(0, now - state.looper.startMs);
        loopValue.textContent = `REC ${(Math.max(0, state.looper.durationMs - elapsed) / 1000).toFixed(1)}s`;
    } else if (state.looper.enabled) {
        loopValue.textContent = 'Loop ON';
    } else {
        loopValue.textContent = 'Väljas';
    }

    densityFill.style.width = `${densityRatio * 100}%`;
    resonanceFill.style.width = `${state.resonance * 100}%`;
    resonanceLabel.textContent = `${Math.round(state.resonance * 100)}%`;
    spreadFill.style.width = `${state.spread * 100}%`;
    spreadLabel.textContent = `${Math.round(state.spread * 100)}%`;
    echoLabel.textContent = `${Math.round(state.echoAmount)}%`;
    echoFill.style.width = `${state.echoAmount}%`;

    updateRecordButton();
}

function updateSpectrum() {
    if (!analyserNode || !analyserData) {
        const idle = 0.18 + Math.abs(Math.sin(state.time * 2.2)) * 0.16;
        barNodes.forEach((bar, index) => {
            const scale = idle + Math.abs(Math.sin(state.time * 3 + index * 0.5)) * 0.24;
            bar.style.setProperty('--bar-scale', scale.toFixed(3));
        });
        state.resonance += (0.08 - state.resonance) * 0.1;
        return;
    }

    analyserNode.getByteFrequencyData(analyserData);
    const binSize = Math.floor(analyserData.length / barNodes.length) || 1;
    let total = 0;

    barNodes.forEach((bar, index) => {
        const start = index * binSize;
        const end = Math.min(analyserData.length, start + binSize);
        let sum = 0;
        for (let cursor = start; cursor < end; cursor += 1) {
            sum += analyserData[cursor];
        }
        const average = sum / Math.max(1, end - start);
        total += average;
        const scale = 0.14 + (average / 255) * 0.86;
        bar.style.setProperty('--bar-scale', scale.toFixed(3));
    });

    const averageLevel = total / (barNodes.length * 255);
    state.resonance += (averageLevel - state.resonance) * 0.16;
}

function updateTrails(dt) {
    state.trails = state.trails.filter((segment) => segment.life > 0);
    state.trails.forEach((segment) => {
        segment.life -= dt;
    });
}

function updateTrailBuses(dt) {
    const echoRatio = state.echoAmount / 100;
    state.trailBuses = state.trailBuses.filter((bus) => {
        bus.life -= dt;
        if (bus.gainNode && audioContext) {
            const lifeRatio = Math.max(0, Math.min(1, bus.life / bus.maxLife));
            bus.gainNode.gain.setTargetAtTime(echoRatio * 0.8 * lifeRatio, audioContext.currentTime, 0.08);
        }

        if (bus.life <= 0) {
            if (bus.gainNode) {
                bus.gainNode.disconnect();
            }
            return false;
        }
        return true;
    });
}

function updateParticles(dt) {
    state.particles = state.particles.filter((particle) => particle.life > 0);
    state.particles.forEach((particle) => {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vx *= 0.97;
        particle.vy *= 0.97;
        particle.life -= dt;
    });
}

function updateRipples(dt) {
    state.ripples = state.ripples.filter((ripple) => ripple.life > 0);
    state.ripples.forEach((ripple) => {
        ripple.radius += dt * 120;
        ripple.life -= dt;
    });
}

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, '#0e0618');
    gradient.addColorStop(0.6, '#09041a');
    gradient.addColorStop(1, '#050210');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const halo = ctx.createRadialGradient(WIDTH / 2, HEIGHT * 0.22, 24, WIDTH / 2, HEIGHT * 0.22, 260);
    halo.addColorStop(0, 'rgba(200, 80, 255, 0.14)');
    halo.addColorStop(1, 'rgba(200, 80, 255, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // 3D rotating heart
    {
        const hcx = WIDTH / 2;
        const hcy = HEIGHT / 2;
        const hScale = 128 + Math.sin(state.time * 1.8) * 7;
        const uSteps = 26;
        const vSteps = 36;
        const ry = state.time * 0.38;
        const rx = 0.3 + Math.sin(state.time * 0.21) * 0.16;

        function hPt(u, v) {
            const s = Math.sin(u);
            const hx = s * s * s * Math.cos(v);
            const hy = -(13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u)) / 16;
            const hz = s * s * s * Math.sin(v);
            return { x: hx, y: hy, z: hz };
        }
        function rY(p, a) {
            return { x: p.x * Math.cos(a) + p.z * Math.sin(a), y: p.y, z: -p.x * Math.sin(a) + p.z * Math.cos(a) };
        }
        function rX(p, a) {
            return { x: p.x, y: p.y * Math.cos(a) - p.z * Math.sin(a), z: p.y * Math.sin(a) + p.z * Math.cos(a) };
        }
        function rot3d(p) { return rX(rY(p, ry), rx); }
        function proj3d(p) {
            const f = 4.5;
            const d = f + p.z;
            return { x: hcx + (p.x / d) * hScale * f, y: hcy + (p.y / d) * hScale * f };
        }

        const faces3d = [];
        for (let ui = 0; ui < uSteps; ui += 1) {
            for (let vi = 0; vi < vSteps; vi += 1) {
                const u0 = (ui / uSteps) * Math.PI;
                const u1 = ((ui + 1) / uSteps) * Math.PI;
                const v0 = (vi / vSteps) * Math.PI * 2;
                const v1 = ((vi + 1) / vSteps) * Math.PI * 2;
                const rp = [hPt(u0, v0), hPt(u1, v0), hPt(u1, v1), hPt(u0, v1)].map(rot3d);
                const avgZ = (rp[0].z + rp[1].z + rp[2].z + rp[3].z) * 0.25;
                const e1x = rp[1].x - rp[0].x, e1y = rp[1].y - rp[0].y, e1z = rp[1].z - rp[0].z;
                const e2x = rp[3].x - rp[0].x, e2y = rp[3].y - rp[0].y, e2z = rp[3].z - rp[0].z;
                const nx = e1y * e2z - e1z * e2y;
                const ny = e1z * e2x - e1x * e2z;
                const nz = e1x * e2y - e1y * e2x;
                const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
                const diffuse = Math.max(0, (nx / nl) * 0.4 + (ny / nl) * (-0.65) + (nz / nl) * 0.62);
                faces3d.push({ pts: rp.map(proj3d), depth: avgZ, diffuse });
            }
        }
        faces3d.sort((a, b) => a.depth - b.depth);

        ctx.save();
        faces3d.forEach(({ pts, diffuse }) => {
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            ctx.lineTo(pts[1].x, pts[1].y);
            ctx.lineTo(pts[2].x, pts[2].y);
            ctx.lineTo(pts[3].x, pts[3].y);
            ctx.closePath();
            const fa = (0.025 + diffuse * 0.2).toFixed(3);
            const sa = (0.03 + diffuse * 0.16).toFixed(3);
            ctx.fillStyle = `rgba(255, 60, 150, ${fa})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(255, 140, 210, ${sa})`;
            ctx.lineWidth = 0.55;
            ctx.stroke();
        });
        ctx.restore();
    }

}

function drawMagnets() {
    ctx.save();
    state.magnets.forEach((magnet) => {
        ctx.strokeStyle = 'rgba(255, 121, 198, 0.26)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(magnet.x, magnet.y, magnet.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 121, 198, 0.14)';
        ctx.beginPath();
        ctx.arc(magnet.x, magnet.y, 9, 0, Math.PI * 2);
        ctx.fill();

        for (let index = 0; index < magnet.particleCount; index += 1) {
            const angle = magnet.phase + (Math.PI * 2 * index) / magnet.particleCount;
            const radius = magnet.radius + Math.sin(state.time * 2 + index) * 7;
            const px = magnet.x + Math.cos(angle) * radius;
            const py = magnet.y + Math.sin(angle) * (radius * 0.82);

            ctx.fillStyle = 'rgba(255, 160, 220, 0.92)';
            ctx.beginPath();
            ctx.arc(px, py, 2.2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    ctx.restore();
}

function drawTrails() {
    ctx.save();
    state.trails.forEach((segment) => {
        const alpha = Math.max(0, segment.life / segment.maxLife);
        if (segment.kind === 'dot') {
            ctx.globalAlpha = alpha * 0.7;
            ctx.fillStyle = segment.glow;
            ctx.beginPath();
            ctx.arc(segment.x, segment.y, segment.radius * 1.8, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = alpha * 0.95;
            ctx.fillStyle = segment.core;
            ctx.beginPath();
            ctx.arc(segment.x, segment.y, segment.radius, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.globalAlpha = alpha * 0.32;
        ctx.strokeStyle = segment.glow;
        ctx.lineWidth = segment.width * 2.6;
        ctx.beginPath();
        ctx.moveTo(segment.x1, segment.y1);
        ctx.lineTo(segment.x2, segment.y2);
        ctx.stroke();

        ctx.globalAlpha = alpha * 0.9;
        ctx.strokeStyle = segment.core;
        ctx.lineWidth = segment.width;
        ctx.beginPath();
        ctx.moveTo(segment.x1, segment.y1);
        ctx.lineTo(segment.x2, segment.y2);
        ctx.stroke();
    });
    ctx.restore();
}

function drawRipples() {
    ctx.save();
    state.ripples.forEach((ripple) => {
        ctx.globalAlpha = Math.max(0, ripple.life * 0.8);
        ctx.strokeStyle = ripple.color;
        ctx.lineWidth = ripple.width;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.stroke();
    });
    ctx.restore();
}

function drawParticles() {
    ctx.save();
    state.particles.forEach((particle) => {
        ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
}

function drawCursorGlow() {
    const preset = instrumentPresets[state.instrumentKey] || instrumentPresets.blue;
    const hue = preset.hue;
    const gradient = ctx.createRadialGradient(state.pointer.x, state.pointer.y, 6, state.pointer.x, state.pointer.y, 60 + state.energy * 40);
    gradient.addColorStop(0, `hsla(${hue}, 96%, 64%, 0.2)`);
    gradient.addColorStop(1, `hsla(${hue}, 96%, 64%, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(state.pointer.x - 80, state.pointer.y - 80, 160, 160);
}

function drawFrame() {
    ctx.save();
    ctx.strokeStyle = 'rgba(190, 110, 255, 0.18)';
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 14, WIDTH - 28, HEIGHT - 28);
    ctx.strokeStyle = 'rgba(255, 79, 160, 0.07)';
    ctx.strokeRect(28, 28, WIDTH - 56, HEIGHT - 56);
    ctx.restore();
}

function render() {
    drawBackground();
    drawMagnets();
    drawTrails();
    drawRipples();
    drawParticles();
    drawCursorGlow();
    drawFrame();
}

function animate(now) {
    const dt = Math.min((now - state.lastFrame) / 1000, 0.033);
    state.lastFrame = now;
    state.time += dt;

    if (state.shakeDebounce > 0) state.shakeDebounce -= dt;
    updateSpectrum();
    updateLooper(dt);
    updateMagnets(dt);
    updateTrails(dt);
    updateTrailBuses(dt);
    updateParticles(dt);
    updateRipples(dt);
    updateBgVibe(dt);
    updateHud();
    render();
    requestAnimationFrame(animate);
}

function toCanvasSpace(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: ((clientX - rect.left) / rect.width) * WIDTH,
        y: ((clientY - rect.top) / rect.height) * HEIGHT,
    };
}

canvas.addEventListener('pointerdown', (event) => {
    const point = toCanvasSpace(event.clientX, event.clientY);
    state.pointer = point;
    beginStroke(point, event.pointerId);
    if (canvas.setPointerCapture) {
        canvas.setPointerCapture(event.pointerId);
    }
});

canvas.addEventListener('pointermove', (event) => {
    const point = toCanvasSpace(event.clientX, event.clientY);
    state.pointer = point;
    if (state.activeStroke && state.activeStroke.pointerId === event.pointerId) {
        continueStroke(point);
    }
});

window.addEventListener('pointerup', (event) => {
    endStroke(event.pointerId);
});

window.addEventListener('pointercancel', (event) => {
    endStroke(event.pointerId);
});

canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

window.addEventListener('keydown', (event) => {
    if (isTypingTarget(event.target)) {
        return;
    }

    const key = event.key.toLowerCase();
    if ((key === 'c' && event.shiftKey) || key === 'escape') {
        clearComposition();
        event.preventDefault();
        return;
    }

    if (event.repeat || pressedKeyboardCodes.has(event.code)) {
        return;
    }

    if (playKeyboardNote(event.code)) {
        pressedKeyboardCodes.add(event.code);
        event.preventDefault();
    }
});

window.addEventListener('keyup', (event) => {
    pressedKeyboardCodes.delete(event.code);
});

window.addEventListener('blur', () => {
    pressedKeyboardCodes.clear();
});

instrumentSelect.addEventListener('change', () => {
    state.instrumentKey = instrumentSelect.value;
    setStatus('Varv vahetatud, pill muutus.');
});

scaleSelect.addEventListener('change', () => {
    state.scaleKey = scaleSelect.value;
    setStatus('Harmooniline kaart vahetatud.');
});

brushSizeInput.addEventListener('input', () => {
    state.brushSize = Number(brushSizeInput.value);
});

densityInput.addEventListener('input', () => {
    state.density = Number(densityInput.value);
});

echoInput.addEventListener('input', () => {
    state.echoAmount = Number(echoInput.value);
    applyAudioSettings();
});

symmetryToggle.addEventListener('change', () => {
    state.symmetryEnabled = symmetryToggle.checked;
    setStatus(state.symmetryEnabled ? 'Symmetry Mode sees.' : 'Symmetry Mode valjas.');
});

addMagnetButton.addEventListener('click', () => {
    state.magnetPlacementMode = !state.magnetPlacementMode;
    addMagnetButton.textContent = state.magnetPlacementMode ? 'Magneti reziim: ON' : 'Lisa magnet';
    setStatus(state.magnetPlacementMode ? 'Kliki louendile, et lisada magnet.' : 'Magneti lisamine valjas.');
});

clearMagnetsButton.addEventListener('click', clearMagnets);

recordButton.addEventListener('click', () => {
    if (state.looper.recording) {
        stopRecording(true);
        return;
    }
    if (state.looper.enabled) {
        stopLoop();
        return;
    }
    startRecording();
});

startButton.addEventListener('click', awakenStudio);
overlayButton.addEventListener('click', awakenStudio);
clearButton.addEventListener('click', clearComposition);

shakeButton.addEventListener('click', () => {
    if (!state.awake) {
        awakenStudio();
        return;
    }
    shakeToExplode();
});

bgVibeToggle.addEventListener('change', () => {
    state.bgVibeEnabled = bgVibeToggle.checked;
    if (state.bgVibeEnabled) {
        if (!ensureAudio()) {
            bgVibeToggle.checked = false;
            state.bgVibeEnabled = false;
            return;
        }
        if (audioContext.state === 'suspended') audioContext.resume();
        state.awake = true;
        overlay.classList.remove('visible');
        createBgVibe();
        setStatus('Taustavibe sees – joonistades kosub atmosfäär.');
    } else {
        destroyBgVibe();
        state.bgVibeDensity = 0;
        setStatus('Taustavibe väljas.');
    }
});

window.addEventListener('devicemotion', (event) => {
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;
    const mag = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
    if (mag > 18 && state.awake) {
        shakeToExplode();
    }
}, { passive: true });

updateHud();
requestAnimationFrame(animate);