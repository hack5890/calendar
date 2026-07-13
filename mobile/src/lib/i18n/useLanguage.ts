import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LANGUAGE_STORAGE_KEY, type Language } from "./index";

type Listener = () => void;

const listeners = new Set<Listener>();
// src/lib/useLanguage.ts와 같은 모듈 캐시 패턴이지만, AsyncStorage는 비동기이므로
// 이 캐시는 앱 부팅 시 bootstrapLanguage()가 채워준다. 채워지기 전 기본값은 "en"
// (웹의 getServerSnapshot과 동일한 SSR-safe 기본값 원칙).
let cached: Language = "en";

function readCachedLanguage(): Language {
  return cached;
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// 앱 시작 시 1회 호출: AsyncStorage에서 저장된 언어를 읽어 캐시를 채운다.
export async function bootstrapLanguage(): Promise<void> {
  const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  cached = saved === "ko" ? "ko" : "en";
  listeners.forEach((listener) => listener());
}

// 언어를 변경한다. UI는 즉시 반영하고(optimistic), AsyncStorage 쓰기는 백그라운드로 진행한다.
export function setLanguage(lang: Language): void {
  cached = lang;
  listeners.forEach((listener) => listener());
  void AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
}

export function useLanguage(): Language {
  return useSyncExternalStore(subscribe, readCachedLanguage, readCachedLanguage);
}
