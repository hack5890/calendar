"use client";

import { useMemo, useState, type FormEvent } from "react";
import { login, register } from "@/lib/actions";
import { getTranslations } from "@/lib/i18n";
import { setLanguage, useLanguage } from "@/lib/useLanguage";

type Mode = "login" | "register";

export default function LoginForm() {
  const language = useLanguage();
  const t = useMemo(() => getTranslations(language), [language]);
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const action = mode === "login" ? login : register;
    const result = await action(username, password);
    setPending(false);
    if (result?.error) setError(t.authErrors[result.error]);
  }

  return (
    <div className="w-full max-w-sm rounded-xl bg-background text-foreground border border-black/10 dark:border-white/15 shadow-2xl overflow-hidden">
      <div className="h-1.5 bg-accent" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-lg font-bold">{t.appName}</h1>
          <div className="flex rounded-lg border border-black/10 dark:border-white/15 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={
                "px-2 py-1 font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent " +
                (language === "en"
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/10")
              }
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage("ko")}
              className={
                "px-2 py-1 font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent " +
                (language === "ko"
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/10")
              }
            >
              한국어
            </button>
          </div>
        </div>

        <div className="flex mb-5 rounded-lg border border-black/10 dark:border-white/15 overflow-hidden text-sm">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={
              "flex-1 py-1.5 font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent " +
              (mode === "login"
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/10")
            }
          >
            {t.login}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={
              "flex-1 py-1.5 font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent " +
              (mode === "register"
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/10")
            }
          >
            {t.register}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder={t.username}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="w-full rounded-lg border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            required
          />
          <input
            type="password"
            placeholder={t.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="w-full rounded-lg border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            required
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full px-3 py-2 text-sm font-medium rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {mode === "login" ? t.login : t.register}
          </button>
        </form>
      </div>
    </div>
  );
}
