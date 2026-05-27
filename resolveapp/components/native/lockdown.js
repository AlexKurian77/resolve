import { NativeModules, Platform } from "react-native";
const { DeviceAdmin, AlarmModule } = NativeModules;

export const checkDeviceAdmin = async () => {
  console.log('Calling checkDeviceAdmin');
  try {
    const result = await DeviceAdmin.isAdminActive();
    console.log('checkDeviceAdmin result:', result);
    return result;
  } catch (e) {
    console.error('checkDeviceAdmin error:', e);
    throw e;
  }
};
export const checkAccessibility = async () => {
  console.log('Calling checkAccessibity');
  try {
    const result = await DeviceAdmin.isAccessibilityServiceEnabled();
    console.log('checkAccessibity result:', result);
    return result;
  } catch (e) {
    console.error('checkAccessibity error:', e);
    throw e;
  }
};

export const requestDeviceAdmin = async () => {
  console.log('Calling requestDeviceAdmin');
  try {
    const result = await DeviceAdmin.requestAdmin();
    console.log('requestDeviceAdmin result:', result);
    return result;
  } catch (e) {
    console.error('requestDeviceAdmin error:', e);
    throw e;
  }
};

export const lockNow = async () => {
  console.log('Calling lockNow');
  try {
    const result = await DeviceAdmin.lockNow();
    console.log('lockNow result:', result);
    return result;
  } catch (e) {
    console.error('lockNow error:', e);
    throw e;
  }
};

export const openAccessibilitySettings = async () => {
  console.log('Calling openAccessibilitySettings');
  try {
    const result = await DeviceAdmin.openAccessibilitySettings();
    console.log('openAccessibilitySettings result:', result);
    return result;
  } catch (e) {
    console.error('openAccessibilitySettings error:', e);
    throw e;
  }
};

export const scheduleLockAt = (epochMillis) => {
  if (Platform.OS === "android") {
    console.log('Calling scheduleLockAt:', epochMillis);
    AlarmModule?.scheduleLock?.(epochMillis);
  }
};

export const cancelScheduledLock = () => {
  if (Platform.OS === "android") {
    console.log('Calling cancelScheduledLock');
    AlarmModule?.cancelScheduledLock?.();
  }
};