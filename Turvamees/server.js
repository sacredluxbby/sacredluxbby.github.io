const http = require('http');
const fs = require('fs');
const path = require('path');

const HOST = '0.0.0.0';
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function resolveFilePath(urlPath) {
  const normalizedPath = decodeURIComponent(urlPath.split('?')[0]);
  const safePath = normalizedPath === '/' ? '/index.html' : normalizedPath;
  const requestedPath = path.normalize(path.join(PUBLIC_DIR, safePath));

  // Turvalisus: ära luba väljuda public kaustast.
  if (!requestedPath.startsWith(PUBLIC_DIR)) {
    return null;
  }

  return requestedPath;
}

function sendResponse(res, statusCode, data, contentType) {
  res.writeHead(statusCode, { 'Content-Type': contentType });
  res.end(data);
}

const server = http.createServer((req, res) => {
  const filePath = resolveFilePath(req.url || '/');

  if (!filePath) {
    sendResponse(res, 403, 'Forbidden', 'text/plain; charset=utf-8');
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      sendResponse(res, 404, 'Not Found', 'text/plain; charset=utf-8');
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[extension] || 'application/octet-stream';

    fs.readFile(filePath, (readError, data) => {
      if (readError) {
        sendResponse(res, 500, 'Internal Server Error', 'text/plain; charset=utf-8');
        return;
      }

      sendResponse(res, 200, data, contentType);
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Turvamees rakendus töötab: http://localhost:${PORT}`);
});
