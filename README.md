# 모험가의 식탁 — Spring Boot 메뉴 API × React 바이브 디자인

JPA 수업의 `chap06-spring-data-jpa` REST API 서버에, 바이브 디자인 & 바이브 코딩으로 만든 React 클라이언트(`menu-app`)를 연동한 실습이다.
화면은 Montage(원티드 디자인 시스템) 토큰 위에 **"밤거리 여관 한편, 떠돌이 상인이 모험가에게 요리 카드를 파는 가게"** 라는 게임 테마를 얹었다.
메뉴 하나가 도감 카드 한 장이고, 가격으로 레어도(일반·고급·희귀·영웅·전설)가 정해진다.

## 한눈에 보기

### 기능

| 화면 | 할 수 있는 것 |
|---|---|
| 🃏 **진열장** `/` | 요리 계통 그림이 들어간 도감 카드 목록 · 페이지 넘기기 · 카드 이름 검색 · 요리 계통 필터 · 몸값 "○ G 초과" 조건 · 진열 순서 5가지(최근·오래된·몸값 높은/낮은·이름) · 레어도 범례 · 카드 바로 담기 |
| 🔍 **카드 상세** `/menus/:menuCode` | 큰 카드와 등급·몸값·계통(식사 › 한식)·판매 여부 · 상인의 한마디 · 배낭에 담기 · 고쳐 쓰기 · 불태우기(한 번 더 확인) · 진열장에서 보던 순서대로 앞·다음 카드 넘기기(버튼, 키보드 ←/→) |
| 📜 **카드 들이기 / 장부 고쳐 쓰기** `/menus/new` · `/menus/:menuCode/edit` | 등록·수정 공용 장부 · 이름·몸값·계통 입력 검증 · 몸값에 따른 등급 미리 알림 · 서버 오류는 "장부 기록"으로 그대로 표시 |
| 🎒 **모험가의 배낭** `/backpack` | 담은 카드 수량 조절 · 계산서와 합계 골드 · 담은 뒤 품절·삭제된 카드는 자동으로 계산에서 제외 · 계산하기 |
| 🕯️ **상태 화면** | 불러오는 중(빛줄기 스켈레톤) · 빈 결과 · 서버 오류 · 서버 연결 실패 · 없는 도감 번호 |

### 연출

| 연출 | 언제 |
|---|---|
| ✨ **입고 개봉** | 새 카드를 장부에 적은 직후 — 뒷면이 떨어져 뒤집히고 레어도 색으로 빛이 터진다 |
| 🔥 **불태우기** | 삭제가 성공한 직후 — 오른쪽 아래에서 왼쪽 위로 고르지 않게 타올라 재가 된다 |
| 💎 **기울기와 광택** | 카드에 마우스를 올렸을 때 — 최대 8° 기울고 광택이 따라온다(담기 버튼도 함께). 영웅·전설은 무지갯빛 |
| 👑 **전설 금빛 테두리** | 전설 카드는 항상 — 테두리를 따라 금빛이 돈다 |
| 🌊 **진열 등장** | 쪽·조건·순서가 바뀔 때 — 카드가 차례로 떠오른다 |
| 🃏 **카드 넘김** | 상세에서 앞·다음 카드로 넘길 때 — 지금 카드가 밀려나고 옆 카드가 들어온다 |
| 🕯️ **촛불 일렁임** | 로고와 상인 얼굴의 불꽃 |

모든 연출은 운영체제의 "동작 줄이기"가 켜져 있으면 멈추고 결과만 보여 준다.

### 레어도

| 일반 | 고급 | 희귀 | 영웅 | 전설 |
|---|---|---|---|---|
| ~4,999원 | 5,000~7,999원 | 8,000~11,999원 | 12,000~19,999원 | 20,000원~ |

## 저장소 구성

```text
├─ chap06-spring-data-jpa/   REST API 서버 (Spring Boot, springdoc 적용)
├─ api-docs.json             /v3/api-docs 에서 내려받은 API 명세
├─ AGENTS.md                 에이전트 지침 (1. 화면 디자인 규칙 / 2. 서버 통신 규칙)
├─ CLAUDE.md                 @AGENTS.md 한 줄
├─ artboards/                화면 디자인 아트보드 원본 (8장)
└─ menu-app/                 React 클라이언트
   ├─ design/montage.tokens.json   디자인 토큰 (Montage + 게임 테마 확장)
   ├─ scripts/build-tokens.mjs     토큰 → CSS 변수 생성
   ├─ scripts/burn-keyframes.cjs   불태우기 연출의 불길 경계 키프레임 생성
   └─ src/
      ├─ api/          서버 요청과 응답 템플릿 처리 (Axios)
      ├─ components/   주소에 직접 대응하지 않는 화면 조각
      └─ pages/        주소 하나에 대응하는 화면
```

