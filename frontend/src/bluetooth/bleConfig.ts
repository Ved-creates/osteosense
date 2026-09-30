export const BLE_SERVICE_UUID = process.env.EXPO_PUBLIC_BLE_SERVICE_UUID?.trim() || "";
export const BLE_CHARACTERISTIC_UUID = process.env.EXPO_PUBLIC_BLE_CHARACTERISTIC_UUID?.trim() || "";
export const BLE_DEVICE_NAME = process.env.EXPO_PUBLIC_BLE_DEVICE_NAME?.trim() || "";

export function isBleConfigured() {
  return Boolean(BLE_SERVICE_UUID && BLE_CHARACTERISTIC_UUID);
}
