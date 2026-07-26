# v1.4 업데이트 적용 방법

## 기존 v1.3.1 저장소에 적용

1. `photo-spec-mvp-v1.4-update.zip`을 내려받습니다.
2. ZIP을 압축 해제합니다.
3. ZIP 자체가 아니라 내부 파일과 폴더를 기존 저장소 최상위에 업로드합니다.
4. 같은 이름의 기존 파일은 교체합니다.
5. 커밋 후 `Actions → Test and deploy Pages`를 확인합니다.
6. 테스트와 배포가 모두 초록색이면 실제 페이지를 새로 엽니다.

## 주요 변경 파일

```text
app.js
index.html
styles.css
privacy.html
src/core.js
tests/core.test.mjs
tests/structure.test.mjs
package.json
package-lock.json
README.md
DOMAIN_SETUP_GUIDE.md
V1.4_CHANGES.md
```

`.github/workflows/pages.yml`은 v1.3.1과 동일하며 이번 업데이트 ZIP에는 포함하지 않습니다.

## 확인할 기능

1. 사진을 올리면 원본 해상도 안내가 나타나는지
2. 확대 슬라이더를 크게 움직이면 화질 상태가 바뀌는지
3. `얼굴 구도 가이드` 체크박스로 선을 숨기고 보일 수 있는지
4. 내려받은 결과 파일에 보조선이 들어가지 않는지
5. 변환 결과의 자동 검사에 원본 선택 영역이 표시되는지
6. 페이지 하단 build 값이 최신 커밋 앞 12자리와 같은지
