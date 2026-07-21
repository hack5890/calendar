import { Pressable, Text, View } from "react-native";
import { Repeat, Trash2 } from "lucide-react-native";
import { EVENT_COLOR_CLASSES } from "@/lib/eventColors";
import { calendarLabel } from "@/lib/calendarLogic";
import { getTranslations } from "@/lib/i18n";
import { useIconColor } from "@/lib/useIconColor";
import type { CalendarSummary, OwnedEvent } from "@/lib/types";

interface DayEventListProps {
  events: OwnedEvent[];
  editableOwnerIds: Set<string>;
  isMerged: boolean;
  calendars: CalendarSummary[];
  calendarMarkColorClass: (ownerId: string) => string;
  onEdit: (event: OwnedEvent) => void;
  onRequestDelete: (event: OwnedEvent) => void;
  t: ReturnType<typeof getTranslations>;
}

export default function DayEventList({
  events,
  editableOwnerIds,
  isMerged,
  calendars,
  calendarMarkColorClass,
  onEdit,
  onRequestDelete,
  t,
}: DayEventListProps) {
  const repeatColor = useIconColor("repeatAccent");
  const mutedColor = useIconColor();

  if (events.length === 0) {
    return (
      <Text className="text-sm opacity-60 mb-3 text-foreground dark:text-foreground-dark">
        {t.noEvents}
      </Text>
    );
  }

  return (
    <View className="gap-2 mb-4">
      {events.map((ev) => {
        const canEdit = editableOwnerIds.has(ev.ownerId);
        return (
          <View
            key={ev.id}
            className="flex-row items-center justify-between gap-2 rounded-lg border border-black/10 dark:border-white/15 px-3 py-2"
          >
            <Pressable className="flex-1" disabled={!canEdit} onPress={() => canEdit && onEdit(ev)}>
              <View className="flex-row items-center flex-wrap gap-1">
                {isMerged && (
                  <View className={`w-2 h-2 rounded-full ${calendarMarkColorClass(ev.ownerId)}`} />
                )}
                {ev.color && (
                  <View className={`w-2 h-2 rounded-full ${EVENT_COLOR_CLASSES[ev.color].dot}`} />
                )}
                {ev.repeat && <Repeat size={12} color={repeatColor} />}
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
              {isMerged && (
                <Text className="text-[11px] opacity-60 mt-0.5 text-foreground dark:text-foreground-dark">
                  {calendarLabel(t, calendars.find((c) => c.ownerId === ev.ownerId))}
                </Text>
              )}
            </Pressable>
            {canEdit && (
              <Pressable
                onPress={() => onRequestDelete(ev)}
                accessibilityLabel={t.deleteEvent}
                hitSlop={16}
              >
                <View style={{ opacity: 0.6 }}>
                  <Trash2 size={16} color={mutedColor} />
                </View>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}
