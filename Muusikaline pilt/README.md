# Photo to Music Web App

A JavaScript + Node.js web application where the user uploads an image and receives a unique generated music loop.

## Features

- Upload a photo from browser
- Supports common formats (JPG, PNG, GIF, BMP, TIFF, WebP) and modern formats (HEIC/HEIF, AVIF)
- Analyze dominant colors from the image
- Detect objects in the photo with TensorFlow COCO-SSD
- Map visual analysis to music properties:
  - tempo
  - key and scale
  - melody, chords, bass and drums
- Play generated track in browser via Tone.js

## Tech Stack

- Backend: Node.js, Express, Multer, Jimp, TensorFlow.js (COCO-SSD)
- Frontend: HTML, CSS, Vanilla JavaScript, Tone.js

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm start
```

3. Open:

```text
http://localhost:3000
```

## API

### `POST /api/analyze`

Form-data:

- `photo` (image file)

Response:

- `analysis`: colors, brightness, saturation, detected objects
- `composition`: generated music data for playback loop

## Notes

- First run may be slower because the object detection model is loaded.
- If model loading fails, app still works with color-based composition.
- Very large images are accepted up to 25 MB and are normalized before analysis.
