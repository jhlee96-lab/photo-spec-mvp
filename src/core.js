export const OFFICIAL_CHECKED_DATE = '2026-07-26';

export const MIME_LABELS = Object.freeze({
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/gif': 'GIF'
});

export const RULE_TYPE_LABELS = Object.freeze({
  reference: '기준 크기',
  recommended: '권장 크기',
  minimum: '최소 크기',
  range: '허용 범위',
  custom: '사용자 지정'
});

export const PRESETS = Object.freeze({
  nationalCivilService: Object.freeze({
    id: 'nationalCivilService',
    label: '국가공무원 응시사진',
    shortLabel: '국가공무원',
    category: '공무원',
    width: 137,
    height: 177,
    physicalSize: '3.5 × 4.5cm',
    ruleType: 'reference',
    maxKb: 350,
    maxKbInclusive: false,
    acceptedFormats: Object.freeze(['image/jpeg', 'image/png']),
    outputFormats: Object.freeze(['image/jpeg', 'image/png']),
    defaultOutputFormat: 'image/jpeg',
    sourceUrl: 'https://gongmuwon.gosi.kr/oprut/AppApAplfSbmsnAplfRcptGd.do',
    sourceLabel: '국가공무원 채용시스템 원서접수 안내',
    checkedDate: OFFICIAL_CHECKED_DATE,
    filenamePrefix: 'national-civil-service',
    exceptionNote: '파일용량 기준은 중증장애인 선발시험을 제외한 일반 안내입니다.',
    manualChecks: Object.freeze([
      '본인 식별이 가능한 선명한 사진인지 확인',
      '몸과 얼굴이 정면을 향하고 있는지 확인',
      '눈동자가 안경테나 반사광에 가려지지 않는지 확인',
      '과도한 보정이나 저화질 사진이 아닌지 확인'
    ])
  }),
  koreanHistory: Object.freeze({
    id: 'koreanHistory',
    label: '한국사능력검정시험',
    shortLabel: '한국사능력검정시험',
    category: '자격·인증시험',
    width: 120,
    height: 160,
    physicalSize: '약 3 × 4cm',
    ruleType: 'recommended',
    maxKb: null,
    maxKbInclusive: false,
    acceptedFormats: Object.freeze(['image/jpeg', 'image/gif']),
    outputFormats: Object.freeze(['image/jpeg']),
    defaultOutputFormat: 'image/jpeg',
    sourceUrl: 'https://m.historyexam.go.kr/pageLink.do?link=rceptInfo',
    sourceLabel: '한국사능력검정시험 공식 응시안내',
    checkedDate: OFFICIAL_CHECKED_DATE,
    filenamePrefix: 'korean-history',
    exceptionNote: '공식 허용 형식은 JPG·GIF이며, 이 도구는 그중 JPG로 출력합니다. 공식 응시안내에는 공통 최대 용량이 별도로 명시되어 있지 않습니다.',
    manualChecks: Object.freeze([
      '최근 6개월 이내 촬영한 탈모 상반신 사진인지 확인',
      '본인 식별이 분명한 표준 증명사진인지 확인',
      '모자 착용·얼굴 가림·전신·단체 사진이 아닌지 확인',
      '사진이 눕거나 잘리지 않았고 가로·세로 비율이 자연스러운지 확인'
    ])
  })
});

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function formatMimeList(mimeTypes) {
  const labels = [...new Set(mimeTypes ?? [])]
    .map((mimeType) => MIME_LABELS[mimeType])
    .filter(Boolean);

  if (labels.length === 0) return '-';
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(', ')} 또는 ${labels.at(-1)}`;
}

export function describeSizeLimit({ maxKb, maxKbInclusive = false }) {
  if (maxKb === null || maxKb === undefined) {
    return '공식 공통 제한 안내 없음';
  }
  return `${maxKb}KB ${maxKbInclusive ? '이하' : '미만'}`;
}

export function normalizeSpec(input) {
  const width = Math.round(Number(input.width));
  const height = Math.round(Number(input.height));
  const maxWasProvided = input.maxKb !== null && input.maxKb !== undefined && input.maxKb !== '';
  const maxKb = maxWasProvided ? Math.round(Number(input.maxKb)) : null;
  const requireMaxKb = input.requireMaxKb !== false;
  const outputFormats = Array.isArray(input.outputFormats) && input.outputFormats.length > 0
    ? input.outputFormats.filter((mimeType) => ['image/jpeg', 'image/png'].includes(mimeType))
    : ['image/jpeg', 'image/png'];
  const safeOutputFormats = outputFormats.length > 0 ? outputFormats : ['image/jpeg'];
  const format = safeOutputFormats.includes(input.format) ? input.format : safeOutputFormats[0];
  const acceptedFormats = Array.isArray(input.acceptedFormats) && input.acceptedFormats.length > 0
    ? [...input.acceptedFormats]
    : [...safeOutputFormats];

  const errors = [];
  if (!Number.isFinite(width) || width < 16 || width > 8000) {
    errors.push('가로 크기는 16~8000px 사이여야 합니다.');
  }
  if (!Number.isFinite(height) || height < 16 || height > 8000) {
    errors.push('세로 크기는 16~8000px 사이여야 합니다.');
  }
  if (!maxWasProvided && requireMaxKb) {
    errors.push('최대 용량을 입력해 주세요.');
  } else if (maxKb !== null && (!Number.isFinite(maxKb) || maxKb < 5 || maxKb > 20000)) {
    errors.push('최대 용량은 5~20000KB 사이여야 합니다.');
  }
  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0 && width * height > 25_000_000) {
    errors.push('출력 이미지 전체 픽셀 수는 2,500만 이하로 설정해 주세요.');
  }

  return {
    spec: {
      width,
      height,
      maxKb,
      maxKbInclusive: Boolean(input.maxKbInclusive),
      format,
      acceptedFormats,
      outputFormats: safeOutputFormats,
      ruleType: input.ruleType ?? 'custom',
      presetId: input.presetId ?? 'custom'
    },
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
  const dimensionCheck = {
    id: 'dimensions',
    label: `${spec.width} × ${spec.height}px`,
    pass: width === spec.width && height === spec.height,
    informational: false
  };

  const sizeCheck = spec.maxKb === null
    ? {
        id: 'size',
        label: '공식 공통 용량 제한이 안내되지 않음',
        pass: true,
        informational: true
      }
    : {
        id: 'size',
        label: describeSizeLimit(spec),
        pass: spec.maxKbInclusive
          ? sizeBytes <= spec.maxKb * 1024
          : sizeBytes < spec.maxKb * 1024,
        informational: false
      };

  const formatCheck = {
    id: 'format',
    label: `공식 허용 형식: ${formatMimeList(spec.acceptedFormats)}`,
    pass: spec.acceptedFormats.includes(mimeType),
    informational: false
  };

  const checks = [dimensionCheck, sizeCheck, formatCheck];
  return {
    checks,
    pass: checks.filter((check) => !check.informational).every((check) => check.pass)
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
  const prefix = PRESETS[presetId]?.filenamePrefix ?? 'photo';
  return `${prefix}-${width}x${height}.${extension}`;
}
