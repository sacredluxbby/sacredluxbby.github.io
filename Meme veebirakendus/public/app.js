const form = document.getElementById("memeForm");
const input = document.getElementById("imageInput");
const button = document.getElementById("generateBtn");
const statusText = document.getElementById("statusText");
const languageSelect = document.getElementById("languageSelect");
const styleSelect = document.getElementById("styleSelect");
const titleText = document.getElementById("titleText");
const subtitleText = document.getElementById("subtitleText");
const fileLabelText = document.getElementById("fileLabelText");
const langLabelText = document.getElementById("langLabelText");
const styleLabelText = document.getElementById("styleLabelText");
const styleClassicText = document.getElementById("styleClassicText");
const styleSarcasticText = document.getElementById("styleSarcasticText");
const styleAbsurdText = document.getElementById("styleAbsurdText");
const styleWholesomeText = document.getElementById("styleWholesomeText");
const resultCard = document.getElementById("resultCard");
const resultImage = document.getElementById("resultImage");
const topCaption = document.getElementById("topCaption");
const bottomCaption = document.getElementById("bottomCaption");
const captionSource = document.getElementById("captionSource");
const downloadBtn = document.getElementById("downloadBtn");

const paletteState = {
  bgMain: [237, 242, 239],
  bgAccent: [216, 231, 225],
  bgOrbA: [248, 251, 249],
  bgOrbB: [209, 227, 220],
  glowA: [31, 122, 104],
  glowB: [143, 184, 171],
  glowC: [201, 221, 214]
};

function clampColor(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function toHex(rgb) {
  return `#${rgb
    .map((part) => clampColor(part).toString(16).padStart(2, "0"))
    .join("")}`;
}

function mixRgb(a, b, amount) {
  const t = Math.max(0, Math.min(1, amount));
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t
  ];
}

function lighten(rgb, amount) {
  return mixRgb(rgb, [255, 255, 255], amount);
}

function setPaletteCss(palette) {
  const root = document.documentElement.style;
  root.setProperty("--bg-main", toHex(palette.bgMain));
  root.setProperty("--bg-accent", toHex(palette.bgAccent));
  root.setProperty("--bg-orb-a", toHex(palette.bgOrbA));
  root.setProperty("--bg-orb-b", toHex(palette.bgOrbB));
  root.setProperty("--glow-a", toHex(palette.glowA));
  root.setProperty("--glow-b", toHex(palette.glowB));
  root.setProperty("--glow-c", toHex(palette.glowC));
}

function animatePalette(target, durationMs = 900) {
  const keys = Object.keys(paletteState);
  const from = {};

  keys.forEach((key) => {
    from[key] = [...paletteState[key]];
  });

  const start = performance.now();

  function step(now) {
    const progress = Math.min(1, (now - start) / durationMs);
    const eased = 1 - Math.pow(1 - progress, 3);
    const nextPalette = {};

    keys.forEach((key) => {
      nextPalette[key] = mixRgb(from[key], target[key], eased);
    });

    setPaletteCss(nextPalette);

    if (progress < 1) {
      requestAnimationFrame(step);
      return;
    }

    keys.forEach((key) => {
      paletteState[key] = [...target[key]];
    });
  }

  requestAnimationFrame(step);
}

function rgbScore(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  const brightness = (r + g + b) / (255 * 3);
  return saturation * 0.72 + brightness * 0.28;
}

function buildPaletteFromImageData(data) {
  let count = 0;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;

  let bestScore = -1;
  let best = [45, 130, 110];

  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a < 120) continue;

    sumR += r;
    sumG += g;
    sumB += b;
    count += 1;

    const score = rgbScore(r, g, b);
    if (score > bestScore) {
      bestScore = score;
      best = [r, g, b];
    }
  }

  if (!count) {
    return null;
  }

  const avg = [sumR / count, sumG / count, sumB / count];
  const neutralBase = [230, 236, 233];
  const neutralSoft = [245, 248, 246];

  // Keep UI in elegant muted range, but tie accents to the chosen image.
  const mutedBest = mixRgb(best, neutralBase, 0.38);
  const mutedAvg = mixRgb(avg, neutralBase, 0.5);
  const deepTone = mixRgb(mutedBest, [20, 72, 62], 0.2);

  return {
    bgMain: lighten(mixRgb(neutralSoft, mutedAvg, 0.28), 0.06),
    bgAccent: lighten(mixRgb(mutedBest, mutedAvg, 0.42), 0.12),
    bgOrbA: lighten(mixRgb(mutedAvg, [255, 255, 255], 0.52), 0.08),
    bgOrbB: lighten(mixRgb(mutedBest, neutralBase, 0.36), 0.1),
    glowA: deepTone,
    glowB: lighten(mixRgb(mutedBest, mutedAvg, 0.3), 0.28),
    glowC: lighten(mixRgb(mutedAvg, neutralBase, 0.45), 0.4)
  };
}

