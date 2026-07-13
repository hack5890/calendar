import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as sharesApi from "@/lib/api/shares";
import { ApiError } from "@/lib/api/client";
import { getTranslations } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/useLanguage";
import ShareList from "@/components/share/ShareList";
import InviteForm from "@/components/share/InviteForm";
import type { SharePermission, ShareSummary } from "@/lib/types";

export default function ShareScreen() {
  const language = useLanguage();
  const t = useMemo(() => getTranslations(language), [language]);

  const [shares, setShares] = useState<ShareSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const list = await sharesApi.getShares();
    setShares(list);
  }, []);

  // 화면 마운트 시 1회 데이터 로드 — 표준 fetch-on-mount 패턴.
  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  async function handleRevoke(sharedWithId: string) {
    setShares((prev) => prev.filter((s) => s.sharedWithId !== sharedWithId));
    await sharesApi.deleteShare(sharedWithId);
  }

  async function handleInvite(username: string, permission: SharePermission) {
    try {
      await sharesApi.createShare(username, permission);
      await refresh();
      return {};
    } catch (e) {
      return { error: e instanceof ApiError ? e.code : "unknown_error" };
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1">
        <View className="p-5">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-foreground dark:text-foreground-dark">
              {t.shareTitle}
            </Text>
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Text className="text-sm opacity-60 text-foreground dark:text-foreground-dark">
                {t.close}
              </Text>
            </Pressable>
          </View>
          {!loading && <ShareList shares={shares} onRevoke={handleRevoke} t={t} />}
          <InviteForm onSubmit={handleInvite} t={t} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
