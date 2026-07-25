import {
  PRESETS,
  buildFilename,
  computeCoverState,
  fitPreviewSize,
  formatBytes,
  normalizeSpec,
  validateResult
} from './src/core.js';

const elements = {
  presetSelect: document.querySelector('#presetSelect'),
  officialSpec: document.querySelector('#officialSpec'),
  customFields: document.querySelector('#customFields'),
  widthInput: document.querySelector('#widthInput'),
  heightInput: document.querySelector('#heightInput'),
  maxKbInput: document.querySelector('#maxKbInput'),
  formatSelect: document.querySelector('#formatSelect'),
  specError: document.querySelector('#specError'),
  fileInput: document.querySelector('#fileInput'),
  dropZone: document.querySelector('#dropZone'),
  fileMeta: document.querySelector('#fileMeta'),
  emptyEditor: document.querySelector('#emptyEditor'),
  editor: document.querySelector('#editor'),
  cropCanvas: document.querySelector('#cropCanvas'),
  zoomRange: document.querySelector('#zoomRange'),
  zoomOutput: document.querySelector('#zoomOutput'),
  rotateLeftButton: document.querySelector('#rotateLeftButton'),
  rotateRightButton: document.querySelector('#rotateRightButton'),
  resetButton: document.querySelector('#resetButton'),
  generateButton: document.querySelector('#generateButton'),
  processingMessage: document.querySelector('#processingMessage'),
  emptyResult: document.querySelector('#emptyResult'),
  result: document.querySelector('#result'),
  resultImage: document.querySelector('#resultImage'),
  resultStatus: document.querySelector('#resultStatus'),
  resultChecks: document.querySelector('#resultChecks'),
  resultFormat: document.querySelector('#resultFormat'),
  resultDimensions: document.querySelector('#resultDimensions'),
  resultSize: document.querySelector('#resultSize'),
  resultQuality: document.querySelector('#resultQuality'),
  downloadButton: document.querySelector('#downloadButton')
};

const state = {
  sourceCanvas: null,
  sourceFile: null,
  centerX: 0,
  centerY: 0,
  zoom: 1,
  renderState: null,
  dragging: false,
  pointerId: null,
  pointerX: 0,
  pointerY: 0,
  resultUrl: null
};

function currentPresetId() {
  return elements.presetSelect.value;
}

function readSpec() {
  const presetId = currentPresetId();
  if (presetId === 'nationalCivilService') {
    const preset = PRESETS.nationalCivilService;
    return normalizeSpec({
      width: preset.width,
      height: preset.height,
      maxKb: preset.maxKb,
      format: elements.formatSelect.value
    });
  }

  return normalizeSpec({
    width: elements.widthInput.value,
    height: elements.heightInput.value,
    maxKb: elements.maxKbInput.value,
    format: elements.formatSelect.value
  });
}

function showSpecErrors(errors) {
  elements.specError.hidden = errors.length === 0;
  elements.specError.textContent = errors.join(' ');
}

function applyPreset() {
  const isCustom = currentPresetId() === 'custom';
  elements.officialSpec.hidden = isCustom;
  elements.customFields.hidden = !isCustom;

  if (!isCustom) {
    const preset = PRESETS.nationalCivilService;
    elements.widthInput.value = String(preset.width);
    elements.heightInput.value = String(preset.height);
    elements.maxKbInput.value = String(preset.maxKb);
  }

  updatePreviewGeometry();
  clearResult();
}

function updatePreviewGeometry() {
  const { spec, errors } = readSpec();
  showSpecErrors(errors);
  if (errors.length > 0 || !state.sourceCanvas) return;

  const preview = fitPreviewSize(spec.width, spec.height);
  elements.cropCanvas.width = preview.width;
  elements.cropCanvas.height = preview.height;
  elements.cropCanvas.style.aspectRatio = `${spec.width} / ${spec.height}`;
  renderPreview();
}

async function decodeImage(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('JPG, PNG 또는 WebP 사진만 선택할 수 있습니다.');
  }

  if (file.size > 30 * 1024 * 1024) {
    throw new Error('원본 사진은 30MB 이하만 사용할 수 있습니다.');
  }

  if ('createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext('2d').drawImage(bitmap, 0, 0);
      bitmap.close?.();
      return canvas;
    } catch {
      // Some browsers do not support the imageOrientation option. Fall back below.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('사진 파일을 읽지 못했습니다. 다른 JPG 또는 PNG 파일을 사용해 주세요.'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.getContext('2d').drawImage(image, 0, 0);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function loadFile(file) {
  try {
    const canvas = await decodeImage(file);
    state.sourceCanvas = canvas;
    state.sourceFile = file;
    resetCropState();

    elements.fileMeta.hidden = false;
    elements.fileMeta.textContent = `${file.name} · ${canvas.width}×${canvas.height}px · ${formatBytes(file.size)}`;
    elements.emptyEditor.hidden = true;
    elements.editor.hidden = false;
    updatePreviewGeometry();
    clearResult();
  } catch (error) {
    state.sourceCanvas = null;
    elements.fileMeta.hidden = false;
    elements.fileMeta.textContent = error instanceof Error ? error.message : '사진을 불러오지 못했습니다.';
    elements.emptyEditor.hidden = false;
    elements.editor.hidden = true;
  }
}

