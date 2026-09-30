import type { BleManager, Device, Subscription } from "react-native-ble-plx";

export type BleConnectionState = "disconnected" | "scanning" | "connecting" | "connected" | "error";

type BleListener = (state: BleConnectionState) => void;

let manager: BleManager | null = null;
let activeDevice: Device | null = null;
let connectionSubscription: Subscription | null = null;
let monitorSubscription: Subscription | null = null;
let state: BleConnectionState = "disconnected";
const listeners = new Set<BleListener>();

export function getBleManager() {
  if (!manager) {
    const { BleManager } = require("react-native-ble-plx");
    manager = new BleManager();
  }
  return manager;
}

export function getBleConnectionState() {
  return state;
}

export function subscribeBleConnection(listener: BleListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setBleConnectionState(next: BleConnectionState) {
  state = next;
  listeners.forEach((listener) => listener(state));
}

export function setActiveBleDevice(device: Device | null) {
  activeDevice = device;
}

export function getActiveBleDevice() {
  return activeDevice;
}

export function setBleSubscriptions(monitor: Subscription | null, connection: Subscription | null = null) {
  monitorSubscription?.remove();
  connectionSubscription?.remove();
  monitorSubscription = monitor;
  connectionSubscription = connection;
}

export function clearActiveBleConnection() {
  monitorSubscription?.remove();
  connectionSubscription?.remove();
  monitorSubscription = null;
  connectionSubscription = null;
  activeDevice = null;
  setBleConnectionState("disconnected");
}
