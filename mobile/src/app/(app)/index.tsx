import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCalendar } from "@/lib/calendar/CalendarContext";
import MonthHeader from "@/components/calendar/MonthHeader";
import WeekdayRow from "@/components/calendar/WeekdayRow";
import MonthGrid from "@/components/calendar/MonthGrid";
import WeekGrid from "@/components/calendar/WeekGrid";

export default function CalendarScreen() {
  const { view } = useCalendar();

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1">
        <View className="p-4">
          <MonthHeader />
          {view === "month" ? (
            <>
              <WeekdayRow />
              <MonthGrid />
            </>
          ) : (
            <WeekGrid />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
