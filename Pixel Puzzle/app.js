const BOARD_SIZE = 400;
const LEADERBOARD_KEY = "pixel-puzzle-leaderboard";

const photoInput = document.getElementById("photo-input");
const cameraButton = document.getElementById("camera-button");
const cutButton = document.getElementById("cut-button");
const ghostButton = document.getElementById("ghost-button");
const exportButton = document.getElementById("export-button");
const difficultySelect = document.getElementById("difficulty-select");
const shapeSelect = document.getElementById("shape-select");
const musicSelect = document.getElementById("music-select");
const playerNameInput = document.getElementById("player-name");
const appTitle = document.getElementById("app-title");
const statusText = document.getElementById("status-text");
const timerText = document.getElementById("timer-text");
const gridLabel = document.getElementById("grid-label");
const storageZone = document.getElementById("storage-zone");
const storageCount = document.getElementById("storage-count");
const assemblyBoard = document.getElementById("assembly-board");
const boardEmptyState = document.getElementById("board-empty-state");
const previewCanvas = document.getElementById("preview-canvas");
const previewContext = previewCanvas.getContext("2d");
const previewDropZone = document.getElementById("preview-drop-zone");
const previewPlaceholder = document.getElementById("preview-placeholder");
const ghostCanvas = document.getElementById("ghost-canvas");
const ghostContext = ghostCanvas.getContext("2d");
const fireworksCanvas = document.getElementById("fireworks-canvas");
const fireworksContext = fireworksCanvas.getContext("2d");
const leaderboardList = document.getElementById("leaderboard-list");
const cameraModal = document.getElementById("camera-modal");
const cameraVideo = document.getElementById("camera-video");
const cameraCanvas = document.getElementById("camera-canvas");
const captureButton = document.getElementById("capture-button");
const closeCameraButton = document.getElementById("close-camera-button");

const state = {
    image: null,
    imageUrl: "",
    pieces: [],
    gridSize: Number(difficultySelect.value),
    cellSize: BOARD_SIZE / Number(difficultySelect.value),
    shapeMode: shapeSelect.value,
    ghostVisible: false,
    solved: false,
    started: false,
    timerStart: 0,
    elapsedMs: 0,
    timerFrame: 0,
    musicMode: musicSelect.value,
    leaderboard: loadLeaderboard(),
    drag: null,
    stream: null,
    fireworksFrame: 0
};

let audioEngine;

attachEvents();
syncBoardMetrics();
drawCanvasPlaceholder(previewContext, previewCanvas.width, previewCanvas.height);
drawCanvasPlaceholder(ghostContext, ghostCanvas.width, ghostCanvas.height);
renderStorage();
renderBoard();
renderLeaderboard();

cameraVideo.playsInline = true;

function attachEvents() {
    photoInput.addEventListener("change", handleFileSelection);
    cameraButton.addEventListener("click", openCamera);
    captureButton.addEventListener("click", captureFromCamera);
    closeCameraButton.addEventListener("click", closeCamera);
    cutButton.addEventListener("click", createPuzzle);
    ghostButton.addEventListener("click", toggleGhost);
    exportButton.addEventListener("click", () => exportLeaderboard(false));

    difficultySelect.addEventListener("change", () => {
        state.gridSize = Number(difficultySelect.value);
        syncBoardMetrics();
        resetPuzzle(false);
        if (state.image) {
            setStatus(`Raskusaste seatud: ${state.gridSize}x${state.gridSize}. Vajuta "Lõika pusleks".`);
        }
    });

    shapeSelect.addEventListener("change", () => {
        state.shapeMode = shapeSelect.value;
        resetPuzzle(false);
        if (state.image) {
            setStatus(`Kuju seatud: ${getShapeLabel(state.shapeMode)}. Vajuta "Lõika pusleks".`);
        }
    });

    musicSelect.addEventListener("change", async () => {
        state.musicMode = musicSelect.value;
        await audioEngine.setMusicMode(state.musicMode);
    });

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointercancel", handlePointerUp);
    document.addEventListener("paste", handlePasteUpload);
    window.addEventListener("beforeunload", stopTimer);

    previewDropZone.addEventListener("dragover", handlePreviewDragOver);
    previewDropZone.addEventListener("dragleave", handlePreviewDragLeave);
    previewDropZone.addEventListener("drop", handlePreviewDrop);
}

