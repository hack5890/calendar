import { View } from "react-native";
import { router } from "expo-router";
import { useCalendar } from "@/lib/calendar/CalendarContext";
import { toDateKey } from "@/lib/calendarLogic";
import { getTranslations } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/useLanguage";
import DayCell from "./DayCell";

export default function MonthGrid() {
  const language = useLanguage();
  const t = getTranslations(language);
  const { cells, eventsForDate } = useCalendar();

  const today = new Date();
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <View className="flex-row flex-wrap">
      {cells.map(({ day, dateKey, inMonth }, index) => (
        <DayCell
          key={dateKey}
          day={day}
          dateKey={dateKey}
          inMonth={inMonth}
          weekdayIndex={index % 7}
          isToday={dateKey === todayKey}
          events={eventsForDate(dateKey)}
          onPress={() => router.push(`/day/${dateKey}`)}
          t={t}
        />
      ))}
    </View>
  );
}
