import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const projectFiles = [
  'index.html',
  'privacy.html',
  'app.js',
  'styles.css',
  '.github/workflows/pages.yml'
];

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('서비스 워커·쿠키·영구 브라우저 저장소를 사용하지 않는다', async () => {
  const texts = await Promise.all(projectFiles.map(read));
  const combined = texts.join('\n').toLowerCase();

  assert.equal(combined.includes('navigator.serviceworker'), false);
  assert.equal(combined.includes('service-worker.js'), false);
  assert.equal(combined.includes('localstorage'), false);
  assert.equal(combined.includes('sessionstorage'), false);
  assert.equal(combined.includes('indexeddb'), false);
  assert.equal(combined.includes('document.cookie'), false);
});

test('배포 시 커밋 SHA로 CSS와 JavaScript 캐시를 구분한다', async () => {
  const [index, privacy, app, workflow] = await Promise.all([
    read('index.html'),
    read('privacy.html'),
    read('app.js'),
    read('.github/workflows/pages.yml')
  ]);

  assert.match(index, /styles\.css\?v=__BUILD_VERSION__/);
  assert.match(index, /app\.js\?v=__BUILD_VERSION__/);
  assert.match(privacy, /styles\.css\?v=__BUILD_VERSION__/);
  assert.match(app, /core\.js\?v=__BUILD_VERSION__/);
  assert.match(workflow, /GITHUB_SHA::12/);
  assert.match(workflow, /sed -i/);
});

test('영웅 영역에서 중복 프리셋 요약을 제거하고 중앙 정렬한다', async () => {
  const [index, css, app] = await Promise.all([
    read('index.html'),
    read('styles.css'),
    read('app.js')
  ]);

  assert.doesNotMatch(index, /class="hero-spec"/);
  assert.doesNotMatch(index, /id="heroPresetName"/);
  assert.doesNotMatch(app, /heroPresetName|heroRuleBadge|heroDimensions|heroSize|heroFormat/);
  assert.match(css, /\.hero\s*\{[^}]*text-align:\s*center/s);
  assert.match(css, /\.hero-main\s*\{[^}]*margin:\s*0 auto/s);
  assert.match(css, /\.hero-actions\s*\{[^}]*justify-content:\s*center/s);
});

test('한국어 영웅 문구를 의도된 두 줄로 유지하고 단어 중간 줄바꿈을 막는다', async () => {
  const [index, css] = await Promise.all([read('index.html'), read('styles.css')]);

  assert.match(index, /<span>사진을 올리고, 맞추고,<\/span><span>바로 내려받으세요\.<\/span>/);
  assert.match(css, /\.hero h1 span\s*\{[^}]*display:\s*block/s);
  assert.match(css, /\.hero-copy\s*\{[^}]*word-break:\s*keep-all/s);
});

test('v1.3에는 Q-Net 국가자격 프리셋과 공식 출처가 표시된다', async () => {
  const [index, core] = await Promise.all([read('index.html'), read('src/core.js')]);

  assert.match(index, /option value="qnet">Q-Net 국가자격/);
  assert.match(index, /q-net\.or\.kr\/cst002\.do/);
  assert.match(index, /300 × 400px 이상/);
  assert.match(core, /qnet:\s*Object\.freeze/);
  assert.match(core, /width:\s*300/);
  assert.match(core, /height:\s*400/);
  assert.match(core, /ruleType:\s*'minimum'/);
  assert.match(core, /dimensionMode:\s*'minimum'/);
  assert.match(core, /acceptedFormatLabel:\s*'JPEG 또는 JPG'/);
});

test('한국사능력검정시험 프리셋과 공식 출처를 유지한다', async () => {
  const [index, core] = await Promise.all([read('index.html'), read('src/core.js')]);

  assert.match(index, /option value="koreanHistory">한국사능력검정시험<\/option>/);
  assert.match(index, /www\.historyexam\.go\.kr\/pageLink\.do\?link=rceptInfo/);
  assert.match(core, /width:\s*120/);
  assert.match(core, /height:\s*160/);
  assert.match(core, /acceptedFormats:\s*Object\.freeze\(\['image\/jpeg', 'image\/gif'\]\)/);
});

test('자동 검사와 직접 확인 영역을 별도로 제공한다', async () => {
  const [index, app] = await Promise.all([read('index.html'), read('app.js')]);

  assert.match(index, /id="resultChecks"/);
  assert.match(index, /id="manualChecks"/);
  assert.match(index, />자동 검사</);
  assert.match(index, />직접 확인</);
  assert.match(app, /renderManualChecks/);
});

test('공식 형식과 도구 출력 형식을 별도 항목으로 표시한다', async () => {
  const index = await read('index.html');
  assert.match(index, /id="officialFormats"/);
  assert.match(index, /id="officialOutput"/);
  assert.match(index, />공식 형식</);
  assert.match(index, />도구 출력</);
});


test('한국사 공식 안내는 PC 웹 링크를 사용하고 모바일 전용 링크를 남기지 않는다', async () => {
  const index = await read('index.html');
  const core = await read('src/core.js');
  const readme = await read('README.md');
  const all = `${index}
${core}
${readme}`;
  assert.match(all, /https:\/\/www\.historyexam\.go\.kr\/pageLink\.do\?link=rceptInfo/);
  assert.doesNotMatch(all, /https:\/\/m\.historyexam\.go\.kr\/pageLink\.do\?link=rceptInfo/);
});


test('v1.4는 원본 해상도 경고와 얼굴 구도 가이드를 제공한다', async () => {
  const [index, app, core, css] = await Promise.all([
    read('index.html'),
    read('app.js'),
    read('src/core.js'),
    read('styles.css')
  ]);

  assert.match(index, /공식 출처 기반 원서사진 · v1\.4/);
  assert.match(index, /id="guideToggle"/);
  assert.match(index, /id="qualityNotice"/);
  assert.match(index, /id="resultSourceQuality"/);
  assert.match(index, /결과 파일에는 포함되지 않습니다/);
  assert.match(app, /drawPortraitGuide/);
  assert.match(app, /assessCurrentSourceQuality/);
  assert.match(app, /getPortraitGuideGeometry/);
  assert.match(core, /export function assessSourceQuality/);
  assert.match(core, /export function getPortraitGuideGeometry/);
  assert.match(css, /\.quality-notice\.warning/);
  assert.match(css, /\.editor-assist-bar/);
});

test('구도 보조선은 결과 이미지 생성 코드가 아니라 미리보기 렌더링에만 적용된다', async () => {
  const app = await read('app.js');
  const renderPreviewBlock = app.slice(app.indexOf('function renderPreview'), app.indexOf('function pointerPosition'));
  const generateBlock = app.slice(app.indexOf('async function generateResult'), app.indexOf('function renderManualChecks'));
  assert.match(renderPreviewBlock, /drawPortraitGuide/);
  assert.doesNotMatch(generateBlock, /drawPortraitGuide|getPortraitGuideGeometry/);
});
