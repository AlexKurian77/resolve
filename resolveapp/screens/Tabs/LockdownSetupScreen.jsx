import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ToastAndroid,
  AppState,
  Platform,
  Vibration,
  PanResponder,
  Modal,
  TextInput,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeModules } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../../utils/theme';

const { DeviceAdmin, LockdownModule } = NativeModules;

export default function LockdownSetupScreen() {
  const [duration, setDuration] = useState(15);
  const [lockdownActive, setLockdownActive] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customMinutesInput, setCustomMinutesInput] = useState('');
  const navigation = useNavigation();
  const currentDurationRef = useRef(duration);
  const panStartValRef = useRef(duration);

  useEffect(() => {
    const handleAppStateChange = async nextAppState => {
      if ((nextAppState === 'background' || nextAppState === 'inactive') && lockdownActive) {
        try { await DeviceAdmin.checkAndLock(); } catch (e) { console.error(e); }
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [lockdownActive]);

  useEffect(() => {
    currentDurationRef.current = duration;
  }, [duration]);

  const adjustTime = amount => {
    setDuration(prev => {
      const newVal = Math.max(1, Math.min(240, prev + amount));
      if (newVal !== prev && Platform.OS === 'android') {
        try { Vibration.vibrate(8); } catch(e){}
      }
      return newVal;
    });
  };

  const handleTilePress = val => {
    setDuration(val);
    try {
      if (Platform.OS === 'android') Vibration.vibrate(8);
    } catch(e){}
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        panStartValRef.current = currentDurationRef.current;
      },
      onPanResponderMove: (evt, gestureState) => {
        // dy is negative when moving up (increases value)
        const delta = Math.floor(-gestureState.dy / 2);
        let newVal = panStartValRef.current + delta;
        newVal = Math.max(1, Math.min(240, newVal));
        
        if (newVal !== currentDurationRef.current) {
          setDuration(newVal);
          currentDurationRef.current = newVal;
          try {
            if (Platform.OS === 'android' && newVal % 5 === 0) Vibration.vibrate(5);
          } catch (e) {}
        }
      },
    })
  ).current;

  const handleStartLockdown = async () => {
    try {
      await DeviceAdmin.startLockdown(duration);
      setLockdownActive(true);
      setTimeout(() => { LockdownModule.setLockdownActive(true); }, 300);
      const now = Date.now();
      const endTime = now + duration * 60 * 1000;
      ToastAndroid.show(`Locking for ${duration} minutes`, ToastAndroid.SHORT);
      navigation.navigate('Countdown', { minutes: duration, endTime });
    } catch (e) {
      ToastAndroid.show('Device Admin not active!', ToastAndroid.SHORT);
    }
  };

  const hours = Math.floor(duration / 60);
  const mins = duration % 60;
  const hoursStr = hours.toString().padStart(2, '0');
  const minsStr = mins.toString().padStart(2, '0');
  const sliderPercentage = (duration / 240) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* Top Display Card */}
        <View style={styles.displayCard}>
          <View style={styles.timeBlock}>
            <Text style={styles.timeDigit}>{hoursStr}</Text>
            <Text style={styles.timeDigit}>{minsStr}</Text>
          </View>
          <TouchableOpacity style={styles.displayBadge} onPress={() => { setCustomMinutesInput(duration.toString()); setShowCustomModal(true); }}>
            <Text style={styles.badgeText}>Custom</Text>
          </TouchableOpacity>
        </View>

        {/* Middle Section: Grid + Slider */}
        <View style={styles.middleSection}>
          {/* Tile Grid */}
          <View style={styles.gridContainer}>
            <View style={styles.gridCol}>
              <TouchableOpacity style={[styles.gridTile, duration === 15 && styles.tileActive]} onPress={() => handleTilePress(15)}>
                <Text style={[styles.tileNum, duration === 15 && styles.textActive]}>15</Text>
                <Text style={[styles.tileSub, duration === 15 && styles.textActive]}>Minutes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.gridTile, duration === 60 && styles.tileActive]} onPress={() => handleTilePress(60)}>
                <Text style={[styles.tileNum, duration === 60 && styles.textActive]}>1</Text>
                <Text style={[styles.tileSub, duration === 60 && styles.textActive]}>Hour</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.gridTile, { height: 120 }, duration === 120 && styles.tileActive]} onPress={() => handleTilePress(120)}>
                <Text style={[styles.tileNum, duration === 120 && styles.textActive]}>2</Text>
                <Text style={[styles.tileSub, duration === 120 && styles.textActive]}>Hours</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.gridCol}>
              <TouchableOpacity style={[styles.gridTile, duration === 30 && styles.tileActive]} onPress={() => handleTilePress(30)}>
                <Text style={[styles.tileNum, duration === 30 && styles.textActive]}>30</Text>
                <Text style={[styles.tileSub, duration === 30 && styles.textActive]}>Minutes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.gridTile, { flex: 1 }, duration === 180 && styles.tileActive]} onPress={() => handleTilePress(180)}>
                <Text style={[styles.tileNum, duration === 180 && styles.textActive]}>3</Text>
                <Text style={[styles.tileSub, duration === 180 && styles.textActive]}>Hours</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Vertical Slider Component */}
          <View style={styles.sliderSection}>
            <View style={styles.verticalTrack} {...panResponder.panHandlers}>
              <View style={styles.ticksContainer}>
                {[...Array(24)].map((_, i) => (
                  <View key={i} style={[styles.tick, i % 6 === 0 && styles.tickMajor]} />
                ))}
              </View>
              <View style={[styles.trackFill, { height: `${sliderPercentage}%` }]} />
              <View style={[styles.trackThumb, { bottom: `${sliderPercentage}%` }]} />
            </View>
            
            <View style={styles.chevronGroup}>
              <TouchableOpacity style={styles.chevronBtn} onPress={() => adjustTime(1)}>
                <MaterialCommunityIcons name="chevron-up" size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.chevronBtn} onPress={() => adjustTime(-1)}>
                <MaterialCommunityIcons name="chevron-down" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bottom Action Bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.playBtn} onPress={handleStartLockdown}>
            <MaterialCommunityIcons name="play" size={32} color={colors.bg} />
          </TouchableOpacity>
        </View>

        {/* Custom Duration Modal */}
        <Modal visible={showCustomModal} transparent animationType="fade" onRequestClose={() => setShowCustomModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Set Custom Duration</Text>
              <Text style={styles.modalSubText}>Enter time in minutes (1 - 240)</Text>
              
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={customMinutesInput}
                onChangeText={setCustomMinutesInput}
                maxLength={3}
                autoFocus
              />
              
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowCustomModal(false)}>
                  <Text style={styles.modalBtnTextCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalBtnConfirm} onPress={() => {
                  const val = parseInt(customMinutesInput, 10);
                  if (!isNaN(val) && val >= 1 && val <= 240) {
                    setDuration(val);
                  }
                  setShowCustomModal(false);
                }}>
                  <Text style={styles.modalBtnTextConfirm}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: spacing.lg, paddingBottom: spacing.xxl },
  
  // Top Display
  displayCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 32,
    padding: spacing.xxl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  timeBlock: {
    flexDirection: 'column',
  },
  timeDigit: {
    fontSize: 72,
    fontWeight: '800',
    color: colors.accent,
    lineHeight: 76,
    letterSpacing: -2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  displayBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  badgeText: {
    color: colors.bg,
    fontSize: 12,
    fontWeight: '700',
  },

  // Middle Section (Grid + Slider)
  middleSection: {
    flex: 1,
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  
  // Grid
  gridContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginRight: spacing.md,
  },
  gridCol: {
    flex: 1,
    gap: spacing.sm,
  },
  gridTile: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
  },
  tileActive: {
    backgroundColor: '#A0A0A0', // Blockit light gray active state
  },
  tileNum: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  tileSub: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  textActive: {
    color: colors.bg,
  },

  // Vertical Slider
  sliderSection: {
    width: 70,
    alignItems: 'center',
  },
  verticalTrack: {
    width: 70,
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: spacing.sm,
  },
  ticksContainer: {
    position: 'absolute',
    height: '90%',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  tick: {
    width: 12,
    height: 2,
    backgroundColor: colors.border,
    borderRadius: 1,
  },
  tickMajor: {
    width: 24,
    backgroundColor: colors.textMuted,
  },
  trackFill: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: `${colors.accent}15`,
  },
  trackThumb: {
    position: 'absolute',
    width: 28,
    height: 4,
    backgroundColor: colors.accent,
    borderRadius: 2,
    zIndex: 2,
  },
  
  // Chevrons
  chevronGroup: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 24,
    width: 70,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    gap: spacing.xs,
  },
  chevronBtn: {
    padding: spacing.sm,
  },

  // Bottom Action Bar
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
  },
  actionLeftGroup: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent + '20', // tinted circular buttons like blockit
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accent + '40',
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: colors.accent, // Accent-colored rounded square play button
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: spacing.lg },
  modalContent: { backgroundColor: colors.surface, borderRadius: radius.xxxl, padding: spacing.xxxl, borderWidth: 1, borderColor: colors.border, width: '90%', maxWidth: 400 },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: spacing.xs, textAlign: 'center' },
  modalSubText: { color: colors.textMuted, fontSize: 13, marginBottom: spacing.lg, textAlign: 'center' },
  modalInput: { backgroundColor: colors.surfaceAlt, color: colors.text, fontSize: 32, fontWeight: '700', textAlign: 'center', borderRadius: radius.md, paddingVertical: spacing.md, marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border },
  modalActions: { flexDirection: 'row', gap: spacing.md },
  modalBtnCancel: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.xxl, backgroundColor: colors.surfaceAlt, alignItems: 'center' },
  modalBtnTextCancel: { color: colors.text, fontWeight: '600', fontSize: 15 },
  modalBtnConfirm: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.xxl, backgroundColor: colors.accent, alignItems: 'center' },
  modalBtnTextConfirm: { color: colors.bg, fontWeight: '600', fontSize: 15 },
});
