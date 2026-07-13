import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError, setAuthToken } from "@/lib/api/client";
import * as authApi from "@/lib/api/auth";
import type { AuthUser } from "@/lib/api/auth";
import { clearStoredSession, readStoredSession, writeStoredSession } from "./secureSession";

type AuthStatus = "loading" | "guest" | "authed";

interface StoredSession {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<{ error?: string }>;
  register: (username: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function persistSession(session: StoredSession | null) {
  if (session) {
    await writeStoredSession(JSON.stringify(session));
  } else {
    await clearStoredSession();
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);

  // 앱 부팅 시 저장된 토큰이 있으면 서버에 유효성을 검증한다(src/proxy.ts의 쿠키 게이트에
  // 대응하는 클라이언트 사이드 처리 — 세션이 서버에서 만료/삭제됐을 수 있으므로 신뢰하지 않고 확인).
  useEffect(() => {
    (async () => {
      const raw = await readStoredSession();
      if (!raw) {
        setStatus("guest");
        return;
      }
      try {
        const session = JSON.parse(raw) as StoredSession;
        setAuthToken(session.token);
        const validatedUser = await authApi.me();
        setUser(validatedUser);
        setStatus("authed");
      } catch {
        setAuthToken(null);
        await persistSession(null);
        setStatus("guest");
      }
    })();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const session = await authApi.login(username, password);
      setAuthToken(session.token);
      await persistSession(session);
      setUser(session.user);
      setStatus("authed");
      return {};
    } catch (e) {
      return { error: e instanceof ApiError ? e.code : "unknown_error" };
    }
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    try {
      const session = await authApi.register(username, password);
      setAuthToken(session.token);
      await persistSession(session);
      setUser(session.user);
      setStatus("authed");
      return {};
    } catch (e) {
      return { error: e instanceof ApiError ? e.code : "unknown_error" };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // 서버 로그아웃이 실패해도 로컬 세션은 정리한다(best-effort).
    }
    setAuthToken(null);
    await persistSession(null);
    setUser(null);
    setStatus("guest");
  }, []);

  const value = useMemo(
    () => ({ status, user, login, register, logout }),
    [status, user, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
