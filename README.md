# 사진맞춤 v1.1

국가공무원 응시사진을 브라우저에서 자르고, `137 × 177px`, `350KB 미만`, JPG/PNG 형식으로 변환하는 정적 웹앱입니다.

## v1.1 디자인 업데이트

- 따뜻한 크림색 배경, 따뜻한 검정 잉크, 주황색 단일 CTA
- 무거운 그림자를 없애고 1px 헤어라인으로 영역 구분
- 세 장의 독립 카드 대신 하나의 연속된 사진 작업공간
- 제목을 의도된 두 줄로 고정하고 한국어 단어 중간 줄바꿈 방지
- PC 3열 → 태블릿 2열 → 모바일 1열 반응형 배치
- 서비스 워커·쿠키·Local Storage 미사용
- Git 커밋 SHA를 CSS/JavaScript 주소에 붙여 구버전 정적 파일 재사용 방지
- 화면 하단 `build` 값으로 실제 배포 버전 확인 가능

## 데이터 처리

사진은 서버로 업로드하지 않습니다. 선택한 파일은 현재 브라우저 탭의 메모리와 Canvas에서만 처리됩니다. 새로고침하면 사진과 결과가 초기화됩니다.

현재 앱 코드에는 다음 기능이 없습니다.

- 쿠키 생성 또는 조회
- Local Storage / Session Storage / IndexedDB
- 서비스 워커 및 오프라인 캐시
- 회원가입·로그인·데이터베이스
- 외부 이미지 처리 API

브라우저 자체의 일반 HTTP 캐시는 사용할 수 있지만, 배포 시 각 커밋의 앞 12자리 SHA가 정적 파일 URL에 들어가므로 새 HTML이 반영된 뒤에는 이전 CSS/JavaScript를 재사용하지 않습니다.

## GitHub Pages 배포

1. 저장소 최상위에 프로젝트 파일을 올립니다.
2. `.github/workflows/pages.yml`이 실제로 존재하는지 확인합니다.
3. `Settings → Pages → Source → GitHub Actions`를 선택합니다.
4. `Actions → Test and deploy Pages`에서 `test`와 `deploy`가 모두 성공하는지 확인합니다.
5. 페이지 하단의 `build abcdef123456` 값이 최신 Git 커밋 앞 12자리와 같은지 확인합니다.

GitHub Pages의 HTML/CDN 반영 자체에는 잠시 시간이 걸릴 수 있습니다. 하지만 최신 HTML이 전달되면 버전이 붙은 새 CSS와 JavaScript를 요청합니다.

## 로컬 테스트

```bash
npm ci
npm run check
npm test
```

## 공식 정보

- 국가공무원 채용시스템 원서접수 안내: <https://gongmuwon.gosi.kr/oprut/AppApAplfSbmsnAplfRcptGd.do>
- 앱에 표시된 규격 확인일: 2026-07-25

이 프로젝트는 국가공무원 채용시스템 또는 인사혁신처의 공식 서비스가 아닙니다. 최종 제출 전 공식 안내를 다시 확인해야 합니다.