function syncBoardMetrics() {
    state.cellSize = BOARD_SIZE / state.gridSize;
    assemblyBoard.style.setProperty("--cell-size", `${state.cellSize}px`);
    gridLabel.textContent = `${state.gridSize} x ${state.gridSize}`;
}

function handleFileSelection(event) {
    const [file] = event.target.files || [];
    if (!file) {
        return;
    }

    loadImageFromFile(file, true);
    photoInput.value = "";
}

function loadImageFromFile(file, autoCreate = false) {
    if (!file.type.startsWith("image/")) {
        setStatus("Valitud fail ei ole pilt.", true);
        return;
    }

    loadImageFromUrl(URL.createObjectURL(file), autoCreate);
}

function handlePasteUpload(event) {
    const items = event.clipboardData?.items || [];
    for (const item of items) {
        if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
                loadImageFromFile(file, true);
                setStatus("Pilt kleebiti lõikelaualt. Vajuta \"Lõika pusleks\".");
            }
            break;
        }
    }
}

function handlePreviewDragOver(event) {
    event.preventDefault();
    previewDropZone.classList.add("drop-target");
}

function handlePreviewDragLeave(event) {
    if (previewDropZone.contains(event.relatedTarget)) {
        return;
    }

    previewDropZone.classList.remove("drop-target");
}

function handlePreviewDrop(event) {
    event.preventDefault();
    previewDropZone.classList.remove("drop-target");

    const [file] = event.dataTransfer?.files || [];
    if (!file) {
        setStatus("Lohistatud objekt ei sisaldanud pilti.", true);
        return;
    }

    loadImageFromFile(file, true);
}

function loadImageFromUrl(url, autoCreate = false) {
    const image = new Image();
    image.onload = () => {
        revokePreviousImageUrl();
        state.image = image;
        state.imageUrl = url;
        cutButton.disabled = false;
        previewPlaceholder.classList.add("hidden");
        drawImageToCanvas(image, previewContext, previewCanvas.width, previewCanvas.height);
        drawImageToCanvas(image, ghostContext, ghostCanvas.width, ghostCanvas.height);
        resetPuzzle(false);
        if (autoCreate) {
            setStatus("Pilt laaditi. Pusle luuakse automaatselt.");
            window.requestAnimationFrame(() => {
                createPuzzle();
                scrollBoardIntoView();
            });
            return;
        }

        setStatus(`Pilt on valmis. Vali ${state.gridSize}x${state.gridSize} raskus ja lõika pusleks.`);
    };

    image.onerror = () => {
        setStatus("Valitud faili ei saanud pildina laadida.", true);
        cutButton.disabled = true;
        URL.revokeObjectURL(url);
    };

    image.src = url;
}

function revokePreviousImageUrl() {
    if (state.imageUrl && state.imageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(state.imageUrl);
    }
}

async function openCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus("Kaamera ei ole selles brauseris saadaval.", true);
        return;
    }

    try {
        state.stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment",
                width: { ideal: 1280 },
                height: { ideal: 1280 }
            },
            audio: false
        });

        cameraVideo.srcObject = state.stream;
        cameraModal.classList.remove("hidden");
        cameraModal.setAttribute("aria-hidden", "false");
        setStatus("Kaamera on aktiivne. Tee foto ja loo pusle sellest.");
    } catch (error) {
        setStatus("Kaamerat ei õnnestunud avada. Kontrolli õiguseid või kasuta faili üleslaadimist.", true);
    }
}

function closeCamera() {
    if (state.stream) {
        state.stream.getTracks().forEach((track) => track.stop());
        state.stream = null;
    }

    cameraVideo.srcObject = null;
    cameraModal.classList.add("hidden");
    cameraModal.setAttribute("aria-hidden", "true");
}

function captureFromCamera() {
    if (!state.stream) {
        return;
    }

    const context = cameraCanvas.getContext("2d");
    drawVideoToCanvas(cameraVideo, context, cameraCanvas.width, cameraCanvas.height);
    const imageUrl = cameraCanvas.toDataURL("image/png");
    closeCamera();
    loadImageFromUrl(imageUrl, true);
}

