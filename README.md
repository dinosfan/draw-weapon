# 심사용 무료 클라우드 배포

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
