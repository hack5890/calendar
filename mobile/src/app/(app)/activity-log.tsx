import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as calendarsApi from "@/lib/api/calendars";
import { useCalendar } from "@/lib/calendar/CalendarContext";
import { getTranslations } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/useLanguage";
import ActivityLogList from "@/components/activity/ActivityLogList";
import type { ActivityLogEntry } from "@/lib/types";

export default function ActivityLogScreen() {
  const language = useLanguage();
  const t = useMemo(() => getTranslations(language), [language]);
  const { selectedOwnerIds } = useCalendar();
  const ownerId = selectedOwnerIds[0];

  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // 화면 마운트 시 1회 데이터 로드 — share.tsx와 동일한 fetch-on-mount 패턴.
  useEffect(() => {
    if (!ownerId) return;
    calendarsApi
      .getActivityLog(ownerId)
      .then(setEntries)
      .finally(() => setLoading(false));
  }, [ownerId]);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1">
        <View className="p-5">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-foreground dark:text-foreground-dark">
              {t.activityLog}
            </Text>
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Text className="text-sm opacity-60 text-foreground dark:text-foreground-dark">
                {t.close}
              </Text>
            </Pressable>
          </View>
          {!loading && <ActivityLogList entries={entries} t={t} />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
