const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const multer = require("multer");
const { analyzeImageToMusic } = require("./src/analyzer");

const app = express();
const port = process.env.PORT || 3000;

const upload = multer({
  dest: path.join(__dirname, "uploads"),
  limits: {
    fileSize: 25 * 1024 * 1024
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/analyze", upload.single("photo"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image uploaded. Choose an image file and try again." });
  }

  try {
    const result = await analyzeImageToMusic(req.file.path, {
      moodPreset: req.body?.moodPreset
    });
    res.json(result);
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: "Failed to analyze image and create music." });
  } finally {
    await fs.unlink(req.file.path).catch(() => undefined);
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Photo-to-Music app running on http://localhost:${port}`);
});
