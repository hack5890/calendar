"use client";

import { useSyncExternalStore } from "react";
import { LANGUAGE_STORAGE_KEY, type Language } from "./i18n";

type Listener = () => void;

const listeners = new Set<Listener>();
let cached: Language | null = null;

// localStorage에서 언어 설정을 읽어온다(클라이언트에서만, 최초 1회).
function readStoredLanguage(): Language {
  if (cached !== null) return cached;
  const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  cached = saved === "ko" ? "ko" : "en";
  return cached;
}

function getServerSnapshot(): Language {
  return "en";
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// 언어를 변경하고 localStorage에 저장한 뒤 구독 중인 컴포넌트를 리렌더시킨다.
export function setLanguage(lang: Language) {
  cached = lang;
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  listeners.forEach((listener) => listener());
}

// useSyncExternalStore로 localStorage 값을 구독한다.
// 서버 렌더링 시에는 항상 "en"을 반환해 하이드레이션 불일치를 피한다.
export function useLanguage(): Language {
  return useSyncExternalStore(subscribe, readStoredLanguage, getServerSnapshot);
}
