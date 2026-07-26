# GitHub Pages 사용자 지정 도메인 연결 가이드

현재 기본 주소:

```text
https://jhlee96-lab.github.io/photo-spec-mvp/
```

도메인을 구입하고 GitHub Pages에 연결하면 다음처럼 바꿀 수 있습니다.

```text
https://www.example.com/
```

또는:

```text
https://example.com/
```

## 먼저 알아둘 점

- `github.io` 주소를 임의의 이름으로 바로 바꾸는 기능은 없습니다.
- 독립 주소를 사용하려면 본인이 소유한 도메인이 필요합니다.
- GitHub 저장소와 Actions 배포 방식은 그대로 유지할 수 있습니다.
- 현재 프로젝트는 상대 경로(`./styles.css`, `./app.js`)를 사용하므로 사용자 지정 도메인 루트에서도 동작합니다.
- GitHub Actions로 Pages를 배포하는 경우 저장소에 `CNAME` 파일을 따로 만들 필요가 없습니다. GitHub의 Pages 설정에 도메인을 등록하는 방식으로 관리합니다.

## 권장 방식: www 서브도메인

GitHub는 `www.example.com` 같은 서브도메인을 안정적인 방식으로 안내합니다.

### 1. 도메인 구입

도메인 등록 업체에서 원하는 도메인을 구입합니다.

예시:

```text
photo-example.com
photo-example.kr
```

### 2. GitHub Pages에 도메인 먼저 등록

GitHub 저장소에서:

```text
Settings
→ Pages
→ Custom domain
→ www.example.com 입력
→ Save
```

DNS를 먼저 바꾸기보다 GitHub Pages 설정에 도메인을 먼저 등록하는 편이 안전합니다.

### 3. 도메인 업체에서 CNAME 추가

DNS 관리 화면에 다음 레코드를 추가합니다.

```text
유형: CNAME
호스트/이름: www
값/대상: jhlee96-lab.github.io
```

주의:

```text
jhlee96-lab.github.io/photo-spec-mvp
```

처럼 저장소 경로까지 입력하면 안 됩니다. CNAME 대상은 계정의 `github.io` 주소까지만 입력합니다.

### 4. 루트 도메인도 함께 쓰고 싶을 때

`example.com`도 접속되게 하려면 도메인 업체에서 A 레코드를 추가할 수 있습니다.

```text
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

GitHub Pages에서 `www.example.com`을 사용자 지정 도메인으로 설정하고 루트 도메인 DNS도 올바르게 구성하면, GitHub가 루트와 www 주소 사이의 리디렉션을 처리할 수 있습니다.

### 5. DNS 반영 대기

DNS 변경은 즉시 보이지 않을 수 있으며 최대 24시간 정도 걸릴 수 있습니다.

### 6. HTTPS 활성화

GitHub에서 DNS 확인과 인증서 발급이 끝나면:

```text
Settings
→ Pages
→ Enforce HTTPS
```

를 활성화합니다. 인증서 발급에는 시간이 조금 걸릴 수 있습니다.

### 7. 도메인 검증 권장

GitHub 계정의 Pages 도메인 검증 기능을 이용하면 다른 GitHub 사용자가 해당 도메인을 자신의 Pages 사이트에 연결하는 위험을 줄일 수 있습니다. GitHub가 안내하는 TXT 레코드를 DNS에 추가해 검증합니다.

## 도메인을 사지 않고 주소만 짧게 만들 수 있나?

계정 이름과 동일한 저장소:

```text
jhlee96-lab.github.io
```

를 만들면 한 계정당 하나의 사용자 사이트를 다음 주소로 운영할 수 있습니다.

```text
https://jhlee96-lab.github.io/
```

하지만 이 방식은:

- 한 계정에 사용자 사이트가 하나뿐이고
- `photo-spec-mvp` 외 다른 프로젝트를 루트에서 운영하기 어렵고
- 서비스 이름이 주소에 드러나지 않으므로

현재 프로젝트에는 독립 도메인이 더 적합합니다.

## 연결 후 확인 목록

- 새 주소에서 첫 화면이 열리는가
- 사진 업로드와 미리보기가 동작하는가
- CSS와 JavaScript가 404 없이 로드되는가
- 개인정보 처리 안내 페이지가 열리는가
- 공식 외부 링크가 HTTPS로 열리는가
- GitHub Pages에서 `Enforce HTTPS`가 켜졌는가
- 기존 `github.io` 주소에서 새 도메인으로 이동되는가

## 공식 문서

- GitHub Pages 사용자 지정 도메인 관리: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- GitHub Pages HTTPS 설정: https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https
- 사용자 지정 도메인 검증: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages
