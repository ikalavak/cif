// src/screens/ForumScreen.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  FlatList,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import SafeScreen from '../components/SafeScreen';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';

const CHANNELS = ['All', 'General', 'Meetups', 'Q&A', 'Lost & Found'];

export default function ForumScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const currentUser = auth.currentUser;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('All');
  const [postChannel, setPostChannel] = useState('General');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [userRole, setUserRole] = useState('Attendee');

  // 1. Check User Account Mute & Role Status
  useEffect(() => {
    if (!currentUser) {
      setIsMuted(false);
      setUserRole('Attendee');
      return;
    }

    const unsubUser = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsMuted(!!data.isForumMuted);
        setUserRole(data.role || (currentUser.email?.toLowerCase().includes('admin') ? 'Organizer' : 'Attendee'));
      }
    });

    return () => unsubUser();
  }, [currentUser]);

  // 2. Live Firestore Subscription for Messages
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'forum_messages'),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const liveMessages = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setMessages(liveMessages);
        setLoading(false);
        setRefreshing(false);
      },
      (err) => {
        console.error('Error fetching forum messages:', err);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  // 3. Send Message with Server Mute Check
  const handleSendMessage = async () => {
    if (!inputText.trim() || sending) return;

    if (!currentUser) {
      Alert.alert('Sign In Required', 'Please sign in to post messages in the community forum.');
      return;
    }

    if (isMuted) {
      Alert.alert(
        'Account Suspended',
        'Your forum posting privileges have been suspended by an administrator.'
      );
      return;
    }

    try {
      const checkSnap = await getDoc(doc(db, 'users', currentUser.uid));
      if (checkSnap.exists() && checkSnap.data().isForumMuted) {
        setIsMuted(true);
        Alert.alert(
          'Account Suspended',
          'Your forum posting privileges have been suspended by an administrator.'
        );
        return;
      }
    } catch (_) {}

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      await addDoc(collection(db, 'forum_messages'), {
        text: textToSend,
        channel: postChannel,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Attendee',
        userRole: userRole,
        isPinned: false,
        likes: [],
        reports: [],
        created_at: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error sending message:', err);
      Alert.alert('Error', 'Failed to send message: ' + err.message);
      setInputText(textToSend);
    } finally {
      setSending(false);
    }
  };

  // 4. Toggle Like Handler
  const handleToggleLike = async (item) => {
    if (!currentUser) {
      Alert.alert('Sign In Required', 'Please sign in to like messages.');
      return;
    }

    const docRef = doc(db, 'forum_messages', item.id);
    const hasLiked = Array.isArray(item.likes) && item.likes.includes(currentUser.uid);

    try {
      await updateDoc(docRef, {
        likes: hasLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
      });
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  // 5. Report / Flag Handler
  const handleReportMessage = (item) => {
    if (!currentUser) {
      Alert.alert('Sign In Required', 'Please sign in to report content.');
      return;
    }

    const reportsList = Array.isArray(item.reports) ? item.reports : [];
    if (reportsList.includes(currentUser.uid)) {
      Alert.alert('Notice', 'You have already flagged this message.');
      return;
    }

    Alert.alert('Report Message', 'Flag this message as inappropriate or spam?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report',
        style: 'destructive',
        onPress: async () => {
          try {
            await updateDoc(doc(db, 'forum_messages', item.id), {
              reports: arrayUnion(currentUser.uid),
            });
            Alert.alert('Reported', 'Thank you. Our moderation team has been notified.');
          } catch (err) {
            console.error('Error reporting message:', err);
          }
        },
      },
    ]);
  };

  // 6. Delete Handler (Owner only)
  const handleDeleteMessage = (item) => {
    if (item.userId !== currentUser?.uid) return;

    Alert.alert('Delete Message', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'forum_messages', item.id));
          } catch (err) {
            Alert.alert('Error', 'Could not delete: ' + err.message);
          }
        },
      },
    ]);
  };

  const filteredAndSortedMessages = useMemo(() => {
    return messages
      .filter((msg) => {
        const matchesChannel = selectedChannel === 'All' || (msg.channel || 'General') === selectedChannel;
        const matchesSearch = `${msg.text || ''} ${msg.userName || ''}`
          .toLowerCase()
          .includes(search.toLowerCase());
        const isHidden = Array.isArray(msg.reports) && msg.reports.length >= 3;
        return matchesChannel && matchesSearch && !isHidden;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });
  }, [messages, selectedChannel, search]);

  const renderMessageItem = ({ item }) => {
    const isOwner = item.userId === currentUser?.uid;
    const likesList = Array.isArray(item.likes) ? item.likes : [];
    const isLikedByMe = currentUser ? likesList.includes(currentUser.uid) : false;
    const role = item.userRole || 'Attendee';

    const formattedTime = item.created_at?.toDate
      ? item.created_at.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Just now';

    return (
      <View style={[styles.messageCard, item.isPinned && styles.pinnedMessageCard]}>
        {item.isPinned && (
          <View style={styles.pinnedBanner}>
            <Feather name="pin" size={12} color={colors.primary || '#8B5CF6'} />
            <Text style={styles.pinnedBannerText}>PINNED ANNOUNCEMENT</Text>
          </View>
        )}

        <View style={{ flexDirection: 'row' }}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.userName || '?').charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.messageContent}>
            <View style={styles.messageHeader}>
              <Text style={styles.messageUsername}>{item.userName || 'Attendee'}</Text>

              <View
                style={[
                  styles.roleBadge,
                  role === 'Organizer' || role === 'admin'
                    ? { backgroundColor: '#fef3c7', borderColor: '#fde68a' }
                    : role === 'Speaker'
                    ? { backgroundColor: '#e0f2fe', borderColor: '#bae6fd' }
                    : { backgroundColor: colors.input, borderColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.roleBadgeText,
                    {
                      color:
                        role === 'Organizer' || role === 'admin'
                          ? '#92400e'
                          : role === 'Speaker'
                          ? '#0369a1'
                          : colors.textMuted,
                    },
                  ]}
                >
                  {role}
                </Text>
              </View>

              {item.channel && item.channel !== 'General' && (
                <Text style={styles.channelTag}>#{item.channel}</Text>
              )}

              <Text style={styles.messageTime}>{formattedTime}</Text>

              {isOwner ? (
                <TouchableOpacity onPress={() => handleDeleteMessage(item)} style={styles.iconBtnAction}>
                  <Feather name="trash-2" size={13} color={colors.textMuted} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => handleReportMessage(item)} style={styles.iconBtnAction}>
                  <Feather name="flag" size={13} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.messageText}>{item.text}</Text>

            <View style={styles.messageFooter}>
              <TouchableOpacity
                style={styles.likeButton}
                onPress={() => handleToggleLike(item)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isLikedByMe ? 'heart' : 'heart-outline'}
                  size={16}
                  color={isLikedByMe ? colors.error : colors.textMuted}
                />
                {likesList.length > 0 && (
                  <Text
                    style={[
                      styles.likeCount,
                      { color: isLikedByMe ? colors.error : colors.textMuted },
                    ]}
                  >
                    {likesList.length}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeScreen style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingText}>Live Community</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.nameText}>← Festival Forum</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                const parent = navigation.getParent && navigation.getParent();
                if (parent && parent.navigate) parent.navigate('Notifications');
                else navigation.navigate('Notifications');
              }}
            >
              <Feather name="bell" size={18} color={colors.text} />
            </TouchableOpacity>
            <ThemeToggle />
          </View>
        </View>

        {/* Suspended Notice Banner */}
        {isMuted && (
          <View style={styles.mutedBanner}>
            <Feather name="alert-circle" size={14} color="#b91c1c" />
            <Text style={styles.mutedBannerText}>
              Your forum posting privileges have been suspended by an admin.
            </Text>
          </View>
        )}

        {/* Search Field */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={17} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search discussions..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Channels Bar */}
        <View style={{ height: 42, marginBottom: 8 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.channelsScroll}
          >
            {CHANNELS.map((ch) => {
              const active = selectedChannel === ch;
              return (
                <TouchableOpacity
                  key={ch}
                  onPress={() => setSelectedChannel(ch)}
                  style={[
                    styles.channelChip,
                    active && { backgroundColor: colors.primary || '#8B5CF6', borderColor: colors.primary || '#8B5CF6' },
                  ]}
                >
                  <Text
                    style={[
                      styles.channelChipText,
                      { color: active ? '#ffffff' : colors.textMuted },
                    ]}
                  >
                    {ch === 'All' ? '🔥 All Topics' : `#${ch}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Feed */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary || '#8B5CF6'} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filteredAndSortedMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary || '#8B5CF6'}
              />
            }
            ListEmptyComponent={
              <Text style={styles.noComments}>
                {search
                  ? 'No matching discussions found.'
                  : `No posts in #${selectedChannel} yet. Be the first to start the conversation!`}
              </Text>
            }
          />
        )}

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          {!isMuted && (
            <View style={styles.postChannelSelector}>
              <Text style={styles.postChannelLabel}>Posting to:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: 6 }}>
                {CHANNELS.filter((c) => c !== 'All').map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setPostChannel(c)}
                    style={[
                      styles.miniChannelBadge,
                      postChannel === c && { backgroundColor: colors.primary || '#8B5CF6' },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: postChannel === c ? '#fff' : colors.textMuted,
                      }}
                    >
                      #{c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              style={[styles.input, isMuted && { backgroundColor: colors.input, opacity: 0.6 }]}
              placeholder={
                isMuted
                  ? 'Account suspended from posting.'
                  : currentUser
                  ? `Message #${postChannel}...`
                  : 'Sign in to send a message...'
              }
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              editable={!sending && !!currentUser && !isMuted}
              multiline={false}
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
              blurOnSubmit={false}
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || sending || !currentUser || isMuted) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || sending || !currentUser || isMuted}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg || colors.background },
    container: { flex: 1 },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 10,
    },
    greetingText: { fontSize: 13, color: colors.textMuted, marginBottom: 2 },
    nameText: { fontSize: 18, fontWeight: 'bold', color: colors.text },
    headerIcons: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    mutedBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#fee2e2',
      borderWidth: 1,
      borderColor: '#fecaca',
      paddingVertical: 6,
      paddingHorizontal: 16,
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 8,
    },
    mutedBannerText: { fontSize: 11, color: '#b91c1c', fontWeight: '600', flex: 1 },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 12,
      paddingHorizontal: 14,
      height: 42,
      backgroundColor: colors.input,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 14, color: colors.text },
    channelsScroll: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
    channelChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    channelChipText: { fontSize: 12, fontWeight: '700' },
    listContent: { paddingHorizontal: 16, paddingBottom: 16 },
    messageCard: {
      marginBottom: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      padding: 14,
    },
    pinnedMessageCard: {
      borderColor: colors.primary ? `${colors.primary}60` : '#8B5CF660',
      backgroundColor: colors.primary ? `${colors.primary}08` : 'rgba(139,92,246,0.05)',
    },
    pinnedBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 8,
      paddingBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pinnedBannerText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
      color: colors.primary || '#8B5CF6',
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.input,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primary || '#8B5CF6',
    },
    messageContent: { flex: 1, marginLeft: 12 },
    messageHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
    messageUsername: { fontSize: 14, fontWeight: '700', color: colors.text },
    roleBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
    },
    roleBadgeText: { fontSize: 10, fontWeight: '700' },
    channelTag: { fontSize: 11, fontWeight: '600', color: colors.primary || '#8B5CF6' },
    messageTime: { fontSize: 11, color: colors.textMuted },
    iconBtnAction: { marginLeft: 'auto', padding: 2 },
    messageText: { fontSize: 14, lineHeight: 20, color: colors.text, marginVertical: 6 },
    messageFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    likeButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    likeCount: { fontSize: 12, fontWeight: '600' },
    noComments: { textAlign: 'center', padding: 32, color: colors.textMuted, fontSize: 14 },
    inputContainer: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.card,
      paddingHorizontal: 14,
      paddingTop: 8,
      paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    },
    postChannelSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    postChannelLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
    miniChannelBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      backgroundColor: colors.input,
      marginRight: 6,
    },
    input: {
      flex: 1,
      height: 42,
      borderRadius: 21,
      paddingHorizontal: 16,
      fontSize: 14,
      backgroundColor: colors.input,
      color: colors.text,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sendButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.primary || '#8B5CF6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: { opacity: 0.4 },
  });