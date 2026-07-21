"use client";

import type { RefObject } from "react";
import { ChevronDown } from "lucide-react";
import type { CalendarSummary } from "@/lib/actions";
import type { Language, Translations } from "@/lib/i18n";
import { setLanguage } from "@/lib/useLanguage";

interface SettingsPanelProps {
  calendars: CalendarSummary[];
  selectedOwnerIds: string[];
  isMerged: boolean;
  calendarLabel: (ownerId: string) => string;
  calendarMarkColorClass: (ownerId: string) => string;
  toggleCalendar: (ownerId: string) => void;
  calendarPickerOpen: boolean;
  onToggleCalendarPickerOpen: () => void;
  calendarPickerRef: RefObject<HTMLDivElement | null>;
  currentUsername: string;
  isOwnCalendarSelected: boolean;
  onShareClick: () => void;
  // 겹쳐보기 중이 아닐 때만 전달된다(활동 로그는 단일 캘린더 기준이므로).
  onActivityLogClick?: () => void;
  onLogout: () => void;
  language: Language;
  t: Translations;
  className?: string;
}

// 캘린더 겹쳐보기 선택, 공유, 로그아웃, 언어 전환을 모아놓은 "설정" 패널.
// 모바일에서는 하단 탭 중 "설정" 탭의 내용이고, 데스크톱에서는 상단에 항상 노출된다.
export default function SettingsPanel({
  calendars,
  selectedOwnerIds,
  isMerged,
  calendarLabel,
  calendarMarkColorClass,
  toggleCalendar,
  calendarPickerOpen,
  onToggleCalendarPickerOpen,
  calendarPickerRef,
  currentUsername,
  isOwnCalendarSelected,
  onShareClick,
  onActivityLogClick,
  onLogout,
  language,
  t,
  className,
}: SettingsPanelProps) {
  return (
    <div
      className={[
        "flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-black/10 dark:border-white/10 text-sm",
        className ?? "",
      ].join(" ")}
    >
      <div className="relative" ref={calendarPickerRef}>
        <button
          type="button"
          onClick={onToggleCalendarPickerOpen}
          className="flex items-center gap-1.5 min-h-11 rounded-lg border border-black/10 dark:border-white/15 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 hover:border-accent/40"
        >
          {isMerged
            ? t.multipleCalendars(selectedOwnerIds.length)
            : calendarLabel(selectedOwnerIds[0])}
          <ChevronDown className="w-4 h-4 opacity-50" />
        </button>
        {calendarPickerOpen && (
          <div className="absolute z-20 mt-1 w-60 rounded-lg border border-black/10 dark:border-white/15 bg-background shadow-lg p-1.5 space-y-0.5">
            {calendars.map((c) => (
              <label
                key={c.ownerId}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent/10 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedOwnerIds.includes(c.ownerId)}
                  onChange={() => toggleCalendar(c.ownerId)}
                  className="accent-accent"
                />
                <span
                  className={[
                    "inline-block w-2 h-2 rounded-full shrink-0",
                    calendarMarkColorClass(c.ownerId),
                  ].join(" ")}
                />
                <span className="truncate">
                  {c.isOwn ? t.myCalendar : t.calendarOf(c.ownerUsername)}
                </span>
                {c.permission === "view" && (
                  <span className="ml-auto text-[10px] opacity-60 shrink-0">
                    {t.viewOnlyBadge}
                  </span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs opacity-60">{currentUsername}</span>
        {isOwnCalendarSelected && (
          <button
            onClick={onShareClick}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-black/10 dark:border-white/15 hover:bg-accent/10 hover:border-accent/40 hover:text-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {t.share}
          </button>
        )}
        {onActivityLogClick && (
          <button
            onClick={onActivityLogClick}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-black/10 dark:border-white/15 hover:bg-accent/10 hover:border-accent/40 hover:text-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {t.activityLog}
          </button>
        )}
        <button
          onClick={onLogout}
          className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-black/10 dark:border-white/15 hover:bg-accent/10 hover:border-accent/40 hover:text-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {t.logout}
        </button>
        <div className="ml-1.5 flex rounded-lg border border-black/10 dark:border-white/15 overflow-hidden text-sm">
          <button
            onClick={() => setLanguage("en")}
            className={
              "px-2.5 py-1.5 font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent " +
              (language === "en"
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/10")
            }
          >
            EN
          </button>
          <button
            onClick={() => setLanguage("ko")}
            className={
              "px-2.5 py-1.5 font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent " +
              (language === "ko"
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/10")
            }
          >
            한국어
          </button>
        </div>
      </div>
    </div>
  );
}
