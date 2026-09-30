# 메뉴 관리 — 에이전트 지침

Montage 디자인 토큰으로 화면을 만들고, 로컬 Spring Boot 메뉴 API와 연동하는 React 실습이다.
API 명세의 기준은 프로젝트 루트의 `api-docs.json`이다.
아래 규칙은 이 프로젝트 안에서만 적용한다.

## 1. 화면 디자인 규칙

### 사용 라이브러리와 프로젝트 생성

- 프로젝트는 `npm create vite@latest menu-app -- --template react --eslint`로 만든다.
- `react`, `react-dom`, `react-router`, `axios`만 사용한다.
- UI 라이브러리, CSS 프레임워크, 전역 상태 라이브러리는 도입하지 않는다.
- TypeScript 문법은 사용하지 않는다.

### 폴더 구조

```text
src/
    api/         서버 요청과 응답 템플릿 처리
    components/  주소에 직접 대응하지 않는 화면 조각
    pages/       주소 하나에 대응하는 화면
```

- 주소에 직접 대응하면 `pages`, 아니면 `components`에 둔다.
- 컴포넌트는 `api/`가 제공하는 함수만 호출한다.

### 상태 관리

- 화면 하나에서만 쓰는 값은 `useState`에 둔다.
- 검색어, 카테고리, 가격 조건, 진열 순서, 페이지 번호는 URL 쿼리스트링에 둔다.
- 서버에서 받은 목록과 상세 데이터는 사용하는 화면이 소유한다.
- 동일한 값을 컴포넌트 상태와 URL에 중복 저장하지 않는다.
- 여러 화면이 함께 쓰는 배낭은 React Context(`BackpackProvider`)와 `localStorage`에 둔다. 저장하는 것은 `menuCode`와 수량뿐이고, 몸값·판매 여부는 배낭 화면에서 서버 값으로 다시 맞춘다.

### 스타일 규칙

- 색은 `var(--토큰)`으로만 사용하고 색상값을 직접 적지 않는다.
- `font-size`를 직접 지정하지 않고 `tokens.css`의 타입 스타일 클래스를 사용한다.
- 간격과 모서리는 `design/montage.tokens.json`에 있는 spacing·radius 값만 사용한다.
- 다크 테마용 색상 분기 코드를 별도로 만들지 않는다.
- `src/tokens.css`는 `npm run tokens`로 생성하며 직접 편집하지 않는다.
- 토큰을 바꾸려면 `design/montage.tokens.json`을 수정한 뒤 다시 생성한다.

### 화면 테마 — 모험가의 식탁

- 컨셉은 "밤거리 여관 한편, 떠돌이 상인이 모험가에게 요리 카드를 파는 가게"다. 기준 화면은 아트보드(claude.ai/artifact/V7dM7WBdUXGzYCqSJKUjrU)다.
- 색은 `--color-game-*`, 그림자는 `--shadow-game-*`, 글꼴은 `--font-family-*`, 움직임은 `--motion-*` 토큰을 쓴다. Montage의 `semantic` 색은 쓰지 않는다.
- 제목·카드 이름·대화창 제목은 `--font-family-display`(Hahmlet), 나머지는 `--font-family-body`다.
- 메뉴 하나는 도감 카드 한 장이다. 레어도는 `menuPrice`로 화면에서 계산한다: 일반 ~4,999 / 고급 5,000~7,999 / 희귀 8,000~11,999 / 영웅 12,000~19,999 / 전설 20,000~.
- 가격은 `9,500 G`, `orderableStatus`는 `Y` → 판매 중, `N` → 품절로 보여준다. 메뉴·카테고리 이름과 가격 숫자는 서버 값을 그대로 쓴다.
- 선택지·입력칸·버튼 문구는 명사형으로 짧게 쓴다. 상인의 말투(하게체)는 대사 자리에만 쓴다.
- 빈 결과·오류·연결 실패 화면은 화자 → 대사 → 사실 → 행동 순서를 따른다.
- 서버 오류의 `description`·`detail`·`code`는 말투를 바꾸지 않고 "장부 기록" 칸에 그대로 보여준다.
- 움직임은 `prefers-reduced-motion: reduce`일 때 끈다.

### 확인

```bash
npm run lint
npm run build
```

- 린트와 빌드 후 브라우저에서 화면과 네트워크 요청을 직접 확인한다.
- 로딩, 빈 결과, 오류 상태가 실제 화면에서 구분되는지 확인한다.

## 2. 서버 통신 규칙

### 서버

- 서버 주소는 `http://localhost:8080`이다.
- `baseURL`은 `src/api/`의 Axios 인스턴스 한 곳에만 적는다.
- 서버가 허용하는 프론트엔드 주소는 `http://localhost:5173`이다.
- Vite가 5174로 실행되면 해당 프로세스를 끄고 5173으로 다시 실행한다.

### 데이터 요청

- 서버 요청은 `src/api/`의 `.js` 파일에만 둔다.
- 컴포넌트에서 Axios나 `fetch`를 직접 호출하지 않는다.
- 이 앱의 REST 요청은 Axios를 사용한다.
- 메뉴·카테고리 상세 주소는 `menuCode`, `categoryCode`로 조립한다. 서버가 다음 URL을 제공하지 않는다.
- 페이지 번호는 1부터 시작한다.
- 가격 검색은 `GET /api/menus/search`를 사용하며 `menuPrice`를 초과하는 메뉴를 반환한다.
- 엔드포인트, HTTP 메서드, 파라미터는 `api-docs.json`을 기준으로 한다.

### 응답 템플릿

정상 응답은 다음 형태다.

```json
{ "httpStatus": 200, "message": "메뉴 목록 조회 성공", "result": { "menus": [] } }
```

오류 응답은 다음 형태다.

```json
{ "code": "ERROR_CODE_00001", "description": "메뉴 조회 실패", "detail": "..." }
```

- `api/`에서 정상 응답의 `result`를 꺼내 반환한다. 컴포넌트는 `ResponseMessage` 구조를 알지 않는다.
- 오류는 `code`, `description`, `detail`로 처리한다. 오류 응답에는 `httpStatus`가 없다.
- 삭제 요청의 실제 HTTP 상태는 200이고, 응답 본문의 `httpStatus`는 204다.
- `orderableStatus`는 문자열 `'Y'` 또는 `'N'`만 사용한다.

### API 명세에 없는 내용

- `CategoryDTO` 필드는 `categoryCode`, `categoryName`, `refCategoryCode`, `refCategoryName`이다.
- 최상위 카테고리인 식사·음료·디저트는 `refCategoryCode`, `refCategoryName`이 `null`이다.
- 메뉴는 대부분 하위 카테고리에 속하지만, 시드 데이터 중 4건은 최상위 카테고리(식사 3건, 음료 1건)에 속한다.
- `ErrorResponse` 필드는 `code`, `description`, `detail`이다.
- `result` 내부 키는 각 API의 `@Operation` 설명을 따른다.
