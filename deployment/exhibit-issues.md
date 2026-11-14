# 포스터 오류 제보 보관

포스터 오류 제보는 PC에 접속하지 않고 Render에서 접수합니다. Render 대시보드에서 게임 서비스의 **Logs**를 열고 `exhibit-issue`를 검색하면 시각, 게임 화면, 방문객이 적은 내용을 확인할 수 있습니다. Hobby 워크스페이스의 로그 보관 기간은 7일입니다. [Render 로그 보관 안내](https://render.com/docs/logging#retention-period)

## Google Sheets에 장기 보관하기

1. 운영자만 볼 수 있는 Google 스프레드시트를 만들고 탭 이름을 `전시 오류 제보`로 바꿉니다. 첫 줄에는 `접수 시각`, `화면`, `내용`을 입력합니다. 스프레드시트 시간대를 서울로 설정하면 접수 시각이 한국 시간으로 표시됩니다.
2. 스프레드시트의 **확장 프로그램 → Apps Script**를 열고 [exhibit-issues.gs](exhibit-issues.gs)의 코드를 붙여넣습니다.
3. Apps Script의 **프로젝트 설정 → 스크립트 속성**에 `EXHIBIT_ISSUES_SHEET_ID`와 `EXHIBIT_ISSUES_WEBHOOK_SECRET`을 추가합니다. 시트 ID는 스프레드시트 주소에서 `/d/`와 `/edit` 사이 값입니다. 비밀값은 `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`로 생성할 수 있습니다.
4. Apps Script에서 **배포 → 새 배포 → 웹 앱**을 선택합니다. 실행 계정은 본인, 액세스는 모든 사용자로 설정합니다. 스프레드시트 공유 범위는 운영자에게만 유지합니다. 웹 앱은 비밀값이 맞는 요청에만 제보를 저장합니다. [Apps Script 웹 앱 배포 안내](https://developers.google.com/apps-script/guides/web)
5. Render 게임 서비스의 환경 변수에 웹 앱의 `/exec` 주소를 `EXHIBIT_ISSUES_WEBHOOK_URL`로 추가하고, 같은 비밀값을 `EXHIBIT_ISSUES_WEBHOOK_SECRET`으로 설정합니다. 서비스에 적용한 뒤 포스터 QR에서 테스트 제보를 한 건 보내 시트의 새 행을 확인합니다.

시트 설정이 없거나 시트 저장에 실패하면 Render 로그에서 제보를 확인할 수 있습니다. 로컬 서버에서 받은 제보는 계속 `output/exhibit-issues.jsonl`에 저장됩니다.
