"use client";

import { X } from "lucide-react";
import type { CalendarEvent } from "@/lib/types";
import { EVENT_COLOR_CLASSES } from "@/lib/eventColors";
import type { Translations } from "@/lib/i18n";
import type { OwnedEvent } from "@/lib/calendarLogic";

interface SearchPanelProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  trimmedQuery: string;
  searchResults: OwnedEvent[];
  onJumpToEvent: (event: CalendarEvent) => void;
  t: Translations;
  className?: string;
}

// 일정 검색 입력창과 검색 결과 드롭다운. 모바일에서는 "검색" 탭의 내용이고,
// 데스크톱에서는 상단에 항상 노출된다.
export default function SearchPanel({
  searchQuery,
  onSearchQueryChange,
  trimmedQuery,
  searchResults,
  onJumpToEvent,
  t,
  className,
}: SearchPanelProps) {
  return (
    <div className={["relative mb-3", className ?? ""].join(" ")}>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        placeholder={t.searchPlaceholder}
        className="w-full rounded-lg border border-black/10 dark:border-white/15 bg-transparent px-3 py-1.5 pr-8 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => onSearchQueryChange("")}
          aria-label={t.clearSearch}
          className="absolute right-0 top-1/2 -translate-y-1/2 min-w-11 min-h-11 flex items-center justify-center opacity-60 hover:opacity-100 hover:text-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      {trimmedQuery && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-black/10 dark:border-white/15 bg-background shadow-lg max-h-64 overflow-y-auto">
          {searchResults.length === 0 ? (
            <p className="px-3 py-2 text-sm opacity-60">{t.noSearchResults}</p>
          ) : (
            searchResults.map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => onJumpToEvent(ev)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-accent/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span className="truncate">
                  {ev.color && (
                    <span
                      className={[
                        "inline-block w-2 h-2 rounded-full mr-1.5 align-middle",
                        EVENT_COLOR_CLASSES[ev.color].dot,
                      ].join(" ")}
                    />
                  )}
                  {ev.title}
                </span>
                <span className="text-xs opacity-60 shrink-0">{ev.date}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
