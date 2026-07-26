# 사진맞춤 v1.5

공식 기관의 현재 안내를 근거로 국가공무원·한국사능력검정시험·Q-Net 원서사진을 브라우저 안에서 자르고, 크기를 조정하고, 기술 규격과 원본 해상도를 점검하는 정적 웹앱입니다.

## v1.5 핵심 변경

- 국가공무원 응시사진 상세 안내 페이지
- 한국사능력검정시험 사진 상세 안내 페이지
- Q-Net 국가자격 사진 상세 안내 페이지
- 문의 및 공식 규격 오류 신고 페이지
- 공개 변경 기록 페이지
- `robots.txt`, `sitemap.xml`, `404.html`
- GitHub Issue 양식 2종
- 배포 시 선택적으로 AdSense 사이트 인증 메타태그 삽입
- 게시자 ID를 설정하면 루트 `ads.txt` 자동 생성
- GitHub Pages·Cloudflare Pages·Netlify에서 공통으로 사용하는 `npm run build`
- 시험별 안내 페이지에서 해당 프리셋을 선택한 변환기로 바로 이동

## 지원 프리셋

### 국가공무원 응시사진

- 크기: `137 × 177px` (`3.5 × 4.5cm`) 기준
- 형식: JPG 또는 PNG
- 용량: `350KB 미만`(중증장애인 선발시험 제외 일반 안내)

### 한국사능력검정시험

- 권장 크기: `120 × 160px`(약 `3 × 4cm`)
- 공식 허용 형식: JPG 또는 GIF
- 앱 출력: JPG
- 공식 공통 최대 용량: 현재 응시안내에 별도 명시 없음

### Q-Net 국가자격

- 최소 크기: `300 × 400px 이상`
- 공식 허용 형식: JPEG 또는 JPG
- 앱 출력: `300 × 400px JPG`
- 공식 공통 최대 용량: 현재 공통 사진등록 안내에 별도 명시 없음

공식 정보 확인일은 `2026-07-26`입니다. 실제 제출 전 해당 종목·회차의 최신 공고를 다시 확인해야 합니다.

## 별도 안내 페이지

- `national-civil-service-photo.html`
- `korean-history-photo.html`
- `qnet-photo.html`
- `contact.html`
- `changelog.html`
- `privacy.html`

## 사진 데이터 처리

사진은 서버로 업로드하지 않습니다. 선택한 파일은 현재 브라우저 탭의 메모리와 Canvas에서만 처리됩니다. 새로고침하면 사진과 결과가 초기화됩니다.

현재 앱 코드에는 다음 기능이 없습니다.

- 쿠키 생성 또는 조회
- Local Storage / Session Storage / IndexedDB
- 서비스 워커 및 오프라인 캐시
- 회원가입·로그인·데이터베이스
- 외부 이미지 처리 API
- 실제 광고 스크립트

## 로컬 실행과 검사

```bash
npm ci
npm run check
npm test
npm run build
```

기본 빌드 결과는 `_site`에 만들어집니다.

```bash
python -m http.server 8000 -d _site
```

## 사이트 주소와 AdSense 인증 설정

배포 환경에서 다음 값을 선택적으로 설정합니다.

```text
SITE_URL=https://실제-사이트-주소
ADSENSE_PUBLISHER_ID=ca-pub-숫자16자리
BUILD_VERSION=Git-커밋-SHA
```

`ADSENSE_PUBLISHER_ID`를 설정하지 않으면 가짜 메타태그나 `ads.txt`를 만들지 않습니다. 설정하면 빌드 과정에서 다음을 생성합니다.

```html
<meta name="google-adsense-account" content="ca-pub-숫자16자리">
```

```text
google.com, pub-숫자16자리, DIRECT, f08c47fec0942fa0
```

이 기능은 사이트 소유권 인증 준비용입니다. 실제 광고 배너 코드는 아직 포함하지 않았습니다.

자세한 내용:

- [`ADSENSE_VERIFICATION_GUIDE.md`](./ADSENSE_VERIFICATION_GUIDE.md)
- [`HOSTING_GUIDE_V1.5.md`](./HOSTING_GUIDE_V1.5.md)
- [`UPDATE_GUIDE_V1.5.md`](./UPDATE_GUIDE_V1.5.md)

## GitHub Pages 배포

1. 저장소 최상위에 프로젝트 파일을 올립니다.
2. `.github/workflows/pages.yml`이 존재하는지 확인합니다.
3. `Settings → Pages → Source → GitHub Actions`를 선택합니다.
4. 필요하면 `Settings → Secrets and variables → Actions → Variables`에 `SITE_URL`과 `ADSENSE_PUBLISHER_ID`를 추가합니다.
5. `Actions → Test and deploy Pages`에서 `test`와 `deploy`가 모두 성공하는지 확인합니다.

## 일반 정적 호스팅

Cloudflare Pages 또는 Netlify에서도 다음 설정으로 배포할 수 있습니다.

```text
Build command: npm run build
Output directory: _site
Node.js: 22
```

Cloudflare Pages를 가장 우선 추천합니다. 자세한 비교는 `HOSTING_GUIDE_V1.5.md`를 참고하세요.

## 공식 정보

- 국가공무원 채용시스템: <https://gongmuwon.gosi.kr/oprut/AppApAplfSbmsnAplfRcptGd.do>
- 한국사능력검정시험 PC 공식 응시안내: <https://www.historyexam.go.kr/pageLink.do?link=rceptInfo>
- Q-Net 사진등록 공식 안내: <https://www.q-net.or.kr/cst002.do?artlSeq=1000033&gId=&gSite=Q&id=cst00202>

이 프로젝트는 인사혁신처, 국사편찬위원회 또는 한국산업인력공단의 공식 서비스가 아닙니다.
