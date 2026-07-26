import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const projectRoot = new URL('../', import.meta.url);

async function build(environment = {}) {
  await execFileAsync(process.execPath, ['scripts/build-site.mjs'], {
    cwd: projectRoot,
    env: { ...process.env, ...environment }
  });
}

async function readBuilt(path) {
  return readFile(new URL(`../_site/${path}`, import.meta.url), 'utf8');
}

test('게시자 ID가 없으면 인증 태그와 ads.txt를 만들지 않는다', async () => {
  await build({
    SITE_URL: 'https://example.test/photo-tool',
    BUILD_VERSION: '1234567890abcdef',
    ADSENSE_PUBLISHER_ID: ''
  });

  const [index, guide, sitemap, buildInfo] = await Promise.all([
    readBuilt('index.html'),
    readBuilt('qnet-photo.html'),
    readBuilt('sitemap.xml'),
    readBuilt('build-info.json')
  ]);

  assert.doesNotMatch(index, /google-adsense-account/);
  assert.doesNotMatch(guide, /__ADSENSE_META__/);
  assert.match(index, /https:\/\/example\.test\/photo-tool\//);
  assert.match(index, /styles\.css\?v=1234567890ab/);
  assert.match(sitemap, /https:\/\/example\.test\/photo-tool\/qnet-photo\.html/);
  assert.match(buildInfo, /"adsenseVerificationEnabled": false/);

  await assert.rejects(access(new URL('../_site/ads.txt', import.meta.url), constants.F_OK));
});

test('유효한 게시자 ID를 설정하면 모든 HTML 인증 태그와 루트 ads.txt를 만든다', async () => {
  const publisherId = 'ca-pub-1234567890123456';
  await build({
    SITE_URL: 'https://photo.example.com',
    BUILD_VERSION: 'fedcba0987654321',
    ADSENSE_PUBLISHER_ID: publisherId
  });

  for (const page of ['index.html', 'privacy.html', 'national-civil-service-photo.html', 'korean-history-photo.html', 'qnet-photo.html', 'contact.html', 'changelog.html', '404.html']) {
    const html = await readBuilt(page);
    assert.match(html, new RegExp(`<meta name="google-adsense-account" content="${publisherId}">`), page);
    assert.doesNotMatch(html, /__(?:BUILD_VERSION|SITE_URL|ADSENSE_META)__/);
  }

  const [adsTxt, buildInfo] = await Promise.all([
    readBuilt('ads.txt'),
    readBuilt('build-info.json')
  ]);
  assert.equal(adsTxt, 'google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n');
  assert.match(buildInfo, /"adsenseVerificationEnabled": true/);
});


test('Cloudflare Pages 환경 주소를 SITE_URL 대체값으로 사용한다', async () => {
  await build({
    SITE_URL: '',
    CF_PAGES_URL: 'https://photo-spec.pages.dev',
    BUILD_VERSION: 'cloudflare123456',
    ADSENSE_PUBLISHER_ID: ''
  });

  const index = await readBuilt('index.html');
  assert.match(index, /<link rel="canonical" href="https:\/\/photo-spec\.pages\.dev\/">/);
});

test('잘못된 AdSense 게시자 ID는 빌드를 실패시킨다', async () => {
  await assert.rejects(
    build({ ADSENSE_PUBLISHER_ID: 'pub-wrong' }),
    /ADSENSE_PUBLISHER_ID/
  );
});
