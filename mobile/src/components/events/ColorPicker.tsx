import { Pressable, Text, View } from "react-native";
import { X } from "lucide-react-native";
import { EVENT_COLORS, EVENT_COLOR_CLASSES, type EventColor } from "@/lib/eventColors";
import { getTranslations } from "@/lib/i18n";
import { useIconColor } from "@/lib/useIconColor";

interface ColorPickerProps {
  value: EventColor | undefined;
  onChange: (color: EventColor | undefined) => void;
  t: ReturnType<typeof getTranslations>;
}

export default function ColorPicker({ value, onChange, t }: ColorPickerProps) {
  const iconColor = useIconColor();

  return (
    <View>
      <Text className="text-xs opacity-60 mb-1 text-foreground dark:text-foreground-dark">
        {t.color}
      </Text>
      <View className="flex-row flex-wrap items-center gap-2">
        <Pressable
          onPress={() => onChange(undefined)}
          accessibilityLabel={t.colorNone}
          hitSlop={8}
          className={`w-7 h-7 rounded-full border border-black/20 dark:border-white/25 items-center justify-center ${
            value === undefined ? "border-2 border-accent dark:border-accent-dark" : ""
          }`}
        >
          <View style={{ opacity: 0.7 }}>
            <X size={14} color={iconColor} strokeWidth={2} />
          </View>
        </Pressable>
        {EVENT_COLORS.map((c) => (
          <Pressable
            key={c}
            onPress={() => onChange(c)}
            accessibilityLabel={t.colorNames[c]}
            hitSlop={8}
            className={`w-7 h-7 rounded-full ${EVENT_COLOR_CLASSES[c].dot} ${
              value === c ? "border-2 border-black/40 dark:border-white/60" : ""
            }`}
          />
        ))}
      </View>
    </View>
  );
}
