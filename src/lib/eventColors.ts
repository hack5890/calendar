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

// Tailwind가 클래스명을 정적으로 스캔할 수 있도록 리터럴 문자열로 매핑한다.
export const EVENT_COLOR_CLASSES: Record<
  EventColor,
  { pill: string; dot: string; ring: string }
> = {
  red: {
    pill: "bg-event-red/15 text-event-red",
    dot: "bg-event-red",
    ring: "ring-event-red",
  },
  orange: {
    pill: "bg-event-orange/15 text-event-orange",
    dot: "bg-event-orange",
    ring: "ring-event-orange",
  },
  yellow: {
    pill: "bg-event-yellow/15 text-event-yellow",
    dot: "bg-event-yellow",
    ring: "ring-event-yellow",
  },
  green: {
    pill: "bg-event-green/15 text-event-green",
    dot: "bg-event-green",
    ring: "ring-event-green",
  },
  teal: {
    pill: "bg-event-teal/15 text-event-teal",
    dot: "bg-event-teal",
    ring: "ring-event-teal",
  },
  blue: {
    pill: "bg-event-blue/15 text-event-blue",
    dot: "bg-event-blue",
    ring: "ring-event-blue",
  },
  purple: {
    pill: "bg-event-purple/15 text-event-purple",
    dot: "bg-event-purple",
    ring: "ring-event-purple",
  },
  pink: {
    pill: "bg-event-pink/15 text-event-pink",
    dot: "bg-event-pink",
    ring: "ring-event-pink",
  },
};
