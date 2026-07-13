import { apiFetch } from "@/lib/api/client";

export interface AuthUser {
  id: string;
  username: string;
}

export interface AuthSession {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

export function register(username: string, password: string): Promise<AuthSession> {
  return apiFetch<AuthSession>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function login(username: string, password: string): Promise<AuthSession> {
  return apiFetch<AuthSession>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function logout(): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>("/api/auth/logout", { method: "POST" });
}

export function me(): Promise<AuthUser> {
  return apiFetch<AuthUser>("/api/auth/me");
}
