/* eslint-disable react-native/no-inline-styles */
// HomeScreen.jsx
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import { useEffect, useState } from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AlertService } from '../../utils/AlertService';
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import ResolveLogo from '../../assets/images/resolve.png';
import { colors, spacing, radius } from '../../utils/theme';

export default function HomeScreen({ navigation }) {
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUrgeModal, setShowUrgeModal] = useState(false);
  const [selectedUrgeOutcome, setSelectedUrgeOutcome] = useState(null);
  const [badges, setBadges] = useState([]);
  const [rewardPoints, setRewardPoints] = useState(140);

  const [hoursSinceMidnight, setHoursSinceMidnight] = useState(0);
  const [minutesSinceMidnight, setMinutesSinceMidnight] = useState(0);

  useEffect(() => {
    let minuteInterval = null;
    let startTimeout = null;

    const updateTime = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);
      const diffMs = now - midnight;
      setHoursSinceMidnight(Math.floor(diffMs / (1000 * 60 * 60)));
      setMinutesSinceMidnight(Math.floor((diffMs / (1000 * 60)) % 60));
    };

    updateTime();
    const now = new Date();
    const msToNextMinute =
      60000 - (now.getSeconds() * 1000 + now.getMilliseconds());
    startTimeout = setTimeout(() => {
      updateTime();
      minuteInterval = setInterval(updateTime, 60 * 1000);
    }, msToNextMinute);

    return () => {
      if (startTimeout) clearTimeout(startTimeout);
      if (minuteInterval) clearInterval(minuteInterval);
    };
  }, []);

  const feelingOptions = {
    positive: [
      {
        id: 'good',
        name: 'Good',
        icon: 'emoticon-happy-outline',
        color: colors.success,
      },
      {
        id: 'neutral',
        name: 'Neutral',
        icon: 'emoticon-neutral-outline',
        color: colors.accent,
      },
    ],
    negative: [
      {
        id: 'bored',
        name: 'Bored',
        icon: 'clock-outline',
        color: colors.danger,
      },
      {
        id: 'stressed',
        name: 'Stressed',
        icon: 'lightning-bolt-outline',
        color: colors.accent,
      },
      {
        id: 'fatigued',
        name: 'Fatigued',
        icon: 'sleep',
        color: colors.warning,
      },
      {
        id: 'lonely',
        name: 'Lonely',
        icon: 'account-heart-outline',
        color: colors.success,
      },
    ],
  };

  useEffect(() => {
    const badgeMilestones = [
      { days: 1, name: '1-Day Badge' },
      { days: 7, name: '7-Day Badge' },
      { days: 30, name: '30-Day Badge' },
      { days: 100, name: '100-Day Badge' },
    ];
    const fetchUserDataAndCheckIn = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserData(data);
            setStreak(data.currentStreak || 0);
            setBestStreak(data.bestStreak || 0);
            setBadges(data.badges || []);

            // Auto check-in logic
            const last = data?.lastCheckIn?.toDate
              ? data.lastCheckIn.toDate()
              : null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let newStreak = 1;
            let newBadges = [...(data.badges || [])];

            if (last) {
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
              if (last.toDateString() === today.toDateString()) return;
              else if (last.toDateString() === yesterday.toDateString()) {
                newStreak = (data.currentStreak || 0) + 1;
              }
            }

            badgeMilestones.forEach(milestone => {
              if (
                newStreak === milestone.days &&
                !newBadges.includes(milestone.name)
              ) {
                newBadges.push(milestone.name);
                AlertService.success(
                  'Milestone Reached',
                  `You earned the "${milestone.name}" badge!`,
                );
              }
            });

            const best = Math.max(newStreak, data.bestStreak || 0);
            await updateDoc(userRef, {
              currentStreak: newStreak,
              bestStreak: best,
              lastCheckIn: Timestamp.fromDate(today),
              badges: newBadges,
            });

            setStreak(newStreak);
            setBestStreak(best);
            setBadges(newBadges);
            setUserData({
              ...data,
              currentStreak: newStreak,
              bestStreak: best,
              lastCheckIn: today,
              badges: newBadges,
            });
            AlertService.success('Success', 'Check-in complete!');
          }
        }
      } catch (e) {
        console.error(e);
        AlertService.alert('Error', 'Failed to fetch user data.');
      } finally {
        setLoading(false);
      }
    };
    fetchUserDataAndCheckIn();
  }, []);

  const handleUrgeRecord = async (outcome, feeling) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const userRef = doc(db, 'users', user.uid);
      const urgeEntry = {
        outcome,
        feeling: feeling.id,
        feelingName: feeling.name,
        date: new Date().toISOString(),
        timestamp: Date.now(),
        hour: new Date().getHours(),
      };
      await updateDoc(userRef, { urges: arrayUnion(urgeEntry) });
      setShowUrgeModal(false);
      setSelectedUrgeOutcome(null);
      AlertService.success('Recorded', `Urge ${outcome}: ${feeling.name}`);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to record urge');
    }
  };

  const displayName = userData?.displayName || '';

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }
  if (!userData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No user data found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image source={ResolveLogo} style={styles.logoImage} />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            {displayName ? `Welcome back, ${displayName}` : 'Welcome'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {`${streak}-day streak · Best Streak - ${bestStreak} ${
              bestStreak == 1 ? 'day' : 'days'
            }`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
          accessibilityLabel="Open profile"
        >
          <MaterialCommunityIcons name="account" size={20} color={colors.bg} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Streak Card */}
        <View style={styles.streakCard}>
          <View style={styles.streakHeaderRow}>
            <MaterialCommunityIcons
              name="fire"
              size={20}
              color={colors.accent}
            />
            <Text style={styles.streakLabel}>MILESTONE STREAK</Text>
          </View>
          <Text style={styles.streakDays}>
            {streak == 1 ? `${streak} Day` : `${streak} Days`}
          </Text>

          <View style={styles.timeCounter}>
            <View style={styles.timeItem}>
              <View style={styles.timeBox}>
                <Text style={styles.timeText}>{streak}</Text>
              </View>
              <Text style={styles.timeLabel}>DAYS</Text>
            </View>
            <Text style={styles.timeSeparator}>:</Text>
            <View style={styles.timeItem}>
              <View style={styles.timeBox}>
                <Text style={styles.timeText}>{hoursSinceMidnight}</Text>
              </View>
              <Text style={styles.timeLabel}>HOURS</Text>
            </View>
            <Text style={styles.timeSeparator}>:</Text>
            <View style={styles.timeItem}>
              <View style={styles.timeBox}>
                <Text style={styles.timeText}>{minutesSinceMidnight}</Text>
              </View>
              <Text style={styles.timeLabel}>MINUTES</Text>
            </View>
          </View>

          <View style={styles.bestStreakContainer}>
            <View style={styles.bestStreakRow}>
              <Text style={styles.bestStreakText}>Best streak</Text>
              <Text style={styles.bestStreakValue}>{bestStreak} days</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      100,
                      (streak / Math.max(bestStreak, 1)) * 100,
                    )}%`,
                    backgroundColor:
                      streak >= bestStreak ? colors.success : colors.accent,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Track Your Progress */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Track Your Progress</Text>
          <View style={styles.urgeButtons}>
            <TouchableOpacity
              style={[
                styles.urgeButton,
                { backgroundColor: colors.successSoft },
              ]}
              onPress={() => {
                setSelectedUrgeOutcome('resisted');
                setShowUrgeModal(true);
              }}
            >
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={32}
                color={colors.success}
              />
              <Text style={styles.urgeButtonText}>URGE RESISTED</Text>
              <Text style={styles.urgeButtonSubText}>You stayed strong!</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.urgeButton,
                { backgroundColor: colors.dangerSoft },
              ]}
              onPress={() => {
                setSelectedUrgeOutcome('relapsed');
                setShowUrgeModal(true);
              }}
            >
              <MaterialCommunityIcons
                name="refresh"
                size={32}
                color={colors.danger}
              />
              <Text style={styles.urgeButtonText}>RELAPSED</Text>
              <Text style={styles.urgeButtonSubText}>
                It's okay, keep going
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Rewards */}
        <View style={styles.sectionCard}>
          <View style={styles.rewardsHeader}>
            <Text style={styles.sectionTitle}>Rewards</Text>
            <View style={styles.rewardsPoints}>
              <MaterialCommunityIcons
                name="star-four-points"
                size={14}
                color={colors.warning}
              />
              <Text style={styles.rewardsPointsText}>
                {rewardPoints} points
              </Text>
            </View>
          </View>
          <Text style={styles.rewardsSubTitle}>Progress to next reward</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(rewardPoints % 200) / 2}%`,
                  backgroundColor: colors.accent,
                },
              ]}
            />
          </View>
          <Text style={styles.rewardsSubText}>
            {200 - (rewardPoints % 200)} more points to unlock premium
            meditation
          </Text>
          <View style={styles.badgesContainer}>
            {badges.length > 0 ? (
              badges.slice(0, 3).map((badge, idx) => (
                <View key={idx} style={styles.badgeItem}>
                  <View style={styles.badgeIcon}>
                    <MaterialCommunityIcons
                      name={
                        idx === 0
                          ? 'trophy-outline'
                          : idx === 1
                          ? 'medal-outline'
                          : 'star-circle-outline'
                      }
                      size={22}
                      color={colors.warning}
                    />
                  </View>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.badgeEmptyText}>
                Complete challenges to earn badges
              </Text>
            )}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Urge Modal */}
      <Modal
        visible={showUrgeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUrgeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowUrgeModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons
                name={
                  selectedUrgeOutcome === 'resisted'
                    ? 'shield-check-outline'
                    : 'refresh'
                }
                size={36}
                color={
                  selectedUrgeOutcome === 'resisted'
                    ? colors.success
                    : colors.danger
                }
              />
              <Text style={styles.modalTitle}>
                {selectedUrgeOutcome === 'resisted'
                  ? 'URGE RESISTED'
                  : 'RELAPSED'}
              </Text>
              <Text style={styles.modalSubText}>How were you feeling?</Text>
            </View>

            <Text style={styles.feelingSectionTitle}>Positive</Text>
            <View style={styles.feelingButtons}>
              {feelingOptions.positive.map(feeling => (
                <TouchableOpacity
                  key={feeling.id}
                  style={[
                    styles.feelingButton,
                    { backgroundColor: feeling.color + '1A' },
                  ]}
                  onPress={() => handleUrgeRecord(selectedUrgeOutcome, feeling)}
                >
                  <MaterialCommunityIcons
                    name={feeling.icon}
                    size={22}
                    color={feeling.color}
                  />
                  <Text style={styles.feelingButtonText}>{feeling.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.feelingSectionTitle}>Negative</Text>
            <View style={styles.feelingButtonsNegative}>
              {feelingOptions.negative.map(feeling => (
                <TouchableOpacity
                  key={feeling.id}
                  style={[
                    styles.feelingButtonNegative,
                    { backgroundColor: feeling.color + '1A' },
                  ]}
                  onPress={() => handleUrgeRecord(selectedUrgeOutcome, feeling)}
                >
                  <MaterialCommunityIcons
                    name={feeling.icon}
                    size={22}
                    color={feeling.color}
                  />
                  <Text style={styles.feelingButtonText}>{feeling.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowUrgeModal(false);
                setSelectedUrgeOutcome(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 16,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  logoContainer: {
    backgroundColor: colors.surface,
    padding: 4,
    borderRadius: radius.md,
    marginRight: spacing.md,
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
  },
  profileButton: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Streak Card
  streakCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xxxl,
    padding: spacing.xxl,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  streakLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  streakDays: {
    color: colors.accent,
    fontSize: 65,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: -2,
    marginBottom: spacing.xl,
    lineHeight: 76,
  },
  timeCounter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  timeItem: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  timeBox: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  timeLabel: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: spacing.sm,
    letterSpacing: 0.5,
  },
  timeSeparator: {
    color: colors.textMuted,
    fontSize: 18,
    marginBottom: 14,
    marginHorizontal: 2,
  },
  bestStreakContainer: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  bestStreakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bestStreakText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  bestStreakValue: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    marginTop: spacing.md,
  },
  progressFill: {
    height: 4,
    borderRadius: radius.full,
  },
  // Sections
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  urgeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  urgeButton: {
    flex: 1,
    padding: spacing.xl,
    borderRadius: radius.xxl,
    alignItems: 'center',
  },
  urgeButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    marginTop: spacing.md,
    letterSpacing: 0.5,
  },
  urgeButtonSubText: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  // Rewards
  rewardsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  rewardsPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rewardsPointsText: {
    color: colors.text,
    fontSize: 13,
  },
  rewardsSubTitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  rewardsSubText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.sm,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  badgeItem: {
    alignItems: 'center',
  },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  badgeText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  badgeEmptyText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  bottomPadding: {
    height: 80,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    width: 320,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  modalSubText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  feelingSectionTitle: {
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: spacing.sm,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  feelingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  feelingButtonsNegative: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  feelingButton: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
  },
  feelingButtonNegative: {
    width: '47%',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
  },
  feelingButtonText: {
    color: colors.text,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  cancelButton: {
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
  },
  cancelButtonText: {
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: '500',
  },
});
