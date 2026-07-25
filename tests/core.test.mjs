import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRESETS,
  buildFilename,
  computeCoverState,
  fitPreviewSize,
  formatBytes,
  normalizeSpec,
  validateResult
} from '../src/core.js';

test('국가공무원 프리셋은 공식 기술 규격을 가진다', () => {
  const preset = PRESETS.nationalCivilService;
  assert.equal(preset.width, 137);
  assert.equal(preset.height, 177);
  assert.equal(preset.maxKb, 350);
  assert.deepEqual(preset.acceptedFormats, ['image/jpeg', 'image/png']);
});

test('사용자 지정 규격을 정상화한다', () => {
  const result = normalizeSpec({ width: '300', height: '400', maxKb: '500', format: 'image/png' });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.spec, { width: 300, height: 400, maxKb: 500, format: 'image/png' });
});

test('비정상 사용자 지정 규격을 거부한다', () => {
  const result = normalizeSpec({ width: 0, height: 9000, maxKb: 1, format: 'image/jpeg' });
  assert.equal(result.errors.length, 3);
});



test('지나치게 큰 사용자 지정 출력은 거부한다', () => {
  const result = normalizeSpec({ width: 8000, height: 8000, maxKb: 5000, format: 'image/jpeg' });
  assert.ok(result.errors.some((message) => message.includes('2,500만')));
});

test('세로 프리셋 미리보기는 최대 영역 안에 맞는다', () => {
  const preview = fitPreviewSize(137, 177, 520, 620);
  assert.ok(preview.width <= 520);
  assert.ok(preview.height <= 620);
  assert.ok(Math.abs(preview.width / preview.height - 137 / 177) < 0.01);
});

test('cover crop은 미리보기 전체를 덮는다', () => {
  const cover = computeCoverState({
    sourceWidth: 1200,
    sourceHeight: 800,
    viewWidth: 274,
    viewHeight: 354,
    zoom: 1
  });
  assert.ok(cover.drawWidth >= 274);
  assert.ok(cover.drawHeight >= 354);
  assert.ok(cover.cropX >= 0);
  assert.ok(cover.cropY >= 0);
  assert.ok(cover.cropX + cover.cropWidth <= 1200 + 1e-8);
  assert.ok(cover.cropY + cover.cropHeight <= 800 + 1e-8);
});

test('중심 좌표는 이미지 밖으로 나가지 않게 제한된다', () => {
  const cover = computeCoverState({
    sourceWidth: 1000,
    sourceHeight: 1000,
    viewWidth: 400,
    viewHeight: 500,
    zoom: 1,
    centerX: -999,
    centerY: 9999
  });
  assert.ok(cover.cropX >= 0);
  assert.ok(cover.cropY >= 0);
  assert.ok(cover.cropX + cover.cropWidth <= 1000 + 1e-8);
  assert.ok(cover.cropY + cover.cropHeight <= 1000 + 1e-8);
});

test('결과 검사는 350KB 미만을 엄격하게 판정한다', () => {
  const spec = { width: 137, height: 177, maxKb: 350 };
  const pass = validateResult({ width: 137, height: 177, sizeBytes: 350 * 1024 - 1, mimeType: 'image/jpeg', spec });
  const fail = validateResult({ width: 137, height: 177, sizeBytes: 350 * 1024, mimeType: 'image/jpeg', spec });
  assert.equal(pass.pass, true);
  assert.equal(fail.pass, false);
});

test('파일명은 프리셋과 형식을 반영한다', () => {
  assert.equal(buildFilename({ presetId: 'nationalCivilService', width: 137, height: 177, mimeType: 'image/jpeg' }), 'national-civil-service-137x177.jpg');
  assert.equal(buildFilename({ presetId: 'custom', width: 300, height: 400, mimeType: 'image/png' }), 'photo-300x400.png');
});

test('바이트를 사람이 읽는 문자열로 변환한다', () => {
  assert.equal(formatBytes(500), '500B');
  assert.equal(formatBytes(2048), '2.0KB');
});
