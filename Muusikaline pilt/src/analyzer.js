const Jimp = require("jimp");
const sharp = require("sharp");
const tf = require("@tensorflow/tfjs");
const cocoSsd = require("@tensorflow-models/coco-ssd");

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  pentatonic: [0, 2, 4, 7, 9]
};

let modelPromise;

function getDetectionModel() {
  if (!modelPromise) {
    modelPromise = tf.ready()
      .then(() => cocoSsd.load({ base: "lite_mobilenet_v2" }))
      .catch((error) => {
        console.warn("Object model failed to load. Continuing with color-only analysis.", error.message);
        return null;
      });
  }

  return modelPromise;
}

function jimpToTensor(image) {
  const { data, width, height } = image.bitmap;
  const pixels = new Int32Array(width * height * 3);

  let px = 0;
  for (let i = 0; i < data.length; i += 4) {
    pixels[px++] = data[i];
    pixels[px++] = data[i + 1];
    pixels[px++] = data[i + 2];
  }

  return tf.tensor3d(pixels, [height, width, 3], "int32");
}

function makeSeededRandom(seedValue) {
  let seed = seedValue >>> 0;

  return function random() {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rgbToHsl(r, g, b) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === red) {
      h = ((green - blue) / delta) % 6;
    } else if (max === green) {
      h = (blue - red) / delta + 2;
    } else {
      h = (red - green) / delta + 4;
    }
  }

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return { h, s, l };
}

function quantizeColor(r, g, b) {
  const q = 32;
  return [
    Math.min(255, Math.floor(r / q) * q),
    Math.min(255, Math.floor(g / q) * q),
    Math.min(255, Math.floor(b / q) * q)
  ];
}

function getMoodLabel(brightness, saturation, objectCount) {
  if (brightness > 0.7 && saturation > 0.45) return "vivid";
  if (brightness > 0.65) return "uplifting";
  if (brightness < 0.38 && objectCount > 1) return "cinematic";
  if (brightness < 0.38) return "nocturnal";
  if (saturation < 0.2) return "minimal";
  return "dreamy";
}

function sanitizeMoodPreset(value) {
  const valid = new Set(["auto", "calm", "sad", "meme"]);
  if (!value) return "auto";
  return valid.has(value) ? value : "auto";
}

function offsetNote(keyIndex, semitoneOffset, octaveBase) {
  const absolute = keyIndex + semitoneOffset;
  const name = NOTE_NAMES[(absolute % 12 + 12) % 12];
  const octave = octaveBase + Math.floor(absolute / 12);
  return `${name}${octave}`;
}

function buildScaleNotes(keyIndex, scaleIntervals, octaveBase) {
  return scaleIntervals.map((interval) => offsetNote(keyIndex, interval, octaveBase));
}

function buildChord(scaleIntervals, keyIndex, degree, octaveBase) {
  const i = degree % scaleIntervals.length;
  const third = (degree + 2) % scaleIntervals.length;
  const fifth = (degree + 4) % scaleIntervals.length;

  return [
    offsetNote(keyIndex, scaleIntervals[i], octaveBase),
    offsetNote(keyIndex, scaleIntervals[third], octaveBase),
    offsetNote(keyIndex, scaleIntervals[fifth], octaveBase)
  ];
}

async function detectObjects(image) {
  const model = await getDetectionModel();
  if (!model) return [];

  const imageTensor = jimpToTensor(image);

  try {
    const predictions = await model.detect(imageTensor);

    return predictions
      .filter((item) => item.score >= 0.45)
      .slice(0, 8)
      .map((item) => ({
        label: item.class,
        score: Number(item.score.toFixed(3))
      }));
  } finally {
    imageTensor.dispose();
  }
}

