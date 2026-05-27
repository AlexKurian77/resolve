import { Platform, Linking } from 'react-native';

export const requestExactAlarmPermission = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 31) {
    const canSchedule = await Linking.canOpenURL('android.settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM');
    if (canSchedule) {
      Linking.openSettings();
    } else {
      console.log('Cannot request exact alarms on this device');
    }
  }
};
