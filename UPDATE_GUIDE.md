# 기존 GitHub 저장소 업데이트 방법

## 1. 먼저 업데이트 ZIP을 풉니다

ZIP 파일 자체를 GitHub에 올리지 말고, 압축을 푼 내부 파일과 폴더를 저장소 최상위에 업로드합니다.

## 2. 반드시 교체할 파일

```text
.github/workflows/pages.yml
index.html
privacy.html
styles.css
app.js
icon.svg
package.json
package-lock.json
tests/structure.test.mjs
README.md
DESIGN_UPDATE.md
UPDATE_GUIDE.md
```

`.github`는 숨김 폴더라 Windows 또는 GitHub 웹 업로드 과정에서 빠질 수 있습니다. 업로드 후 저장소에서 아래 경로를 직접 열어 새 워크플로인지 확인하세요.

```text
.github/workflows/pages.yml
```

새 워크플로에는 다음 문구가 있어야 합니다.

```text
BUILD_VERSION="${GITHUB_SHA::12}"
```

## 3. Actions 확인

```text
Actions
→ Test and deploy Pages
→ test 성공
→ deploy 성공
```

총 13개 테스트가 통과해야 합니다.

## 4. 실제 반영 버전 확인

배포가 완료된 뒤 사이트 하단의 다음 값을 확인합니다.

```text
build 12자리문자열
```

이 값은 최신 Git 커밋 SHA의 앞 12자리와 같아야 합니다. 다르다면 GitHub Pages가 아직 이전 HTML을 보여주는 중이므로 잠시 뒤 다시 열어봅니다.

이번 버전에는 서비스 워커가 없으므로 별도의 Unregister나 Cache Storage 삭제가 필요하지 않습니다. 새 HTML이 반영되면 CSS와 JavaScript는 새 버전 URL로 요청됩니다.