function createPuzzle() {
    if (!state.image) {
        setStatus("Lae enne pilt või tee foto.", true);
        return;
    }

    syncBoardMetrics();
    resetPuzzle(true);

    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = BOARD_SIZE;
    sourceCanvas.height = BOARD_SIZE;

    const sourceContext = sourceCanvas.getContext("2d");
    drawImageToCanvas(state.image, sourceContext, BOARD_SIZE, BOARD_SIZE);
    drawImageToCanvas(state.image, previewContext, previewCanvas.width, previewCanvas.height);
    drawImageToCanvas(state.image, ghostContext, ghostCanvas.width, ghostCanvas.height);

    const pieces = [];
    for (let row = 0; row < state.gridSize; row += 1) {
        for (let column = 0; column < state.gridSize; column += 1) {
            const index = row * state.gridSize + column;
            const shape = buildShapeDefinition(index, state.shapeMode);
            const pieceCanvas = document.createElement("canvas");
            pieceCanvas.width = state.cellSize;
            pieceCanvas.height = state.cellSize;
            const pieceContext = pieceCanvas.getContext("2d");

            pieceContext.save();
            applyPath(pieceContext, shape.points, state.cellSize);
            pieceContext.clip();
            pieceContext.drawImage(
                sourceCanvas,
                column * state.cellSize,
                row * state.cellSize,
                state.cellSize,
                state.cellSize,
                0,
                0,
                state.cellSize,
                state.cellSize
            );
            pieceContext.restore();

            pieces.push({
                id: `piece-${index}`,
                correctIndex: index,
                correctX: column * state.cellSize,
                correctY: row * state.cellSize,
                x: 0,
                y: 0,
                zone: "storage",
                snapped: false,
                shapeCss: shape.css,
                dataUrl: pieceCanvas.toDataURL("image/png")
            });
        }
    }

    state.pieces = shuffleArray(pieces);
    boardEmptyState.classList.add("hidden");
    renderStorage();
    renderBoard();
    updateProgressMessage();
}

function scrollBoardIntoView() {
    assemblyBoard.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest"
    });
}

function resetPuzzle(clearPieces) {
    stopTimer();
    state.started = false;
    state.solved = false;
    state.elapsedMs = 0;
    timerText.textContent = formatElapsedTime(0);
    document.body.classList.remove("success");
    appTitle.textContent = "Pixel Puzzle";

    if (clearPieces) {
        state.pieces = [];
    } else {
        state.pieces = [];
    }

    cancelFireworks();
    renderStorage();
    renderBoard();
    boardEmptyState.classList.toggle("hidden", Boolean(state.pieces.length));
}

function renderStorage() {
    storageZone.innerHTML = "";
    const storagePieces = state.pieces.filter((piece) => piece.zone === "storage");
    storagePieces.forEach((piece) => {
        storageZone.append(createPieceElement(piece, true));
    });
    storageCount.textContent = `${storagePieces.length} tükki`;
}

function renderBoard() {
    assemblyBoard.querySelectorAll(".piece").forEach((element) => element.remove());

    const boardPieces = state.pieces
        .filter((piece) => piece.zone === "board")
        .sort((left, right) => Number(left.snapped) - Number(right.snapped));

    boardPieces.forEach((piece) => {
        assemblyBoard.append(createPieceElement(piece, false));
    });

    boardEmptyState.classList.toggle("hidden", state.pieces.length > 0);
}

function createPieceElement(piece, inStorage) {
    const element = document.createElement("div");
    element.className = "piece";
    element.dataset.pieceId = piece.id;
    element.dataset.label = String(piece.correctIndex + 1);
    element.style.setProperty("--piece-size", `${state.cellSize}px`);
    element.style.backgroundImage = `url(${piece.dataUrl})`;
    element.style.clipPath = piece.shapeCss;
    element.style.webkitClipPath = piece.shapeCss;
    element.style.borderRadius = state.shapeMode === "square" ? "14px" : "6px";

    if (inStorage) {
        element.classList.add("in-storage");
    } else {
        element.style.left = `${piece.x}px`;
        element.style.top = `${piece.y}px`;
    }

    if (piece.snapped) {
        element.classList.add("snapped");
    }

    element.addEventListener("pointerdown", (event) => handlePointerDown(event, piece.id));
    return element;
}

