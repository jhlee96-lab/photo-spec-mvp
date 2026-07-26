# AdSense 사이트 인증 준비

v1.5는 실제 광고를 표시하지 않고, AdSense 사이트 소유권 확인에 사용할 수 있는 인증 메타태그와 `ads.txt`를 배포 시 생성합니다.

## 1. AdSense에서 게시자 ID 확인

게시자 ID는 다음 형태입니다.

```text
ca-pub-0000000000000000
```

숫자는 정확히 16자리여야 합니다. 다른 임의의 값을 넣지 마세요.

## 2. GitHub Actions 변수 설정

```text
GitHub 저장소
→ Settings
→ Secrets and variables
→ Actions
→ Variables
→ New repository variable
```

두 변수를 추가합니다.

```text
ADSENSE_PUBLISHER_ID=ca-pub-실제숫자16자리
SITE_URL=https://심사받을-사이트-주소
```

Publishable한 게시자 ID이므로 빌드용 Repository Variable로 관리해도 됩니다. 서비스 계정 비밀키나 다른 인증 정보는 넣지 않습니다.

## 3. 다시 배포

변수를 추가한 뒤 Actions에서 워크플로를 수동 실행하거나 새 커밋을 만듭니다.

빌드가 성공하면 각 HTML의 `<head>`에 다음 태그가 들어갑니다.

```html
<meta name="google-adsense-account" content="ca-pub-실제숫자16자리">
```

사이트 루트에는 다음 형식의 `ads.txt`가 만들어집니다.

```text
google.com, pub-실제숫자16자리, DIRECT, f08c47fec0942fa0
```

## 4. 직접 확인

브라우저에서 페이지 소스를 열어 `google-adsense-account`를 검색합니다. 또한 다음 주소가 열리는지 확인합니다.

```text
https://사이트주소/ads.txt
```

## 중요한 제한

- 메타태그는 사이트 인증 준비용이며 광고를 표시하지 않습니다.
- 실제 광고를 넣으려면 AdSense 심사 후 광고 코드와 개인정보·쿠키 안내를 별도로 추가해야 합니다.
- 현재 CSP는 외부 광고 스크립트를 차단합니다. 승인 후 실제 광고를 추가하는 버전에서 CSP를 함께 수정해야 합니다.
- `SITE_URL`은 심사받을 최종 사이트 주소와 같아야 canonical URL과 sitemap이 올바르게 생성됩니다.
