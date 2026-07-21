"use client";

import { CalendarDays, Search, Settings } from "lucide-react";
import type { Translations } from "@/lib/i18n";

export type MobileTab = "calendar" | "search" | "settings";

interface MobileTabBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  t: Translations;
}

// 모바일 전용 하단 탭 내비게이션. sm 이상(데스크톱)에서는 숨겨지고,
// 데스크톱에서는 기존처럼 모든 패널이 한 화면에 동시에 노출된다.
export default function MobileTabBar({
  activeTab,
  onTabChange,
  t,
}: MobileTabBarProps) {
  const tabs: { key: MobileTab; label: string; Icon: typeof CalendarDays }[] = [
    { key: "calendar", label: t.tabCalendar, Icon: CalendarDays },
    { key: "search", label: t.tabSearch, Icon: Search },
    { key: "settings", label: t.tabSettings, Icon: Settings },
  ];

  return (
    <nav
      className="sm:hidden fixed inset-x-0 bottom-0 z-30 flex items-stretch bg-background border-t border-black/10 dark:border-white/15 pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile navigation"
    >
      {tabs.map(({ key, label, Icon }) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onTabChange(key)}
            className={[
              "flex-1 min-h-14 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
              isActive ? "text-accent" : "opacity-60 hover:opacity-100",
            ].join(" ")}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="w-5 h-5" />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
