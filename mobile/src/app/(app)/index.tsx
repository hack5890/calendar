import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MonthHeader from "@/components/calendar/MonthHeader";
import WeekdayRow from "@/components/calendar/WeekdayRow";
import MonthGrid from "@/components/calendar/MonthGrid";

export default function CalendarScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1">
        <View className="p-4">
          <MonthHeader />
          <WeekdayRow />
          <MonthGrid />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