async function handlePointerDown(event, pieceId) {
    const piece = findPiece(pieceId);
    if (!piece || state.solved) {
        return;
    }

    await audioEngine.ensure();
    startTimer();

    const target = event.currentTarget;
    if (typeof target.setPointerCapture === "function") {
        target.setPointerCapture(event.pointerId);
    }

    const rect = target.getBoundingClientRect();
    const pointerOffsetX = event.clientX - rect.left;
    const pointerOffsetY = event.clientY - rect.top;

    state.drag = {
        pieceId,
        originZone: piece.zone,
        originX: piece.x,
        originY: piece.y,
        offsetX: pointerOffsetX,
        offsetY: pointerOffsetY,
        width: rect.width,
        height: rect.height,
        pointerId: event.pointerId
    };

    piece.zone = "board";
    piece.snapped = false;

    if (target.parentElement) {
        target.parentElement.removeChild(target);
    }

    target.classList.add("dragging");
    target.style.position = "fixed";
    target.style.left = `${rect.left}px`;
    target.style.top = `${rect.top}px`;
    target.style.width = `${rect.width}px`;
    target.style.height = `${rect.height}px`;
    target.style.zIndex = "999";
    document.body.append(target);

    state.drag.element = target;
    updateDraggingPosition(event.clientX, event.clientY);
}

function handlePointerMove(event) {
    if (!state.drag || event.pointerId !== state.drag.pointerId) {
        return;
    }

    updateDraggingPosition(event.clientX, event.clientY);
    updateSnapPreview(event.clientX, event.clientY);
}

function updateDraggingPosition(clientX, clientY) {
    if (!state.drag) {
        return;
    }

    const left = clientX - state.drag.offsetX;
    const top = clientY - state.drag.offsetY;
    state.drag.element.style.left = `${left}px`;
    state.drag.element.style.top = `${top}px`;
}

function updateSnapPreview(clientX, clientY) {
    if (!state.drag) {
        return;
    }

    const piece = findPiece(state.drag.pieceId);
    if (!piece) {
        return;
    }

    const boardRect = assemblyBoard.getBoundingClientRect();
    const left = clientX - state.drag.offsetX;
    const top = clientY - state.drag.offsetY;
    const relativeX = left - boardRect.left;
    const relativeY = top - boardRect.top;
    const nearCorrectSpot = isNearCorrectSpot(piece, relativeX, relativeY);
    state.drag.element.classList.toggle("snap-ready", nearCorrectSpot);
}

function handlePointerUp(event) {
    if (!state.drag || event.pointerId !== state.drag.pointerId) {
        return;
    }

    const piece = findPiece(state.drag.pieceId);
    const dragElement = state.drag.element;
    const storageRect = storageZone.getBoundingClientRect();
    const boardRect = assemblyBoard.getBoundingClientRect();
    const left = event.clientX - state.drag.offsetX;
    const top = event.clientY - state.drag.offsetY;
    const isInsideStorage = isPointInsideRect(event.clientX, event.clientY, storageRect);
    const isInsideBoard = isPointInsideRect(event.clientX, event.clientY, boardRect);

    if (typeof dragElement.releasePointerCapture === "function" && dragElement.hasPointerCapture(event.pointerId)) {
        dragElement.releasePointerCapture(event.pointerId);
    }

    dragElement.remove();

    if (!piece) {
        state.drag = null;
        renderStorage();
        renderBoard();
        return;
    }

    if (isInsideStorage) {
        piece.zone = "storage";
        piece.snapped = false;
    } else if (isInsideBoard) {
        const relativeX = clamp(left - boardRect.left, 0, BOARD_SIZE - state.cellSize);
        const relativeY = clamp(top - boardRect.top, 0, BOARD_SIZE - state.cellSize);
        piece.zone = "board";
        piece.x = relativeX;
        piece.y = relativeY;

        if (isNearCorrectSpot(piece, relativeX, relativeY)) {
            piece.x = piece.correctX;
            piece.y = piece.correctY;
            piece.snapped = true;
            audioEngine.playSnap();
        }
    } else if (state.drag.originZone === "storage") {
        piece.zone = "storage";
        piece.snapped = false;
    } else {
        piece.zone = "board";
        piece.x = state.drag.originX;
        piece.y = state.drag.originY;
        piece.snapped = Math.abs(piece.x - piece.correctX) < 0.5 && Math.abs(piece.y - piece.correctY) < 0.5;
    }

    state.drag = null;
    renderStorage();
    renderBoard();
    updatePuzzleStatus();
}

