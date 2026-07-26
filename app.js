import {
  MIME_LABELS,
  PRESETS,
  RULE_TYPE_LABELS,
  assessSourceQuality,
  buildFilename,
  computeCoverState,
  describeDimensions,
  describeSizeLimit,
  fitPreviewSize,
  formatBytes,
  formatMimeList,
  getPortraitGuideGeometry,
  normalizeSpec,
  validateResult
} from './src/core.js?v=__BUILD_VERSION__';

const CUSTOM_MANUAL_CHECKS = Object.freeze([
  '제출 기관의 최신 공식 안내와 픽셀·용량 기준이 일치하는지 확인',
  '본인 식별이 가능한 정면 사진인지 확인',
  '배경색·촬영 시점·복장 등 사진 내용 조건을 확인',
  '최종 제출 화면에서 미리보기가 잘리거나 흐리지 않은지 확인'
]);

const elements = {
  presetSelect: document.querySelector('#presetSelect'),
  officialSpec: document.querySelector('#officialSpec'),
  officialPresetName: document.querySelector('#officialPresetName'),
  officialRuleBadge: document.querySelector('#officialRuleBadge'),
  officialCheckedDate: document.querySelector('#officialCheckedDate'),
  officialDimensions: document.querySelector('#officialDimensions'),
  officialFormats: document.querySelector('#officialFormats'),
  officialOutput: document.querySelector('#officialOutput'),
  officialMaxSize: document.querySelector('#officialMaxSize'),
  officialNote: document.querySelector('#officialNote'),
  officialSourceLink: document.querySelector('#officialSourceLink'),
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
  guideToggle: document.querySelector('#guideToggle'),
  qualityNotice: document.querySelector('#qualityNotice'),
  qualityBadge: document.querySelector('#qualityBadge'),
  qualityTitle: document.querySelector('#qualityTitle'),
  qualityDetail: document.querySelector('#qualityDetail'),
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
  manualChecks: document.querySelector('#manualChecks'),
  resultFormat: document.querySelector('#resultFormat'),
  resultDimensions: document.querySelector('#resultDimensions'),
  resultSize: document.querySelector('#resultSize'),
  resultQuality: document.querySelector('#resultQuality'),
  resultSourceQuality: document.querySelector('#resultSourceQuality'),
  downloadButton: document.querySelector('#downloadButton')
};

const state = {
  sourceCanvas: null,
  sourceFile: null,
  centerX: 0,
  centerY: 0,
  zoom: 1,
  renderState: null,
  sourceQuality: null,
  dragging: false,
  pointerId: null,
  pointerX: 0,
  pointerY: 0,
  resultUrl: null
};

function currentPresetId() {
  return elements.presetSelect.value;
}

function currentPreset() {
  return PRESETS[currentPresetId()] ?? null;
}

function formatOptionLabel(mimeType) {
  if (mimeType === 'image/png') return 'PNG — 선명하지만 용량이 클 수 있음';
  return 'JPG — 원서사진에 권장';
}

function renderFormatOptions(outputFormats, preferredFormat) {
  const previous = elements.formatSelect.value;
  const selected = outputFormats.includes(previous)
    ? previous
    : (outputFormats.includes(preferredFormat) ? preferredFormat : outputFormats[0]);

  const options = outputFormats.map((mimeType) => {
    const option = document.createElement('option');
    option.value = mimeType;
    option.textContent = formatOptionLabel(mimeType);
    option.selected = mimeType === selected;
    return option;
  });

  elements.formatSelect.replaceChildren(...options);
}

function readSpec() {
  const preset = currentPreset();
  if (preset) {
    return normalizeSpec({
      width: preset.width,
      height: preset.height,
      maxKb: preset.maxKb,
      maxKbInclusive: preset.maxKbInclusive,
      format: elements.formatSelect.value,
      acceptedFormats: preset.acceptedFormats,
      acceptedFormatLabel: preset.acceptedFormatLabel,
      outputFormats: preset.outputFormats,
      requireMaxKb: false,
      ruleType: preset.ruleType,
      dimensionMode: preset.dimensionMode,
      presetId: preset.id
    });
  }

  return normalizeSpec({
    width: elements.widthInput.value,
    height: elements.heightInput.value,
    maxKb: elements.maxKbInput.value,
    maxKbInclusive: false,
    format: elements.formatSelect.value,
    acceptedFormats: ['image/jpeg', 'image/png'],
    outputFormats: ['image/jpeg', 'image/png'],
    requireMaxKb: true,
    ruleType: 'custom',
    dimensionMode: 'exact',
    presetId: 'custom'
  });
}

function showSpecErrors(errors) {
  elements.specError.hidden = errors.length === 0;
  elements.specError.textContent = errors.join(' ');
}

