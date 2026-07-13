export const EVENT_COLORS = [
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
] as const;

export type EventColor = (typeof EVENT_COLORS)[number];

// tailwind.config.js에 등록된 event-* 색상 토큰(라이트/다크 쌍)에 대응한다.
// RN은 className 하나에 배경/텍스트 색을 함께 못 넣는 경우가 있어(View vs Text)
// pill(배경)과 text(글자색)를 분리해서 제공한다.
export const EVENT_COLOR_CLASSES: Record<
  EventColor,
  { pill: string; text: string; dot: string; ring: string }
> = {
  red: {
    pill: "bg-event-red/15 dark:bg-event-red-dark/15",
    text: "text-event-red dark:text-event-red-dark",
    dot: "bg-event-red dark:bg-event-red-dark",
    ring: "ring-event-red dark:ring-event-red-dark",
  },
  orange: {
    pill: "bg-event-orange/15 dark:bg-event-orange-dark/15",
    text: "text-event-orange dark:text-event-orange-dark",
    dot: "bg-event-orange dark:bg-event-orange-dark",
    ring: "ring-event-orange dark:ring-event-orange-dark",
  },
  yellow: {
    pill: "bg-event-yellow/15 dark:bg-event-yellow-dark/15",
    text: "text-event-yellow dark:text-event-yellow-dark",
    dot: "bg-event-yellow dark:bg-event-yellow-dark",
    ring: "ring-event-yellow dark:ring-event-yellow-dark",
  },
  green: {
    pill: "bg-event-green/15 dark:bg-event-green-dark/15",
    text: "text-event-green dark:text-event-green-dark",
    dot: "bg-event-green dark:bg-event-green-dark",
    ring: "ring-event-green dark:ring-event-green-dark",
  },
  teal: {
    pill: "bg-event-teal/15 dark:bg-event-teal-dark/15",
    text: "text-event-teal dark:text-event-teal-dark",
    dot: "bg-event-teal dark:bg-event-teal-dark",
    ring: "ring-event-teal dark:ring-event-teal-dark",
  },
  blue: {
    pill: "bg-event-blue/15 dark:bg-event-blue-dark/15",
    text: "text-event-blue dark:text-event-blue-dark",
    dot: "bg-event-blue dark:bg-event-blue-dark",
    ring: "ring-event-blue dark:ring-event-blue-dark",
  },
  purple: {
    pill: "bg-event-purple/15 dark:bg-event-purple-dark/15",
    text: "text-event-purple dark:text-event-purple-dark",
    dot: "bg-event-purple dark:bg-event-purple-dark",
    ring: "ring-event-purple dark:ring-event-purple-dark",
  },
  pink: {
    pill: "bg-event-pink/15 dark:bg-event-pink-dark/15",
    text: "text-event-pink dark:text-event-pink-dark",
    dot: "bg-event-pink dark:bg-event-pink-dark",
    ring: "ring-event-pink dark:ring-event-pink-dark",
  },
};
