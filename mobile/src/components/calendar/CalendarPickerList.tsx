import { Pressable, Text, View } from "react-native";
import { EVENT_COLORS, EVENT_COLOR_CLASSES } from "@/lib/eventColors";
import { getTranslations } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { useCalendar } from "@/lib/calendar/CalendarContext";
import type { CalendarSummary } from "@/lib/types";

export default function CalendarPickerList({ onSelect }: { onSelect: () => void }) {
  const language = useLanguage();
  const t = getTranslations(language);
  const { calendars, selectedOwnerId, selectCalendar } = useCalendar();

  function markColorClass(index: number) {
    return EVENT_COLOR_CLASSES[EVENT_COLORS[index % EVENT_COLORS.length]].dot;
  }

  function label(c: CalendarSummary) {
    return c.isOwn ? t.myCalendar : t.calendarOf(c.ownerUsername);
  }

  return (
    <View className="gap-1 p-2">
      {calendars.map((c, index) => (
        <Pressable
          key={c.ownerId}
          onPress={() => {
            selectCalendar(c.ownerId);
            onSelect();
          }}
          className={`flex-row items-center gap-2 px-3 py-2.5 rounded-lg ${
            c.ownerId === selectedOwnerId ? "bg-accent/10 dark:bg-accent-dark/10" : ""
          }`}
        >
          <View className={`w-2 h-2 rounded-full ${markColorClass(index)}`} />
          <Text className="flex-1 text-sm text-foreground dark:text-foreground-dark">
            {label(c)}
          </Text>
          {c.permission === "view" && (
            <Text className="text-[10px] opacity-60 text-foreground dark:text-foreground-dark">
              {t.viewOnlyBadge}
            </Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}