async function analyzeImageToMusic(imagePath, options = {}) {
  // Normalize all input formats (including HEIC/AVIF/WebP/TIFF) to PNG in memory.
  const normalizedBuffer = await sharp(imagePath)
    .rotate()
    .ensureAlpha()
    .png({ compressionLevel: 9 })
    .toBuffer();

  const image = await Jimp.read(normalizedBuffer);
  image.resize(220, 220);

  const histogram = new Map();
  const hueBuckets = new Array(12).fill(0);

  let brightnessAcc = 0;
  let saturationAcc = 0;

  const stride = 4;
  for (let y = 0; y < image.bitmap.height; y += stride) {
    for (let x = 0; x < image.bitmap.width; x += stride) {
      const rgba = Jimp.intToRGBA(image.getPixelColor(x, y));
      const [qr, qg, qb] = quantizeColor(rgba.r, rgba.g, rgba.b);
      const key = `${qr},${qg},${qb}`;

      histogram.set(key, (histogram.get(key) || 0) + 1);

      const hsl = rgbToHsl(rgba.r, rgba.g, rgba.b);
      hueBuckets[Math.floor(hsl.h / 30) % 12] += 1;
      brightnessAcc += hsl.l;
      saturationAcc += hsl.s;
    }
  }

  const totalSamples = (image.bitmap.width / stride) * (image.bitmap.height / stride);
  const avgBrightness = brightnessAcc / totalSamples;
  const avgSaturation = saturationAcc / totalSamples;

  const dominantColors = [...histogram.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, count]) => {
      const [r, g, b] = key.split(",").map(Number);
      return {
        rgb: [r, g, b],
        hex: `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`,
        ratio: Number((count / totalSamples).toFixed(3))
      };
    });

  const hottestHueIndex = hueBuckets.indexOf(Math.max(...hueBuckets));
  const keyIndex = hottestHueIndex;

  const objects = await detectObjects(image.clone().resize(300, 300)).catch(() => []);
  const moodPreset = sanitizeMoodPreset(options.moodPreset);

  let scaleName =
    avgBrightness > 0.66
      ? "major"
      : avgSaturation > 0.42
        ? "dorian"
        : avgBrightness < 0.42
          ? "minor"
          : "pentatonic";

  if (moodPreset === "calm") scaleName = "major";
  if (moodPreset === "sad") scaleName = "minor";
  if (moodPreset === "meme") scaleName = "major";

  const scaleIntervals = SCALES[scaleName];

  let objectInfluence = 0;
  for (const obj of objects) {
    objectInfluence += obj.label.length;
  }

  const seedSource =
    Math.floor(avgBrightness * 1000) * 13 +
    Math.floor(avgSaturation * 1000) * 17 +
    objectInfluence * 19 +
    dominantColors.length * 23;

  const random = makeSeededRandom(seedSource);
  let mood = getMoodLabel(avgBrightness, avgSaturation, objects.length);
  let tempo = Math.round(72 + avgBrightness * 58 + Math.min(20, objects.length * 4));

  if (moodPreset === "calm") {
    mood = "calm";
    tempo = Math.round(62 + avgBrightness * 22);
  } else if (moodPreset === "sad") {
    mood = "sad-minor";
    tempo = Math.round(58 + avgSaturation * 20 + objects.length * 2);
  } else if (moodPreset === "meme") {
    mood = "meme-happy";
    tempo = Math.round(122 + avgBrightness * 38 + objects.length * 3);
  }

  const melodyScale = buildScaleNotes(keyIndex, scaleIntervals, 4);
  const bassScale = buildScaleNotes(keyIndex, scaleIntervals, 2);

  const melody = new Array(16).fill(null);
  const bass = new Array(16).fill(null);
  const chords = new Array(16).fill(null);

  const melodyGate = moodPreset === "calm" ? 0.45 : moodPreset === "sad" ? 0.36 : moodPreset === "meme" ? 0.12 : 0.28;
  for (let step = 0; step < 16; step += 1) {
    if (random() > melodyGate) {
      const note = melodyScale[Math.floor(random() * melodyScale.length)];
      melody[step] = {
        note,
        velocity: Number((0.4 + random() * (moodPreset === "meme" ? 0.55 : 0.4)).toFixed(2))
      };
    }

    if (step % 4 === 0) {
      const degree = Math.floor(random() * scaleIntervals.length);
      const chord = buildChord(scaleIntervals, keyIndex, degree, 3);
      const chordVelocityBase = moodPreset === "calm" ? 0.24 : moodPreset === "sad" ? 0.28 : 0.3;
      const chordVelocityRange = moodPreset === "meme" ? 0.35 : 0.22;
      chords[step] = {
        notes: chord,
        velocity: Number((chordVelocityBase + random() * chordVelocityRange).toFixed(2))
      };

      bass[step] = {
        note: bassScale[degree % bassScale.length],
        velocity: Number((0.44 + random() * (moodPreset === "meme" ? 0.36 : 0.22)).toFixed(2))
      };
    }
  }

  let drumEnergy = Math.min(1, avgSaturation * 0.9 + objects.length * 0.08);
  if (moodPreset === "calm") drumEnergy = Math.min(drumEnergy, 0.38);
  if (moodPreset === "sad") drumEnergy = Math.min(drumEnergy, 0.52);
  if (moodPreset === "meme") drumEnergy = Math.max(0.78, drumEnergy);
  const kick = new Array(16).fill(0);
  const snare = new Array(16).fill(0);
  const hat = new Array(16).fill(0);

  for (let step = 0; step < 16; step += 1) {
    if (step % 4 === 0 || (moodPreset === "meme" && step % 8 === 6)) kick[step] = 1;
    if (step % 8 === 4 || (moodPreset === "meme" && step % 8 === 2)) snare[step] = 1;
    if (random() < (moodPreset === "calm" ? 0.2 : 0.45) + drumEnergy * (moodPreset === "meme" ? 0.4 : 0.3)) {
      hat[step] = 1;
    }
  }

  const analysis = {
    dominantColors,
    averageBrightness: Number(avgBrightness.toFixed(3)),
    averageSaturation: Number(avgSaturation.toFixed(3)),
    objects
  };

  const composition = {
    tempo,
    key: NOTE_NAMES[keyIndex],
    scale: scaleName,
    mood,
    moodPreset,
    loopLength: 16,
    melody,
    bass,
    chords,
    drums: {
      kick,
      snare,
      hat
    }
  };

  return { analysis, composition };
}

module.exports = {
  analyzeImageToMusic
};