function isNearCorrectSpot(piece, x, y) {
    const dx = piece.correctX - x;
    const dy = piece.correctY - y;
    const threshold = Math.max(12, state.cellSize * 0.28);
    return Math.hypot(dx, dy) <= threshold;
}

function updatePuzzleStatus() {
    const solved = state.pieces.length > 0 && state.pieces.every((piece) => {
        return piece.zone === "board" && piece.snapped && piece.x === piece.correctX && piece.y === piece.correctY;
    });

    if (solved) {
        stopTimer();
        state.solved = true;
        appTitle.textContent = "Success";
        document.body.classList.add("success");
        setStatus(`Valmis ${formatElapsedTime(state.elapsedMs)} ajaga. Rekord lisatud.`);
        audioEngine.playWin();
        launchFireworks();
        saveRecord();
        return;
    }

    updateProgressMessage();
}

function updateProgressMessage() {
    appTitle.textContent = "Pixel Puzzle";
    document.body.classList.remove("success");

    if (!state.pieces.length) {
        setStatus(state.image ? "Vajuta \"Lõika pusleks\" ja alusta mängu." : "Lae pilt üles, et alustada.");
        return;
    }

    const snappedCount = state.pieces.filter((piece) => piece.snapped).length;
    setStatus(`${snappedCount} / ${state.pieces.length} tükki on paigas.`);
}

function toggleGhost() {
    state.ghostVisible = !state.ghostVisible;
    assemblyBoard.classList.toggle("ghost-visible", state.ghostVisible);
    ghostButton.textContent = state.ghostVisible ? "Peida" : "Vaata";
}

function startTimer() {
    if (state.started || !state.pieces.length) {
        return;
    }

    state.started = true;
    state.timerStart = performance.now() - state.elapsedMs;
    tickTimer();
}

function tickTimer() {
    state.elapsedMs = performance.now() - state.timerStart;
    timerText.textContent = formatElapsedTime(state.elapsedMs);
    state.timerFrame = window.requestAnimationFrame(tickTimer);
}

function stopTimer() {
    if (state.timerFrame) {
        window.cancelAnimationFrame(state.timerFrame);
        state.timerFrame = 0;
    }

    if (state.started) {
        state.elapsedMs = performance.now() - state.timerStart;
        timerText.textContent = formatElapsedTime(state.elapsedMs);
    }
}

function saveRecord() {
    const name = playerNameInput.value.trim() || "Anon";
    const record = {
        name,
        timeMs: Math.round(state.elapsedMs),
        time: formatElapsedTime(state.elapsedMs),
        difficulty: `${state.gridSize}x${state.gridSize}`,
        shape: getShapeLabel(state.shapeMode),
        date: new Date().toISOString()
    };

    state.leaderboard = [...state.leaderboard, record]
        .sort((left, right) => left.timeMs - right.timeMs)
        .slice(0, 10);

    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(state.leaderboard));
    renderLeaderboard();
    exportLeaderboard(true);
}

