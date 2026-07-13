import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSION_KEY = "calendar_auth_session";

// expo-secure-store는 웹에서 지원되지 않는다(Keychain/Keystore가 없음) — 웹 빌드가
// 완전히 죽지 않도록 웹에서는 AsyncStorage(localStorage 기반)로 대체한다.
// 실제 배포 대상은 iOS/Android 네이티브이므로 그쪽은 항상 SecureStore를 사용한다.
const isWeb = Platform.OS === "web";

export async function readStoredSession(): Promise<string | null> {
  return isWeb
    ? AsyncStorage.getItem(SESSION_KEY)
    : SecureStore.getItemAsync(SESSION_KEY);
}

export async function writeStoredSession(raw: string): Promise<void> {
  if (isWeb) {
    await AsyncStorage.setItem(SESSION_KEY, raw);
  } else {
    await SecureStore.setItemAsync(SESSION_KEY, raw);
  }
}

export async function clearStoredSession(): Promise<void> {
  if (isWeb) {
    await AsyncStorage.removeItem(SESSION_KEY);
  } else {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  }
}
