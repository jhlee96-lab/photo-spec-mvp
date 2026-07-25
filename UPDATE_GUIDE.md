# 사진맞춤 v1.2 업데이트 적용 가이드

## 1. 업데이트 ZIP 압축 풀기

ZIP 파일 자체가 아니라 압축을 푼 안쪽 파일과 폴더를 기존 `photo-spec-mvp` 저장소에 올립니다.

## 2. 반드시 교체할 항목

```text
.github/workflows/pages.yml
src/core.js
tests/core.test.mjs
tests/structure.test.mjs
app.js
index.html
styles.css
privacy.html
package.json
package-lock.json
README.md
UPDATE_GUIDE.md
V1.2_CHANGES.md
```

`.github`는 숨김 폴더라 웹 업로드에서 빠지기 쉽습니다. 업로드 후 저장소에서 `.github/workflows/pages.yml`을 직접 열어 확인하세요.

## 3. 커밋 후 Actions 확인

```text
Actions
→ Test and deploy Pages
```

정상 결과:

```text
tests 23
pass 23
fail 0
```

`test`가 성공한 뒤 `deploy`도 초록색 체크가 되어야 실제 홈페이지가 바뀝니다.

## 4. 배포 후 확인

1. 프리셋 선택 메뉴에 `한국사능력검정시험`이 보이는지 확인합니다.
2. 한국사 프리셋을 선택하면 다음 내용이 표시되는지 확인합니다.
   - 120 × 160px
   - 공식 형식 JPG 또는 GIF
   - 도구 출력 JPG
   - 공식 공통 용량 제한 안내 없음
3. 사진을 변환한 뒤 자동 검사에 용량 항목이 `안내`로 표시되는지 확인합니다.
4. 결과 아래에 `직접 확인` 체크리스트가 보이는지 확인합니다.
5. 내려받은 파일명이 `korean-history-120x160.jpg`인지 확인합니다.
6. 페이지 하단 `build` 값이 최신 커밋 앞 12자리와 같은지 확인합니다.

서비스 워커·쿠키·Local Storage를 사용하지 않으므로 사이트 데이터를 지울 필요는 없습니다. GitHub Pages 배포 반영에는 잠시 시간이 걸릴 수 있습니다.