function resetCropState() {
  if (!state.sourceCanvas) return;
  state.centerX = state.sourceCanvas.width / 2;
  state.centerY = state.sourceCanvas.height / 2;
  state.zoom = 1;
  elements.zoomRange.value = '1';
  elements.zoomOutput.value = '100%';
}

function renderPreview() {
  if (!state.sourceCanvas) return;
  const canvas = elements.cropCanvas;
  const context = canvas.getContext('2d', { alpha: false });

  const cover = computeCoverState({
    sourceWidth: state.sourceCanvas.width,
    sourceHeight: state.sourceCanvas.height,
    viewWidth: canvas.width,
    viewHeight: canvas.height,
    zoom: state.zoom,
    centerX: state.centerX,
    centerY: state.centerY
  });

  state.centerX = cover.centerX;
  state.centerY = cover.centerY;
  state.renderState = cover;

  context.save();
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    state.sourceCanvas,
    cover.drawX,
    cover.drawY,
    cover.drawWidth,
    cover.drawHeight
  );

  context.strokeStyle = 'rgba(255,255,255,0.42)';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(canvas.width / 3, 0);
  context.lineTo(canvas.width / 3, canvas.height);
  context.moveTo((canvas.width / 3) * 2, 0);
  context.lineTo((canvas.width / 3) * 2, canvas.height);
  context.moveTo(0, canvas.height / 3);
  context.lineTo(canvas.width, canvas.height / 3);
  context.moveTo(0, (canvas.height / 3) * 2);
  context.lineTo(canvas.width, (canvas.height / 3) * 2);
  context.stroke();

  const vignette = context.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    Math.min(canvas.width, canvas.height) * 0.28,
    canvas.width / 2,
    canvas.height / 2,
    Math.max(canvas.width, canvas.height) * 0.72
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.13)');
  context.fillStyle = vignette;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.restore();
}

function pointerPosition(event) {
  const rect = elements.cropCanvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (elements.cropCanvas.width / rect.width),
    y: (event.clientY - rect.top) * (elements.cropCanvas.height / rect.height)
  };
}

function onPointerDown(event) {
  if (!state.sourceCanvas || !state.renderState) return;
  const point = pointerPosition(event);
  state.dragging = true;
  state.pointerId = event.pointerId;
  state.pointerX = point.x;
  state.pointerY = point.y;
  elements.cropCanvas.setPointerCapture(event.pointerId);
}

function onPointerMove(event) {
  if (!state.dragging || event.pointerId !== state.pointerId || !state.renderState) return;
  const point = pointerPosition(event);
  const dx = point.x - state.pointerX;
  const dy = point.y - state.pointerY;
  state.centerX -= dx / state.renderState.scale;
  state.centerY -= dy / state.renderState.scale;
  state.pointerX = point.x;
  state.pointerY = point.y;
  renderPreview();
}

function onPointerUp(event) {
  if (event.pointerId !== state.pointerId) return;
  state.dragging = false;
  state.pointerId = null;
}

function rotateSource(clockwise) {
  if (!state.sourceCanvas) return;
  const oldCanvas = state.sourceCanvas;
  const rotated = document.createElement('canvas');
  rotated.width = oldCanvas.height;
  rotated.height = oldCanvas.width;
  const context = rotated.getContext('2d');

  context.save();
  if (clockwise) {
    context.translate(rotated.width, 0);
    context.rotate(Math.PI / 2);
  } else {
    context.translate(0, rotated.height);
    context.rotate(-Math.PI / 2);
  }
  context.drawImage(oldCanvas, 0, 0);
  context.restore();

  state.sourceCanvas = rotated;
  resetCropState();
  renderPreview();
  clearResult();
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('사진 파일을 생성하지 못했습니다.'));
    }, mimeType, quality);
  });
}

async function encodeCanvas(canvas, mimeType, maxBytes) {
  if (mimeType === 'image/png') {
    const blob = await canvasToBlob(canvas, mimeType);
    return { blob, quality: null, underLimit: blob.size < maxBytes };
  }

  let low = 0.05;
  let high = 0.95;
  let best = null;
  let bestQuality = null;

  for (let index = 0; index < 11; index += 1) {
    const quality = (low + high) / 2;
    const blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    if (blob.size < maxBytes) {
      best = blob;
      bestQuality = quality;
      low = quality;
    } else {
      high = quality;
    }
  }

  if (!best) {
    bestQuality = 0.05;
    best = await canvasToBlob(canvas, 'image/jpeg', bestQuality);
  }

  return { blob: best, quality: bestQuality, underLimit: best.size < maxBytes };
}