## 실행 방법

### 1. 백엔드 (localhost:8080)

1. MySQL(3306)을 실행하고 `chap06-spring-data-jpa/sql/` 의 두 파일을 순서대로 실행한다.
   - `00_01_CREATE_USER_DATABASE.sql` — 계정(ohgiraffers)과 DB(menudb)
   - `00_02_DB_SCRIPT.sql` — 표와 시드 데이터
2. 서버를 실행한다.
   ```bash
   cd chap06-spring-data-jpa
   ./gradlew bootRun
   ```
3. 확인: <http://localhost:8080/api/menus> 가 JSON 을 돌려주고, <http://localhost:8080/swagger-ui.html> 이 열린다.

### 2. 프론트엔드 (localhost:5173)

```bash
cd menu-app
npm install
npm run dev
```

- 서버 CORS 는 `http://localhost:5173` 만 허용한다. 5173 이 이미 쓰이고 있으면 `strictPort` 설정 때문에 실행이 멈춘다. 먼저 뜬 프로세스를 끄고 다시 실행한다.
- 토큰을 바꿨다면 `npm run tokens` 로 `src/tokens.css` 를 다시 만든다. (`tokens.css` 는 직접 편집하지 않는다)
- 검사: `npm run lint`, `npm run build`

## 진행 흐름

### 1. 백엔드 — REST API 서버와 명세

- `chap06-spring-data-jpa` 에 springdoc(`springdoc-openapi-starter-webmvc-ui`)을 추가하고 Swagger UI 를 켰다.
- 컨트롤러에 `@Tag` `@Operation` `@ApiResponses` `@Parameter` 를 붙이고, 정상 응답 `ResponseMessage` 의 `result` 안에 어떤 키가 담기는지를 `@Operation` 설명에 적었다. (`result` 가 Map 이라 명세에 자동으로 드러나지 않는다)
- `/v3/api-docs` 를 `api-docs.json` 으로 저장해 React 비동기 요청부를 작성하는 기준으로 썼다.

### 2. 프론트엔드 준비 — 디자인 토큰과 화면 설계

- **디자인 토큰**: Montage(`montage-web-main`)에서 추출한 `montage.tokens.json` 을 재사용했다. 빠져 있던 모서리 값은 각 컴포넌트 `style.ts` 에서 모아 radius 17종으로 더했다.
- **테마 확장**: 게임 테마용 색·그림자·글꼴·움직임(연출 시간·기울기 각도 포함)을 `color.game` · `shadow.game` · `fontFamily` · `motion` 으로 **토큰 파일에 먼저 추가**한 뒤 썼다. 기존 Montage 값은 바꾸지 않았다.
- **화면 설계**: Claude 아티팩트 캔버스에 아트보드 8장을 그렸다. 원본 파일은 `artboards/` 에 있다.

  | 아트보드 | 담긴 것 |
  |---|---|
  | 1. 레이아웃 | 헤더(촛불 로고·진열장·카드 들이기), 푸터 |
  | 2. 진열장 | 도감 카드 그리드, 페이지네이션, 이름 검색, 몸값 조건, 요리 계통 필터, 레어도 범례 |
  | 3. 카드 상세 | 카드 정보, 배낭에 담기·고쳐 쓰기·불태우기, 앞·다음 카드 넘기기, 불태우기 확인 대화창 |
  | 4. 카드 장부 | 등록·수정 공용 폼, 입력 검증, 서버 오류 알림 |
  | 5. 상태 모음 | 로딩 스켈레톤(사선 빛줄기), 빈 결과, 오류 응답, 연결 실패, 저장 중 |
  | 6. 모험가의 배낭 | 담은 카드 목록·수량, 계산서, 품절·사라진 카드, 계산 대화창, 빈 배낭 |
  | 7. 연출 모음 | 입고 개봉, 불태우기, 기울기와 광택, 전설 금빛 테두리, 진열 등장, 카드 넘김, 촛불 일렁임 |
  | 8. 요리 계통 그림 | 하위 계통 9종 선 그림(한식·중식·일식·퓨전·커피·쥬스·기타·동양·서양)과 기본 접시 |

  - 캔버스: <https://claude.ai/artifact/V7dM7WBdUXGzYCqSJKUjrU>
  - `artboards/*.dc.html` 은 캔버스 전용 형식(Design Component)이라 브라우저로 바로 열면 반복·조건 부분이 그려지지 않는다. 화면은 위 캔버스에서 본다. `artboards/montage.css` 는 아트보드에서 쓴 토큰 사본이며 값은 `menu-app/src/tokens.css` 와 같다.

