# 기존 v1.2 저장소를 v1.3으로 업데이트하는 방법

## 1. 안전한 적용 방식

`photo-spec-mvp-v1.3-update.zip`의 압축을 풀고, ZIP 자체가 아니라 내부 파일과 폴더를 기존 GitHub 저장소 최상위에 업로드합니다.

업데이트 ZIP에는 `.github/workflows/pages.yml`도 안전 확인용으로 포함되어 있습니다. v1.2에서 정상 배포 중인 동일 워크플로를 유지해도 되지만, 함께 업로드해도 됩니다.

## 2. 교체·추가할 파일

```text
.github/workflows/pages.yml
index.html
styles.css
app.js
src/core.js
tests/core.test.mjs
tests/structure.test.mjs
package.json
package-lock.json
privacy.html
README.md
UPDATE_GUIDE.md
V1.3_CHANGES.md
```

기존 `V1.2_CHANGES.md`가 저장소에 남아 있어도 앱 동작에는 문제가 없습니다. 변경 기록을 깔끔하게 관리하려면 GitHub에서 해당 파일만 삭제해도 됩니다.

## 3. 커밋 및 배포

1. GitHub에서 위 파일들을 업로드합니다.
2. `Commit changes`를 누릅니다.
3. `Actions → Test and deploy Pages`를 엽니다.
4. 테스트 로그가 다음처럼 끝나는지 확인합니다.

```text
tests 30
pass 30
fail 0
```

5. `test`와 `deploy`가 모두 초록색인지 확인합니다.
6. 배포 페이지 하단 `build` 값이 최신 커밋 앞 12자리인지 확인합니다.

## 4. 화면 확인

다음 항목을 확인하세요.

- 상단 오른쪽의 중복 프리셋 요약 박스가 사라짐
- `사진을 올리고, 맞추고, 바로 내려받으세요.` 영역이 중앙 정렬됨
- 프리셋 목록에 `Q-Net 국가자격 (기사·기능사 등)`이 표시됨
- Q-Net 선택 시 `최소 크기`, `300 × 400px 이상`, `JPEG 또는 JPG`가 표시됨
- 출력 형식은 JPG 하나만 표시됨
- 사진 변환 후 자동 검사에 `공식 최소 크기 충족`이 표시됨
- 내려받은 파일명이 `qnet-300x400.jpg`임
- Q-Net 부적합 사진 사례를 확인하는 체크리스트가 표시됨
- 새로고침하면 선택한 사진과 결과가 초기화됨

## 5. 이전 화면이 잠시 보이는 경우

서비스 워커, 쿠키, Local Storage를 사용하지 않으므로 사이트 데이터를 삭제할 필요는 없습니다. GitHub Actions의 배포가 완료된 뒤에도 GitHub Pages의 새 HTML 반영에 잠시 시간이 걸릴 수 있습니다.

페이지 하단의 `build` 값으로 최신 배포 여부를 확인하세요.
