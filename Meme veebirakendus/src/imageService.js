const sharp = require("sharp");

function escapeXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function composeMeme(imageBuffer, topText, bottomText) {
  const image = sharp(imageBuffer).rotate();
  const meta = await image.metadata();

  const width = meta.width || 1024;
  const height = meta.height || 1024;

  const fontSize = Math.max(32, Math.round(width * 0.07));
  const strokeSize = Math.max(3, Math.round(fontSize * 0.08));
  const topY = Math.round(fontSize * 1.25);
  const bottomY = height - Math.round(fontSize * 0.5);

  const top = escapeXml(topText || "");
  const bottom = escapeXml(bottomText || "");

  const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .meme-text {
      font-family: Impact, "Arial Black", sans-serif;
      font-size: ${fontSize}px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
      paint-order: stroke;
      stroke: black;
      stroke-width: ${strokeSize}px;
      fill: white;
      text-anchor: middle;
    }
  </style>
  <text x="50%" y="${topY}" class="meme-text">${top}</text>
  <text x="50%" y="${bottomY}" class="meme-text">${bottom}</text>
</svg>
`;

  return image
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 92 })
    .toBuffer();
}

module.exports = {
  composeMeme
};
