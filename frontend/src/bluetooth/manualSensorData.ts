import { storage } from "@/src/utils/storage";

export type LegSensorData = {
  pressureFsr1Mv: number;
  pressureFsr2Mv: number;
  accelXG: number;
  accelYG: number;
  accelZG: number;
  gyroXDps: number;
  gyroYDps: number;
  gyroZDps: number;
};

export type ManualSensorData = {
  source: "manual-demo";
  updatedAt: string;
  left: LegSensorData;
  right: LegSensorData;
};

const STORAGE_KEY = "oa-risk-detector/manual-sensor-data";

export const EMPTY_LEG_SENSOR_DATA: LegSensorData = {
  pressureFsr1Mv: 0,
  pressureFsr2Mv: 0,
  accelXG: 0,
  accelYG: 0,
  accelZG: 0,
  gyroXDps: 0,
  gyroYDps: 0,
  gyroZDps: 0,
};

export async function saveManualSensorData(data: Omit<ManualSensorData, "source" | "updatedAt">) {
  const snapshot: ManualSensorData = {
    ...data,
    source: "manual-demo",
    updatedAt: new Date().toISOString(),
  };
  return storage.setItem(STORAGE_KEY, snapshot);
}

export async function getManualSensorData() {
  return storage.getItem<ManualSensorData | null>(STORAGE_KEY, null);
}
