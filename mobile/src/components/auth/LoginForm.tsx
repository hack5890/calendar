import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useAuth } from "@/lib/auth/AuthContext";
import { getTranslations } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/useLanguage";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type Mode = "login" | "register";

export default function LoginForm() {
  const language = useLanguage();
  const t = useMemo(() => getTranslations(language), [language]);
  const { login, register } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit() {
    setError(null);
    setPending(true);
    const action = mode === "login" ? login : register;
    const result = await action(username, password);
    setPending(false);
    if (result.error) {
      const code = result.error as keyof typeof t.authErrors;
      setError(t.authErrors[code] ?? t.genericError);
    }
  }

  return (
    <View className="w-full max-w-sm self-center rounded-xl bg-background dark:bg-background-dark border border-black/10 dark:border-white/15 overflow-hidden">
      <View className="h-1.5 bg-accent dark:bg-accent-dark" />
      <View className="p-6 gap-3">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-lg font-bold text-foreground dark:text-foreground-dark">
            {t.appName}
          </Text>
          <LanguageSwitcher />
        </View>

        <View className="flex-row mb-2 rounded-lg border border-black/10 dark:border-white/15 overflow-hidden">
          <Pressable
            onPress={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 py-2 items-center ${mode === "login" ? "bg-accent dark:bg-accent-dark" : ""}`}
          >
            <Text
              className={`text-sm font-medium ${
                mode === "login"
                  ? "text-accent-foreground dark:text-accent-foreground-dark"
                  : "text-foreground dark:text-foreground-dark"
              }`}
            >
              {t.login}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setMode("register");
              setError(null);
            }}
            className={`flex-1 py-2 items-center ${mode === "register" ? "bg-accent dark:bg-accent-dark" : ""}`}
          >
            <Text
              className={`text-sm font-medium ${
                mode === "register"
                  ? "text-accent-foreground dark:text-accent-foreground-dark"
                  : "text-foreground dark:text-foreground-dark"
              }`}
            >
              {t.register}
            </Text>
          </Pressable>
        </View>

        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder={t.username}
          autoCapitalize="none"
          autoComplete="username"
          className="w-full rounded-lg border border-black/10 dark:border-white/15 px-3 py-2 text-sm text-foreground dark:text-foreground-dark"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder={t.password}
          secureTextEntry
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="w-full rounded-lg border border-black/10 dark:border-white/15 px-3 py-2 text-sm text-foreground dark:text-foreground-dark"
        />
        {error && <Text className="text-xs text-red-500">{error}</Text>}
        <Pressable
          onPress={handleSubmit}
          disabled={pending || !username || !password}
          className={`w-full rounded-lg bg-accent dark:bg-accent-dark px-3 py-2.5 items-center ${
            pending ? "opacity-60" : ""
          }`}
        >
          <Text className="text-sm font-medium text-accent-foreground dark:text-accent-foreground-dark">
            {mode === "login" ? t.login : t.register}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
