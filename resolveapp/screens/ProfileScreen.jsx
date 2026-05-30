/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  Switch,
  StatusBar,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius } from '../utils/theme';
import { AlertService } from '../utils/AlertService';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    dailyReminders: true,
    streakMilestones: true,
    motivationalQuotes: false,
    communityUpdates: true,
    emergencyAlerts: true,
  });
  const [appSettings, setAppSettings] = useState({
    darkMode: true,
    dataSync: true,
    analytics: true,
    soundEffects: false,
    hapticFeedback: true,
  });
  const [showMemories, setShowMemories] = useState(false);
  const [userMemories, setUserMemories] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserData(data);
            if (data.memories) {
              setUserMemories(data.memories);
            } else {
              const localMemories = await AsyncStorage.getItem('userMemories');
              if (localMemories) setUserMemories(JSON.parse(localMemories));
            }
          }
        } else {
          const localMemories = await AsyncStorage.getItem('userMemories');
          if (localMemories) setUserMemories(JSON.parse(localMemories));
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleSignOut = () => {
    AlertService.confirm(
      'Sign Out',
      'Are you sure you want to sign out?',
      async () => {
        try {
          if (!userData.anonymous) await signOut(auth);
          navigation.replace('Login');
        } catch (error) {
          console.error('Sign out error:', error);
        }
      },
      null,
      'Sign Out',
      'Cancel'
    );
  };

  const handleDeleteMemory = async (index) => {
    AlertService.confirm(
      'Delete Memory',
      'Are you sure you want the AI to forget this fact?',
      async () => {
        try {
          const newMemories = userMemories.filter((_, i) => i !== index);
          setUserMemories(newMemories);
          
          const user = auth.currentUser;
          if (user) {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, { memories: newMemories }, { merge: true });
          } else {
            await AsyncStorage.setItem('userMemories', JSON.stringify(newMemories));
          }
        } catch (error) {
          console.error('Delete memory error:', error);
        }
      },
      null,
      'Delete',
      'Cancel'
    );
  };

  const profileOptions = [
    { id: 6, title: 'AI Memories', description: 'Manage what the AI knows about you', icon: 'brain', color: colors.success, action: () => setShowMemories(true) },
    { id: 1, title: 'Account Settings', description: 'Manage your account details', icon: 'account-cog-outline', color: colors.accent, action: () => setShowSettings(true) },
    { id: 2, title: 'Notifications', description: 'Configure app notifications', icon: 'bell-outline', color: colors.success, action: () => setShowNotifications(true) },
    { id: 3, title: 'Privacy & Security', description: 'Manage your privacy settings', icon: 'shield-check-outline', color: colors.warning, action: () => ToastAndroid.show('Privacy settings coming soon', ToastAndroid.SHORT) },
    { id: 4, title: 'Data Export', description: 'Download your recovery data', icon: 'download-outline', color: colors.accent, action: () => ToastAndroid.show('Data export coming soon', ToastAndroid.SHORT) },
    { id: 5, title: 'Help & Support', description: 'Get help using the app', icon: 'help-circle-outline', color: colors.danger, action: () => ToastAndroid.show('Support coming soon', ToastAndroid.SHORT) },
  ];

  const displayName = userData?.displayName || 'Guest';
  const email = userData?.email || auth.currentUser?.email || '--';
  const currentStreak = userData?.currentStreak ?? 0;
  const bestStreak = userData?.bestStreak ?? 0;
  const badges = userData?.badges || [];
  let joinDate = 'Recently';
  if (userData?.createdAt) {
    let dateObj;
    if (typeof userData.createdAt === 'number') dateObj = new Date(userData.createdAt);
    else if (userData.createdAt?.seconds) dateObj = new Date(userData.createdAt.seconds * 1000);
    
    if (dateObj) {
      const diffTime = Math.abs(new Date() - dateObj);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      let relativeStr = '';
      if (diffDays === 0) {
        relativeStr = 'Today';
      } else if (diffDays === 1) {
        relativeStr = '1 day';
      } else if (diffDays < 30) {
        relativeStr = `${diffDays} days`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        relativeStr = `${months} month${months > 1 ? 's' : ''}`;
      } else {
        const years = Math.floor(diffDays / 365);
        relativeStr = `${years} year${years > 1 ? 's' : ''}`;
      }
      
      joinDate = `${relativeStr} (${dateObj.toLocaleDateString()})`;
    }
  }

  const notificationInfo = {
    dailyReminders: { title: 'Daily Check-in Reminders', description: 'Get reminded to log your daily progress' },
    streakMilestones: { title: 'Streak Milestones', description: 'Celebrate when you reach new streak goals' },
    motivationalQuotes: { title: 'Motivational Quotes', description: 'Receive inspiring messages throughout the day' },
    communityUpdates: { title: 'Community Updates', description: 'Stay updated with community activities' },
    emergencyAlerts: { title: 'Emergency Support', description: 'Important alerts for crisis situations' },
  };

  const appSettingsInfo = {
    darkMode: { title: 'Dark Mode', description: 'Use dark theme throughout the app' },
    dataSync: { title: 'Cloud Sync', description: 'Automatically sync your data to the cloud' },
    analytics: { title: 'Usage Analytics', description: 'Help improve the app by sharing anonymous usage data' },
    soundEffects: { title: 'Sound Effects', description: 'Play sounds for actions and notifications' },
    hapticFeedback: { title: 'Haptic Feedback', description: 'Feel vibrations for button presses and alerts' },
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: spacing.lg }}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View style={styles.profileCard}>
            <View style={{ alignItems: 'center' }}>
              <View style={styles.avatar}>
                <MaterialCommunityIcons name="account" size={28} color={colors.bg} />
              </View>
              <Text style={styles.displayName}>{displayName}</Text>
              <Text style={styles.email}>{email}</Text>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{currentStreak}</Text>
                  <Text style={styles.statLabel}>Current Streak</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{bestStreak}</Text>
                  <Text style={styles.statLabel}>Best Streak</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{badges.length}</Text>
                  <Text style={styles.statLabel}>Badges</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Membership */}
          <View style={styles.membershipRow}>
            <MaterialCommunityIcons name="calendar-check-outline" size={20} color={colors.success} />
            <View style={{ marginLeft: spacing.md }}>
              <Text style={styles.memberTitle}>Member Since</Text>
              <Text style={styles.memberDate}>{joinDate}</Text>
            </View>
          </View>

          {/* Profile Options */}
          {profileOptions.map(option => (
            <TouchableOpacity key={option.id} style={styles.optionRow} onPress={option.action}>
              <View style={[styles.optionIconBg, { backgroundColor: option.color + '1A' }]}>
                <MaterialCommunityIcons name={option.icon} size={22} color={option.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDesc}>{option.description}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          ))}

          {/* Sign Out */}
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <MaterialCommunityIcons name="logout" size={20} color={colors.text} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Notifications Modal */}
        <Modal visible={showNotifications} transparent animationType="slide" onRequestClose={() => setShowNotifications(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowNotifications(false)}>
            <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Notifications</Text>
                <TouchableOpacity onPress={() => setShowNotifications(false)}>
                  <MaterialCommunityIcons name="close" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {Object.entries(notificationSettings).map(([key, value]) => (
                  <View key={key} style={styles.settingRow}>
                    <View style={{ flex: 1, marginRight: spacing.md }}>
                      <Text style={styles.settingTitle}>{notificationInfo[key].title}</Text>
                      <Text style={styles.settingDesc}>{notificationInfo[key].description}</Text>
                    </View>
                    <Switch
                      value={value}
                      onValueChange={() => setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }))}
                      trackColor={{ false: colors.border, true: colors.success }}
                      thumbColor={value ? '#ffffff' : colors.textMuted}
                    />
                  </View>
                ))}
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Settings Modal */}
        <Modal visible={showSettings} transparent animationType="slide" onRequestClose={() => setShowSettings(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSettings(false)}>
            <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Settings</Text>
                <TouchableOpacity onPress={() => setShowSettings(false)}>
                  <MaterialCommunityIcons name="close" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {Object.entries(appSettings).map(([key, value]) => (
                  <View key={key} style={styles.settingRow}>
                    <View style={{ flex: 1, marginRight: spacing.md }}>
                      <Text style={styles.settingTitle}>{appSettingsInfo[key].title}</Text>
                      <Text style={styles.settingDesc}>{appSettingsInfo[key].description}</Text>
                    </View>
                    <Switch
                      value={value}
                      onValueChange={() => setAppSettings(prev => ({ ...prev, [key]: !prev[key] }))}
                      trackColor={{ false: colors.border, true: colors.accent }}
                      thumbColor={value ? '#ffffff' : colors.textMuted}
                    />
                  </View>
                ))}
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* AI Memories Modal */}
        <Modal visible={showMemories} transparent animationType="slide" onRequestClose={() => setShowMemories(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowMemories(false)}>
            <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>AI Memories</Text>
                <TouchableOpacity onPress={() => setShowMemories(false)}>
                  <MaterialCommunityIcons name="close" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: spacing.lg }}>
                The AI remembers the following facts about you to personalize your experience. You can delete any memory at any time.
              </Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {userMemories.length === 0 ? (
                  <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl }}>No memories saved yet.</Text>
                ) : (
                  userMemories.map((mem, index) => (
                    <View key={index} style={[styles.settingRow, { alignItems: 'flex-start' }]}>
                      <View style={{ flex: 1, marginRight: spacing.md }}>
                        <Text style={{ color: colors.text, fontSize: 13, lineHeight: 18 }}>{mem}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteMemory(index)} style={{ padding: spacing.sm, backgroundColor: colors.dangerSoft, borderRadius: radius.md }}>
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
                <View style={{ height: 20 }} />
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xxl },
  headerTitle: { color: colors.text, fontSize: 22, fontWeight: '700' },
  profileCard: { backgroundColor: colors.surfaceAlt, borderRadius: radius.xxxl, padding: spacing.xxl, marginBottom: spacing.xxl, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  displayName: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 4 },
  email: { color: colors.textMuted, fontSize: 12, marginBottom: spacing.lg },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { color: colors.text, fontSize: 22, fontWeight: '700' },
  statLabel: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  membershipRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.xxl, padding: spacing.lg, marginBottom: spacing.xxl, borderWidth: 1, borderColor: colors.border },
  memberTitle: { color: colors.text, fontWeight: '600', fontSize: 14 },
  memberDate: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  optionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.xxl, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  optionIconBg: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  optionTitle: { color: colors.text, fontWeight: '600', fontSize: 14 },
  optionDesc: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.danger, borderRadius: radius.xxl, padding: spacing.lg, marginBottom: spacing.xxxl },
  signOutText: { color: colors.text, fontWeight: '600', marginLeft: spacing.sm, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xxxl, borderTopRightRadius: radius.xxxl, padding: spacing.xxl, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xxl },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.bg, borderRadius: radius.xxl, padding: spacing.lg, marginBottom: spacing.md },
  settingTitle: { color: colors.text, fontWeight: '600', fontSize: 14 },
  settingDesc: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
});
