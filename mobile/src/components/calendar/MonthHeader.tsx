import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth/AuthContext";
import { useCalendar } from "@/lib/calendar/CalendarContext";
import { calendarLabel } from "@/lib/calendarLogic";
import { getTranslations } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/useLanguage";
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
  } = useCalendar();

  const monthTitle = new Date(year, month).toLocaleString(t.locale, {
    month: "long",
    year: "numeric",
  });

  return (
    <View className="mb-3">
      <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-black/10 dark:border-white/15">
        <Pressable
          onPress={() => router.push("/calendar-picker")}
          className="flex-row items-center gap-1.5 rounded-lg border border-black/10 dark:border-white/15 px-2.5 py-1.5"
        >
          <Text className="text-sm text-foreground dark:text-foreground-dark">
            {isMerged ? t.multipleCalendars(selectedOwnerIds.length) : calendarLabel(t, selectedCalendar)}
          </Text>
          <Text className="text-xs opacity-50 text-foreground dark:text-foreground-dark">▾</Text>
        </Pressable>
        <View className="flex-row items-center gap-1.5">
          <Text className="text-xs opacity-60 text-foreground dark:text-foreground-dark">
            {user?.username}
          </Text>
          {isOwnSelected && (
            <Pressable
              onPress={() => router.push("/share")}
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
              className="px-2.5 py-1.5 rounded-lg border border-black/10 dark:border-white/15"
            >
              <Text className="text-xs font-medium text-foreground dark:text-foreground-dark">
                {t.activityLog}
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => logout()}
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
          {monthTitle}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <Pressable
            onPress={goPrevMonth}
            accessibilityLabel={t.prevMonth}
            className="w-8 h-8 items-center justify-center rounded-lg border border-black/10 dark:border-white/15"
          >
            <Text className="text-foreground dark:text-foreground-dark">←</Text>
          </Pressable>
          <Pressable
            onPress={goToday}
            className="px-3 py-1.5 rounded-lg border border-accent/40 dark:border-accent-dark/40"
          >
            <Text className="text-sm font-medium text-accent dark:text-accent-dark">
              {t.today}
            </Text>
          </Pressable>
          <Pressable
            onPress={goNextMonth}
            accessibilityLabel={t.nextMonth}
            className="w-8 h-8 items-center justify-center rounded-lg border border-black/10 dark:border-white/15"
          >
            <Text className="text-foreground dark:text-foreground-dark">→</Text>
          </Pressable>
          <View className="ml-1.5">
            <LanguageSwitcher />
          </View>
        </View>
      </View>
    </View>
  );
}
