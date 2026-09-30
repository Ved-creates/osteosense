import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { BleManager, Device } from "react-native-ble-plx";

import { BLE_CHARACTERISTIC_UUID, BLE_DEVICE_NAME, BLE_SERVICE_UUID, isBleConfigured } from "./bleConfig";
import { clearActiveBleConnection, getActiveBleDevice, getBleConnectionState, getBleManager, setActiveBleDevice, setBleConnectionState, setBleSubscriptions, subscribeBleConnection, type BleConnectionState } from "./bleConnection";
import { EMPTY_LEG_SENSOR_DATA, getManualSensorData, saveManualSensorData, type LegSensorData } from "./manualSensorData";

type ConnectionState = BleConnectionState;
type ReceivedValue = { raw: string; parsed: unknown };
type SensorForm = Record<keyof LegSensorData, string>;
type PanelMode = "ble" | "manual";

const SENSOR_FIELDS: { key: keyof LegSensorData; label: string; unit: string }[] = [
  { key: "pressureFsr1Mv", label: "FSR 1", unit: "mV" },
  { key: "pressureFsr2Mv", label: "FSR 2", unit: "mV" },
  { key: "accelXG", label: "Accel X", unit: "g" },
  { key: "accelYG", label: "Accel Y", unit: "g" },
  { key: "accelZG", label: "Accel Z", unit: "g" },
  { key: "gyroXDps", label: "Gyro X", unit: "deg/s" },
  { key: "gyroYDps", label: "Gyro Y", unit: "deg/s" },
  { key: "gyroZDps", label: "Gyro Z", unit: "deg/s" },
];

function toSensorForm(data: LegSensorData): SensorForm {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value)])) as SensorForm;
}

function decodeBase64(value: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (const character of value.replace(/=/g, "")) {
    const index = alphabet.indexOf(character);
    if (index < 0) continue;
    buffer = (buffer << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 255);
    }
  }

  try {
    return new TextDecoder().decode(new Uint8Array(bytes));
  } catch {
    return bytes.map((byte) => String.fromCharCode(byte)).join("");
  }
}

function parseNotification(value: string): ReceivedValue {
  const raw = decodeBase64(value).replace(/\0+$/, "").trim();
  try {
    return { raw, parsed: JSON.parse(raw) };
  } catch {
    return { raw, parsed: raw };
  }
}

