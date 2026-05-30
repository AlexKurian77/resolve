import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { colors, spacing, radius } from '../../utils/theme';
import { apiService } from '../../utils/apiService';

const formatTime = (timestamp) => {
  if (!timestamp) return 'Just now';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function FullForumScreen({ route, navigation }) {
  const { threadId, threadTitle } = route.params;
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [expandedReplies, setExpandedReplies] = useState({});
  
  const POSTS_PER_PAGE = 5;

  const fetchPosts = async () => {
    try {
      const threadRef = doc(db, 'threads', threadId);
      const threadSnap = await getDoc(threadRef);
      if (threadSnap.exists()) {
        const data = threadSnap.data();
        const allPosts = data.posts || [];
        const sorted = allPosts.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt || 0);
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt || 0);
          return timeB - timeA;
        });
        setPosts(sorted);
      }
    } catch (e) {
      console.error('Error fetching full thread:', e);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [threadId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await fetchPosts();
    setRefreshing(false);
  }, [threadId]);

  const loadMore = () => {
    if (page * POSTS_PER_PAGE < posts.length) {
      setPage(prev => prev + 1);
    }
  };

  const displayedPosts = useMemo(() => {
    return posts.slice(0, page * POSTS_PER_PAGE);
  }, [posts, page]);

  const handleUpvote = async postId => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      setPosts(prev =>
        prev.map(p => {
          if (p.id === postId) {
            const upvotedBy = p.upvotedBy || [];
            const hasVoted = upvotedBy.includes(user.uid);
            const newUpvotedBy = hasVoted
              ? upvotedBy.filter(id => id !== user.uid)
              : [...upvotedBy, user.uid];
            return { ...p, upvotedBy: newUpvotedBy, upvotes: p.upvotes + (hasVoted ? -1 : 1) };
          }
          return p;
        })
      );
      await apiService.upvotePost(threadId, postId, user.uid);
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
      const replyData = { id: `r${Date.now()}`, text, userId: user.uid, createdAt: Date.now() };
      
      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? { ...p, replies: [...(p.replies || []), replyData] }
            : p
        )
      );
      setReplyDrafts(d => ({ ...d, [postId]: '' }));
      
      // Auto expand replies when you reply
      setExpandedReplies(prev => ({ ...prev, [postId]: true }));

      await apiService.addReply(threadId, postId, replyData);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleReplies = (postId) => {
    setExpandedReplies(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const renderPost = ({ item: p }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <MaterialCommunityIcons
          name="account-circle-outline"
          size={28}
          color={colors.accent}
        />
        <View style={styles.postMeta}>
          <Text style={styles.postAuthor}>Anonymous User</Text>
          <Text style={styles.postTime}>{formatTime(p.createdAt)}</Text>
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
            color={
              p.upvotedBy?.includes(auth.currentUser?.uid)
                ? colors.success
                : p.upvotes > 0
                ? colors.warning
                : colors.textMuted
            }
          />
          <Text
            style={[
              styles.upvoteCount,
              {
                color:
                  p.upvotedBy?.includes(auth.currentUser?.uid)
                    ? colors.success
                    : p.upvotes > 0
                    ? colors.warning
                    : colors.textMuted,
              },
            ]}
          >
            {p.upvotedBy ? p.upvotedBy.length : p.upvotes}
          </Text>
        </TouchableOpacity>
        
        {/* Toggle Replies Button */}
        {p.replies?.length > 0 && (
          <TouchableOpacity 
            style={styles.toggleRepliesButton}
            onPress={() => toggleReplies(p.id)}
          >
            <MaterialCommunityIcons 
              name={expandedReplies[p.id] ? "chevron-up" : "chevron-down"} 
              size={16} 
              color={colors.textMuted} 
            />
            <Text style={styles.toggleRepliesText}>
              {expandedReplies[p.id] ? 'Hide' : 'Show'} Replies ({p.replies.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {expandedReplies[p.id] && p.replies?.length > 0 && (
        <View style={styles.repliesContainer}>
          {p.replies.map(r => (
            <View key={r.id} style={{ marginBottom: spacing.sm }}>
              <Text style={styles.replyText}>{r.text}</Text>
              <Text style={styles.replyTime}>{formatTime(r.createdAt)}</Text>
            </View>
          ))}
        </View>
      )}

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
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{threadTitle}</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={displayedPosts}
        keyExtractor={item => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.listContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { padding: spacing.xs },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  listContent: { padding: spacing.lg },
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
    justifyContent: 'space-between',
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
  toggleRepliesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleRepliesText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
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
    lineHeight: 17,
    opacity: 0.8,
  },
  replyTime: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 2,
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
});
