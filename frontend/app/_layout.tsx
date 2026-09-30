import "react-native-url-polyfill/auto";

import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { LogBox } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { LanguageProvider } from "@/src/i18n";
import { queryClient } from "@/src/query-client";

// Disable logbox errors etc so that users can see the app
// and agent works as expected.
LogBox.ignoreAllLogs(true)

export default function RootLayout() {
  // One app level ErrorBoundary; a render crash shows a reload screen
  // instead of a blank app.
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <KeyboardProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </KeyboardProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
