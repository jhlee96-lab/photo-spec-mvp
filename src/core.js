export const OFFICIAL_CHECKED_DATE = '2026-07-25';

export const PRESETS = Object.freeze({
  nationalCivilService: Object.freeze({
    id: 'nationalCivilService',
    label: '국가공무원 응시사진',
    width: 137,
    height: 177,
    maxKb: 350,
    acceptedFormats: ['image/jpeg', 'image/png'],
    defaultOutputFormat: 'image/jpeg',
    sourceUrl: 'https://gongmuwon.gosi.kr/oprut/AppApAplfSbmsnAplfRcptGd.do',
    checkedDate: OFFICIAL_CHECKED_DATE,
    exceptionNote: '파일용량 기준은 중증장애인 선발시험을 제외한 일반 안내입니다.'
  })
});

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function normalizeSpec(input) {
  const width = Math.round(Number(input.width));
  const height = Math.round(Number(input.height));
  const maxKb = Math.round(Number(input.maxKb));
  const format = input.format === 'image/png' ? 'image/png' : 'image/jpeg';

  const errors = [];
  if (!Number.isFinite(width) || width < 16 || width > 8000) {
    errors.push('가로 크기는 16~8000px 사이여야 합니다.');
  }
  if (!Number.isFinite(height) || height < 16 || height > 8000) {
    errors.push('세로 크기는 16~8000px 사이여야 합니다.');
  }
  if (!Number.isFinite(maxKb) || maxKb < 5 || maxKb > 20000) {
    errors.push('최대 용량은 5~20000KB 사이여야 합니다.');
  }
  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0 && width * height > 25_000_000) {
    errors.push('출력 이미지 전체 픽셀 수는 2,500만 이하로 설정해 주세요.');
  }

  return {
    spec: { width, height, maxKb, format },
    errors
  };
}

export function fitPreviewSize(targetWidth, targetHeight, maxWidth = 520, maxHeight = 620) {
  const ratio = targetWidth / targetHeight;
  let width = maxWidth;
  let height = width / ratio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }

  return {
    width: Math.max(180, Math.round(width)),
    height: Math.max(180, Math.round(height))
  };
}

export function computeCoverState({
  sourceWidth,
  sourceHeight,
  viewWidth,
  viewHeight,
  zoom = 1,
  centerX = sourceWidth / 2,
  centerY = sourceHeight / 2
}) {
  if ([sourceWidth, sourceHeight, viewWidth, viewHeight].some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new Error('이미지와 미리보기 크기는 0보다 커야 합니다.');
  }

  const safeZoom = clamp(Number(zoom) || 1, 1, 4);
  const baseScale = Math.max(viewWidth / sourceWidth, viewHeight / sourceHeight);
  const scale = baseScale * safeZoom;
  const cropWidth = viewWidth / scale;
  const cropHeight = viewHeight / scale;

  const minCenterX = cropWidth / 2;
  const maxCenterX = sourceWidth - cropWidth / 2;
  const minCenterY = cropHeight / 2;
  const maxCenterY = sourceHeight - cropHeight / 2;

  const normalizedCenterX = minCenterX > maxCenterX
    ? sourceWidth / 2
    : clamp(centerX, minCenterX, maxCenterX);
  const normalizedCenterY = minCenterY > maxCenterY
    ? sourceHeight / 2
    : clamp(centerY, minCenterY, maxCenterY);

  const drawX = viewWidth / 2 - normalizedCenterX * scale;
  const drawY = viewHeight / 2 - normalizedCenterY * scale;

  return {
    zoom: safeZoom,
    scale,
    centerX: normalizedCenterX,
    centerY: normalizedCenterY,
    cropX: normalizedCenterX - cropWidth / 2,
    cropY: normalizedCenterY - cropHeight / 2,
    cropWidth,
    cropHeight,
    drawX,
    drawY,
    drawWidth: sourceWidth * scale,
    drawHeight: sourceHeight * scale
  };
}

export function validateResult({ width, height, sizeBytes, mimeType, spec }) {
  const acceptedMimeTypes = ['image/jpeg', 'image/png'];
  const checks = [
    {
      id: 'dimensions',
      label: `${spec.width} × ${spec.height}px`,
      pass: width === spec.width && height === spec.height
    },
    {
      id: 'size',
      label: `${spec.maxKb}KB 미만`,
      pass: sizeBytes < spec.maxKb * 1024
    },
    {
      id: 'format',
      label: 'JPG 또는 PNG',
      pass: acceptedMimeTypes.includes(mimeType)
    }
  ];

  return {
    checks,
    pass: checks.every((check) => check.pass)
  };
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '-';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

export function buildFilename({ presetId, width, height, mimeType }) {
  const extension = mimeType === 'image/png' ? 'png' : 'jpg';
  const prefix = presetId === 'nationalCivilService' ? 'national-civil-service' : 'photo';
  return `${prefix}-${width}x${height}.${extension}`;
}
