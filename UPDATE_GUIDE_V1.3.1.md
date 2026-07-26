# v1.3에서 v1.3.1로 업데이트

1. 업데이트 ZIP의 압축을 풉니다.
2. ZIP 자체가 아니라 내부 파일을 기존 저장소 최상위에 업로드합니다.
3. 같은 이름의 파일을 교체하고 커밋합니다.
4. Actions에서 테스트와 배포가 모두 성공하는지 확인합니다.

주요 변경 파일:

- `index.html`
- `privacy.html`
- `src/core.js`
- `tests/core.test.mjs`
- `tests/structure.test.mjs`
- `package.json`
- `package-lock.json`
- `README.md`