async function loadImageBitmap(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = String(reader.result);
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function applyPaletteFromSelectedImage(file) {
  try {
    const image = await loadImageBitmap(file);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) return;

    const targetWidth = 64;
    const targetHeight = Math.max(
      32,
      Math.round((image.naturalHeight / image.naturalWidth) * targetWidth)
    );

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

    const { data } = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const palette = buildPaletteFromImageData(data);

    if (palette) {
      animatePalette(palette, 1400);
    }
  } catch {
    // If reading image palette fails, keep current background colors.
  }
}

const ui = {
  ru: {
    subtitle:
      "Загрузи любое изображение, и ИИ придумает мемную подпись и вернет готовую картинку.",
    fileLabel: "Выбрать картинку",
    langLabel: "Язык мема",
    styleLabel: "Стиль юмора",
    styleClassic: "Классика",
    styleSarcastic: "Саркастичный",
    styleAbsurd: "Абсурдный",
    styleWholesome: "Добрый",
    generate: "Сгенерировать мем",
    waitUpload: "Ожидаю загрузку изображения.",
    noFile: "Сначала выбери изображение.",
    generating: "ИИ генерирует мем...",
    done: "Мем готов. Можно загрузить другую картинку.",
    failed: "Не получилось создать мем.",
    topPrefix: "ВЕРХ",
    bottomPrefix: "НИЗ",
    aiSource: "AI подпись",
    fallbackSource: "демо подпись",
    download: "Скачать мем"
  },
  en: {
    subtitle:
      "Upload any image, and AI will invent a meme caption and return the final meme picture.",
    fileLabel: "Choose image",
    langLabel: "Meme language",
    styleLabel: "Humor style",
    styleClassic: "Classic",
    styleSarcastic: "Sarcastic",
    styleAbsurd: "Absurd",
    styleWholesome: "Wholesome",
    generate: "Generate meme",
    waitUpload: "Waiting for image upload.",
    noFile: "Please choose an image first.",
    generating: "AI is generating your meme...",
    done: "Meme is ready. Upload another image if you want.",
    failed: "Could not create meme.",
    topPrefix: "TOP",
    bottomPrefix: "BOTTOM",
    aiSource: "AI caption",
    fallbackSource: "demo caption",
    download: "Download meme"
  }
};

function currentLang() {
  return languageSelect.value === "en" ? "en" : "ru";
}

function tr() {
  return ui[currentLang()];
}

function setStatus(key) {
  statusText.textContent = tr()[key];
}

function applyTranslations() {
  const t = tr();

  document.documentElement.lang = currentLang();
  titleText.textContent = "Meme Forge AI";
  subtitleText.textContent = t.subtitle;
  fileLabelText.textContent = t.fileLabel;
  langLabelText.textContent = t.langLabel;
  styleLabelText.textContent = t.styleLabel;
  styleClassicText.textContent = t.styleClassic;
  styleSarcasticText.textContent = t.styleSarcastic;
  styleAbsurdText.textContent = t.styleAbsurd;
  styleWholesomeText.textContent = t.styleWholesome;
  button.textContent = t.generate;
  downloadBtn.textContent = t.download;

  if (!resultCard.classList.contains("show")) {
    setStatus("waitUpload");
  }
}

languageSelect.addEventListener("change", applyTranslations);
input.addEventListener("change", () => {
  if (input.files[0]) {
    applyPaletteFromSelectedImage(input.files[0]);
  }
});

applyTranslations();

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!input.files[0]) {
    setStatus("noFile");
    return;
  }

  const formData = new FormData();
  formData.append("image", input.files[0]);
  formData.append("language", currentLang());
  formData.append("style", styleSelect.value);

  button.disabled = true;
  setStatus("generating");

  try {
    const response = await fetch("/api/meme", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Ошибка на сервере");
    }

    resultImage.src = data.image;
    downloadBtn.href = data.image;
    topCaption.textContent = `${tr().topPrefix}: ${data.caption.topText}`;
    bottomCaption.textContent = `${tr().bottomPrefix}: ${data.caption.bottomText}`;
    captionSource.textContent =
      data.caption.source === "openai" ? tr().aiSource : tr().fallbackSource;

    resultCard.classList.add("show");
    setStatus("done");
  } catch (error) {
    statusText.textContent = error.message || tr().failed;
  } finally {
    button.disabled = false;
  }
});
