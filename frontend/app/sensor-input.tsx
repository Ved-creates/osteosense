import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BluetoothPanel } from "@/src/bluetooth/BluetoothPanel";
import { makeStyles, useTheme } from "@/src/theme";

export default function SensorInput() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.screen} testID="sensor-input-screen">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 26 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.replace("/")} style={styles.backButton} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back to home">
            <Ionicons name="arrow-back" size={21} color={colors.onSurface} />
          </Pressable>
          <Text style={styles.stepLabel}>SENSOR DATA · SEPARATE FROM ASSESSMENT</Text>
        </View>
        <Text style={styles.title}>BLE & sensor values</Text>
        <Text style={styles.intro}>Connect to the ESP32 or enter demo readings here. Saved values stay on this device and can be included in a later report.</Text>
        <BluetoothPanel />
        <Pressable onPress={() => router.replace("/")} style={styles.doneButton} accessibilityRole="button" testID="sensor-input-done-button">
          <Text style={styles.doneText}>DONE · RETURN HOME</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 24 },
  topBar: { minHeight: 44, flexDirection: "row", alignItems: "center" },
  backButton: { width: 44, height: 44, alignItems: "flex-start", justifyContent: "center" },
  stepLabel: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.7 },
  title: { color: colors.onSurface, fontFamily: "Georgia", fontSize: 29, marginTop: 22 },
  intro: { color: colors.onSurfaceSecondary, fontSize: 14, lineHeight: 21, marginTop: 10 },
  doneButton: { minHeight: 50, marginTop: 20, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  doneText: { color: colors.onSurface, fontSize: 12, fontWeight: "800", letterSpacing: 0.7 },
}));
