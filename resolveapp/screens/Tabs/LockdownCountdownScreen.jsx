import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ToastAndroid,
  BackHandler,
  NativeModules,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../../utils/theme';

const { DeviceLockdownStateModule, LockdownModule } = NativeModules;

export default function LockdownCountdownScreen({ route, navigation }) {
  const { minutes, endTime } = route.params;
  const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.floor((endTime - Date.now()) / 1000)));
  const [checkboxConfirmed, setCheckboxConfirmed] = useState(false);
  const [checkboxDisabled, setCheckboxDisabled] = useState(false);
  const halfwayReminderShown = useRef(false);
  const backHandlerRef = useRef(null);

  useEffect(() => {
    if (DeviceLockdownStateModule?.setLockdownActive) DeviceLockdownStateModule.setLockdownActive(true);
    const backAction = () => true;
    backHandlerRef.current = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => {
      if (DeviceLockdownStateModule?.setLockdownActive) DeviceLockdownStateModule.setLockdownActive(false);
      backHandlerRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const secondsLeft = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(secondsLeft);
      if (!halfwayReminderShown.current && secondsLeft <= (minutes * 60) / 2) {
        ToastAndroid.show('Halfway through lockdown!', ToastAndroid.SHORT);
        halfwayReminderShown.current = true;
      }
      if (secondsLeft <= 0) {
        clearInterval(timer);
        if (DeviceLockdownStateModule?.setLockdownActive) DeviceLockdownStateModule.setLockdownActive(false);
        backHandlerRef.current?.remove();
        LockdownModule.setLockdownActive(false);
        ToastAndroid.show('Lockdown complete!', ToastAndroid.SHORT);
        if (navigation?.reset) navigation.reset({ index: 0, routes: [{ name: 'MainTabs', state: { index: 0, routes: [{ name: 'Home' }] } }] });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime, minutes, navigation]);

  const formatTime = sec => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStopLockdown = () => {
    if (checkboxConfirmed) {
      ToastAndroid.show('Stopping is disabled while lockdown confirmation is enabled.', ToastAndroid.SHORT);
      return;
    }
    if (DeviceLockdownStateModule?.setLockdownActive) DeviceLockdownStateModule.setLockdownActive(false);
    LockdownModule.setLockdownActive(false);
    ToastAndroid.show('Lockdown stopped early.', ToastAndroid.SHORT);
    if (navigation?.reset) navigation.reset({ index: 0, routes: [{ name: 'MainTabs', state: { index: 0, routes: [{ name: 'Home' }] } }] });
  };

  const handleConfirmCheckbox = () => {
    if (checkboxDisabled) return;
    setCheckboxConfirmed(true);
    setCheckboxDisabled(true);
    ToastAndroid.show('Stop button disabled until lockdown completes.', ToastAndroid.SHORT);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="lock-clock" size={40} color={colors.accent} />
          </View>
          <Text style={styles.title}>Lockdown in Progress</Text>
          <Text style={styles.subtitle}>Stay strong! Your device is locked for your chosen duration.</Text>

          <View style={styles.timerContainer}>
            <Text style={styles.timerLabel}>Time Remaining</Text>
            <Text style={styles.timerValue}>{formatTime(timeLeft)}</Text>
          </View>

          {timeLeft === 0 && (
            <View style={styles.completeContainer}>
              <MaterialCommunityIcons name="check-circle-outline" size={24} color={colors.success} />
              <Text style={styles.completeText}>Lockdown Complete!</Text>
            </View>
          )}

          {timeLeft > 0 && (
            <>
              <TouchableOpacity
                style={[styles.checkboxContainer, checkboxDisabled && styles.checkboxDisabledStyle]}
                onPress={handleConfirmCheckbox}
                disabled={checkboxDisabled}
              >
                <MaterialCommunityIcons
                  name={checkboxConfirmed ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={20}
                  color={checkboxDisabled ? colors.textMuted : colors.accent}
                />
                <Text style={[styles.checkboxLabel, checkboxDisabled && { color: colors.textMuted }]}>
                  Disable stopping lockdown
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.stopButton, checkboxConfirmed && styles.stopButtonDisabled]}
                onPress={handleStopLockdown}
                disabled={checkboxConfirmed}
              >
                <MaterialCommunityIcons name="close-circle-outline" size={20} color={colors.text} style={{ marginRight: spacing.sm }} />
                <Text style={styles.stopButtonText}>Stop Lockdown</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.xxxl, padding: spacing.xxxl, width: '100%', maxWidth: 400, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  iconContainer: { marginBottom: spacing.lg, backgroundColor: colors.surfaceAlt, borderRadius: 40, padding: spacing.xl },
  title: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: spacing.sm, textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontSize: 13, marginBottom: spacing.xxl, textAlign: 'center', lineHeight: 19 },
  timerContainer: { alignItems: 'center', marginBottom: spacing.xxl },
  timerLabel: { color: colors.textMuted, fontSize: 13, marginBottom: spacing.xs },
  timerValue: { color: colors.accent, fontSize: 72, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontWeight: '800', letterSpacing: -2 },
  completeContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  completeText: { color: colors.success, fontSize: 16, fontWeight: '600' },
  stopButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.danger, borderRadius: radius.xxl, paddingVertical: spacing.md, paddingHorizontal: spacing.xxl, marginTop: spacing.lg },
  stopButtonText: { color: colors.text, fontWeight: '600', fontSize: 15 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.lg, gap: spacing.md },
  checkboxLabel: { color: colors.text, fontSize: 13, flexShrink: 1 },
  checkboxDisabledStyle: { opacity: 0.5 },
  stopButtonDisabled: { backgroundColor: colors.surfaceAlt },
});
