import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  StyleSheet,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import HomeScreen from './HomeScreen';
import AnalyticsScreen from './AnalyticsScreen';
import LockdownSetupScreen from './LockdownSetupScreen';
import CommunityScreen from './CommunityScreen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../../utils/apiService';
import { colors, spacing, radius } from '../../utils/theme';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const [showChatbot, setShowChatbot] = useState(false);
  const [showUrgeHelpModal, setShowUrgeHelpModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm your recovery assistant. How are you feeling today?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMessage = {
      id: Date.now(),
      text: chatInput.trim(),
      isBot: false,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');

    const typingId = Date.now() + 1;
    const typingMessage = { id: typingId, text: '...', isBot: true, timestamp: new Date(), typing: true };
    setChatMessages(prev => [...prev, typingMessage]);

    // Extract history for context (last 10 messages)
    const history = chatMessages.slice(-10).map(msg => ({
      role: msg.isBot ? 'Assistant' : 'User',
      content: msg.text
    }));

    try {
      const data = await apiService.sendChat(userMessage.text, history);
      setChatMessages(prev =>
        prev.map(msg =>
          msg.id === typingId
            ? { ...msg, text: data.response || 'No response', typing: false, timestamp: new Date() }
            : msg,
        ),
      );
    } catch (err) {
      setChatMessages(prev =>
        prev.map(msg =>
          msg.id === typingId
            ? { ...msg, text: 'Sorry, there was a problem connecting to the assistant.', typing: false, timestamp: new Date() }
            : msg,
        ),
      );
    }
  };

  const dopamineSwapSuggestions = {
    immediate: [
      { id: 'breathing', name: 'Deep Breathing', icon: 'weather-windy', duration: '2 min', color: colors.success },
      { id: 'coldwater', name: 'Cold Water', icon: 'water-outline', duration: '30 sec', color: colors.accent },
      { id: 'pushups', name: '10 Push-ups', icon: 'arm-flex-outline', duration: '1 min', color: colors.warning },
      { id: 'music', name: 'Favorite Song', icon: 'music-note-outline', duration: '3 min', color: colors.danger },
    ],
    longer: [
      { id: 'walk', name: 'Quick Walk', icon: 'walk', duration: '10 min', color: colors.success },
      { id: 'call', name: 'Call a Friend', icon: 'phone-outline', duration: '15 min', color: colors.accent },
      { id: 'hobby', name: 'Creative Hobby', icon: 'palette-outline', duration: '30 min', color: colors.warning },
      { id: 'exercise', name: 'Workout', icon: 'arm-flex-outline', duration: '20 min', color: colors.danger },
    ],
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.bg,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 64,
            paddingBottom: 8,
            paddingTop: 8,
            elevation: 0,
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Analytics"
          component={AnalyticsScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="chart-line" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Emergency"
          component={LockdownSetupScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="shield-alert-outline" size={size} color={colors.warning} />
            ),
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600', color: colors.warning },
          }}
        />
        <Tab.Screen
          name="Community"
          component={CommunityScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="account-group-outline" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>

      {/* Floating Urge Help Button */}
      <TouchableOpacity style={styles.fabLeft} onPress={() => setShowUrgeHelpModal(true)}>
        <View style={styles.fabLeftInner}>
          <MaterialCommunityIcons name="shield-alert-outline" size={22} color={colors.text} />
        </View>
      </TouchableOpacity>

      {/* Floating Chatbot Button */}
      <TouchableOpacity style={styles.fabRight} onPress={() => setShowChatbot(true)}>
        <View style={styles.fabRightInner}>
          <MaterialCommunityIcons name="message-text-outline" size={22} color={colors.bg} />
        </View>
      </TouchableOpacity>

      {/* Chatbot Modal */}
      <Modal visible={showChatbot} animationType="slide" transparent={true} onRequestClose={() => setShowChatbot(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
          <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'flex-end' }} behavior="padding">
            <View style={styles.chatModalContent}>
              {/* Chat Header */}
              <View style={styles.chatHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.chatHeaderIcon}>
                    <MaterialCommunityIcons name="message-text-outline" size={18} color={colors.accent} />
                  </View>
                  <View>
                    <Text style={styles.chatHeaderTitle}>Recovery Assistant</Text>
                    <Text style={styles.chatHeaderSubtitle}>Always here to help</Text>
                  </View>
                </View>
                <TouchableOpacity style={{ padding: 8 }} onPress={() => setShowChatbot(false)}>
                  <MaterialCommunityIcons name="close" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Chat Messages */}
              <ScrollView style={styles.chatMessages} showsVerticalScrollIndicator={false}>
                {chatMessages.map(message => (
                  <View key={message.id} style={{ marginBottom: 14, alignItems: message.isBot ? 'flex-start' : 'flex-end' }}>
                    <View
                      style={{
                        maxWidth: '80%',
                        padding: spacing.md,
                        borderRadius: radius.xxl,
                        backgroundColor: message.isBot ? colors.surfaceAlt : colors.accent,
                        borderBottomLeftRadius: message.isBot ? 4 : radius.xxl,
                        borderBottomRightRadius: message.isBot ? radius.xxl : 4,
                      }}
                    >
                      <Text style={{ color: message.typing ? colors.textMuted : colors.text, fontSize: 14, lineHeight: 20 }}>
                        {message.typing ? 'Typing...' : message.text}
                      </Text>
                      <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 4 }}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* Chat Input */}
              <View style={styles.chatInputRow}>
                <View style={styles.chatInputBox}>
                  <TextInput
                    value={chatInput}
                    onChangeText={setChatInput}
                    placeholder="Type your message..."
                    placeholderTextColor={colors.textMuted}
                    style={{ color: colors.text, fontSize: 14 }}
                    multiline
                    maxLength={500}
                    onSubmitEditing={handleSendMessage}
                    blurOnSubmit={false}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.chatSendButton, { backgroundColor: chatInput.trim() ? colors.accent : colors.surfaceAlt }]}
                  onPress={handleSendMessage}
                  disabled={!chatInput.trim()}
                >
                  <MaterialCommunityIcons name="send" size={18} color={chatInput.trim() ? colors.bg : colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Urge Help Modal */}
      <Modal visible={showUrgeHelpModal} transparent={true} animationType="slide" onRequestClose={() => setShowUrgeHelpModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={styles.urgeModalContent}>
            <View style={{ alignItems: 'center', marginBottom: spacing.xxl }}>
              <View style={styles.urgeModalIconBg}>
                <MaterialCommunityIcons name="shield-alert-outline" size={26} color={colors.danger} />
              </View>
              <Text style={styles.urgeModalTitle}>I'm Feeling an Urge</Text>
              <Text style={styles.urgeModalSubtitle}>Choose your support level</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Dopamine Swaps */}
              <View style={styles.urgeSwapsSection}>
                <View style={styles.urgeSwapsHeader}>
                  <MaterialCommunityIcons name="swap-horizontal" size={18} color={colors.accent} />
                  <Text style={styles.urgeSwapsTitle}>Quick Dopamine Swaps</Text>
                </View>

                <Text style={styles.urgeSwapsSubTitle}>Immediate (0-5 min)</Text>
                <View style={styles.urgeSwapsRow}>
                  {dopamineSwapSuggestions.immediate.map(activity => (
                    <TouchableOpacity key={activity.id} style={[styles.urgeSwapBtn, { backgroundColor: activity.color + '1A' }]}>
                      <MaterialCommunityIcons name={activity.icon} size={22} color={activity.color} />
                      <Text style={styles.urgeSwapBtnText}>{activity.name}</Text>
                      <Text style={styles.urgeSwapBtnDuration}>{activity.duration}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.urgeSwapsSubTitle}>Longer Activities (10+ min)</Text>
                <View style={styles.urgeSwapsRow}>
                  {dopamineSwapSuggestions.longer.map(activity => (
                    <TouchableOpacity key={activity.id} style={[styles.urgeSwapBtn, { backgroundColor: activity.color + '1A' }]}>
                      <MaterialCommunityIcons name={activity.icon} size={22} color={activity.color} />
                      <Text style={styles.urgeSwapBtnText}>{activity.name}</Text>
                      <Text style={styles.urgeSwapBtnDuration}>{activity.duration}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.urgeModalCloseBtn} onPress={() => setShowUrgeHelpModal(false)}>
              <Text style={styles.urgeModalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // FABs
  fabLeft: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    zIndex: 1000,
  },
  fabLeftInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabRight: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    zIndex: 1000,
  },
  fabRightInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Chat Modal
  chatModalContent: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xxxl,
    borderTopRightRadius: radius.xxxl,
    height: '80%',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chatHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  chatHeaderTitle: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 15,
  },
  chatHeaderSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
  },
  chatMessages: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  chatInputBox: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xxl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginRight: spacing.md,
  },
  chatSendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Urge Help Modal
  urgeModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxxl,
    borderTopRightRadius: radius.xxxl,
    padding: spacing.xxl,
    maxHeight: '80%',
  },
  urgeModalIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  urgeModalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  urgeModalSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  urgeSwapsSection: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  urgeSwapsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  urgeSwapsTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  urgeSwapsSubTitle: {
    color: colors.textMuted,
    fontWeight: '500',
    marginBottom: spacing.md,
    fontSize: 12,
  },
  urgeSwapsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  urgeSwapBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.xl,
    width: '22%',
  },
  urgeSwapBtnText: {
    color: colors.text,
    fontSize: 10,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  urgeSwapBtnDuration: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  urgeModalCloseBtn: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.xl,
    alignItems: 'center',
  },
  urgeModalCloseBtnText: {
    color: colors.textMuted,
    fontWeight: '500',
  },
});
