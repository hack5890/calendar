import { Pressable, Text, View } from "react-native";
import { Trash2 } from "lucide-react-native";
import { getTranslations } from "@/lib/i18n";
import { useIconColor } from "@/lib/useIconColor";
import type { ShareSummary } from "@/lib/types";

interface ShareListProps {
  shares: ShareSummary[];
  onRevoke: (sharedWithId: string) => void;
  t: ReturnType<typeof getTranslations>;
}

export default function ShareList({ shares, onRevoke, t }: ShareListProps) {
  const mutedColor = useIconColor();

  if (shares.length === 0) {
    return (
      <Text className="text-xs opacity-60 mb-4 text-foreground dark:text-foreground-dark">
        {t.noShares}
      </Text>
    );
  }

  return (
    <View className="gap-2 mb-4">
      {shares.map((s) => (
        <View
          key={s.id}
          className="flex-row items-center justify-between gap-2 rounded-lg border border-black/10 dark:border-white/15 px-3 py-2"
        >
          <Text className="flex-1 text-sm text-foreground dark:text-foreground-dark">
            {s.sharedWithUsername}
            <Text className="text-[11px] opacity-60"> ({s.permission === "edit" ? t.permissionEdit : t.permissionView})</Text>
          </Text>
          <Pressable
            onPress={() => onRevoke(s.sharedWithId)}
            accessibilityLabel={t.revoke}
            hitSlop={16}
          >
            <View style={{ opacity: 0.6 }}>
              <Trash2 size={16} color={mutedColor} />
            </View>
          </Pressable>
        </View>
      ))}
    </View>
  );
}
