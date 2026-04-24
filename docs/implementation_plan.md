# Implementation Notes

Date: 2026-04-24

## Completed

- Confirmed `.env` is ignored and not tracked by Git.
- Added `start` script in `server/package.json` for deployment/runtime consistency.
- Hardened `server/index.js` GraphQL route to avoid undefined property crashes.
- Added safer error diagnostics (`upstreamStatus`, non-JSON guard, missing env keys hint).
- Removed token echo from root response body.
- Documented Azure DevOps Release (`3dt005` / `fabric-lab` / `Release-2`) app settings flow in README.

## Validation

- `npm start` runs `server/index.js` successfully.
- `GET /` returns 200 and `tokenReady` state.
- `/v1/travels` no longer throws uncaught `TypeError`; now returns controlled error JSON when upstream auth fails.
