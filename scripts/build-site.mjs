import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const outputDirectory = path.join(projectRoot, '_site');

const DEFAULT_SITE_URL = 'https://jhlee96-lab.github.io/photo-spec-mvp';
const HTML_FILE_PATTERN = /\.html$/i;
const TEXT_FILE_PATTERN = /\.(?:html|js|css|xml|txt)$/i;

function normalizeSiteUrl(value) {
  const candidate = String(value || DEFAULT_SITE_URL).trim().replace(/\/+$/, '');
  let parsed;

  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error(`SITE_URL이 올바른 URL이 아닙니다: ${candidate}`);
  }

  if (!['https:', 'http:'].includes(parsed.protocol)) {
    throw new Error('SITE_URL은 http 또는 https 주소여야 합니다.');
  }

  return candidate;
}

function normalizePublisherId(value) {
  const candidate = String(value || '').trim();
  if (!candidate) return null;

  if (!/^ca-pub-\d{16}$/.test(candidate)) {
    throw new Error('ADSENSE_PUBLISHER_ID는 ca-pub- 다음에 숫자 16개가 오는 형식이어야 합니다.');
  }

  return candidate;
}

function normalizeBuildVersion() {
  const candidate = String(
    process.env.BUILD_VERSION
      || process.env.GITHUB_SHA
      || process.env.CF_PAGES_COMMIT_SHA
      || process.env.COMMIT_REF
      || process.env.VERCEL_GIT_COMMIT_SHA
      || 'local-dev'
  ).trim();

  return candidate.slice(0, 12) || 'local-dev';
}

async function listTopLevelFiles() {
  const entries = await readdir(projectRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => HTML_FILE_PATTERN.test(name) || [
      'styles.css',
      'app.js',
      'icon.svg',
      '_headers',
      'robots.txt',
      'sitemap.xml'
    ].includes(name));
}

function buildAdSenseMeta(publisherId) {
  if (!publisherId) return '';
  return `<meta name="google-adsense-account" content="${publisherId}">`;
}

function replaceTokens(text, { buildVersion, siteUrl, adsenseMeta }) {
  return text
    .replaceAll('__BUILD_VERSION__', buildVersion)
    .replaceAll('__SITE_URL__', siteUrl)
    .replaceAll('__ADSENSE_META__', adsenseMeta);
}

async function writeProcessedFile(fileName, replacements) {
  const sourcePath = path.join(projectRoot, fileName);
  const destinationPath = path.join(outputDirectory, fileName);

  if (!TEXT_FILE_PATTERN.test(fileName)) {
    await cp(sourcePath, destinationPath);
    return;
  }

  const source = await readFile(sourcePath, 'utf8');
  const processed = replaceTokens(source, replacements);

  if (/__(?:BUILD_VERSION|SITE_URL|ADSENSE_META)__/.test(processed)) {
    throw new Error(`${fileName}에 치환되지 않은 배포 토큰이 남았습니다.`);
  }

  await writeFile(destinationPath, processed, 'utf8');
}

async function build() {
  const siteUrl = normalizeSiteUrl(
    process.env.SITE_URL
      || process.env.CF_PAGES_URL
      || process.env.URL
  );
  const publisherId = normalizePublisherId(process.env.ADSENSE_PUBLISHER_ID);
  const buildVersion = normalizeBuildVersion();
  const adsenseMeta = buildAdSenseMeta(publisherId);

  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(path.join(outputDirectory, 'src'), { recursive: true });

  const topLevelFiles = await listTopLevelFiles();
  await Promise.all(
    topLevelFiles.map((fileName) => writeProcessedFile(fileName, {
      buildVersion,
      siteUrl,
      adsenseMeta
    }))
  );

  await cp(path.join(projectRoot, 'src'), path.join(outputDirectory, 'src'), { recursive: true });

  const corePath = path.join(outputDirectory, 'src', 'core.js');
  const coreSource = await readFile(corePath, 'utf8');
  await writeFile(
    corePath,
    replaceTokens(coreSource, { buildVersion, siteUrl, adsenseMeta }),
    'utf8'
  );

  await writeFile(path.join(outputDirectory, '.nojekyll'), '', 'utf8');

  if (publisherId) {
    const adsTxtPublisherId = publisherId.replace(/^ca-/, '');
    await writeFile(
      path.join(outputDirectory, 'ads.txt'),
      `google.com, ${adsTxtPublisherId}, DIRECT, f08c47fec0942fa0\n`,
      'utf8'
    );
  }

  await writeFile(
    path.join(outputDirectory, 'build-info.json'),
    `${JSON.stringify({
      version: buildVersion,
      siteUrl,
      adsenseVerificationEnabled: Boolean(publisherId)
    }, null, 2)}\n`,
    'utf8'
  );

  console.log(`Built ${topLevelFiles.length} top-level files into _site`);
  console.log(`Site URL: ${siteUrl}`);
  console.log(`Build version: ${buildVersion}`);
  console.log(`AdSense verification: ${publisherId ? 'enabled' : 'not configured'}`);
}

await build();
