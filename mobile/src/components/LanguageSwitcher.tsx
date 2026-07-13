import { Pressable, Text, View } from "react-native";
import { setLanguage, useLanguage } from "@/lib/i18n/useLanguage";

export default function LanguageSwitcher() {
  const language = useLanguage();

  return (
    <View className="flex-row rounded-lg border border-black/10 dark:border-white/15 overflow-hidden">
      <Pressable
        onPress={() => setLanguage("en")}
        className={`px-2.5 py-1.5 ${language === "en" ? "bg-accent dark:bg-accent-dark" : ""}`}
      >
        <Text
          className={`text-xs font-medium ${
            language === "en"
              ? "text-accent-foreground dark:text-accent-foreground-dark"
              : "text-foreground dark:text-foreground-dark"
          }`}
        >
          EN
        </Text>
      </Pressable>
      <Pressable
        onPress={() => setLanguage("ko")}
        className={`px-2.5 py-1.5 ${language === "ko" ? "bg-accent dark:bg-accent-dark" : ""}`}
      >
        <Text
          className={`text-xs font-medium ${
            language === "ko"
              ? "text-accent-foreground dark:text-accent-foreground-dark"
              : "text-foreground dark:text-foreground-dark"
          }`}
        >
          한국어
        </Text>
      </Pressable>
    </View>
  );
}
