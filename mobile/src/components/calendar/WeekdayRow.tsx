import { Text, View } from "react-native";
import { getTranslations } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/useLanguage";

export default function WeekdayRow() {
  const language = useLanguage();
  const t = getTranslations(language);

  return (
    <View className="flex-row mb-1">
      {t.weekdays.map((d, i) => (
        <View key={d} className="flex-1 items-center py-1">
          <Text
            className={`text-xs font-semibold ${
              i === 0
                ? "text-red-500 dark:text-red-400"
                : i === 6
                  ? "text-blue-500 dark:text-blue-400"
                  : "opacity-60 text-foreground dark:text-foreground-dark"
            }`}
          >
            {d}
          </Text>
        </View>
      ))}
    </View>
  );
}
