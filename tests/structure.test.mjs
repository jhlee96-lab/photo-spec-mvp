import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const htmlFiles = [
  'index.html',
  'privacy.html',
  'national-civil-service-photo.html',
  'korean-history-photo.html',
  'qnet-photo.html',
  'contact.html',
  'changelog.html',
  '404.html'
];

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('런타임 코드는 서비스 워커·쿠키·영구 브라우저 저장소를 사용하지 않는다', async () => {
  const runtimeFiles = ['index.html', 'app.js', 'src/core.js'];
  const texts = await Promise.all(runtimeFiles.map(read));
  const combined = texts.join('\n').toLowerCase();

  assert.equal(combined.includes('navigator.serviceworker'), false);
  assert.equal(combined.includes('service-worker.js'), false);
  assert.equal(combined.includes('localstorage'), false);
  assert.equal(combined.includes('sessionstorage'), false);
  assert.equal(combined.includes('indexeddb'), false);
  assert.equal(combined.includes('document.cookie'), false);
});

test('모든 HTML은 빌드 버전·사이트 URL·선택적 AdSense 인증 토큰을 사용한다', async () => {
  const pages = await Promise.all(htmlFiles.map(read));

  for (const [index, page] of pages.entries()) {
    assert.match(page, /styles\.css\?v=__BUILD_VERSION__/, htmlFiles[index]);
    assert.match(page, /__SITE_URL__\//, htmlFiles[index]);
    assert.match(page, /__ADSENSE_META__/, htmlFiles[index]);
    assert.doesNotMatch(page, /ca-pub-\d{16}/, `${htmlFiles[index]}에 가짜 게시자 ID를 넣으면 안 됩니다.`);
  }

  const index = pages[0];
  assert.match(index, /app\.js\?v=__BUILD_VERSION__/);
  const app = await read('app.js');
  assert.match(app, /core\.js\?v=__BUILD_VERSION__/);
});

test('GitHub Actions는 공통 정적 빌드 스크립트와 배포 변수를 사용한다', async () => {
  const workflow = await read('.github/workflows/pages.yml');
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /SITE_URL:\s*\$\{\{ vars\.SITE_URL \}\}/);
  assert.match(workflow, /ADSENSE_PUBLISHER_ID:\s*\$\{\{ vars\.ADSENSE_PUBLISHER_ID \}\}/);
  assert.match(workflow, /BUILD_VERSION:\s*\$\{\{ github\.sha \}\}/);
  assert.match(workflow, /path:\s*_site/);
  assert.doesNotMatch(workflow, /sed -i|GITHUB_SHA::12/);
});

test('v1.5 홈은 시험별 안내·문의·변경 기록으로 연결된다', async () => {
  const index = await read('index.html');
  assert.match(index, /공식 출처 기반 원서사진 · v1\.5/);
  assert.match(index, /national-civil-service-photo\.html/);
  assert.match(index, /korean-history-photo\.html/);
  assert.match(index, /qnet-photo\.html/);
  assert.match(index, /contact\.html/);
  assert.match(index, /changelog\.html/);
  assert.match(index, /class="operations-strip"/);
});

