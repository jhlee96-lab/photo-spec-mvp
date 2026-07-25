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

test('한국어 영웅 문구를 의도된 두 줄로 고정하고 단어 중간 줄바꿈을 막는다', async () => {
  const [index, css] = await Promise.all([read('index.html'), read('styles.css')]);

  assert.match(index, /<span>사진을 올리고, 맞추고,<\/span><span>바로 내려받으세요\.<\/span>/);
  assert.match(css, /\.hero h1 span\s*\{[^}]*display:\s*block/s);
  assert.match(css, /\.hero-copy\s*\{[^}]*word-break:\s*keep-all/s);
});