export function BluetoothPanel() {
  const managerRef = useRef<BleManager | null>(null);
  const [state, setState] = useState<ConnectionState>(getBleConnectionState());
  const [device, setDevice] = useState<Device | null>(null);
  const [latest, setLatest] = useState<ReceivedValue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<PanelMode>("ble");
  const [leftForm, setLeftForm] = useState<SensorForm>(() => toSensorForm(EMPTY_LEG_SENSOR_DATA));
  const [rightForm, setRightForm] = useState<SensorForm>(() => toSensorForm(EMPTY_LEG_SENSOR_DATA));
  const [manualSaved, setManualSaved] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  useEffect(() => {
    getManualSensorData().then((saved) => {
      if (!saved) return;
      setLeftForm(toSensorForm(saved.left));
      setRightForm(toSensorForm(saved.right));
      setManualSaved(true);
    });
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeBleConnection(setState);
    if (Platform.OS !== "web") {
      try {
        managerRef.current = getBleManager();
      } catch {
        setError("Bluetooth needs the custom development build; it is not included in Expo Go.");
        setBleConnectionState("error");
      }
    }
    return unsubscribe;
  }, []);

  const disconnect = async () => {
    const connectedDevice = device ?? getActiveBleDevice();
    await connectedDevice?.cancelConnection().catch(() => undefined);
    clearActiveBleConnection();
    setDevice(null);
    setLatest(null);
  };

  const connect = async () => {
    if (Platform.OS === "web") {
      setError("Bluetooth is available in the Android/iOS development build, not Expo web.");
      setBleConnectionState("error");
      return;
    }
    if (!isBleConfigured()) {
      setError("Add EXPO_PUBLIC_BLE_SERVICE_UUID and EXPO_PUBLIC_BLE_CHARACTERISTIC_UUID to frontend/.env first.");
      setBleConnectionState("error");
      return;
    }

    const manager = managerRef.current;
    if (!manager) return;

    setError(null);
    setLatest(null);
    setBleConnectionState("scanning");

    try {
      await manager.state();
      manager.startDeviceScan([BLE_SERVICE_UUID], null, async (scanError, scannedDevice) => {
        if (scanError) {
          manager.stopDeviceScan();
          setError(scanError.message);
          setBleConnectionState("error");
          return;
        }
        if (!scannedDevice) return;
        const name = scannedDevice.name || scannedDevice.localName || "";
        if (BLE_DEVICE_NAME && name !== BLE_DEVICE_NAME) return;

        manager.stopDeviceScan();
        setBleConnectionState("connecting");
        try {
          const connected = await scannedDevice.connect();
          await connected.discoverAllServicesAndCharacteristics();
          setActiveBleDevice(connected);
          setDevice(connected);
          const monitor = connected.monitorCharacteristicForService(
            BLE_SERVICE_UUID,
            BLE_CHARACTERISTIC_UUID,
            (notificationError, characteristic) => {
              if (notificationError) {
                setError(notificationError.message);
                setBleConnectionState("error");
                return;
              }
              if (characteristic?.value) setLatest(parseNotification(characteristic.value));
            },
          );
          const connection = connected.onDisconnected(() => {
            clearActiveBleConnection();
            setDevice(null);
            setLatest(null);
          });
          setBleSubscriptions(monitor, connection);
          setBleConnectionState("connected");
        } catch (connectionError) {
          setError(connectionError instanceof Error ? connectionError.message : String(connectionError));
          setBleConnectionState("error");
        }
      });
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : String(scanError));
      setBleConnectionState("error");
    }
  };

  const isBusy = state === "scanning" || state === "connecting";
  const stateLabel = state === "connected" ? "CONNECTED" : state === "scanning" ? "SCANNING" : state === "connecting" ? "CONNECTING" : state === "error" ? "ERROR" : "DISCONNECTED";
  const displayValue = latest?.parsed && typeof latest.parsed === "object" ? JSON.stringify(latest.parsed, null, 2) : latest?.raw || "Waiting for BLE data…";

  const saveManualValues = async () => {
    const left = Object.fromEntries(Object.entries(leftForm).map(([key, value]) => [key, Number(value)])) as LegSensorData;
    const right = Object.fromEntries(Object.entries(rightForm).map(([key, value]) => [key, Number(value)])) as LegSensorData;
    if ([...Object.values(left), ...Object.values(right)].some((value) => !Number.isFinite(value))) {
      setManualError("Enter a valid number in every sensor field.");
      return;
    }
    const saved = await saveManualSensorData({ left, right });
    setManualSaved(saved);
    setManualError(saved ? null : "Could not save these values on this device.");
  };

  const renderSensorForm = (side: "Left" | "Right", form: SensorForm, update: (next: SensorForm) => void) => (
    <View style={styles.legSection}>
      <Text style={styles.legTitle}>{side.toUpperCase()} LEG {side === "Left" ? "· FSR 1–2 / IMU S1" : "· FSR 3–4 / IMU S3"}</Text>
      <View style={styles.sensorGrid}>
        {SENSOR_FIELDS.map((field) => (
          <View key={`${side}-${field.key}`} style={styles.sensorField}>
            <Text style={styles.sensorLabel}>{field.label} ({field.unit})</Text>
            <TextInput
              accessibilityLabel={`${side} leg ${field.label}`}
              keyboardType="decimal-pad"
              value={form[field.key]}
              onChangeText={(value) => {
                update({ ...form, [field.key]: value.replace(/[^0-9.-]/g, "") });
                setManualSaved(false);
              }}
              style={styles.sensorInput}
            />
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="bluetooth" size={18} color="#6E5E4E" />
          <Text style={styles.title}>BLE SENSOR DATA</Text>
        </View>
        <Text style={[styles.state, state === "connected" && styles.connected]}>{stateLabel}</Text>
      </View>

      <View style={styles.modeSwitch}>
        <Pressable onPress={() => setMode("ble")} style={[styles.modeButton, mode === "ble" && styles.modeButtonActive]} accessibilityRole="tab" accessibilityState={{ selected: mode === "ble" }}>
          <Text style={[styles.modeText, mode === "ble" && styles.modeTextActive]}>LIVE BLE</Text>
        </Pressable>
        <Pressable onPress={() => setMode("manual")} style={[styles.modeButton, mode === "manual" && styles.modeButtonActive]} accessibilityRole="tab" accessibilityState={{ selected: mode === "manual" }}>
          <Text style={[styles.modeText, mode === "manual" && styles.modeTextActive]}>MANUAL / DEMO</Text>
        </Pressable>
      </View>

      {mode === "ble" ? (
        <>
          {device ? <Text style={styles.device}>{device.name || device.localName || device.id}</Text> : null}
          <Text style={styles.caption}>ESP32 and AI readings received by Bluetooth appear here.</Text>
          <ScrollView style={styles.valueBox} contentContainerStyle={styles.valueContent} horizontal={false}>
            <Text style={styles.value}>{displayValue}</Text>
          </ScrollView>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {!isBleConfigured() ? <Text style={styles.hint}>Configure the BLE service and characteristic UUIDs in frontend/.env.</Text> : null}
          <View style={styles.actions}>
            {state === "connected" ? (
              <Pressable onPress={disconnect} style={styles.secondaryButton} accessibilityRole="button"><Text style={styles.secondaryText}>DISCONNECT</Text></Pressable>
            ) : (
              <Pressable onPress={connect} disabled={isBusy} style={[styles.primaryButton, isBusy && styles.disabled]} accessibilityRole="button">
                {isBusy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>SCAN AND CONNECT</Text>}
              </Pressable>
            )}
          </View>
        </>
      ) : (
        <>
          <Text style={styles.caption}>Enter demo readings. FSR 1–2 are assigned to the left leg; FSR 3–4 to the right. IMU S1/S3 represent left/right.</Text>
          {renderSensorForm("Left", leftForm, setLeftForm)}
          {renderSensorForm("Right", rightForm, setRightForm)}
          {manualError ? <Text style={styles.error}>{manualError}</Text> : null}
          <Pressable onPress={saveManualValues} style={styles.primaryButton} accessibilityRole="button" testID="save-manual-sensor-values">
            <Text style={styles.primaryText}>{manualSaved ? "DEMO VALUES SAVED" : "SAVE DEMO VALUES"}</Text>
          </Pressable>
          <Text style={styles.hint}>Saved values are included in the next camera assessment report. They are demo inputs, not a clinical result.</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { marginTop: 24, padding: 16, borderWidth: 1, borderColor: "#DDD6C9", borderRadius: 12, backgroundColor: "#F2EFE9" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { color: "#6E5E4E", fontSize: 11, fontWeight: "800", letterSpacing: 1.1 },
  state: { color: "#7A7570", fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  connected: { color: "#5C6B53" },
  modeSwitch: { flexDirection: "row", marginTop: 14, padding: 3, borderRadius: 8, backgroundColor: "#E6DFD3" },
  modeButton: { flex: 1, minHeight: 36, alignItems: "center", justifyContent: "center", borderRadius: 6 },
  modeButtonActive: { backgroundColor: "#6E5E4E" },
  modeText: { color: "#4A4745", fontSize: 10, fontWeight: "800" },
  modeTextActive: { color: "#FFFFFF" },
  device: { color: "#2C2A29", fontSize: 14, fontWeight: "700", marginTop: 12 },
  caption: { color: "#6B6764", fontSize: 12, lineHeight: 18, marginTop: 8 },
  valueBox: { minHeight: 86, maxHeight: 150, marginTop: 14, padding: 12, borderRadius: 8, backgroundColor: "#EAE5DC" },
  valueContent: { flexGrow: 1, justifyContent: "center" },
  value: { color: "#2C2A29", fontSize: 13, lineHeight: 19, fontFamily: "monospace" },
  error: { color: "#9E4F4F", fontSize: 12, lineHeight: 18, marginTop: 10 },
  hint: { color: "#A37C4B", fontSize: 12, lineHeight: 18, marginTop: 10 },
  legSection: { marginTop: 16 },
  legTitle: { color: "#6E5E4E", fontSize: 10, fontWeight: "800", marginBottom: 8 },
  sensorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sensorField: { width: "48%", flexGrow: 1 },
  sensorLabel: { color: "#6B6764", fontSize: 10, fontWeight: "700", marginBottom: 4 },
  sensorInput: { minHeight: 40, paddingHorizontal: 10, borderWidth: 1, borderColor: "#DDD6C9", borderRadius: 6, backgroundColor: "#FFFFFF", color: "#2C2A29", fontSize: 14 },
  actions: { marginTop: 14 },
  primaryButton: { minHeight: 46, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#6E5E4E" },
  secondaryButton: { minHeight: 46, alignItems: "center", justifyContent: "center", borderRadius: 8, borderWidth: 1, borderColor: "#6E5E4E" },
  primaryText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800", letterSpacing: 0.8 },
  secondaryText: { color: "#6E5E4E", fontSize: 12, fontWeight: "800", letterSpacing: 0.8 },
  disabled: { opacity: 0.65 },
});