function renderPresetDetails(preset) {
  elements.officialPresetName.textContent = preset.label;
  elements.officialRuleBadge.textContent = RULE_TYPE_LABELS[preset.ruleType] ?? '공식 규격';
  elements.officialCheckedDate.textContent = `확인일 ${preset.checkedDate}`;
  elements.officialDimensions.textContent = describeDimensions(preset);
  elements.officialFormats.textContent = preset.acceptedFormatLabel ?? formatMimeList(preset.acceptedFormats);
  elements.officialOutput.textContent = formatMimeList(preset.outputFormats);
  elements.officialMaxSize.textContent = describeSizeLimit(preset);
  elements.officialNote.textContent = preset.exceptionNote;
  elements.officialSourceLink.href = preset.sourceUrl;
  elements.officialSourceLink.textContent = `${preset.sourceLabel} ↗`;
}

function applyPreset() {
  const preset = currentPreset();
  const isCustom = !preset;
  elements.officialSpec.hidden = isCustom;
  elements.customFields.hidden = !isCustom;

  if (preset) {
    renderFormatOptions([...preset.outputFormats], preset.defaultOutputFormat);
    renderPresetDetails(preset);
    elements.widthInput.value = String(preset.width);
    elements.heightInput.value = String(preset.height);
    elements.maxKbInput.value = preset.maxKb === null ? '' : String(preset.maxKb);
  } else {
    if (!elements.maxKbInput.value) elements.maxKbInput.value = '350';
    renderFormatOptions(['image/jpeg', 'image/png'], elements.formatSelect.value || 'image/jpeg');
  }

  updatePreviewGeometry();
  clearResult();
}

function updatePreviewGeometry() {
  const { spec, errors } = readSpec();
  showSpecErrors(errors);
  if (errors.length > 0 || !state.sourceCanvas) {
    elements.qualityNotice.hidden = true;
    state.sourceQuality = null;
    return;
  }

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
      // imageOrientation 옵션을 지원하지 않는 브라우저는 아래 대체 경로를 사용합니다.
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
    state.sourceQuality = null;
    elements.qualityNotice.hidden = true;
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

function assessCurrentSourceQuality(spec = readSpec().spec) {
  if (!state.renderState) return null;
  return assessSourceQuality({
    cropWidth: state.renderState.cropWidth,
    cropHeight: state.renderState.cropHeight,
    targetWidth: spec.width,
    targetHeight: spec.height
  });
}

function updateQualityNotice() {
  if (!state.sourceCanvas || !state.renderState) {
    elements.qualityNotice.hidden = true;
    state.sourceQuality = null;
    return;
  }

  const { spec, errors } = readSpec();
  if (errors.length > 0) {
    elements.qualityNotice.hidden = true;
    state.sourceQuality = null;
    return;
  }

  const assessment = assessCurrentSourceQuality(spec);
  state.sourceQuality = assessment;
  elements.qualityNotice.hidden = false;
  elements.qualityNotice.className = `quality-notice ${assessment.level}`;
  elements.qualityBadge.textContent = assessment.label;
  elements.qualityTitle.textContent = `선택 영역 ${assessment.cropLabel} → 출력 ${assessment.outputLabel}`;
  elements.qualityDetail.textContent = assessment.message;
}

function drawPortraitGuide(context, width, height) {
  if (!elements.guideToggle?.checked) return;

  const guide = getPortraitGuideGeometry(width, height);
  const lineWidth = Math.max(1, width / 360);
  const labelSize = Math.max(9, Math.min(11, width / 28));

  context.save();
  context.lineWidth = lineWidth;
  context.strokeStyle = 'rgba(255,255,255,0.78)';
  context.setLineDash([Math.max(4, width / 55), Math.max(3, width / 75)]);

  context.beginPath();
  context.moveTo(guide.centerX, 0);
  context.lineTo(guide.centerX, height);
  for (const y of [guide.headTopY, guide.eyeLineY, guide.chinLineY, guide.shoulderLineY]) {
    context.moveTo(0, y);
    context.lineTo(width, y);
  }
  context.stroke();

  context.setLineDash([]);
  context.strokeStyle = 'rgba(245,78,0,0.9)';
  context.lineWidth = Math.max(1.25, width / 260);
  context.beginPath();
  context.ellipse(
    guide.faceEllipse.centerX,
    guide.faceEllipse.centerY,
    guide.faceEllipse.radiusX,
    guide.faceEllipse.radiusY,
    0,
    0,
    Math.PI * 2
  );
  context.stroke();

  context.font = `600 ${labelSize}px system-ui, sans-serif`;
  context.textBaseline = 'bottom';
  const labels = [
    ['정수리', guide.headTopY],
    ['눈', guide.eyeLineY],
    ['턱', guide.chinLineY],
    ['어깨', guide.shoulderLineY]
  ];
  for (const [label, y] of labels) {
    const textWidth = context.measureText(label).width;
    const x = 7;
    const baseline = Math.max(labelSize + 3, y - 3);
    context.fillStyle = 'rgba(38,37,30,0.78)';
    context.fillRect(x - 3, baseline - labelSize - 3, textWidth + 6, labelSize + 5);
    context.fillStyle = 'rgba(255,255,255,0.95)';
    context.fillText(label, x, baseline);
  }
  context.restore();
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
  drawPortraitGuide(context, canvas.width, canvas.height);
  context.restore();
  updateQualityNotice();
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
    return {
      blob,
      quality: null,
      underLimit: !Number.isFinite(maxBytes) || blob.size < maxBytes
    };
  }

  if (!Number.isFinite(maxBytes)) {
    const quality = 0.92;
    const blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    return { blob, quality, underLimit: true };
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

    const maxBytes = spec.maxKb === null ? null : spec.maxKb * 1024;
    const encoded = await encodeCanvas(outputCanvas, spec.format, maxBytes);
    showResult(encoded, outputCanvas, spec);
  } catch (error) {
    elements.specError.hidden = false;
    elements.specError.textContent = error instanceof Error ? error.message : '사진 변환 중 오류가 발생했습니다.';
  } finally {
    elements.generateButton.disabled = false;
    elements.processingMessage.hidden = true;
  }
}

