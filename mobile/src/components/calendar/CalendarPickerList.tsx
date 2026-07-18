import { Pressable, Text, View } from "react-native";
import { getTranslations } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { useCalendar } from "@/lib/calendar/CalendarContext";
import { calendarLabel } from "@/lib/calendarLogic";

// 여러 캘린더를 동시에 체크해 겹쳐볼 수 있는 목록. 최소 하나는 항상 선택된 상태로 유지된다
// (CalendarContext.toggleCalendar가 마지막 하나를 해제하려는 시도를 무시한다).
export default function CalendarPickerList() {
  const language = useLanguage();
  const t = getTranslations(language);
  const { calendars, selectedOwnerIds, toggleCalendar, calendarMarkColorClass } = useCalendar();

  return (
    <View className="gap-1 p-2">
      {calendars.map((c) => {
        const checked = selectedOwnerIds.includes(c.ownerId);
        return (
          <Pressable
            key={c.ownerId}
            onPress={() => toggleCalendar(c.ownerId)}
            className={`flex-row items-center gap-2 px-3 py-2.5 rounded-lg ${
              checked ? "bg-accent/10 dark:bg-accent-dark/10" : ""
            }`}
          >
            <View
              className={`w-5 h-5 rounded-md border items-center justify-center ${
                checked
                  ? "bg-accent dark:bg-accent-dark border-accent dark:border-accent-dark"
                  : "border-black/20 dark:border-white/25"
              }`}
            >
              {checked && (
                <Text className="text-[11px] font-bold text-accent-foreground dark:text-accent-foreground-dark">
                  ✓
                </Text>
              )}
            </View>
            <View className={`w-2 h-2 rounded-full ${calendarMarkColorClass(c.ownerId)}`} />
            <Text className="flex-1 text-sm text-foreground dark:text-foreground-dark">
              {calendarLabel(t, c)}
            </Text>
            {c.permission === "view" && (
              <Text className="text-[10px] opacity-60 text-foreground dark:text-foreground-dark">
                {t.viewOnlyBadge}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
