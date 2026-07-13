import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getTranslations } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/useLanguage";
import CalendarPickerList from "@/components/calendar/CalendarPickerList";

export default function CalendarPickerScreen() {
  const language = useLanguage();
  const t = useMemo(() => getTranslations(language), [language]);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row items-center justify-between px-5 pt-5 mb-2">
        <Text className="text-lg font-bold text-foreground dark:text-foreground-dark">
          {t.calendarPicker}
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text className="text-sm opacity-60 text-foreground dark:text-foreground-dark">
            {t.close}
          </Text>
        </Pressable>
      </View>
      <CalendarPickerList onSelect={() => router.back()} />
    </SafeAreaView>
  );
}
