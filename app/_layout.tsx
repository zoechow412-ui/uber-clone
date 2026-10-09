import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

// iPhone passenger preview: the existing Clerk/driver screens remain in the
// repository, but the preview startup does not require production API keys.
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="passenger" />
      </Stack>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
