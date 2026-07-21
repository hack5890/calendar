"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Trash2, X } from "lucide-react";
import {
  getMyShares,
  shareCalendar,
  unshareCalendar,
  type ShareSummary,
  type SharePermission,
} from "@/lib/actions";
import type { Translations } from "@/lib/i18n";

interface ShareModalProps {
  onClose: () => void;
  t: Translations;
}

// 내 캘린더를 다른 사용자와 공유(보기/편집 권한 부여)하고, 기존 공유 목록을 관리하는 모달.
export default function ShareModal({ onClose, t }: ShareModalProps) {
  const [shares, setShares] = useState<ShareSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [permission, setPermission] = useState<SharePermission>("view");
  const [error, setError] = useState<string | null>(null);
  // 모바일 바텀시트의 슬라이드업 진입 애니메이션 트리거.
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    getMyShares().then((s) => {
      setShares(s);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;
    const result = await shareCalendar(username, permission);
    if (result?.error) {
      setError(t.shareErrors[result.error]);
      return;
    }
    setError(null);
    setUsername("");
    setShares(await getMyShares());
  }

  async function handleRevoke(sharedWithId: string) {
    setShares((prev) => prev.filter((s) => s.sharedWithId !== sharedWithId));
    await unshareCalendar(sharedWithId);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:p-4"
      onClick={onClose}
    >
      <div
        className={[
          "w-full sm:max-w-sm rounded-t-xl sm:rounded-xl bg-background text-foreground border border-black/10 dark:border-white/15 shadow-2xl overflow-hidden",
          "transition-transform duration-300 ease-out sm:transition-none sm:translate-y-0",
          entered ? "translate-y-0" : "translate-y-full",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 bg-accent" />
        <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{t.shareTitle}</h2>
            <button
              onClick={onClose}
              className="min-w-11 min-h-11 flex items-center justify-center opacity-60 hover:opacity-100 hover:text-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
              aria-label={t.close}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!loading && (
            <ul className="mb-4 space-y-2 max-h-40 overflow-y-auto">
              {shares.length === 0 && (
                <li className="text-xs opacity-60">{t.noShares}</li>
              )}
              {shares.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-black/10 dark:border-white/15 px-3 py-2 text-sm"
                >
                  <span className="flex-1 truncate">
                    {s.sharedWithUsername}
                    <span className="ml-2 text-[11px] opacity-60">
                      {s.permission === "edit"
                        ? t.permissionEdit
                        : t.permissionView}
                    </span>
                  </span>
                  <button
                    onClick={() => handleRevoke(s.sharedWithId)}
                    className="min-w-11 min-h-11 flex items-center justify-center shrink-0 opacity-60 hover:opacity-100 hover:text-red-500 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                    aria-label={t.revoke}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder={t.shareUsernamePlaceholder}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value as SharePermission)}
              className="w-full rounded-lg border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="view">{t.permissionView}</option>
              <option value="edit">{t.permissionEdit}</option>
            </select>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
              >
                {t.share}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
