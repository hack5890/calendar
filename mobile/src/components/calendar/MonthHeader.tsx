import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useAuth } from "@/lib/auth/AuthContext";
import { useCalendar } from "@/lib/calendar/CalendarContext";
import { calendarLabel, formatWeekRangeLabel } from "@/lib/calendarLogic";
import { getTranslations } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { useIconColor } from "@/lib/useIconColor";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function MonthHeader() {
  const language = useLanguage();
  const t = getTranslations(language);
  const { user, logout } = useAuth();
  const {
    year,
    month,
    selectedCalendar,
    selectedOwnerIds,
    isMerged,
    isOwnSelected,
    goPrevMonth,
    goNextMonth,
    goToday,
    view,
    setView,
    weekDates,
    goPrevWeek,
    goNextWeek,
  } = useCalendar();
  const iconColor = useIconColor();

  const title =
    view === "month"
      ? new Date(year, month).toLocaleString(t.locale, { month: "long", year: "numeric" })
      : formatWeekRangeLabel(weekDates, t.locale);

  return (
    <View className="mb-3">
      <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-black/10 dark:border-white/15">
        <Pressable
          onPress={() => router.push("/calendar-picker")}
          hitSlop={8}
          className="flex-row items-center gap-1.5 rounded-lg border border-black/10 dark:border-white/15 px-2.5 py-1.5"
        >
          <Text className="text-sm text-foreground dark:text-foreground-dark">
            {isMerged ? t.multipleCalendars(selectedOwnerIds.length) : calendarLabel(t, selectedCalendar)}
          </Text>
          <View style={{ opacity: 0.5 }}>
            <ChevronDown size={14} color={iconColor} />
          </View>
        </Pressable>
        <View className="flex-row items-center gap-1.5">
          <Text className="text-xs opacity-60 text-foreground dark:text-foreground-dark">
            {user?.username}
          </Text>
          {isOwnSelected && (
            <Pressable
              onPress={() => router.push("/share")}
              hitSlop={8}
              className="px-2.5 py-1.5 rounded-lg border border-black/10 dark:border-white/15"
            >
              <Text className="text-xs font-medium text-foreground dark:text-foreground-dark">
                {t.share}
              </Text>
            </Pressable>
          )}
          {!isMerged && (
            <Pressable
              onPress={() => router.push("/activity-log")}
              hitSlop={8}
              className="px-2.5 py-1.5 rounded-lg border border-black/10 dark:border-white/15"
            >
              <Text className="text-xs font-medium text-foreground dark:text-foreground-dark">
                {t.activityLog}
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => logout()}
            hitSlop={8}
            className="px-2.5 py-1.5 rounded-lg border border-black/10 dark:border-white/15"
          >
            <Text className="text-xs font-medium text-foreground dark:text-foreground-dark">
              {t.logout}
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="flex-row items-center justify-between mb-3 flex-wrap gap-2">
        <Text className="text-xl font-bold text-foreground dark:text-foreground-dark">
          {title}
        </Text>
        <View className="flex-row items-center gap-1.5 flex-wrap">
          <Pressable
            onPress={view === "week" ? goPrevWeek : goPrevMonth}
            accessibilityLabel={view === "week" ? t.prevWeek : t.prevMonth}
            className="w-11 h-11 items-center justify-center rounded-lg border border-black/10 dark:border-white/15"
          >
            <ChevronLeft size={18} color={iconColor} />
          </Pressable>
          <Pressable
            onPress={goToday}
            hitSlop={8}
            className="px-3 py-1.5 rounded-lg border border-accent/40 dark:border-accent-dark/40"
          >
            <Text className="text-sm font-medium text-accent dark:text-accent-dark">
              {t.today}
            </Text>
          </Pressable>
          <Pressable
            onPress={view === "week" ? goNextWeek : goNextMonth}
            accessibilityLabel={view === "week" ? t.nextWeek : t.nextMonth}
            className="w-11 h-11 items-center justify-center rounded-lg border border-black/10 dark:border-white/15"
          >
            <ChevronRight size={18} color={iconColor} />
          </Pressable>
          <View className="flex-row rounded-lg border border-black/10 dark:border-white/15 overflow-hidden">
            <Pressable
              onPress={() => setView("month")}
              className={`px-2.5 py-1.5 ${view === "month" ? "bg-accent dark:bg-accent-dark" : ""}`}
            >
              <Text
                className={`text-xs font-medium ${
                  view === "month"
                    ? "text-accent-foreground dark:text-accent-foreground-dark"
                    : "text-foreground dark:text-foreground-dark"
                }`}
              >
                {t.monthView}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setView("week")}
              className={`px-2.5 py-1.5 ${view === "week" ? "bg-accent dark:bg-accent-dark" : ""}`}
            >
              <Text
                className={`text-xs font-medium ${
                  view === "week"
                    ? "text-accent-foreground dark:text-accent-foreground-dark"
                    : "text-foreground dark:text-foreground-dark"
                }`}
              >
                {t.weekView}
              </Text>
            </Pressable>
          </View>
          <View className="ml-1.5">
            <LanguageSwitcher />
          </View>
        </View>
      </View>
    </View>
  );
}
