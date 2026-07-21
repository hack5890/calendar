import { Text, View } from "react-native";
import { getTranslations } from "@/lib/i18n";
import type { ActivityLogEntry } from "@/lib/types";

interface ActivityLogListProps {
  entries: ActivityLogEntry[];
  t: ReturnType<typeof getTranslations>;
}

export default function ActivityLogList({ entries, t }: ActivityLogListProps) {
  if (entries.length === 0) {
    return (
      <Text className="text-xs opacity-60 text-foreground dark:text-foreground-dark">
        {t.noActivity}
      </Text>
    );
  }

  function describe(entry: ActivityLogEntry): string {
    if (entry.action === "created") return t.activityCreated(entry.actorUsername, entry.eventTitle);
    if (entry.action === "updated") return t.activityUpdated(entry.actorUsername, entry.eventTitle);
    return t.activityDeleted(entry.actorUsername, entry.eventTitle);
  }

  return (
    <View className="gap-2">
      {entries.map((entry) => (
        <View
          key={entry.id}
          className="rounded-lg border border-black/10 dark:border-white/15 px-3 py-2"
        >
          <Text className="text-sm text-foreground dark:text-foreground-dark">
            {describe(entry)}
          </Text>
          <Text className="mt-0.5 text-[11px] opacity-60 text-foreground dark:text-foreground-dark">
            {new Date(entry.createdAt).toLocaleString(t.locale)}
          </Text>
        </View>
      ))}
    </View>
  );
}