function loadLeaderboard() {
    try {
        const raw = localStorage.getItem(LEADERBOARD_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        return [];
    }
}

function renderLeaderboard() {
    leaderboardList.innerHTML = "";

    if (!state.leaderboard.length) {
        const item = document.createElement("li");
        item.textContent = "Rekordid ilmuvad pärast esimest võitu.";
        leaderboardList.append(item);
        return;
    }

    state.leaderboard.forEach((record) => {
        const item = document.createElement("li");
        item.innerHTML = `<strong>${escapeHtml(record.name)}</strong> · ${record.time} · ${record.difficulty} · ${escapeHtml(record.shape)}`;
        leaderboardList.append(item);
    });
}

function exportLeaderboard(silentAutoDownload) {
    const blob = new Blob([JSON.stringify(state.leaderboard, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "pixel-puzzle-records.json";

    if (!silentAutoDownload) {
        setStatus("Rekordid eksporditi JSON-failina.");
    }

    anchor.click();
    URL.revokeObjectURL(url);
}

function launchFireworks() {
    cancelFireworks();

    const particles = [];
    for (let burst = 0; burst < 6; burst += 1) {
        const originX = Math.random() * BOARD_SIZE;
        const originY = Math.random() * (BOARD_SIZE * 0.6);
        for (let index = 0; index < 28; index += 1) {
            const angle = (Math.PI * 2 * index) / 28 + Math.random() * 0.3;
            const speed = 1.5 + Math.random() * 3.8;
            particles.push({
                x: originX,
                y: originY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 70 + Math.random() * 24,
                age: 0,
                color: ["#70e7d2", "#ffb957", "#72a9ff", "#91f8b0"][Math.floor(Math.random() * 4)]
            });
        }
    }

    const render = () => {
        fireworksContext.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
        particles.forEach((particle) => {
            particle.age += 1;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.04;
            const alpha = Math.max(0, 1 - particle.age / particle.life);
            fireworksContext.fillStyle = withAlpha(particle.color, alpha);
            fireworksContext.beginPath();
            fireworksContext.arc(particle.x, particle.y, 2.4, 0, Math.PI * 2);
            fireworksContext.fill();
        });

        const alive = particles.some((particle) => particle.age < particle.life);
        if (alive) {
            state.fireworksFrame = window.requestAnimationFrame(render);
        } else {
            fireworksContext.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
            state.fireworksFrame = 0;
        }
    };

    render();
}

function cancelFireworks() {
    if (state.fireworksFrame) {
        window.cancelAnimationFrame(state.fireworksFrame);
        state.fireworksFrame = 0;
    }

    fireworksContext.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
}

function drawCanvasPlaceholder(context, width, height) {
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#0a0f16";
    context.fillRect(0, 0, width, height);
}

function drawImageToCanvas(image, context, width, height) {
    const sourceWidth = image.naturalWidth || image.videoWidth || image.width;
    const sourceHeight = image.naturalHeight || image.videoHeight || image.height;
    const sourceAspect = sourceWidth / sourceHeight;
    const targetAspect = width / height;

    let drawWidth = sourceWidth;
    let drawHeight = sourceHeight;
    let startX = 0;
    let startY = 0;

    if (sourceAspect > targetAspect) {
        drawWidth = sourceHeight * targetAspect;
        startX = (sourceWidth - drawWidth) / 2;
    } else {
        drawHeight = sourceWidth / targetAspect;
        startY = (sourceHeight - drawHeight) / 2;
    }

    context.clearRect(0, 0, width, height);
    context.drawImage(image, startX, startY, drawWidth, drawHeight, 0, 0, width, height);
}

function drawVideoToCanvas(video, context, width, height) {
    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;
    const sourceAspect = sourceWidth / sourceHeight;
    const targetAspect = width / height;

    let drawWidth = sourceWidth;
    let drawHeight = sourceHeight;
    let startX = 0;
    let startY = 0;

    if (sourceAspect > targetAspect) {
        drawWidth = sourceHeight * targetAspect;
        startX = (sourceWidth - drawWidth) / 2;
    } else {
        drawHeight = sourceWidth / targetAspect;
        startY = (sourceHeight - drawHeight) / 2;
    }

    context.clearRect(0, 0, width, height);
    context.drawImage(video, startX, startY, drawWidth, drawHeight, 0, 0, width, height);
}

function buildShapeDefinition(index, mode) {
    if (mode === "triangle") {
        const points = index % 2 === 0
            ? [[0, 0], [1, 0], [1, 1]]
            : [[0, 0], [0, 1], [1, 1]];
        return toShapeDefinition(points);
    }

    if (mode === "polygon") {
        const random = seededRandom(index + 1);
        const inset = 0.12;
        const points = [
            [inset * random(), 0],
            [1 - inset * random(), 0.05 + 0.08 * random()],
            [1, 0.24 + 0.12 * random()],
            [0.94 - inset * random(), 1],
            [0.18 + 0.18 * random(), 0.98 - inset * random()],
            [0, 0.34 + 0.16 * random()]
        ];
        return toShapeDefinition(points);
    }

    return toShapeDefinition([[0, 0], [1, 0], [1, 1], [0, 1]]);
}

function toShapeDefinition(points) {
    const css = `polygon(${points.map(([x, y]) => `${(x * 100).toFixed(1)}% ${(y * 100).toFixed(1)}%`).join(", ")})`;
    return { css, points };
}

function applyPath(context, points, size) {
    context.beginPath();
    points.forEach(([x, y], index) => {
        const drawX = x * size;
        const drawY = y * size;
        if (index === 0) {
            context.moveTo(drawX, drawY);
        } else {
            context.lineTo(drawX, drawY);
        }
    });
    context.closePath();
}

function formatElapsedTime(milliseconds) {
    const totalTenths = Math.floor(milliseconds / 100);
    const totalSeconds = Math.floor(totalTenths / 10);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const tenths = totalTenths % 10;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

function getShapeLabel(shapeMode) {
    return {
        square: "Ruudud",
        triangle: "Kolmnurgad",
        polygon: "Hulknurgad"
    }[shapeMode] || "Ruudud";
}

function seededRandom(seed) {
    let value = seed * 214013 + 2531011;
    return () => {
        value = (value * 48271) % 2147483647;
        return (value & 2147483647) / 2147483647;
    };
}

function findPiece(pieceId) {
    return state.pieces.find((piece) => piece.id === pieceId);
}

function shuffleArray(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
}

function isPointInsideRect(x, y, rect) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function withAlpha(color, alpha) {
    const sanitized = color.replace("#", "");
    const red = Number.parseInt(sanitized.slice(0, 2), 16);
    const green = Number.parseInt(sanitized.slice(2, 4), 16);
    const blue = Number.parseInt(sanitized.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function setStatus(message, isError = false) {
    statusText.textContent = message;
    statusText.style.color = isError ? "var(--danger)" : "var(--text)";
}

class AudioEngine {
    constructor() {
        this.context = null;
        this.musicInterval = 0;
        this.step = 0;
        this.mode = "off";
    }

    async ensure() {
        if (!this.context) {
            const Context = window.AudioContext || window.webkitAudioContext;
            if (!Context) {
                return;
            }
            this.context = new Context();
        }

        if (this.context.state === "suspended") {
            await this.context.resume();
        }
    }

    async setMusicMode(mode) {
        this.mode = mode;
        await this.ensure();
        this.stopMusic();

        if (!this.context || mode === "off") {
            return;
        }

        this.step = 0;
        this.playMusicStep();
        this.musicInterval = window.setInterval(() => this.playMusicStep(), 340);
    }

    stopMusic() {
        if (this.musicInterval) {
            window.clearInterval(this.musicInterval);
            this.musicInterval = 0;
        }
    }

    playMusicStep() {
        if (!this.context) {
            return;
        }

        const patterns = {
            pulse: [220, null, 330, null, 392, null, 330, null],
            arcade: [523.25, 659.25, 783.99, 659.25, 523.25, 659.25, 440, 659.25],
            drift: [196, 246.94, null, 293.66, 246.94, null, 174.61, 220]
        };

        const pattern = patterns[this.mode] || [];
        const note = pattern[this.step % pattern.length];
        if (note) {
            const type = this.mode === "arcade" ? "square" : this.mode === "drift" ? "sine" : "triangle";
            const gain = this.mode === "drift" ? 0.03 : 0.04;
            this.playTone(note, 0.22, type, gain);
            if (this.mode !== "drift" && this.step % 2 === 0) {
                this.playTone(note / 2, 0.18, "sine", 0.02);
            }
        }

        this.step += 1;
    }

    playSnap() {
        if (!this.context) {
            return;
        }

        this.playTone(760, 0.05, "square", 0.08);
        this.playTone(1040, 0.08, "triangle", 0.05, 0.02);
    }

    playWin() {
        if (!this.context) {
            return;
        }

        [523.25, 659.25, 783.99, 1046.5].forEach((note, index) => {
            this.playTone(note, 0.18, "triangle", 0.06, index * 0.08);
        });
    }

    playTone(frequency, duration, type, volume, delay = 0) {
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        const start = this.context.currentTime + delay;
        const end = start + duration;

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, start);

        gainNode.gain.setValueAtTime(0.0001, start);
        gainNode.gain.exponentialRampToValueAtTime(volume, start + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, end);

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        oscillator.start(start);
        oscillator.stop(end + 0.02);
    }
}

audioEngine = new AudioEngine();