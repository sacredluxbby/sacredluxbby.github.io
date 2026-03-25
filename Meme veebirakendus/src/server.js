require("dotenv").config();

const express = require("express");
const multer = require("multer");
const path = require("path");

const { generateMemeCaption } = require("./memeService");
const { composeMeme } = require("./imageService");

const app = express();
const port = process.env.PORT || 3000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Можно загружать только изображения."));
    }

    cb(null, true);
  }
});

app.use(express.static(path.join(__dirname, "..", "public")));

app.post("/api/meme", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Файл не найден." });
    }

    const language = req.body?.language;
    const style = req.body?.style;

    const { topText, bottomText, source } = await generateMemeCaption(
      req.file.buffer,
      req.file.mimetype,
      {
        language,
        style
      }
    );

    const resultImage = await composeMeme(req.file.buffer, topText, bottomText);

    return res.json({
      caption: {
        topText,
        bottomText,
        source
      },
      image: `data:image/jpeg;base64,${resultImage.toString("base64")}`
    });
  } catch (error) {
    const message = error?.message || "Не удалось создать мем.";
    return res.status(500).json({ error: message });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: "Слишком большой файл (макс. 10MB)." });
  }

  if (err?.message) {
    return res.status(400).json({ error: err.message });
  }

  next(err);
});

app.listen(port, () => {
  console.log(`Meme AI server started on http://localhost:${port}`);
});
