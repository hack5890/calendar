import { Pressable, Text, View } from "react-native";
import { EVENT_COLOR_CLASSES } from "@/lib/eventColors";
import { getTranslations } from "@/lib/i18n";
import type { CalendarEvent } from "@/lib/types";

interface DayEventListProps {
  events: CalendarEvent[];
  canEdit: boolean;
  onEdit: (event: CalendarEvent) => void;
  onRequestDelete: (event: CalendarEvent) => void;
  t: ReturnType<typeof getTranslations>;
}

export default function DayEventList({
  events,
  canEdit,
  onEdit,
  onRequestDelete,
  t,
}: DayEventListProps) {
  if (events.length === 0) {
    return (
      <Text className="text-sm opacity-60 mb-3 text-foreground dark:text-foreground-dark">
        {t.noEvents}
      </Text>
    );
  }

  return (
    <View className="gap-2 mb-4">
      {events.map((ev) => (
        <View
          key={ev.id}
          className="flex-row items-center justify-between gap-2 rounded-lg border border-black/10 dark:border-white/15 px-3 py-2"
        >
          <Pressable
            className="flex-1"
            disabled={!canEdit}
            onPress={() => canEdit && onEdit(ev)}
          >
            <View className="flex-row items-center flex-wrap gap-1">
              {ev.color && (
                <View className={`w-2 h-2 rounded-full ${EVENT_COLOR_CLASSES[ev.color].dot}`} />
              )}
              {ev.repeat && (
                <Text className="text-repeat-accent dark:text-repeat-accent-dark text-xs">
                  ↻
                </Text>
              )}
              <Text className="font-medium text-sm text-foreground dark:text-foreground-dark">
                {ev.title}
              </Text>
              {ev.time && (
                <Text className="text-xs text-accent dark:text-accent-dark">{ev.time}</Text>
              )}
            </View>
            {ev.repeat && (ev.repeatInterval ?? 1) > 1 && (
              <Text className="text-[11px] text-repeat-accent dark:text-repeat-accent-dark mt-0.5">
                {t.repeatEvery} {ev.repeatInterval} {t.repeatUnits[ev.repeat]}
              </Text>
            )}
          </Pressable>
          {canEdit && (
            <Pressable onPress={() => onRequestDelete(ev)} accessibilityLabel={t.deleteEvent}>
              <Text className="opacity-60">🗑</Text>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}
