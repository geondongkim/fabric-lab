# Expo React Native 프로젝트 팁

Date: 2026-04-24  
App 위치: `app/` (create-expo-app@latest, expo-router, TypeScript)

---

## 프로젝트 구조

```
fabric-lab/
├── server/          # Node.js Express API (Azure App Service 배포)
│   └── index.js     # GraphQL 프록시 → Azure Fabric
└── app/             # Expo React Native 앱
    ├── app/         # expo-router 기반 파일 시스템 라우터
    ├── components/
    ├── constants/
    ├── hooks/
    └── assets/
```

---

## 개발 시작

```bash
cd app
npx expo start          # QR 코드로 Expo Go 앱에서 확인
npx expo start --android  # Android 에뮬레이터
npx expo start --ios      # iOS 시뮬레이터 (Mac 전용)
npx expo start --web      # 웹 브라우저
```

---

## server/ API 연동 팁

### 로컬 개발 시 서버 주소
- Android 에뮬레이터: `http://10.0.2.2:8080` (localhost 대신)
- iOS 시뮬레이터: `http://localhost:8080`
- 실기기(Expo Go): PC의 실제 IP (예: `http://192.168.x.x:8080`)

### 권장: 환경별 Base URL 관리

`app/constants/api.ts` 파일 생성:
```ts
import Constants from 'expo-constants';

// app.json extra 또는 .env로 주입
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080';
```

`app/.env.local` (gitignore됨):
```
EXPO_PUBLIC_API_URL=http://10.0.2.2:8080
```

프로덕션:
```
EXPO_PUBLIC_API_URL=https://3dt005-hhe8d7frerbef3hb.koreacentral-01.azurewebsites.net
```

> **주의**: Expo에서 환경변수는 `EXPO_PUBLIC_` 접두사가 있어야 클라이언트에서 접근 가능

---

## expo-router 라우팅 기본

- `app/app/index.tsx` → `/` 루트 화면
- `app/app/(tabs)/` → 탭 네비게이션
- `app/app/modal.tsx` → 모달 화면
- 동적 라우트: `app/app/[id].tsx` → `/1`, `/2` 등

---

## Android 빌드 (로컬)

```bash
# 사전 조건: cmdline-tools, Java JDK 설치
cd app

# Managed Workflow (Expo Go로 테스트)
npx expo start --android

# Bare Workflow (네이티브 빌드)
npx expo prebuild          # android/, ios/ 폴더 생성
npx expo run:android       # Gradle 빌드 후 에뮬레이터 실행
```

> `android/`, `ios/` 폴더는 .gitignore에 등록됨 — `prebuild`로 재생성 가능

---

## EAS Build (클라우드 빌드, 권장)

```bash
npm install -g eas-cli
eas login
eas build:configure     # eas.json 생성
eas build --platform android --profile preview  # APK 빌드
eas build --platform android --profile production  # AAB 빌드
```

`eas.json` 예시:
```json
{
  "build": {
    "preview": {
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

---

## 성능 팁

- `app.json`에 `"newArchEnabled": true` 이미 설정됨 (React Native New Architecture)
- `"reactCompiler": true` 실험적 기능 활성화됨 → 불필요한 re-render 자동 최적화
- 이미지는 `expo-image` 사용 (내장 `<Image>` 대신) → 캐싱, 성능 우수

---

## 유용한 패키지 (필요 시 추가)

```bash
# HTTP 클라이언트
npx expo install axios
# 또는 기본 fetch 사용 (추가 설치 불필요)

# 상태 관리
npx expo install zustand
# 또는
npx expo install @reduxjs/toolkit react-redux

# 보안 저장소 (토큰 저장)
npx expo install expo-secure-store

# 로컬 DB
npx expo install expo-sqlite
```

---

## 주요 환경변수 정보

| 변수 | 값 |
|---|---|
| `ANDROID_HOME` | `C:\Users\EL035\AppData\Local\Android\Sdk` |
| `ANDROID_SDK_ROOT` | 동일 |
| sdkmanager | `20.0` (cmdline-tools/latest) |
| adb | `1.0.41` |
| Build Tools | `36.1.0`, `37.0.0` |
| Platform | `android-36.1` |

---

## 자주 쓰는 명령어

```bash
# 캐시 초기화
npx expo start --clear

# 타입 체크
cd app && npx tsc --noEmit

# 린트
cd app && npm run lint

# 의존성 호환성 확인 (expo 버전에 맞게)
npx expo install --check
npx expo install --fix
```
