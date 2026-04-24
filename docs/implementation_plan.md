# Implementation Notes

Date: 2026-04-24 (updated: 2026-04-25)

## Completed

- Confirmed `.env` is ignored and not tracked by Git.
- Added `start` script in `server/package.json` for deployment/runtime consistency.
- Hardened `server/index.js` GraphQL route to avoid undefined property crashes.
- Added safer error diagnostics (`upstreamStatus`, non-JSON guard, missing env keys hint).
- Removed token echo from root response body.
- Documented Azure DevOps Release (`3dt005` / `fabric-lab` / `Release-2`) app settings flow in README.
- **[2026-04-25] HTTP 503 근본 원인 분석 및 수정**:
  - 원인: Azure DevOps `zipDeploy`가 내부적으로 **Run-From-Package** 방식으로 동작
  - Kudu 배포 로그: `"Skipping build. Project type: Run-From-Zip"` → Oryx `npm install` 스킵
  - zip이 `/home/data/SitePackages/`에 읽기 전용 마운트 → `node_modules` 없음 → Express 모듈 로드 실패 → 서버 크래시 → 503
  - 해결: `azure-pipelines.yml`에 `npm install --production` 단계 추가 (commit `c15da99`)
  - 이제 빌드 시 `node_modules`가 zip에 포함되어 Run-From-Package 배포 후에도 서버 정상 동작
- **[2026-04-25] Build #17 → Build #18 파이프라인 개선**:
  - Build #17 failed: Android SDK 단계 실패로 서버 단계 미실행 (아티팩트 미발행)
  - 해결 (commit `2a0f814`): Android 단계 `continueOnError: true` + 서버 단계 `condition: always()` 추가
  - Build #18: partiallySucceeded (Android SDK 부분 성공), 서버 단계 3개 모두 succeeded
  - Release #9: Build #18 server-drop 아티팩트 기반 배포 → **succeeded**
  - **최종 확인**: `https://3dt005-hhe8d7frerbef3hb.koreacentral-01.azurewebsites.net/` → **HTTP 200** ✅

## App Service 구성

- **OS**: Linux (`kind: app,linux`, `reserved: true`)
- **런타임**: `NODE|24-lts` (`linuxFxVersion`)
- **배포 방식**: Run-From-Package (Azure DevOps `zipDeploy` task 내부적으로 사용)
- **시작 명령**: `node index.js` (릴리즈 파이프라인 `StartupCommand` 설정)
- **URL**: `https://3dt005-hhe8d7frerbef3hb.koreacentral-01.azurewebsites.net`

## Kudu API 인증

- Basic auth (publishingCredentials): **401 실패** (SCM Basic Auth 비활성화 상태)
- **Azure AD Bearer token** 방식만 동작:
  ```powershell
  $token = az account get-access-token --resource "https://management.azure.com/" --query accessToken -o tsv
  $headers = @{'Authorization'="Bearer $token"}
  Invoke-RestMethod -Uri "https://3dt005-hhe8d7frerbef3hb.scm.koreacentral-01.azurewebsites.net/api/deployments" -Headers $headers
  ```

## Validation

- `npm start` runs `server/index.js` successfully.
- `GET /` returns 200 and `tokenReady` state.
- `/v1/travels` no longer throws uncaught `TypeError`; now returns controlled error JSON when upstream auth fails.
