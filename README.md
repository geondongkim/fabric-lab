# fabric-lab

Simple Express server for local API checks.

## Run

1. Install dependencies:
  cd server && npm install
2. Start server:
  npm start

## Where to see output messages

- Terminal output (server logs):
  - `Server is running on port 3000`
  - `GET / 요청 수신`
- HTTP response output (client/browser/curl/Postman):
  - `{"status":"OK","message":"조회에 성공했습니다."}`

## Endpoint

- `GET /` -> health-style response JSON

## Azure Release Deployment (No .env in Git)

Do not commit `.env`. Keep secrets in Azure App Service Application Settings.

1. Azure DevOps `3dt005` -> project `fabric-lab` -> Release pipeline `Release-2`.
2. In the Azure App Service stage/task, set app settings (or use an Azure App Service Settings task):
  - `TENANT_ID=$(TENANT_ID)`
  - `CLIENT_ID=$(CLIENT_ID)`
  - `CLIENT_SECRET=$(CLIENT_SECRET)`
  - `GRAPHQL_ENDPOINT=$(GRAPHQL_ENDPOINT)`
  - `WEBSITE_NODE_DEFAULT_VERSION=~24`
  - `WEBSITES_PORT=3000`
3. In Release variables, create `TENANT_ID`, `CLIENT_ID`, `CLIENT_SECRET`, `GRAPHQL_ENDPOINT` and mark secrets appropriately.
4. Redeploy release.

Validation:
- `GET /` should return `tokenReady: true`.
- `GET /v1/travels` should stop returning auth-related 401/502 once app settings are correct.

PowerShell note:
- Use `Invoke-WebRequest -UseBasicParsing` to avoid interactive security prompt.
- Use `curl.exe` instead of `curl` because PowerShell aliases `curl` to `Invoke-WebRequest`.
