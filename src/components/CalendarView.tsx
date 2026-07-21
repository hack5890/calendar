"use client";

import type { TouchEvent } from "react";
import { ChevronLeft, ChevronRight, Repeat } from "lucide-react";
import { EVENT_COLOR_CLASSES } from "@/lib/eventColors";
import type { Translations } from "@/lib/i18n";
import {
  collectEventsForDate,
  formatWeekRangeLabel,
  type OwnedEvent,
} from "@/lib/calendarLogic";

interface CalendarViewProps {
  view: "month" | "week";
  onViewChange: (view: "month" | "week") => void;
  year: number;
  month: number;
  weekDates: string[];
  cells: { day: number; dateKey: string; inMonth: boolean }[];
  eventsByDate: Map<string, OwnedEvent[]>;
  searchPool: OwnedEvent[];
  todayKey: string;
  selectedDate: string | null;
  onSelectDate: (dateKey: string) => void;
  trimmedQuery: string;
  isMerged: boolean;
  calendarMarkColorClass: (ownerId: string) => string;
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
  goToPrevWeek: () => void;
  goToNextWeek: () => void;
  goToToday: () => void;
  gridEntered: boolean;
  slideDirection: "left" | "right";
  onGridTouchStart: (e: TouchEvent<HTMLDivElement>) => void;
  onGridTouchMove: (e: TouchEvent<HTMLDivElement>) => void;
  onGridTouchEnd: () => void;
  t: Translations;
  className?: string;
}

