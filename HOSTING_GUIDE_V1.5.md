# v1.5 정적 호스팅 선택 가이드

사진맞춤은 서버 함수와 데이터베이스가 없는 정적 웹앱이므로 GitHub 저장소는 그대로 유지하면서 배포 대상만 Cloudflare Pages 또는 Netlify로 바꿀 수 있습니다.

## 추천 순서

1. **Cloudflare Pages Free** — 광고 수익화를 염두에 둔 현재 프로젝트에 가장 권장
2. **Netlify Free** — 편리하지만 월별 크레딧 사용량을 확인해야 함
3. **Vercel** — Hobby는 개인·비상업 용도이므로 AdSense를 붙일 계획이라면 권장하지 않음

## Cloudflare Pages

현재 규모에서는 무료 플랜으로 시작할 수 있습니다.

```text
Build command: npm run build
Build output directory: _site
Node.js version: 22
```

환경 변수:

```text
SITE_URL=https://프로젝트명.pages.dev
ADSENSE_PUBLISHER_ID=ca-pub-실제숫자16자리  # 게시자 ID를 받은 뒤에만
```

사용자 지정 도메인을 연결한 뒤에는 `SITE_URL`을 새 도메인으로 바꾸고 다시 배포합니다.

## Netlify

```text
Build command: npm run build
Publish directory: _site
```

프로젝트에는 `netlify.toml`도 포함되어 있습니다. 무료 플랜은 월별 크레딧 한도가 있으므로 사용량이 커질 때 대시보드를 확인해야 합니다.

## Vercel

기술적으로 정적 사이트를 배포할 수 있지만, 무료 Hobby 플랜은 개인 또는 비상업 사용으로 제한됩니다. AdSense를 실제로 붙여 수익화할 계획이라면 유료 Pro 플랜 또는 다른 호스팅을 선택하는 편이 안전합니다.

## 도메인 비용과 호스팅 비용은 별개

- `*.pages.dev`, `*.netlify.app` 주소는 호스팅 업체가 제공하는 무료 주소입니다.
- 독립 도메인을 구매하면 보통 1년 단위 등록·갱신 비용이 발생합니다.
- 독립 도메인을 사더라도 정적 호스팅은 무료 플랜을 계속 사용할 수 있습니다.
- 도메인은 Cloudflare·Netlify에서 구매할 필요가 없고 원하는 등록업체에서 구입해 연결할 수 있습니다.

## Cloudflare Pages 연결 순서

1. Cloudflare 대시보드에서 Workers & Pages를 엽니다.
2. GitHub 계정을 연결하고 `photo-spec-mvp` 저장소를 선택합니다.
3. Build command를 `npm run build`, output을 `_site`로 설정합니다.
4. `SITE_URL` 환경 변수를 임시 `pages.dev` 주소로 설정합니다.
5. 배포 후 변환기와 안내 페이지를 확인합니다.
6. 독립 도메인을 구입한 경우 Custom domains에서 연결합니다.
7. `SITE_URL`을 독립 도메인으로 바꾸고 재배포합니다.