### 3. 에이전트로 React 앱 생성

`AGENTS.md` 를 두 층으로 나눠 에이전트가 같은 규칙으로 모든 화면을 만들게 했다.

| 층 | 내용 | 결정 요소 |
|---|---|---|
| 1. 화면 디자인 규칙 | 라이브러리(react·react-router·axios만), 폴더 구조, 상태(조건은 URL), 스타일(토큰만 사용), 화면 테마 | 디자인 토큰 |
| 2. 서버 통신 규칙 | baseURL 한 곳, 요청은 `src/api/` 에만, 응답 템플릿(`result` 꺼내기·오류 `code/description/detail`), 명세에 없는 내용 | API 명세 |

연동할 서버가 바뀌면 2층만, 디자인이 바뀌면 토큰과 1층만 고치면 된다.

## 화면과 API

| 화면 | 주소 | API |
|---|---|---|
| 진열장 (목록) | `/?q=&category=&price=&sort=&page=` | `GET /api/menus/pages` · `/pages/sort` · `/search` · `/api/menus`, `GET /api/categories` |
| 카드 상세 | `/menus/:menuCode?(진열장 조건)` | `GET /api/menus/{menuCode}`, `DELETE /api/menus/{menuCode}`, 넘기기 순서용으로 진열장과 같은 목록 요청, `GET /api/categories` |
| 카드 들이기 (등록) | `/menus/new` | `POST /api/menus` |
| 장부 고쳐 쓰기 (수정) | `/menus/:menuCode/edit` | `GET`·`PUT /api/menus/{menuCode}` |
| 모험가의 배낭 | `/backpack` | `GET /api/menus` (몸값·판매 여부를 다시 맞춤) |

- 조건 없음 → 서버 페이징(`/pages`, 순서를 바꾸면 `/pages/sort`). 페이지 번호는 1부터.
- 이름·카테고리 조건 → 서버에 검색 API 가 없어 전체(가격 조건이 있으면 `/search`, 없으면 `/api/menus`)를 받아 화면에서 거르고 나눈다.
- 가격 조건은 지정한 값을 **초과**하는 메뉴만 온다.
- 상세의 앞·다음 카드는 진열장에서 보던 순서를 따른다. 서버 정렬(`/pages/sort`)은 값이 같은 카드의 순서를 요청 모양마다 다르게 주므로, 상세도 진열장과 같은 12장씩 1쪽부터 받아 이어 붙인다.
- 삭제 응답의 실제 HTTP 상태는 200, 본문의 `httpStatus` 는 204 다. 성공 여부는 HTTP 상태로만 판단한다.
- 서버 오류(`code`·`description`·`detail`)는 말투를 바꾸지 않고 "장부 기록" 칸에 그대로 보여준다.
- 배낭은 서버에 주문 API 가 없어 브라우저(`localStorage`)에 `menuCode`·수량만 저장하고, 여러 화면이 React Context 로 함께 쓴다. 계산하기는 기록을 남기지 않고 배낭만 비운다.

## 확인한 것

- `npm run lint` · `npm run build` 통과
- 브라우저: `?page=1` 이 첫 쪽 / 조건을 주소에 넣고 새로고침해도 유지 / 뒤로가기로 이전 조건 복귀 / 가격 조건이 초과로 동작 / 빈 결과 / 등록 후 목록 증가 / 400 응답 시 `description` 표시 / 삭제는 한 번 더 확인 후 `DELETE → 200` 이면 목록으로
- 배낭: 담기 후 헤더 장수 증가 / 품절 카드는 담기 비활성 / 담은 뒤 품절·삭제된 카드는 계산에서 제외 / 계산 후 판매 중 카드만 배낭에서 빠짐
- 연출: 개봉은 등록 직후에만(새로고침·수정 때는 없음) / 불태우기는 삭제 성공 뒤에만 / 전설 카드에만 금빛 테두리
- 넘기기: 몸값 높은 순 37장, 계통 필터 + 이름순 9장 모두 진열장 순서와 상세에서 끝까지 넘긴 순서가 같음
- 규칙: `src/api/` 밖에서 axios·fetch 호출 없음, 직접 쓴 색상값·`font-size` 없음, 쓰인 CSS 변수는 모두 `tokens.css` 에 존재
