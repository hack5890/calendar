export type Language = "en" | "ko";

export const LANGUAGE_STORAGE_KEY = "calendar:lang";

const dict = {
  en: {
    locale: "en-US",
    today: "Today",
    prevMonth: "Previous month",
    nextMonth: "Next month",
    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    more: (n: number) => `+${n} more`,
    close: "Close",
    deleteEvent: "Delete event",
    confirmDelete: "Delete this event?",
    cancel: "Cancel",
    deleteAction: "Delete",
    repeats: "Repeats",
    titlePlaceholder: "Title",
    descriptionPlaceholder: "Description (optional)",
    repeatOptions: {
      none: "Does not repeat",
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
      yearly: "Yearly",
    },
    repeatUntil: "Repeat until (optional)",
    repeatEvery: "Every",
    repeatUnits: {
      daily: "day(s)",
      weekly: "week(s)",
      monthly: "month(s)",
      yearly: "year(s)",
    },
    cancelEdit: "Cancel edit",
    update: "Update",
    add: "Add",
  },
  ko: {
    locale: "ko-KR",
    today: "오늘",
    prevMonth: "이전 달",
    nextMonth: "다음 달",
    weekdays: ["일", "월", "화", "수", "목", "금", "토"],
    more: (n: number) => `+${n}개 더보기`,
    close: "닫기",
    deleteEvent: "일정 삭제",
    confirmDelete: "이 일정을 삭제하시겠습니까?",
    cancel: "취소",
    deleteAction: "삭제",
    repeats: "반복",
    titlePlaceholder: "제목",
    descriptionPlaceholder: "설명 (선택)",
    repeatOptions: {
      none: "반복 안 함",
      daily: "매일",
      weekly: "매주",
      monthly: "매월",
      yearly: "매년",
    },
    repeatUntil: "반복 종료일 (선택)",
    repeatEvery: "매",
    repeatUnits: {
      daily: "일마다",
      weekly: "주마다",
      monthly: "개월마다",
      yearly: "년마다",
    },
    cancelEdit: "수정 취소",
    update: "수정",
    add: "추가",
  },
} satisfies Record<Language, unknown>;

export type Translations = (typeof dict)[Language];

export function getTranslations(lang: Language): Translations {
  return dict[lang];
}
