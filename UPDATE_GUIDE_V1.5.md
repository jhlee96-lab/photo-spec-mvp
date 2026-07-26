# v1.4 → v1.5 업데이트 안내

## 권장 파일

기존 저장소에는 `photo-spec-mvp-v1.5-update.zip`의 내부 파일을 덮어쓰세요. ZIP 파일 자체를 저장소에 올리지 않습니다.

## 반드시 교체할 파일

```text
.github/workflows/pages.yml
app.js
index.html
privacy.html
styles.css
package.json
package-lock.json
README.md
scripts/build-site.mjs
tests/
```

## 새로 추가할 파일과 폴더

```text
.github/ISSUE_TEMPLATE/
404.html
ADSENSE_VERIFICATION_GUIDE.md
HOSTING_GUIDE_V1.5.md
UPDATE_GUIDE_V1.5.md
V1.5_CHANGES.md
changelog.html
contact.html
korean-history-photo.html
national-civil-service-photo.html
qnet-photo.html
robots.txt
sitemap.xml
_headers
netlify.toml
```

## 업로드 후 확인

1. `.github/workflows/pages.yml`이 실제로 교체됐는지 확인합니다.
2. Actions의 새 실행을 엽니다.
3. `npm run check`, `npm test`, `npm run build`가 성공하는지 확인합니다.
4. 배포 후 아래 페이지를 직접 엽니다.

```text
/national-civil-service-photo.html
/korean-history-photo.html
/qnet-photo.html
/contact.html
/changelog.html
/sitemap.xml
```

## GitHub Actions 변수

저장소에서 다음으로 이동합니다.

```text
Settings
→ Secrets and variables
→ Actions
→ Variables
```

필요할 때만 다음 값을 추가합니다.

```text
SITE_URL=https://실제사이트주소
ADSENSE_PUBLISHER_ID=ca-pub-숫자16자리
```

게시자 ID가 아직 없다면 `ADSENSE_PUBLISHER_ID`를 만들지 않아도 됩니다. 빈 값일 때는 인증 메타태그와 `ads.txt`가 생성되지 않습니다.
