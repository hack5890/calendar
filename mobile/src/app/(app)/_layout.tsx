import { Stack } from "expo-router";
import { CalendarProvider } from "@/lib/calendar/CalendarContext";

export default function AppLayout() {
  return (
    <CalendarProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="day/[date]"
          options={{
            headerShown: false,
            presentation: "formSheet",
            sheetAllowedDetents: [0.6, 0.92],
            sheetInitialDetentIndex: 0,
          }}
        />
        <Stack.Screen name="calendar-picker" options={{ presentation: "modal" }} />
        <Stack.Screen name="share" options={{ presentation: "modal" }} />
      </Stack>
    </CalendarProvider>
  );
}
