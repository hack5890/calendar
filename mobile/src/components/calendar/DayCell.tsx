import { Pressable, Text, View } from "react-native";
import { EVENT_COLOR_CLASSES } from "@/lib/eventColors";
import { getTranslations } from "@/lib/i18n";
import type { OwnedEvent } from "@/lib/types";

interface DayCellProps {
  day: number;
  dateKey: string;
  inMonth: boolean;
  weekdayIndex: number;
  isToday: boolean;
  events: OwnedEvent[];
  isMerged: boolean;
  calendarMarkColorClass: (ownerId: string) => string;
  onPress: () => void;
  t: ReturnType<typeof getTranslations>;
}

export default function DayCell({
  day,
  inMonth,
  weekdayIndex,
  isToday,
  events,
  isMerged,
  calendarMarkColorClass,
  onPress,
  t,
}: DayCellProps) {
  const visible = events.slice(0, 2);
  const hiddenCount = events.length - visible.length;

  return (
    <Pressable
      onPress={onPress}
      className={`w-[14.28%] aspect-square p-1 ${inMonth ? "" : "opacity-35"}`}
    >
      <View
        className={`flex-1 rounded-lg border p-1 overflow-hidden ${
          isToday
            ? "border-accent dark:border-accent-dark"
            : "border-black/10 dark:border-white/15"
        }`}
      >
        <View
          className={`w-5 h-5 rounded-full items-center justify-center ${
            isToday ? "bg-accent dark:bg-accent-dark" : ""
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              isToday
                ? "text-accent-foreground dark:text-accent-foreground-dark"
                : weekdayIndex === 0
                  ? "text-red-500 dark:text-red-400"
                  : weekdayIndex === 6
                    ? "text-blue-500 dark:text-blue-400"
                    : "text-foreground dark:text-foreground-dark"
            }`}
          >
            {day}
          </Text>
        </View>
        <View className="mt-0.5 gap-0.5">
          {visible.map((ev) => (
            <View
              key={ev.id}
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
                {ev.repeat ? "↻ " : ""}
                {ev.time ? `${ev.time} ` : ""}
                {ev.title}
              </Text>
            </View>
          ))}
          {hiddenCount > 0 && (
            <Text className="text-[9px] opacity-60 text-foreground dark:text-foreground-dark">
              {t.more(hiddenCount)}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