test('시험별 안내 페이지는 공식 규격·출처·해당 프리셋 CTA를 제공한다', async () => {
  const [national, history, qnet] = await Promise.all([
    read('national-civil-service-photo.html'),
    read('korean-history-photo.html'),
    read('qnet-photo.html')
  ]);

  assert.match(national, /137 × 177px/);
  assert.match(national, /350KB 미만/);
  assert.match(national, /gongmuwon\.gosi\.kr/);
  assert.match(national, /\?preset=nationalCivilService#photo-tool/);

  assert.match(history, /120 × 160px/);
  assert.match(history, /JPG 또는 GIF/);
  assert.match(history, /www\.historyexam\.go\.kr\/pageLink\.do\?link=rceptInfo/);
  assert.doesNotMatch(history, /m\.historyexam\.go\.kr/);
  assert.match(history, /\?preset=koreanHistory#photo-tool/);

  assert.match(qnet, /300 × 400px 이상/);
  assert.match(qnet, /JPEG 또는 JPG/);
  assert.match(qnet, /q-net\.or\.kr/);
  assert.match(qnet, /\?preset=qnet#photo-tool/);
});

test('문의 페이지와 GitHub Issue 양식은 공개 개인정보 주의를 포함한다', async () => {
  const [contact, specTemplate, featureTemplate] = await Promise.all([
    read('contact.html'),
    read('.github/ISSUE_TEMPLATE/spec-report.yml'),
    read('.github/ISSUE_TEMPLATE/feature-request.yml')
  ]);

  assert.match(contact, /issues\/new\?template=spec-report\.yml/);
  assert.match(contact, /issues\/new\?template=feature-request\.yml/);
  assert.match(contact, /개인정보/);
  assert.match(specTemplate, /기관 공식 출처 URL/);
  assert.match(specTemplate, /사진 원본이나 개인정보/);
  assert.match(featureTemplate, /새 시험 프리셋/);
});

test('변경 기록은 v1.5와 공식 출처 확인 기록을 제공한다', async () => {
  const changelog = await read('changelog.html');
  assert.match(changelog, />v1\.5</);
  assert.match(changelog, /AdSense 사이트 인증 메타태그/);
  assert.match(changelog, /공식 규격 확인 기록/);
  assert.match(changelog, /2026-07-26/);
});

test('검색엔진 기본 파일은 실제 SITE_URL 토큰과 모든 공개 페이지를 포함한다', async () => {
  const [robots, sitemap] = await Promise.all([read('robots.txt'), read('sitemap.xml')]);
  assert.match(robots, /Sitemap: __SITE_URL__\/sitemap\.xml/);
  for (const page of [
    'national-civil-service-photo.html',
    'korean-history-photo.html',
    'qnet-photo.html',
    'changelog.html',
    'contact.html',
    'privacy.html'
  ]) {
    assert.match(sitemap, new RegExp(page.replace('.', '\\.')));
  }
});

test('AdSense 빌드 스크립트는 ID 검증·메타태그·ads.txt를 선택적으로 생성한다', async () => {
  const script = await read('scripts/build-site.mjs');
  assert.match(script, /\^ca-pub-\\d\{16\}\$/);
  assert.match(script, /google-adsense-account/);
  assert.match(script, /google\.com, \$\{adsTxtPublisherId\}, DIRECT, f08c47fec0942fa0/);
  assert.match(script, /ADSENSE_PUBLISHER_ID/);
  assert.match(script, /SITE_URL/);
});

test('안내 페이지 링크는 URL 프리셋 선택 로직과 연결된다', async () => {
  const app = await read('app.js');
  assert.match(app, /function applyPresetFromUrl/);
  assert.match(app, /new URLSearchParams\(window\.location\.search\)/);
  assert.match(app, /availablePresets\.has\(requestedPreset\)/);
  assert.match(app, /elements\.presetSelect\.value = requestedPreset/);
});

test('v1.4 원본 해상도 경고와 얼굴 구도 가이드를 그대로 유지한다', async () => {
  const [index, app, core, css] = await Promise.all([
    read('index.html'),
    read('app.js'),
    read('src/core.js'),
    read('styles.css')
  ]);

  assert.match(index, /id="guideToggle"/);
  assert.match(index, /id="qualityNotice"/);
  assert.match(index, /id="resultSourceQuality"/);
  assert.match(app, /drawPortraitGuide/);
  assert.match(app, /assessCurrentSourceQuality/);
  assert.match(core, /export function assessSourceQuality/);
  assert.match(core, /export function getPortraitGuideGeometry/);
  assert.match(css, /\.quality-notice\.warning/);
});

test('구도 보조선은 미리보기에만 적용되고 결과 생성에는 들어가지 않는다', async () => {
  const app = await read('app.js');
  const renderPreviewBlock = app.slice(app.indexOf('function renderPreview'), app.indexOf('function pointerPosition'));
  const generateBlock = app.slice(app.indexOf('async function generateResult'), app.indexOf('function renderManualChecks'));
  assert.match(renderPreviewBlock, /drawPortraitGuide/);
  assert.doesNotMatch(generateBlock, /drawPortraitGuide|getPortraitGuideGeometry/);
});

test('Cloudflare·Netlify 배포용 정적 설정을 포함한다', async () => {
  const [headers, netlify, packageJson] = await Promise.all([
    read('_headers'),
    read('netlify.toml'),
    read('package.json')
  ]);
  assert.match(headers, /X-Content-Type-Options: nosniff/);
  assert.match(headers, /Permissions-Policy:/);
  assert.match(netlify, /command = "npm run build"/);
  assert.match(netlify, /publish = "_site"/);
  assert.match(packageJson, /"build": "node scripts\/build-site\.mjs"/);
});
