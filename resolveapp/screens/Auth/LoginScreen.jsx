import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ToastAndroid,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { signIn, signUp } from '../../firebase/authService';
import { createUserDoc } from '../../firebase/firestoreService';
import ResolveLogo from '../../assets/images/resolve.png';
import { signInAnonymously } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { colors, spacing, radius } from '../../utils/theme';

export default function LoginScreen({ navigation }) {
  const [tab, setTab] = useState('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [message, setMessage] = useState('');

  const handleSignIn = async () => {
    try {
      await signIn(loginEmail, loginPassword);
      ToastAndroid.show('Logged in successfully!', ToastAndroid.SHORT);
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs', state: { index: 0, routes: [{ name: 'Home' }] } }],
      });
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleSignUp = async () => {
    try {
      const userCred = await signUp(signupEmail, signupPassword);
      await createUserDoc(userCred.user.uid, { displayName: signupUsername });
      ToastAndroid.show('Account created successfully!', ToastAndroid.SHORT);
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs', state: { index: 0, routes: [{ name: 'Home' }] } }],
      });
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleGuestLogin = async () => {
    try {
      if (auth.currentUser) {
        navigation.replace('MainTabs');
        return;
      }
      const userCred = await signInAnonymously(auth);
      const uid = userCred.user.uid;
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          anonymous: true,
          displayName: 'Guest',
          createdAt: serverTimestamp(),
          currentStreak: 0,
          bestStreak: 0,
          lastCheckIn: null,
          badges: [],
          urges: [],
        });
      }

      ToastAndroid.show('Logged in as guest', ToastAndroid.SHORT);
      navigation.replace('MainTabs');
    } catch (err) {
      console.log(err);
      setMessage(err.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.container}>
            {/* Logo */}
            <View style={styles.logoRow}>
              <View style={styles.logoBg}>
                <Image source={ResolveLogo} style={styles.logoImg} resizeMode="contain" />
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tabBtn, styles.tabLeft, tab === 'login' && styles.tabActive]}
                onPress={() => setTab('login')}
              >
                <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, styles.tabRight, tab === 'signup' && styles.tabActive]}
                onPress={() => setTab('signup')}
              >
                <Text style={[styles.tabText, tab === 'signup' && styles.tabTextActive]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {/* Card */}
            <View style={styles.card}>
              {tab === 'login' ? (
                <>
                  <Text style={styles.cardTitle}>Welcome Back</Text>
                  <Text style={styles.cardSubtitle}>Sign in to continue your journey</Text>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <View style={styles.inputWrapper}>
                      <MaterialCommunityIcons name="email-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor={colors.textMuted}
                        value={loginEmail}
                        onChangeText={setLoginEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                  </View>
                  <View style={styles.inputGroupLast}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <View style={styles.inputWrapper}>
                      <MaterialCommunityIcons name="lock-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry
                        value={loginPassword}
                        onChangeText={setLoginPassword}
                      />
                    </View>
                  </View>
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleSignIn}>
                    <Text style={styles.primaryBtnText}>Login</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.cardTitle}>Create Account</Text>
                  <Text style={styles.cardSubtitle}>Sign up to start your journey</Text>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Username</Text>
                    <View style={styles.inputWrapper}>
                      <MaterialCommunityIcons name="account-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Username"
                        placeholderTextColor={colors.textMuted}
                        value={signupUsername}
                        onChangeText={setSignupUsername}
                      />
                    </View>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <View style={styles.inputWrapper}>
                      <MaterialCommunityIcons name="email-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor={colors.textMuted}
                        value={signupEmail}
                        onChangeText={setSignupEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                  </View>
                  <View style={styles.inputGroupLast}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <View style={styles.inputWrapper}>
                      <MaterialCommunityIcons name="lock-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry
                        value={signupPassword}
                        onChangeText={setSignupPassword}
                      />
                    </View>
                  </View>
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleSignUp}>
                    <Text style={styles.primaryBtnText}>Sign Up</Text>
                  </TouchableOpacity>
                </>
              )}
              {message ? <Text style={styles.errorMsg}>{message}</Text> : null}
            </View>
          </View>
        </ScrollView>
        <TouchableOpacity style={styles.guestBtn} onPress={handleGuestLogin}>
          <MaterialCommunityIcons name="account-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
          <Text style={styles.guestBtnText}>Continue as Guest</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 48,
  },
  logoRow: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logoBg: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radius.full,
  },
  logoImg: {
    width: 160,
    height: 160,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    justifyContent: 'center',
  },
  tabBtn: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: 10,
    backgroundColor: colors.surfaceAlt,
  },
  tabLeft: {
    borderTopLeftRadius: radius.xl,
    borderBottomLeftRadius: radius.xl,
  },
  tabRight: {
    borderTopRightRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    fontWeight: '600',
    color: colors.textMuted,
    fontSize: 14,
  },
  tabTextActive: {
    color: colors.bg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  cardSubtitle: {
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputGroupLast: {
    marginBottom: spacing.xxl,
  },
  inputLabel: {
    color: colors.textMuted,
    fontWeight: '500',
    marginBottom: spacing.xs,
    fontSize: 13,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 15,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: colors.bg,
    fontWeight: '600',
    fontSize: 15,
  },
  errorMsg: {
    marginTop: spacing.lg,
    color: colors.danger,
    textAlign: 'center',
    fontSize: 13,
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  guestBtnText: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 14,
  },
});
