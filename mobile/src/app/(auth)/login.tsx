import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-1 items-center justify-center p-4">
        <LoginForm />
      </View>
    </SafeAreaView>
  );
}
