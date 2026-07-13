const DEFAULT_API_URL = "http://localhost:3000";

const configured = process.env.EXPO_PUBLIC_API_URL;
if (!configured) {
  console.warn(
    `[config] EXPO_PUBLIC_API_URL이 설정되지 않아 기본값(${DEFAULT_API_URL})을 사용합니다. ` +
      "Android 에뮬레이터는 10.0.2.2, 실기기는 개발 머신의 LAN IP를 써야 합니다. .env.example 참고."
  );
}

export const API_BASE_URL = configured ?? DEFAULT_API_URL;
