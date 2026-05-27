/* eslint-disable react-native/no-inline-styles */
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import { colors, spacing, radius } from '../../utils/theme';

export default function CommunityScreen({ navigation }) {
  const [threads, setThreads] = useState([
    {
      id: 'relapse',
      title: 'Relapse Stories',
      posts: [
        {
          id: 'p1',
          text: 'Had a setback last week, getting back up.',
          upvotes: 5,
          replies: [{ id: 'r1', text: 'Proud of you for trying again!' }],
        },
      ],
    },
    {
      id: 'motivation',
      title: 'Motivation',
      posts: [
        {
          id: 'p2',
          text: 'Day 14 — feeling clearer than ever.',
          upvotes: 12,
          replies: [],
        },
      ],
    },
    {
      id: 'tips',
      title: 'Tips',
      posts: [
        {
          id: 'p3',
          text: 'Cold showers + walk outside helped me.',
          upvotes: 8,
          replies: [],
        },
      ],
    },
  ]);
  const [newPost, setNewPost] = useState('');
  const [activeThreadId, setActiveThreadId] = useState('relapse');
  const [replyDrafts, setReplyDrafts] = useState({});
  const [sessions] = useState([
    {
      id: 's1',
      title: 'Evening Check-in',
      time: 'Today 7:00 PM',
      mode: 'text',
    },
    {
      id: 's2',
      title: 'Weekend Recovery Circle',
      time: 'Sat 10:00 AM',
      mode: 'audio',
    },
  ]);
  const [joinedSessionId, setJoinedSessionId] = useState(null);
  const [partnerCode, setPartnerCode] = useState('');
  const [connectedCode, setConnectedCode] = useState(null);
  const [shareStreak, setShareStreak] = useState(true);
  const [shareAlerts, setShareAlerts] = useState(false);
  const [messageDraft, setMessageDraft] = useState('');
  const [messages, setMessages] = useState([]);

  const activeThread = useMemo(
    () => threads.find(t => t.id === activeThreadId),
    [threads, activeThreadId],
  );

  const handleUpvote = async postId => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const threadRef = doc(db, 'threads', activeThreadId);
      const threadSnap = await getDoc(threadRef);
      if (threadSnap.exists()) {
        const threadData = threadSnap.data();
        const updatedPosts = threadData.posts.map(p =>
          p.id === postId ? { ...p, upvotes: p.upvotes + 1 } : p,
        );
        await setDoc(threadRef, { posts: updatedPosts }, { merge: true });
        setThreads(prev =>
          prev.map(t =>
            t.id === activeThreadId ? { ...t, posts: updatedPosts } : t,
          ),
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPost = async () => {
    if (!newPost.trim()) return;
    const user = auth.currentUser;
    if (!user) return;
    try {
      const threadRef = doc(db, 'threads', activeThreadId);
      const newPostData = {
        id: `p${Date.now()}`,
        text: newPost.trim(),
        upvotes: 0,
        replies: [],
        createdAt: serverTimestamp(),
        userId: user.uid,
      };
      await setDoc(
        threadRef,
        { posts: arrayUnion(newPostData) },
        { merge: true },
      );
      setThreads(prev =>
        prev.map(t =>
          t.id === activeThreadId
            ? { ...t, posts: [newPostData, ...t.posts] }
            : t,
        ),
      );
      setNewPost('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddReply = async postId => {
    const text = replyDrafts[postId]?.trim();
    if (!text) return;
    const user = auth.currentUser;
    if (!user) return;
    try {
      const threadRef = doc(db, 'threads', activeThreadId);
      const threadSnap = await getDoc(threadRef);
      if (threadSnap.exists()) {
        const threadData = threadSnap.data();
        const updatedPosts = threadData.posts.map(p =>
          p.id === postId
            ? {
                ...p,
                replies: [
                  ...p.replies,
                  { id: `r${Date.now()}`, text, userId: user.uid },
                ],
              }
            : p,
        );
        await setDoc(threadRef, { posts: updatedPosts }, { merge: true });
        setThreads(prev =>
          prev.map(t =>
            t.id === activeThreadId ? { ...t, posts: updatedPosts } : t,
          ),
        );
        setReplyDrafts(d => ({ ...d, [postId]: '' }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleJoin = async id => {
    setJoinedSessionId(id);
    const user = auth.currentUser;
    if (!user) return;
    try {
      const sessionRef = doc(db, 'sessions', id);
      await setDoc(
        sessionRef,
        { participants: arrayUnion(user.uid) },
        { merge: true },
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleConnect = async () => {
    if (!partnerCode.trim()) return;
    const user = auth.currentUser;
    if (!user) return;
    try {
      const partnerRef = doc(db, 'users', partnerCode.trim());
      const partnerSnap = await getDoc(partnerRef);
      if (partnerSnap.exists()) {
        setConnectedCode(partnerCode.trim());
        await setDoc(
          doc(db, 'users', user.uid),
          { partnerCode: partnerCode.trim() },
          { merge: true },
        );
        setPartnerCode('');
      } else {
        console.error('Invalid partner code');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async () => {
    if (!messageDraft.trim() || !connectedCode) return;
    const user = auth.currentUser;
    if (!user) return;
    try {
      const messageData = {
        id: `m${Date.now()}`,
        text: messageDraft.trim(),
        fromMe: true,
        timestamp: serverTimestamp(),
        fromUserId: user.uid,
        toUserId: connectedCode,
      };
      const chatRef = doc(db, 'chats', `${user.uid}_${connectedCode}`);
      await setDoc(
        chatRef,
        { messages: arrayUnion(messageData) },
        { merge: true },
      );
      setMessages(m => [...m, messageData]);
      setMessageDraft('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community & Support</Text>
        <Text style={styles.headerSubtitle}>
          Connect, share & heal together
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Anonymous Forum */}
        <View style={styles.sectionCard}>
          <View style={styles.forumHeader}>
            <View style={styles.forumTitleRow}>
              <MaterialCommunityIcons
                name="forum-outline"
                size={20}
                color={colors.accent}
              />
              <Text style={styles.sectionTitle}>Anonymous Forum</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.threadTabsScroll}
            >
              <View style={styles.threadTabs}>
                {threads.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.threadTab,
                      activeThreadId === t.id && styles.threadTabActive,
                    ]}
                    onPress={() => setActiveThreadId(t.id)}
                  >
                    <Text
                      style={[
                        styles.threadTabText,
                        {
                          color:
                            activeThreadId === t.id
                              ? colors.bg
                              : colors.textMuted,
                          fontWeight: activeThreadId === t.id ? '600' : '400',
                        },
                      ]}
                    >
                      {t.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.postInputContainer}>
            <TextInput
              value={newPost}
              onChangeText={setNewPost}
              placeholder={`Share to ${activeThread?.title}`}
              placeholderTextColor={colors.textMuted}
              style={styles.postInput}
            />
            <TouchableOpacity style={styles.postButton} onPress={handleAddPost}>
              <Text style={styles.postButtonText}>Post</Text>
            </TouchableOpacity>
          </View>

          {activeThread?.posts.map(p => (
            <View key={p.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <MaterialCommunityIcons
                  name="account-circle-outline"
                  size={28}
                  color={colors.accent}
                />
                <View style={styles.postMeta}>
                  <Text style={styles.postAuthor}>Anonymous User</Text>
                  <Text style={styles.postTime}>Just now</Text>
                </View>
              </View>
              <Text style={styles.postText}>{p.text}</Text>
              <View style={styles.postActions}>
                <TouchableOpacity
                  style={styles.upvoteButton}
                  onPress={() => handleUpvote(p.id)}
                >
                  <MaterialCommunityIcons
                    name="arrow-up-bold-outline"
                    size={16}
                    color={p.upvotes > 0 ? colors.warning : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.upvoteCount,
                      {
                        color:
                          p.upvotes > 0 ? colors.warning : colors.textMuted,
                      },
                    ]}
                  >
                    {p.upvotes}
                  </Text>
                </TouchableOpacity>
              </View>
              {p.replies?.length ? (
                <View style={styles.repliesContainer}>
                  {p.replies.map(r => (
                    <Text key={r.id} style={styles.replyText}>
                      {r.text}
                    </Text>
                  ))}
                </View>
              ) : null}
              <View style={styles.replyInputContainer}>
                <TextInput
                  value={replyDrafts[p.id] || ''}
                  onChangeText={t => setReplyDrafts(d => ({ ...d, [p.id]: t }))}
                  placeholder="Reply anonymously"
                  placeholderTextColor={colors.textMuted}
                  style={styles.replyInput}
                />
                <TouchableOpacity
                  style={styles.replyButton}
                  onPress={() => handleAddReply(p.id)}
                >
                  <Text style={[styles.replyButtonText, { color: colors.bg }]}>Reply</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* AI Group Therapy */}
        <View style={styles.sectionCard}>
          <View style={styles.therapySectionHeader}>
            <MaterialCommunityIcons
              name="account-group-outline"
              size={20}
              color={colors.success}
            />
            <Text style={styles.sectionTitle}>AI Group Therapy</Text>
          </View>
          {sessions.map(s => (
            <View key={s.id} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <MaterialCommunityIcons
                  name={
                    s.mode === 'audio'
                      ? 'microphone-outline'
                      : 'message-text-outline'
                  }
                  size={16}
                  color={colors.accent}
                />
                <Text style={styles.sessionTitle}>{s.title}</Text>
                <Text style={styles.sessionTime}>{s.time}</Text>
              </View>
              <Text style={styles.sessionDescription}>
                AI facilitator provides prompts and gentle moderation.
              </Text>
              {joinedSessionId === s.id ? (
                <View style={styles.sessionPrompt}>
                  <Text style={styles.promptText}>
                    Prompt: "Share one win and one challenge today."
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.joinButton, { backgroundColor: colors.text }]}
                  onPress={() => handleJoin(s.id)}
                >
                  <Text style={[styles.joinButtonText, { color: colors.bg }]}>
                    Join {s.mode === 'audio' ? 'Audio' : 'Text'} Session
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Accountability Partner */}
        <View style={styles.sectionCard}>
          <View style={styles.partnerSectionHeader}>
            <MaterialCommunityIcons
              name="handshake-outline"
              size={20}
              color={colors.danger}
            />
            <Text style={styles.sectionTitle}>Accountability Partner</Text>
          </View>
          <View style={styles.partnerInputContainer}>
            <TextInput
              value={partnerCode}
              onChangeText={setPartnerCode}
              placeholder="Enter or share your connect code"
              placeholderTextColor={colors.textMuted}
              style={styles.partnerInput}
            />
            <TouchableOpacity
              style={styles.connectButton}
              onPress={handleConnect}
            >
              <Text style={styles.connectButtonText}>Connect</Text>
            </TouchableOpacity>
          </View>
          {connectedCode ? (
            <View style={styles.partnerConnected}>
              <Text style={styles.connectedText}>
                Connected to: {connectedCode}
              </Text>
              <View style={styles.partnerOptions}>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => setShareStreak(v => !v)}
                >
                  <Text style={styles.optionText}>
                    Share Streak: {shareStreak ? 'On' : 'Off'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => setShareAlerts(v => !v)}
                >
                  <Text style={styles.optionText}>
                    Emergency Alerts: {shareAlerts ? 'On' : 'Off'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.messageContainer}>
                {messages.length ? (
                  messages.map(m => (
                    <Text key={m.id} style={styles.messageText}>
                      {m.fromMe ? 'Me: ' : 'Partner: '}
                      {m.text}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.noMessagesText}>No messages yet</Text>
                )}
              </View>
              <View style={styles.messageInputContainer}>
                <TextInput
                  value={messageDraft}
                  onChangeText={setMessageDraft}
                  placeholder="Private message"
                  placeholderTextColor={colors.textMuted}
                  style={styles.messageInput}
                />
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={handleSendMessage}
                >
                  <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={styles.noPartnerText}>
              Connect with a partner to share progress and messages.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: { color: colors.textMuted, fontSize: 12 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  forumHeader: { marginBottom: spacing.lg },
  forumTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  threadTabsScroll: { marginBottom: spacing.md },
  threadTabs: { flexDirection: 'row', gap: spacing.sm },
  threadTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xxl,
    backgroundColor: colors.surfaceAlt,
  },
  threadTabActive: { backgroundColor: colors.accent },
  threadTabText: { fontSize: 13 },
  postInputContainer: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  postInput: { color: colors.text, fontSize: 14, minHeight: 36 },
  postButton: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    marginTop: spacing.sm,
  },
  postButtonText: { color: colors.bg, fontSize: 13, fontWeight: '600' },
  postCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  postMeta: { flex: 1 },
  postAuthor: { color: colors.text, fontSize: 13, fontWeight: '600' },
  postTime: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  postText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  upvoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  upvoteCount: { fontSize: 12, fontWeight: '600' },
  repliesContainer: {
    backgroundColor: colors.bg,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.success,
  },
  replyText: {
    color: colors.text,
    fontSize: 12,
    marginBottom: spacing.sm,
    lineHeight: 17,
    opacity: 0.8,
  },
  replyInputContainer: {
    backgroundColor: colors.bg,
    borderRadius: radius.xl,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  replyInput: { color: colors.text, fontSize: 12, flex: 1, minHeight: 32 },
  replyButton: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
  },
  replyButtonText: { color: colors.text, fontSize: 11, fontWeight: '600' },
  therapySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sessionCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sessionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  sessionTime: { color: colors.textMuted, fontSize: 10 },
  sessionDescription: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.md,
    lineHeight: 17,
  },
  joinButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.success,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
  },
  joinButtonText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  sessionPrompt: {
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    padding: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.accent,
  },
  promptText: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 17,
    opacity: 0.8,
  },
  partnerSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  partnerInputContainer: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  partnerInput: { color: colors.text, fontSize: 14, minHeight: 36 },
  connectButton: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    marginTop: spacing.sm,
  },
  connectButtonText: { color: colors.bg, fontSize: 13, fontWeight: '600' },
  partnerConnected: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  connectedText: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  partnerOptions: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  optionButton: {
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    flex: 1,
  },
  optionText: { color: colors.text, fontSize: 11, fontWeight: '500' },
  messageContainer: {
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    maxHeight: 140,
  },
  messageText: {
    color: colors.text,
    fontSize: 12,
    marginBottom: spacing.sm,
    lineHeight: 17,
    opacity: 0.8,
  },
  noMessagesText: { color: colors.textMuted, fontSize: 12 },
  messageInputContainer: {
    backgroundColor: colors.bg,
    borderRadius: radius.xl,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  messageInput: { color: colors.text, fontSize: 12, flex: 1, minHeight: 32 },
  sendButton: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.xl,
  },
  sendButtonText: { color: colors.text, fontSize: 11, fontWeight: '600' },
  noPartnerText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