// 월/주 뷰 전환 토글, 이전/오늘/다음 내비게이션, 월간/주간 그리드를 담당하는 패널.
// 모바일에서는 "캘린더" 탭의 내용이고, 데스크톱에서는 항상 노출된다.
export default function CalendarView({
  view,
  onViewChange,
  year,
  month,
  weekDates,
  cells,
  eventsByDate,
  searchPool,
  todayKey,
  selectedDate,
  onSelectDate,
  trimmedQuery,
  isMerged,
  calendarMarkColorClass,
  goToPrevMonth,
  goToNextMonth,
  goToPrevWeek,
  goToNextWeek,
  goToToday,
  gridEntered,
  slideDirection,
  onGridTouchStart,
  onGridTouchMove,
  onGridTouchEnd,
  t,
  className,
}: CalendarViewProps) {
  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          {view === "month"
            ? new Date(year, month).toLocaleString(t.locale, {
                month: "long",
                year: "numeric",
              })
            : formatWeekRangeLabel(weekDates, t.locale)}
        </h1>
        <div className="flex items-center gap-1.5">
          <button
            onClick={view === "week" ? goToPrevWeek : goToPrevMonth}
            className="min-w-11 min-h-11 flex items-center justify-center rounded-lg border border-black/10 dark:border-white/15 hover:bg-accent/10 hover:border-accent/40 hover:text-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={view === "week" ? t.prevWeek : t.prevMonth}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-accent/40 text-accent hover:bg-accent/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {t.today}
          </button>
          <button
            onClick={view === "week" ? goToNextWeek : goToNextMonth}
            className="min-w-11 min-h-11 flex items-center justify-center rounded-lg border border-black/10 dark:border-white/15 hover:bg-accent/10 hover:border-accent/40 hover:text-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={view === "week" ? t.nextWeek : t.nextMonth}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="ml-1.5 flex rounded-lg border border-black/10 dark:border-white/15 overflow-hidden text-sm">
            <button
              onClick={() => onViewChange("month")}
              className={
                "px-2.5 py-1.5 font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent " +
                (view === "month"
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/10")
              }
            >
              {t.monthView}
            </button>
            <button
              onClick={() => onViewChange("week")}
              className={
                "px-2.5 py-1.5 font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent " +
                (view === "week"
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/10")
              }
            >
              {t.weekView}
            </button>
          </div>
        </div>
      </div>

      {view === "month" && (
        <>
          <div className="grid grid-cols-7 text-center text-xs font-semibold mb-1">
            {t.weekdays.map((d, i) => (
              <div
                key={d}
                className={[
                  "py-1",
                  i === 0
                    ? "text-red-500 dark:text-red-400"
                    : i === 6
                      ? "text-blue-500 dark:text-blue-400"
                      : "opacity-60",
                ].join(" ")}
              >
                {d}
              </div>
            ))}
          </div>

          <div
            className="overflow-hidden"
            onTouchStart={onGridTouchStart}
            onTouchMove={onGridTouchMove}
            onTouchEnd={onGridTouchEnd}
          >
            <div
              key={`${year}-${month}`}
              className={[
                "grid grid-cols-7 gap-1.5 transition-transform duration-300 ease-out",
                gridEntered
                  ? "translate-x-0"
                  : slideDirection === "left"
                    ? "translate-x-full"
                    : "-translate-x-full",
              ].join(" ")}
            >
              {cells.map(({ day, dateKey, inMonth }, index) => {
                const dayEvents = eventsByDate.get(dateKey) ?? [];
                const isToday = dateKey === todayKey;
                const isSearchMatch =
                  trimmedQuery.length > 0 && dayEvents.length > 0;
                const isSelected = dateKey === selectedDate;
                const weekdayIndex = index % 7;
                return (
                  <button
                    key={dateKey}
                    onClick={() => onSelectDate(dateKey)}
                    className={[
                      "aspect-square sm:aspect-auto sm:h-24 flex flex-col items-start p-1.5 rounded-lg border text-left overflow-hidden transition-colors",
                      isSelected
                        ? "border-accent bg-accent/10"
                        : "border-black/10 dark:border-white/15",
                      inMonth ? "" : "opacity-35",
                      isToday ? "ring-2 ring-offset-1 ring-accent" : "",
                      isSearchMatch && !isToday
                        ? "ring-2 ring-offset-1 ring-accent/50"
                        : "",
                      "hover:bg-accent/5 hover:border-accent/30",
                      "outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-accent",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full",
                        isToday
                          ? "bg-accent text-accent-foreground"
                          : weekdayIndex === 0
                            ? "text-red-500 dark:text-red-400"
                            : weekdayIndex === 6
                              ? "text-blue-500 dark:text-blue-400"
                              : "",
                      ].join(" ")}
                    >
                      {day}
                    </span>
                    <div className="mt-0.5 w-full space-y-0.5 overflow-hidden">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className={[
                            "truncate text-[10px] leading-tight rounded px-1 py-0.5",
                            ev.color
                              ? EVENT_COLOR_CLASSES[ev.color].pill
                              : ev.repeat
                                ? "bg-repeat-accent/15 text-repeat-accent"
                                : "bg-accent/10 text-accent",
                          ].join(" ")}
                        >
                          {isMerged && (
                            <span
                              className={[
                                "inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle shrink-0",
                                calendarMarkColorClass(ev.ownerId),
                              ].join(" ")}
                            />
                          )}
                          {ev.repeat ? (
                            <Repeat className="inline w-3 h-3 mr-0.5 align-middle" />
                          ) : (
                            ""
                          )}
                          {ev.time ? `${ev.time} ` : ""}
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[10px] opacity-60">
                          {t.more(dayEvents.length - 2)}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {view === "week" && (
        <div className="grid grid-cols-7 gap-1.5">
          {weekDates.map((dateKey, index) => {
            const dayEvents = collectEventsForDate(searchPool, dateKey);
            const isToday = dateKey === todayKey;
            const isSelected = dateKey === selectedDate;
            const dayNumber = Number(dateKey.split("-")[2]);
            return (
              <div
                key={dateKey}
                className="flex flex-col rounded-lg border border-black/10 dark:border-white/15 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => onSelectDate(dateKey)}
                  className={[
                    "flex flex-col items-center gap-0.5 py-1.5 text-xs font-semibold transition-colors",
                    isSelected ? "bg-accent/10" : "",
                    "hover:bg-accent/5",
                    "outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
                  ].join(" ")}
                >
                  <span
                    className={
                      index === 0
                        ? "text-red-500 dark:text-red-400"
                        : index === 6
                          ? "text-blue-500 dark:text-blue-400"
                          : "opacity-60"
                    }
                  >
                    {t.weekdays[index]}
                  </span>
                  <span
                    className={[
                      "w-6 h-6 flex items-center justify-center rounded-full",
                      isToday ? "bg-accent text-accent-foreground" : "",
                    ].join(" ")}
                  >
                    {dayNumber}
                  </span>
                </button>
                <div className="flex-1 min-h-24 max-h-64 overflow-y-auto p-1 space-y-1">
                  {dayEvents.map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => onSelectDate(dateKey)}
                      className={[
                        "w-full truncate text-left text-[11px] leading-tight rounded px-1.5 py-1",
                        ev.color
                          ? EVENT_COLOR_CLASSES[ev.color].pill
                          : ev.repeat
                            ? "bg-repeat-accent/15 text-repeat-accent"
                            : "bg-accent/10 text-accent",
                      ].join(" ")}
                    >
                      {isMerged && (
                        <span
                          className={[
                            "inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle shrink-0",
                            calendarMarkColorClass(ev.ownerId),
                          ].join(" ")}
                        />
                      )}
                      {ev.repeat && (
                        <Repeat className="inline w-3 h-3 mr-0.5 align-middle" />
                      )}
                      {ev.time && <span className="mr-1">{ev.time}</span>}
                      {ev.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
