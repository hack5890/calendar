import { useColorScheme } from "react-native";

// tailwind.config.js의 색상 값과 동일하게 유지할 것 — lucide-react-native 아이콘은 SVG라
// className(다크모드 variant 포함)으로 색을 받지 못해 직접 색상 코드를 넘겨야 한다.
const PALETTE = {
  foreground: "#171717",
  foregroundDark: "#ededed",
  accent: "#4f46e5",
  accentDark: "#818cf8",
  repeatAccent: "#d97706",
  repeatAccentDark: "#fbbf24",
} as const;

export function useIconColor(
  kind: "foreground" | "accent" | "repeatAccent" = "foreground"
): string {
  const isDark = useColorScheme() === "dark";
  switch (kind) {
    case "accent":
      return isDark ? PALETTE.accentDark : PALETTE.accent;
    case "repeatAccent":
      return isDark ? PALETTE.repeatAccentDark : PALETTE.repeatAccent;
    default:
      return isDark ? PALETTE.foregroundDark : PALETTE.foreground;
  }
}
