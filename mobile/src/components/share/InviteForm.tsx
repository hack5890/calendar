import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { getTranslations } from "@/lib/i18n";
import type { SharePermission } from "@/lib/types";

interface InviteFormProps {
  onSubmit: (username: string, permission: SharePermission) => Promise<{ error?: string }>;
  t: ReturnType<typeof getTranslations>;
}

export default function InviteForm({ onSubmit, t }: InviteFormProps) {
  const [username, setUsername] = useState("");
  const [permission, setPermission] = useState<SharePermission>("view");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!username.trim()) return;
    const result = await onSubmit(username, permission);
    if (result.error) {
      const code = result.error as keyof typeof t.shareErrors;
      setError(t.shareErrors[code] ?? t.genericError);
      return;
    }
    setError(null);
    setUsername("");
  }

  return (
    <View className="gap-3">
      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder={t.shareUsernamePlaceholder}
        autoCapitalize="none"
        className="w-full rounded-lg border border-black/10 dark:border-white/15 px-3 py-2 text-sm text-foreground dark:text-foreground-dark"
      />
      <View className="flex-row rounded-lg border border-black/10 dark:border-white/15 overflow-hidden">
        <Pressable
          onPress={() => setPermission("view")}
          className={`flex-1 py-2 items-center ${permission === "view" ? "bg-accent dark:bg-accent-dark" : ""}`}
        >
          <Text
            className={`text-sm ${
              permission === "view"
                ? "text-accent-foreground dark:text-accent-foreground-dark"
                : "text-foreground dark:text-foreground-dark"
            }`}
          >
            {t.permissionView}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setPermission("edit")}
          className={`flex-1 py-2 items-center ${permission === "edit" ? "bg-accent dark:bg-accent-dark" : ""}`}
        >
          <Text
            className={`text-sm ${
              permission === "edit"
                ? "text-accent-foreground dark:text-accent-foreground-dark"
                : "text-foreground dark:text-foreground-dark"
            }`}
          >
            {t.permissionEdit}
          </Text>
        </Pressable>
      </View>
      {error && <Text className="text-xs text-red-500">{error}</Text>}
      <Pressable
        onPress={handleSubmit}
        className="self-end px-3 py-1.5 rounded-lg bg-accent dark:bg-accent-dark"
      >
        <Text className="text-sm font-medium text-accent-foreground dark:text-accent-foreground-dark">
          {t.share}
        </Text>
      </Pressable>
    </View>
  );
}
