import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCalendar } from "@/lib/calendar/CalendarContext";
import { getTranslations } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/useLanguage";
import DayEventList from "@/components/events/DayEventList";
import EventForm from "@/components/events/EventForm";
import ConfirmDeleteDialog from "@/components/events/ConfirmDeleteDialog";
import type { OwnedEvent } from "@/lib/types";

export default function DayScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const language = useLanguage();
  const t = useMemo(() => getTranslations(language), [language]);
  const {
    eventsForDate,
    calendars,
    isMerged,
    editableCalendars,
    editableOwnerIds,
    defaultTargetOwnerId,
    calendarMarkColorClass,
    saveEvent,
    deleteEvent,
  } = useCalendar();

  const [editing, setEditing] = useState<OwnedEvent | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<OwnedEvent | null>(null);

  const events = eventsForDate(date);
  const canAddNew = editableCalendars.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1">
        <View className="p-5">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-foreground dark:text-foreground-dark">
              {date}
            </Text>
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Text className="text-sm opacity-60 text-foreground dark:text-foreground-dark">
                {t.close}
              </Text>
            </Pressable>
          </View>

          <DayEventList
            events={events}
            editableOwnerIds={editableOwnerIds}
            isMerged={isMerged}
            calendars={calendars}
            calendarMarkColorClass={calendarMarkColorClass}
            onEdit={setEditing}
            onRequestDelete={setConfirmTarget}
            t={t}
          />

          {canAddNew && (
            <EventForm
              key={editing?.id ?? "new"}
              date={date}
              editing={editing}
              targetCalendars={editableCalendars}
              isMerged={isMerged}
              defaultOwnerId={defaultTargetOwnerId}
              calendarMarkColorClass={calendarMarkColorClass}
              onCancelEdit={() => setEditing(null)}
              t={t}
              onSubmit={(event, isEditing, ownerId) => {
                saveEvent({ ...event, ownerId }, isEditing);
                setEditing(null);
              }}
            />
          )}
        </View>
      </ScrollView>

      <ConfirmDeleteDialog
        visible={confirmTarget !== null}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (confirmTarget) deleteEvent(confirmTarget.id, confirmTarget.ownerId);
          setConfirmTarget(null);
        }}
        t={t}
      />
    </SafeAreaView>
  );
}
