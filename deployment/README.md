# 공개 게임 운영

본편은 Render의 고정 주소에서 Tailscale Funnel을 거쳐 PC 게임 서버로 연결한다. 포스터 QR은 같은 Render 서비스에서 전시 안내와 예시 보스전을 직접 열고, 실시간 무기 제작 요청만 PC 서버로 보낸다. Windows에서 Tailscale이 연결된 상태로 `게임 실행.cmd`를 실행하면 실시간 제작을 이용할 수 있다.

- [본편](https://draw-weapon-khu-2026.onrender.com/start.html)
- [시연용](https://draw-weapon-khu-2026.onrender.com/exhibit.html)

PC가 응답하지 않으면 전시 화면에서 예시 무기 8종과 오류 제보를 이용할 수 있다. 기존 Render 서비스의 `DRAW_WEAPON_PUBLIC_ORIGIN`에는 PC의 고정 Tailscale HTTPS 주소를 유지한다. 오류 제보는 기본적으로 Render 서비스 로그에 `exhibit-issue`로 남는다. 장기 저장을 연결하려면 [전시 오류 제보 설정](exhibit-issues.md)을 참고한다.

## Render에서 게임 서버를 직접 운영하는 구성

아래는 별도 구성의 기록이다. 직접 운영에서 AI 제작을 쓰려면 ChatKHU의 출발 IP 접근 승인이 필요하다.

- Render Singapore / Docker / free, 서버 1개, 고정 onrender.com 주소
- 접속이 없으면 잠들고 다음 접속 시 다시 시작합니다. PC는 필요 없습니다.
- 그림 분석: 기본 ChatKHU Gemini 3.5 Flash
- 도트·진화 외형: 기본 ChatKHU Nano Banana 2.1
- 공급자·모델·키는 Render의 서버 환경 변수에서 교체할 수 있습니다.
- Node 22 + Python 3.13 + 현재 로컬과 동일한 Pillow/NumPy 버전
- 정상 상태: GET /healthz → 200 {"status":"ok"}
- API 잔액이 없어도 시작 화면과 모의 제작·전투는 이용할 수 있습니다.
- 무료 서버의 생성 파일과 평가 파일은 재시작·재배포 시 사라질 수 있습니다.
- 생성된 도트는 사용한 브라우저에도 보관합니다. 무기 데이터는 기존처럼 브라우저에 저장됩니다.
- 자동 배포는 꺼져 있어 코드 수정만으로 심사 중 서버가 재시작되지 않습니다.

저장소에는 검수한 개별 실행 소스를 그대로 올립니다. 공개 음악은 Docker 빌드에서
원작자 OpenGameArt 링크로부터 내려받고 변환합니다. 출처와 라이선스는 게임에 표시합니다.
API 키·PC 설정·기존 플레이어의 생성 이미지·로컬 모델 가중치·로그는 포함하지 않습니다.

API 키는 Render의 BAZE_API_KEY / GEMINI_API_KEY / AI_API_KEY 비밀 환경 변수로 관리합니다.
AI_ENDPOINT, AI_MODEL, AI_IMAGE_PROVIDER, AI_IMAGE_MODEL로 모델 연결을 바꿉니다.
서버가 실제 live 상태가 되고 화면·모의 전투를 확인한 뒤 공개 주소를 안내합니다.
실제 AI 제작은 API 잔액 충전 후 별도로 검증해야 합니다.

## 본편에서 ChatKHU가 403을 반환할 때

2026-11-11 23:09 KST에 본편 Render 서버에서 Nano Banana 이미지 요청이
`permission_denied - Requests from this IP address are not allowed for this workspace`로 차단되었습니다.
기존 본편 주소 `https://draw-weapon-khu-2026.onrender.com/start.html`은 그대로 유지합니다.
사이트가 열리거나 `/healthz`가 200을 반환해도 ChatKHU 접속이 허용된 것은 아닙니다.

1. [본편 Render 대시보드](https://dashboard.render.com/web/srv-dbhlomff3r2c73d82vfg)의
   **Connect → Outbound**에서 이 서비스의 현재 출발 IP 범위를 확인합니다.
   현재 서비스는 Singapore 무료 플랜입니다. Render 지역 공유 범위에 속한 IP 중 하나를
   사용하므로, 임의의 IP 한 개만 확인해서 등록하면 재시작 후 실패할 수 있습니다.
2. [ChatKHU 담당자](https://dx.khu.ac.kr/)에게 외부 공개 본편 운영이 정책상 가능한지와
   이 범위 등록 가능 여부를 문의합니다. 공유 범위를 승인할 수 없다면 학교가 제공하거나
   승인할 수 있는 상시 서버 또는 전용 고정 출발 IP 조건을 확인합니다. API 키는 전달하지
   않습니다. 게임에 접속하는 방문자의 IP를 등록하는 것이 아닙니다.
3. 승인 후에는 Render에서 `chatkhu-gateway-check` 로그가 200이고
   `analysisAvailable`과 `imageAvailable`이 모두 참인지 확인합니다. 이 검사는 서버가
   시작할 때 모델 목록만 조회하며 이미지나 무기를 생성하지 않습니다.
4. 본편 공방에서 새 낙서로 무기와 기술 4개를 만들고, 도트 생성 및 전투 진입을
   확인합니다. 진화 선택 후 외형 생성까지 확인해야 본편 AI 검증이 완료됩니다.

Render의 무료 서버는 유휴 상태에서 잠들 수 있지만 새 접속으로 다시 시작합니다.
이 방식에는 노트북, 로컬 GPU, 터널이 필요하지 않습니다.
