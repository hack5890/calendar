import { Modal, Pressable, Text, View } from "react-native";
import { getTranslations } from "@/lib/i18n";

interface ConfirmDeleteDialogProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  t: ReturnType<typeof getTranslations>;
}

export default function ConfirmDeleteDialog({
  visible,
  onCancel,
  onConfirm,
  t,
}: ConfirmDeleteDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        className="flex-1 items-center justify-center bg-black/40 p-4"
        onPress={onCancel}
      >
        <Pressable
          className="w-full max-w-xs rounded-xl bg-background dark:bg-background-dark border border-black/10 dark:border-white/15 overflow-hidden"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="h-1.5 bg-red-600" />
          <View className="p-5">
            <Text className="text-sm mb-4 text-foreground dark:text-foreground-dark">
              {t.confirmDelete}
            </Text>
            <View className="flex-row justify-end gap-2">
              <Pressable onPress={onCancel} hitSlop={8} className="px-3 py-1.5 rounded-lg">
                <Text className="text-sm opacity-70 text-foreground dark:text-foreground-dark">
                  {t.cancel}
                </Text>
              </Pressable>
              <Pressable
                onPress={onConfirm}
                hitSlop={8}
                className="px-3 py-1.5 rounded-lg bg-red-600"
              >
                <Text className="text-sm font-medium text-white">{t.deleteAction}</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
