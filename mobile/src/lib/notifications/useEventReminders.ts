import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { eventOccursOnDate, toDateKey } from "@/lib/calendarLogic";
import type { OwnedEvent } from "@/lib/types";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// 발생(occurrence) 인스턴스가 실체화되지 않으므로(웹 버전과 동일 전제), 오늘부터 이 범위
// 안에서 다음 발생일을 직접 탐색해 그 발생 하나에 대한 알림만 예약한다. 그 발생이 지나가면
// 다음 발생에 대한 예약은 앱이 다시 열려 이 훅이 재실행될 때 이어서 생성된다(웹의 30초
// 폴링과 달리 네이티브 알림은 앱이 백그라운드/종료 상태여도 울리므로, 이 정도로 충분하다).
const SEARCH_HORIZON_DAYS = 366;

function findNextReminderDate(event: OwnedEvent, now: Date): Date | null {
  if (event.reminderMinutesBefore == null || !event.time) return null;
  const [hh, mm] = event.time.split(":").map(Number);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let i = 0; i <= SEARCH_HORIZON_DAYS; i++) {
    const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const dateKey = toDateKey(day.getFullYear(), day.getMonth(), day.getDate());
    if (!eventOccursOnDate(event, dateKey)) continue;

    const eventTime = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hh, mm);
    const reminderTime = new Date(eventTime.getTime() - event.reminderMinutesBefore * 60_000);
    if (reminderTime > now) return reminderTime;
  }
  return null;
}

// events가 바뀔 때마다(최초 로드, 저장, 삭제) 이 훅이 예약했던 알림을 전부 취소하고
// 현재 events 기준으로 다시 예약한다. CalendarProvider 안에서 호출된다.
export function useEventReminders(events: OwnedEvent[]): void {
  const scheduledIdsRef = useRef<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      let permission = await Notifications.getPermissionsAsync();
      if (permission.status !== "granted") {
        permission = await Notifications.requestPermissionsAsync();
      }
      if (permission.status !== "granted" || cancelled) return;

      for (const id of scheduledIdsRef.current) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
      scheduledIdsRef.current = [];

      const now = new Date();
      const nextIds: string[] = [];
      for (const event of events) {
        const reminderDate = findNextReminderDate(event, now);
        if (!reminderDate) continue;

        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: event.title,
            body: [event.time, event.description].filter(Boolean).join(" · "),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: reminderDate,
          },
        });
        nextIds.push(id);
      }

      if (cancelled) {
        for (const id of nextIds) {
          await Notifications.cancelScheduledNotificationAsync(id);
        }
      } else {
        scheduledIdsRef.current = nextIds;
      }
    }

    sync();

    return () => {
      cancelled = true;
    };
  }, [events]);
}
