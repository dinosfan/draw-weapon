# 앱 색표 — 이 색만 사용

출처: [Open Color](https://yeun.github.io/open-color/). 단일 원본은 dist/js/palette.js. CSS 생성: node scripts/build-palette.cjs.
브라우저 색표: http://127.0.0.1:4174/palette.html

| 토큰 / 타입 | Open Color | HEX |
|---|---|---|
| ink | black | #000000 |
| paper | gray 0 | #f8f9fa |
| surface | white | #ffffff |
| muted | gray 7 | #495057 |
| subtle | gray 2 | #e9ecef |
| fire / 불꽃 | orange 6 | #fd7e14 |
| water / 물 | blue 5 | #339af0 |
| nature / 풀 | green 6 | #40c057 |
| electric / 전기 | yellow 5 | #fcc419 |
| metal / 강철 | gray 5 | #adb5bd |
| ice / 얼음 | cyan 4 | #3bc9db |
| illusion / 에스퍼 | pink 5 | #f06595 |
| normal / 노말 | gray 6 | #868e96 |
| danger | red 6 | #fa5252 |
| fighting / 격투 | orange 8 | #e8590c |
| flying / 비행 | blue 2 | #a5d8ff |
| poison / 독 | grape 8 | #9c36b5 |
| ground / 땅 | orange 9 | #d9480f |
| rock / 바위 | yellow 9 | #e67700 |
| bug / 벌레 | lime 7 | #74b816 |
| ghost / 고스트 | violet 9 | #5f3dc4 |
| dragon / 드래곤 | indigo 7 | #4263eb |
| dark / 악 | gray 8 | #343a40 |
| fairy / 페어리 | pink 2 | #fcc2d7 |
| stellar / 스텔라 | teal 4 | #38d9a9 |

- ??? 타입은 subtle 토큰을 재사용한다.
- 기술 네 면 테두리·타입 배지·타입 연출은 같은 토큰을 사용한다. 기술 배경은 surface, 글자는 ink. 배지 글자는 대비에 따라 ink 또는 surface.
- HP는 타입으로 재색칠하지 않는다. 포커스는 별도 검정 윤곽선이다.
- 상태 배지: 독=poison, 화상=fire, 마비=electric, 잠듦=normal, 얼음=ice, 혼란=illusion, 풀죽음=fighting, 반동=rock.
- CSS는 var(--color-...), JS/canvas는 GamePalette.tokens만 사용한다. 임의 색·혼합·농도를 추가하지 않는다. 투명도 변화는 허용한다.
- AI는 색 코드 대신 타입 ID를 반환한다. 원본 그림·Microsoft Fluent Emoji·승인된 도트 그림의 원래 색은 보존한다.
- 색 변경 시 이 문서도 갱신하고 생성 스크립트와 node --test를 실행한다.

- 희귀도 색: 일반=normal, 희귀=water, 영웅=ghost, 전설=electric, 신화=illusion. 등급 배지와 탄생 연출에만 사용하며 기술 테두리와 전투 타격 연출은 원래 타입 색을 유지한다.

- 생성된 VFX PNG는 원본을 보존하고 재생 직전에 ink/dark/해당 기술 타입/metal/paper 5색으로 맞춘다. 반투명 가장자리의 약한 잡음을 제거하고 프레임을 96×96 논리 픽셀로 정리한다. UI 색표 검사 예외를 추가하지 않는다.