function renderManualChecks() {
  const manualItems = currentPreset()?.manualChecks ?? CUSTOM_MANUAL_CHECKS;
  const listItems = manualItems.map((text, index) => {
    const item = document.createElement('li');
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    const copy = document.createElement('span');
    checkbox.type = 'checkbox';
    checkbox.id = `manualCheck${index}`;
    copy.textContent = text;
    label.htmlFor = checkbox.id;
    label.append(checkbox, copy);
    item.append(label);
    return item;
  });
  elements.manualChecks.replaceChildren(...listItems);
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

  const sourceQuality = assessCurrentSourceQuality(spec);
  const qualityNeedsReview = sourceQuality && sourceQuality.level !== 'sufficient';
  const displayChecks = [...validation.checks];
  if (sourceQuality) {
    displayChecks.push({
      id: 'sourceQuality',
      label: `원본 선택 영역 ${sourceQuality.cropLabel} → 출력 ${sourceQuality.outputLabel}`,
      pass: sourceQuality.level === 'sufficient',
      warning: qualityNeedsReview,
      informational: false
    });
  }

  elements.emptyResult.hidden = true;
  elements.result.hidden = false;
  if (!validation.pass) {
    elements.resultStatus.className = 'status-banner fail';
    elements.resultStatus.textContent = '일부 자동 검사 항목을 통과하지 못했습니다.';
  } else if (qualityNeedsReview) {
    elements.resultStatus.className = 'status-banner caution';
    elements.resultStatus.textContent = '기술 규격은 통과했지만 원본 해상도를 확인해 주세요.';
  } else {
    elements.resultStatus.className = 'status-banner pass';
    elements.resultStatus.textContent = '자동 검사 항목을 통과했습니다.';
  }

  elements.resultChecks.replaceChildren(...displayChecks.map((check) => {
    const item = document.createElement('li');
    const label = document.createElement('span');
    const status = document.createElement('strong');
    label.textContent = check.label;

    if (check.warning) {
      status.textContent = '화질 주의';
      status.className = 'warning';
    } else if (check.informational) {
      status.textContent = '안내';
      status.className = 'info';
    } else {
      status.textContent = check.pass ? '통과' : '확인 필요';
      status.className = check.pass ? 'pass' : 'fail';
    }

    item.append(label, status);
    return item;
  }));

  renderManualChecks();

  elements.resultFormat.textContent = MIME_LABELS[encoded.blob.type] ?? encoded.blob.type;
  elements.resultDimensions.textContent = `${outputCanvas.width} × ${outputCanvas.height}px`;
  elements.resultSize.textContent = formatBytes(encoded.blob.size);
  elements.resultQuality.textContent = encoded.quality === null ? '해당 없음' : `${Math.round(encoded.quality * 100)}%`;
  elements.resultSourceQuality.textContent = sourceQuality
    ? `${sourceQuality.cropLabel} · ${sourceQuality.label}`
    : '-';

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
  elements.resultSourceQuality.textContent = '-';
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
elements.guideToggle.addEventListener('change', () => {
  renderPreview();
});
elements.generateButton.addEventListener('click', generateResult);
window.addEventListener('beforeunload', clearResultUrl);

function applyPresetFromUrl() {
  const requestedPreset = new URLSearchParams(window.location.search).get('preset');
  const availablePresets = new Set([...Object.keys(PRESETS), 'custom']);

  if (requestedPreset && availablePresets.has(requestedPreset)) {
    elements.presetSelect.value = requestedPreset;
  }
}

applyPresetFromUrl();
applyPreset();
