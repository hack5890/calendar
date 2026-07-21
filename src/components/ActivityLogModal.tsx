"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getActivityLog, type ActivityLogSummary } from "@/lib/actions";
import type { Translations } from "@/lib/i18n";

interface ActivityLogModalProps {
  ownerId: string;
  onClose: () => void;
  t: Translations;
}

// 특정 캘린더(ownerId)의 최근 활동(추가/수정/삭제) 내역을 보여주는 모달.
export default function ActivityLogModal({
  ownerId,
  onClose,
  t,
}: ActivityLogModalProps) {
  const [entries, setEntries] = useState<ActivityLogSummary[]>([]);
  const [loading, setLoading] = useState(true);
  // 모바일 바텀시트의 슬라이드업 진입 애니메이션 트리거.
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    getActivityLog(ownerId).then((log) => {
      setEntries(log);
      setLoading(false);
    });
  }, [ownerId]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  function describe(entry: ActivityLogSummary): string {
    if (entry.action === "created") {
      return t.activityCreated(entry.actorUsername, entry.eventTitle);
    }
    if (entry.action === "updated") {
      return t.activityUpdated(entry.actorUsername, entry.eventTitle);
    }
    return t.activityDeleted(entry.actorUsername, entry.eventTitle);
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
            <h2 className="text-lg font-bold">{t.activityLog}</h2>
            <button
              onClick={onClose}
              className="min-w-11 min-h-11 flex items-center justify-center opacity-60 hover:opacity-100 hover:text-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
              aria-label={t.close}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!loading && (
            <ul className="space-y-2 max-h-80 overflow-y-auto">
              {entries.length === 0 && (
                <li className="text-xs opacity-60">{t.noActivity}</li>
              )}
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-lg border border-black/10 dark:border-white/15 px-3 py-2 text-sm"
                >
                  <p>{describe(entry)}</p>
                  <p className="mt-0.5 text-[11px] opacity-60">
                    {new Date(entry.createdAt).toLocaleString(t.locale)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
