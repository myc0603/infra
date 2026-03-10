# Simple React + Express CRUD (File Storage)

Express + React(UMD)로 구성된 단순한 CRUD 예제입니다. RDB 없이 `data/items.json` 파일에 저장합니다.

## Requirements
- Node.js 18+ (권장)

## 실행 방법

1. 의존성 설치
   ```bash
   npm install
   ```
2. 서버 실행
   ```bash
   npm start
   ```
3. 테스트 실행
   ```bash
   npm test
   ```
4. 접속
   - `http://localhost:3000`

## 구조
- `server.js`
- `public/index.html`
- `public/app.js`
- `data/items.json`
- `__tests__/server.test.js`
- `__tests__/app.test.js`

## API 엔드포인트
- `POST /api/items`
  - body: `{ "text": "..." }`
  - 생성된 아이템 반환
- `GET /api/items`
  - 전체 아이템 리스트 반환
- `PUT /api/items/:id`
  - body: `{ "text": "..." }`
  - 수정된 아이템 반환
- `DELETE /api/items/:id`
  - 삭제된 아이템 반환

## 데이터 저장 방식
- 파일 경로: `data/items.json`
- 서버 시작 시 파일이 없으면 자동 생성합니다.
