import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import * as Crypto from "expo-crypto";
import { getTranslations } from "@/lib/i18n";
import type { CalendarEvent, RecurrenceFrequency } from "@/lib/types";
import type { EventColor } from "@/lib/eventColors";
import ColorPicker from "./ColorPicker";

const REPEAT_ORDER: (RecurrenceFrequency | "none")[] = [
  "none",
  "daily",
  "weekly",
  "monthly",
  "yearly",
];

interface EventFormProps {
  date: string;
  editing: CalendarEvent | null;
  onSubmit: (event: CalendarEvent, isEditing: boolean) => void;
  onCancelEdit: () => void;
  t: ReturnType<typeof getTranslations>;
}

// 호출부(day/[date].tsx)에서 key={editing?.id ?? "new"}로 렌더링해야 한다 — 그래야 편집 대상이
// 바뀔 때 React가 이 컴포넌트를 새로 마운트해서 아래 초기값들이 다시 계산되고, 폼을 동기화하기
// 위한 useEffect가 필요 없어진다("초기화" 대신 "리셋"으로 prop 변경에 대응하는 패턴).
export default function EventForm({ date, editing, onSubmit, onCancelEdit, t }: EventFormProps) {
  const [title, setTitle] = useState(editing?.title ?? "");
  const [time, setTime] = useState(editing?.time ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [repeat, setRepeat] = useState<RecurrenceFrequency | "none">(editing?.repeat ?? "none");
  const [repeatInterval, setRepeatInterval] = useState(String(editing?.repeatInterval ?? 1));
  const [repeatUntil, setRepeatUntil] = useState(editing?.repeatUntil ?? "");
  const [color, setColor] = useState<EventColor | undefined>(editing?.color);

  function handleSubmit() {
    if (!title.trim()) return;
    const interval = Math.max(1, Number(repeatInterval) || 1);
    onSubmit(
      {
        id: editing?.id ?? Crypto.randomUUID(),
        date: editing?.date ?? date,
        title: title.trim(),
        time: time.trim() || undefined,
        description: description.trim() || undefined,
        repeat: repeat === "none" ? undefined : repeat,
        repeatInterval: repeat !== "none" ? interval : undefined,
        repeatUntil: repeat !== "none" && repeatUntil ? repeatUntil : undefined,
        color,
      },
      Boolean(editing)
    );
  }

  return (
    <View className="gap-3">
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder={t.titlePlaceholder}
        className="w-full rounded-lg border border-black/10 dark:border-white/15 px-3 py-2 text-sm text-foreground dark:text-foreground-dark"
      />
      <TextInput
        value={time}
        onChangeText={setTime}
        placeholder={t.timePlaceholder}
        className="w-full rounded-lg border border-black/10 dark:border-white/15 px-3 py-2 text-sm text-foreground dark:text-foreground-dark"
      />
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder={t.descriptionPlaceholder}
        multiline
        numberOfLines={2}
        className="w-full rounded-lg border border-black/10 dark:border-white/15 px-3 py-2 text-sm text-foreground dark:text-foreground-dark"
      />

      <ColorPicker value={color} onChange={setColor} t={t} />

      <View>
        <Text className="text-xs opacity-60 mb-1 text-foreground dark:text-foreground-dark">
          {t.repeats}
        </Text>
        <View className="flex-row flex-wrap gap-1.5">
          {REPEAT_ORDER.map((value) => (
            <Pressable
              key={value}
              onPress={() => setRepeat(value)}
              className={`px-2.5 py-1.5 rounded-lg border ${
                repeat === value
                  ? "bg-accent dark:bg-accent-dark border-accent dark:border-accent-dark"
                  : "border-black/10 dark:border-white/15"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  repeat === value
                    ? "text-accent-foreground dark:text-accent-foreground-dark"
                    : "text-foreground dark:text-foreground-dark"
                }`}
              >
                {t.repeatOptions[value]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {repeat !== "none" && (
        <>
          <View className="flex-row items-center gap-2">
            <Text className="text-xs opacity-60 text-foreground dark:text-foreground-dark">
              {t.repeatEvery}
            </Text>
            <TextInput
              value={repeatInterval}
              onChangeText={setRepeatInterval}
              keyboardType="number-pad"
              className="w-16 rounded-lg border border-black/10 dark:border-white/15 px-2 py-1.5 text-sm text-foreground dark:text-foreground-dark"
            />
            <Text className="text-xs opacity-60 text-foreground dark:text-foreground-dark">
              {t.repeatUnits[repeat]}
            </Text>
          </View>
          <View>
            <Text className="text-xs opacity-60 mb-1 text-foreground dark:text-foreground-dark">
              {t.repeatUntil}
            </Text>
            <TextInput
              value={repeatUntil}
              onChangeText={setRepeatUntil}
              placeholder="YYYY-MM-DD"
              className="w-full rounded-lg border border-black/10 dark:border-white/15 px-3 py-2 text-sm text-foreground dark:text-foreground-dark"
            />
          </View>
        </>
      )}

      <View className="flex-row justify-end gap-2 pt-1">
        {editing && (
          <Pressable onPress={onCancelEdit} className="px-3 py-1.5 rounded-lg">
            <Text className="text-sm opacity-70 text-foreground dark:text-foreground-dark">
              {t.cancelEdit}
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={handleSubmit}
          disabled={!title.trim()}
          className="px-3 py-1.5 rounded-lg bg-accent dark:bg-accent-dark"
        >
          <Text className="text-sm font-medium text-accent-foreground dark:text-accent-foreground-dark">
            {editing ? t.update : t.add}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
