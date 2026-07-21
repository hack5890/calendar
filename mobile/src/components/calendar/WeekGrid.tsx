import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Repeat } from "lucide-react-native";
import { useCalendar } from "@/lib/calendar/CalendarContext";
import { toDateKey } from "@/lib/calendarLogic";
import { EVENT_COLOR_CLASSES } from "@/lib/eventColors";
import { getTranslations } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { useIconColor } from "@/lib/useIconColor";

// src/components/CalendarView.tsx의 주간(week) 뷰와 동일한 레이아웃: 요일별 7칸 컬럼,
// 각 컬럼 안에 그날 발생하는 이벤트를 스크롤 가능한 필 목록으로 보여준다.
export default function WeekGrid() {
  const language = useLanguage();
  const t = getTranslations(language);
  const { weekDates, eventsForDate, isMerged, calendarMarkColorClass } = useCalendar();
  const repeatColor = useIconColor("repeatAccent");

  const today = new Date();
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <View className="flex-row flex-wrap">
      {weekDates.map((dateKey, index) => {
        const dayEvents = eventsForDate(dateKey);
        const isToday = dateKey === todayKey;
        const dayNumber = Number(dateKey.split("-")[2]);

        return (
          <View
            key={dateKey}
            className="w-[14.28%] p-0.5"
          >
            <View className="rounded-lg border border-black/10 dark:border-white/15 overflow-hidden">
              <Pressable
                onPress={() => router.push(`/day/${dateKey}`)}
                className="items-center gap-0.5 py-1.5"
              >
                <Text
                  className={`text-[10px] font-semibold ${
                    index === 0
                      ? "text-red-500 dark:text-red-400"
                      : index === 6
                        ? "text-blue-500 dark:text-blue-400"
                        : "opacity-60 text-foreground dark:text-foreground-dark"
                  }`}
                >
                  {t.weekdays[index]}
                </Text>
                <View
                  className={`w-5 h-5 rounded-full items-center justify-center ${
                    isToday ? "bg-accent dark:bg-accent-dark" : ""
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      isToday
                        ? "text-accent-foreground dark:text-accent-foreground-dark"
                        : "text-foreground dark:text-foreground-dark"
                    }`}
                  >
                    {dayNumber}
                  </Text>
                </View>
              </Pressable>
              <ScrollView className="h-24 p-0.5" nestedScrollEnabled>
                <View className="gap-0.5">
                  {dayEvents.map((ev) => (
                    <Pressable
                      key={ev.id}
                      onPress={() => router.push(`/day/${dateKey}`)}
                      className={`flex-row items-center gap-0.5 rounded px-1 py-0.5 ${
                        ev.color
                          ? EVENT_COLOR_CLASSES[ev.color].pill
                          : ev.repeat
                            ? "bg-repeat-accent/15 dark:bg-repeat-accent-dark/15"
                            : "bg-accent/10 dark:bg-accent-dark/10"
                      }`}
                    >
                      {isMerged && (
                        <View
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${calendarMarkColorClass(ev.ownerId)}`}
                        />
                      )}
                      {ev.repeat && <Repeat size={7} color={repeatColor} />}
                      <Text
                        numberOfLines={1}
                        className={`flex-1 text-[9px] leading-tight ${
                          ev.color
                            ? EVENT_COLOR_CLASSES[ev.color].text
                            : ev.repeat
                              ? "text-repeat-accent dark:text-repeat-accent-dark"
                              : "text-accent dark:text-accent-dark"
                        }`}
                      >
                        {ev.time ? `${ev.time} ` : ""}
                        {ev.title}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        );
      })}
    </View>
  );
}