async function generateResult() {
  if (!state.sourceCanvas || !state.renderState) return;
  const { spec, errors } = readSpec();
  showSpecErrors(errors);
  if (errors.length > 0) return;

  elements.generateButton.disabled = true;
  elements.processingMessage.hidden = false;

  try {
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = spec.width;
    outputCanvas.height = spec.height;
    const context = outputCanvas.getContext('2d', { alpha: false });
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, spec.width, spec.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(
      state.sourceCanvas,
      state.renderState.cropX,
      state.renderState.cropY,
      state.renderState.cropWidth,
      state.renderState.cropHeight,
      0,
      0,
      spec.width,
      spec.height
    );

    const encoded = await encodeCanvas(outputCanvas, spec.format, spec.maxKb * 1024);
    showResult(encoded, outputCanvas, spec);
  } catch (error) {
    elements.specError.hidden = false;
    elements.specError.textContent = error instanceof Error ? error.message : '사진 변환 중 오류가 발생했습니다.';
  } finally {
    elements.generateButton.disabled = false;
    elements.processingMessage.hidden = true;
  }
}

function showResult(encoded, outputCanvas, spec) {
  clearResultUrl();
  state.resultUrl = URL.createObjectURL(encoded.blob);
  elements.resultImage.src = state.resultUrl;

  const validation = validateResult({
    width: outputCanvas.width,
    height: outputCanvas.height,
    sizeBytes: encoded.blob.size,
    mimeType: encoded.blob.type,
    spec
  });

  elements.emptyResult.hidden = true;
  elements.result.hidden = false;
  elements.resultStatus.className = `status-banner ${validation.pass ? 'pass' : 'fail'}`;
  elements.resultStatus.textContent = validation.pass
    ? '기술 규격을 통과했습니다.'
    : '일부 기술 규격을 통과하지 못했습니다.';

  elements.resultChecks.replaceChildren(...validation.checks.map((check) => {
    const item = document.createElement('li');
    const label = document.createElement('span');
    const status = document.createElement('strong');
    label.textContent = check.label;
    status.textContent = check.pass ? '통과' : '확인 필요';
    status.className = check.pass ? 'pass' : 'fail';
    item.append(label, status);
    return item;
  }));

  elements.resultFormat.textContent = encoded.blob.type === 'image/png' ? 'PNG' : 'JPG';
  elements.resultDimensions.textContent = `${outputCanvas.width} × ${outputCanvas.height}px`;
  elements.resultSize.textContent = formatBytes(encoded.blob.size);
  elements.resultQuality.textContent = encoded.quality === null ? '해당 없음' : `${Math.round(encoded.quality * 100)}%`;

  elements.downloadButton.href = state.resultUrl;
  elements.downloadButton.download = buildFilename({
    presetId: currentPresetId(),
    width: spec.width,
    height: spec.height,
    mimeType: encoded.blob.type
  });
}

function clearResultUrl() {
  if (state.resultUrl) {
    URL.revokeObjectURL(state.resultUrl);
    state.resultUrl = null;
  }
}

function clearResult() {
  clearResultUrl();
  elements.resultImage.removeAttribute('src');
  elements.emptyResult.hidden = false;
  elements.result.hidden = true;
}

function handleDrop(event) {
  event.preventDefault();
  elements.dropZone.classList.remove('is-dragging');
  const file = event.dataTransfer?.files?.[0];
  if (file) loadFile(file);
}

elements.presetSelect.addEventListener('change', applyPreset);
[elements.widthInput, elements.heightInput, elements.maxKbInput].forEach((input) => {
  input.addEventListener('input', () => {
    updatePreviewGeometry();
    clearResult();
  });
});
elements.formatSelect.addEventListener('change', clearResult);
elements.fileInput.addEventListener('change', () => {
  const file = elements.fileInput.files?.[0];
  if (file) loadFile(file);
});
elements.dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  elements.dropZone.classList.add('is-dragging');
});
elements.dropZone.addEventListener('dragleave', () => elements.dropZone.classList.remove('is-dragging'));
elements.dropZone.addEventListener('drop', handleDrop);
elements.cropCanvas.addEventListener('pointerdown', onPointerDown);
elements.cropCanvas.addEventListener('pointermove', onPointerMove);
elements.cropCanvas.addEventListener('pointerup', onPointerUp);
elements.cropCanvas.addEventListener('pointercancel', onPointerUp);
elements.zoomRange.addEventListener('input', () => {
  state.zoom = Number(elements.zoomRange.value);
  elements.zoomOutput.value = `${Math.round(state.zoom * 100)}%`;
  renderPreview();
  clearResult();
});
elements.rotateLeftButton.addEventListener('click', () => rotateSource(false));
elements.rotateRightButton.addEventListener('click', () => rotateSource(true));
elements.resetButton.addEventListener('click', () => {
  resetCropState();
  renderPreview();
  clearResult();
});
elements.generateButton.addEventListener('click', generateResult);
window.addEventListener('beforeunload', clearResultUrl);

applyPreset();
