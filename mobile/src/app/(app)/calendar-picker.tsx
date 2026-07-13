import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import CalendarPickerList from "@/components/calendar/CalendarPickerList";

export default function CalendarPickerScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <CalendarPickerList onSelect={() => router.back()} />
    </SafeAreaView>
  );
}
