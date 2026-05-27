import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ToastAndroid,
  AppState,
  NativeModules,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  checkDeviceAdmin,
  checkAccessibility,
  requestDeviceAdmin,
} from '../../components/native/lockdown';
import { auth } from '../../firebaseConfig';
import { colors, spacing, radius } from '../../utils/theme';

const { DeviceAdmin, AlarmModule } = NativeModules;

export default function PermissionsScreen({ navigation }) {
  const [isAdminActive, setIsAdminActive] = useState(false);
  const [isAccessibilityActive, setIsAccessibilityActive] = useState(false);
  const [isAlarmPermissionGranted, setIsAlarmPermissionGranted] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  // Check if accessibility service is enabled
  const checkAccessibilityAccess = useCallback(async () => {
    try {
      const active = await checkAccessibility();
      setIsAccessibilityActive(active);
    } catch (e) {
      console.error('Failed to check accessibity:', e);
      ToastAndroid.show('Failed to check Device accessibity status', ToastAndroid.SHORT);
    }
  }, []);

  const checkAdmin = useCallback(async () => {
    try {
      const active = await checkDeviceAdmin();
      setIsAdminActive(active);
    } catch (e) {
      console.error('Failed to check admin:', e);
      ToastAndroid.show('Failed to check Device Admin status', ToastAndroid.SHORT);
    }
  }, []);

  const checkAlarmPermission = useCallback(async () => {
    try {
      if (AlarmModule && AlarmModule.isAlarmEnabled) {
        const enabled = await AlarmModule.isAlarmEnabled();
        setIsAlarmPermissionGranted(enabled);
      } else {
        setIsAlarmPermissionGranted(true);
      }
    } catch (e) {
      console.error('Failed to check alarm permission:', e);
      setIsAlarmPermissionGranted(true);
    }
  }, []);

  // Check both permissions
  const checkAll = useCallback(() => {
    checkAdmin();
    checkAccessibilityAccess();
    checkAlarmPermission();
  }, [checkAdmin, checkAccessibilityAccess, checkAlarmPermission]);

  useEffect(() => {
    checkAll();
  }, [checkAll]);

  useFocusEffect(
    useCallback(() => {
      checkAll();
      const subscription = AppState.addEventListener('change', nextAppState => {
        if (nextAppState === 'active') {
          checkAll();
        }
      });
      return () => subscription.remove();
    }, [checkAll]),
  );

  useEffect(() => {
    if (isAdminActive && isAccessibilityActive && isAlarmPermissionGranted) {
      const unsubscribe = auth.onAuthStateChanged(user => {
        if (user) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      });
      return unsubscribe;
    }
  }, [isAdminActive, isAccessibilityActive, isAlarmPermissionGranted, navigation]);

  const handleEnableAdmin = async () => {
    setIsRequesting(true);
    try {
      await requestDeviceAdmin();
    } catch (e) {
      console.error('Request admin failed:', e);
      ToastAndroid.show('Could not request Device Admin', ToastAndroid.SHORT);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleEnableAccessibility = () => {
    if (DeviceAdmin && DeviceAdmin.openAccessibilitySettings) {
      DeviceAdmin.openAccessibilitySettings();
    } else {
      ToastAndroid.show('Please enable accessibility manually in settings.', ToastAndroid.SHORT);
    }
  };

  const handleOpenAlarmsPermission = () => {
    if (AlarmModule && AlarmModule.openAlarmsAndRemindersSettings) {
      AlarmModule.openAlarmsAndRemindersSettings();
    } else {
      ToastAndroid.show('Please enable Alarms & Reminders permission manually in settings.', ToastAndroid.SHORT);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Permissions Required</Text>
          <Text style={styles.subtitle}>
            To enable lockdown features, please grant the following permissions:
          </Text>

          <View style={styles.permissionList}>
            <View style={styles.permissionItem}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name="shield-lock" size={26} color={isAdminActive ? colors.success : colors.accent} />
              </View>
              <View style={styles.permissionTextContainer}>
                <Text style={styles.permissionTitle}>Device Admin</Text>
                <Text style={styles.permissionDesc}>
                  Required to lock your phone during lockdown.
                </Text>
              </View>
              {!isAdminActive ? (
                <TouchableOpacity style={styles.actionButton} onPress={handleEnableAdmin} disabled={isRequesting}>
                  <Text style={styles.actionButtonText}>Enable</Text>
                </TouchableOpacity>
              ) : (
                <MaterialCommunityIcons name="check-circle" size={24} color={colors.success} />
              )}
            </View>

            <View style={styles.permissionItem}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name="eye-settings" size={26} color={isAccessibilityActive ? colors.success : colors.accent} />
              </View>
              <View style={styles.permissionTextContainer}>
                <Text style={styles.permissionTitle}>Accessibility</Text>
                <Text style={styles.permissionDesc}>
                  Needed to keep the app in the foreground.
                </Text>
              </View>
              {!isAccessibilityActive ? (
                <TouchableOpacity style={styles.actionButton} onPress={handleEnableAccessibility}>
                  <Text style={styles.actionButtonText}>Enable</Text>
                </TouchableOpacity>
              ) : (
                <MaterialCommunityIcons name="check-circle" size={24} color={colors.success} />
              )}
            </View>

            <View style={styles.permissionItem}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name="alarm" size={26} color={isAlarmPermissionGranted ? colors.success : colors.accent} />
              </View>
              <View style={styles.permissionTextContainer}>
                <Text style={styles.permissionTitle}>Alarms & Reminders</Text>
                <Text style={styles.permissionDesc}>
                  Allows the app to schedule lockdowns.
                </Text>
              </View>
              {!isAlarmPermissionGranted ? (
                <TouchableOpacity style={styles.actionButton} onPress={handleOpenAlarmsPermission}>
                  <Text style={styles.actionButtonText}>Enable</Text>
                </TouchableOpacity>
              ) : (
                <MaterialCommunityIcons name="check-circle" size={24} color={colors.success} />
              )}
            </View>
          </View>

          {isRequesting && (
            <Text style={styles.requestingText}>Requesting Device Admin...</Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxxl,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: spacing.xxl,
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionList: {
    marginBottom: spacing.md,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  permissionTextContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  permissionTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  permissionDesc: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  actionButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
  },
  actionButtonText: {
    color: colors.bg,
    fontWeight: '700',
    fontSize: 13,
  },
  requestingText: {
    color: colors.warning,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.md,
    fontWeight: '600',
  },
});
