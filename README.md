# 모험가의 식탁 — Spring Boot 메뉴 API × React 바이브 디자인

JPA 수업의 `chap06-spring-data-jpa` REST API 서버에, 바이브 디자인 & 바이브 코딩으로 만든 React 클라이언트(`menu-app`)를 연동한 실습이다.
화면은 Montage(원티드 디자인 시스템) 토큰 위에 **"밤거리 여관 한편, 떠돌이 상인이 모험가에게 요리 카드를 파는 가게"** 라는 게임 테마를 얹었다.
메뉴 하나가 도감 카드 한 장이고, 가격으로 레어도(일반·고급·희귀·영웅·전설)가 정해진다.

## 저장소 구성

```text
├─ chap06-spring-data-jpa/   REST API 서버 (Spring Boot, springdoc 적용)
├─ api-docs.json             /v3/api-docs 에서 내려받은 API 명세
├─ AGENTS.md                 에이전트 지침 (1. 화면 디자인 규칙 / 2. 서버 통신 규칙)
├─ CLAUDE.md                 @AGENTS.md 한 줄
├─ artboards/                화면 디자인 아트보드 원본 (5장)
└─ menu-app/                 React 클라이언트
   ├─ design/montage.tokens.json   디자인 토큰 (Montage + 게임 테마 확장)
   ├─ scripts/build-tokens.mjs     토큰 → CSS 변수 생성
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
- **테마 확장**: 게임 테마용 색·그림자·글꼴·움직임을 `color.game` · `shadow.game` · `fontFamily` · `motion` 으로 **토큰 파일에 먼저 추가**한 뒤 썼다. 기존 Montage 값은 바꾸지 않았다.
- **화면 설계**: Claude 아티팩트 캔버스에 아트보드 5장을 그렸다. 원본 파일은 `artboards/` 에 있다.

  | 아트보드 | 담긴 것 |
  |---|---|
  | 1. 레이아웃 | 헤더(촛불 로고·진열장·카드 들이기), 푸터 |
  | 2. 진열장 | 도감 카드 그리드, 페이지네이션, 이름 검색, 몸값 조건, 요리 계통 필터, 레어도 범례 |
  | 3. 카드 상세 | 카드 정보, 고쳐 쓰기·불태우기, 불태우기 확인 대화창 |
  | 4. 카드 장부 | 등록·수정 공용 폼, 입력 검증, 서버 오류 알림 |
  | 5. 상태 모음 | 로딩 스켈레톤(사선 빛줄기), 빈 결과, 오류 응답, 연결 실패, 저장 중 |

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
| 카드 상세 | `/menus/:menuCode` | `GET /api/menus/{menuCode}`, `DELETE /api/menus/{menuCode}` |
| 카드 들이기 (등록) | `/menus/new` | `POST /api/menus` |
| 장부 고쳐 쓰기 (수정) | `/menus/:menuCode/edit` | `GET`·`PUT /api/menus/{menuCode}` |

- 조건 없음 → 서버 페이징(`/pages`, 순서를 바꾸면 `/pages/sort`). 페이지 번호는 1부터.
- 이름·카테고리 조건 → 서버에 검색 API 가 없어 전체(가격 조건이 있으면 `/search`, 없으면 `/api/menus`)를 받아 화면에서 거르고 나눈다.
- 가격 조건은 지정한 값을 **초과**하는 메뉴만 온다.
- 삭제 응답의 실제 HTTP 상태는 200, 본문의 `httpStatus` 는 204 다. 성공 여부는 HTTP 상태로만 판단한다.
- 서버 오류(`code`·`description`·`detail`)는 말투를 바꾸지 않고 "장부 기록" 칸에 그대로 보여준다.

## 확인한 것

- `npm run lint` · `npm run build` 통과
- 브라우저: `?page=1` 이 첫 쪽 / 조건을 주소에 넣고 새로고침해도 유지 / 뒤로가기로 이전 조건 복귀 / 가격 조건이 초과로 동작 / 빈 결과 / 등록 후 목록 증가 / 400 응답 시 `description` 표시 / 삭제는 한 번 더 확인 후 `DELETE → 200` 이면 목록으로
- 규칙: `src/api/` 밖에서 axios·fetch 호출 없음, 직접 쓴 색상값·`font-size` 없음, 쓰인 CSS 변수는 모두 `tokens.css` 에 존재
