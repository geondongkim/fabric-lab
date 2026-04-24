# fabric-lab

Express API 서버 — Azure Fabric GraphQL 프록시 및 여행 데이터 조회.

## 로컬 실행

1. 의존성 설치:
  cd server && npm install
2. 서버 시작:
  npm start

## Where to see output messages

- Terminal output (server logs):
  - `Server is running on port 3000`
  - `GET / 요청 수신`
- HTTP response output (client/browser/curl/Postman):
  - `{"status":"OK","message":"조회에 성공했습니다."}`

## Endpoint

- `GET /` -> health-style response JSON

## Azure CI/CD 배포

### 아키텍처
- **빌드 파이프라인**: Azure DevOps `azure-pipelines.yml` — Android APK 빌드 + 서버 아티팩트 발행
- **릴리즈 파이프라인**: Azure DevOps Release Pipeline (ID=1) — `zipDeploy`로 App Service 배포
- **App Service**: `3dt005` (Linux, Node 24-lts, koreacentral)
- **배포 방식**: Run-From-Package (zip이 `/home/data/SitePackages/`에 읽기 전용 마운트)

### 중요: node_modules 포함 이유

Azure DevOps `zipDeploy`는 내부적으로 **Run-From-Package** 방식으로 동작합니다.
이 방식에서는 Oryx 빌드가 스킵되어 `npm install`이 실행되지 않습니다.
따라서 **빌드 시 `npm install --production`을 실행하여 `node_modules`를 zip에 포함**해야 합니다.

`azure-pipelines.yml`의 `Install Server Dependencies` 단계가 이를 처리합니다.

### 빌드 트리거

`azure-pipelines.yml`의 trigger는 `app/*` 경로만 감시합니다.
서버 코드(`server/`) 변경 시 빌드를 **수동으로 트리거**해야 합니다:

```powershell
$env:AZURE_EXTENSION_DIR = "$env:TEMP\az-ext-clean"
$token = az account get-access-token --resource "499b84ac-1321-427f-aa17-267ca6975798" --query accessToken -o tsv
$headers = @{'Authorization'="Bearer $token"; 'Content-Type'='application/json'}
$body = '{"definition":{"id":1},"sourceBranch":"refs/heads/main"}'
$build = Invoke-RestMethod -Uri "https://dev.azure.com/3dt005/fabric-lab/_apis/build/builds?api-version=7.1" -Method Post -Headers $headers -Body $body
Write-Host "Build queued: ID=$($build.id) status=$($build.status)"
```

### 릴리즈 트리거 (빌드 완료 후)

```powershell
$env:AZURE_EXTENSION_DIR = "$env:TEMP\az-ext-clean"
$token = az account get-access-token --resource "499b84ac-1321-427f-aa17-267ca6975798" --query accessToken -o tsv
$headers = @{'Authorization'="Bearer $token"; 'Content-Type'='application/json'}
$body = '{"definitionId":1}'
$rel = Invoke-RestMethod -Uri "https://vsrm.dev.azure.com/3dt005/fabric-lab/_apis/release/releases?api-version=7.1" -Method Post -Headers $headers -Body $body
Write-Host "Release ID: $($rel.id), Status: $($rel.status)"
```

### App Service 환경 변수 (Application Settings)

| 변수명 | 설명 |
|---|---|
| `TENANT_ID` | Azure AD 테넌트 ID |
| `CLIENT_ID` | 서비스 프린시플 클라이언트 ID |
| `CLIENT_SECRET` | 서비스 프린시플 시크릿 |
| `GRAPHQL_ENDPOINT` | Fabric GraphQL 엔드포인트 URL |
| `WEBSITES_PORT` | 서버 포트 (8080) |
| `WEBSITE_NODE_DEFAULT_VERSION` | Node.js 버전 (~24) |

`.env` 파일은 Git에 커밋하지 마세요. 시크릿은 App Service Application Settings에 저장하세요.
