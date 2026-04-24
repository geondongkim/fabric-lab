# fabric-lab

Simple Express server for local API checks.

## Run

1. Install dependencies:
   npm install
2. Start server:
   node server/index.js

## Where to see output messages

- Terminal output (server logs):
  - `Server is running on port 3000`
  - `GET / 요청 수신`
- HTTP response output (client/browser/curl/Postman):
  - `{"status":"OK","message":"조회에 성공했습니다."}`

## Endpoint

- `GET /` -> health-style response JSON
