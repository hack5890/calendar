import { API_BASE_URL } from "@/lib/config";

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

// AuthContext가 로그인/로그아웃/부팅 시점에 갱신한다. 모듈 하나가 현재 토큰을 들고 있는 편이
// 매 호출마다 토큰을 인자로 넘기는 것보다 API 클라이언트 사용부를 단순하게 유지한다.
let currentToken: string | null = null;

export function setAuthToken(token: string | null): void {
  currentToken = token;
}

interface ApiSuccess<T> {
  data: T;
}
interface ApiFailure {
  error: { code: string; message: string };
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (currentToken) {
    headers.set("Authorization", `Bearer ${currentToken}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError("network_error", "네트워크 요청에 실패했습니다.", 0);
  }

  const body = (await response.json().catch(() => null)) as
    | ApiSuccess<T>
    | ApiFailure
    | null;

  if (!response.ok || !body || "error" in body) {
    const error = body && "error" in body ? body.error : null;
    throw new ApiError(
      error?.code ?? "unknown_error",
      error?.message ?? "알 수 없는 오류가 발생했습니다.",
      response.status
    );
  }

  return body.data;
}
