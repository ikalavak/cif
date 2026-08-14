import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  FlatList,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import SafeScreen from '../components/SafeScreen';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';

export default function ForumScreen({ navigation, route }) {
  const { colors } = useTheme();

  const post = route?.params?.post || {
    id: 1,
    username: 'Alex',
    title: 'Who is going to the festival this weekend?',
    content:
      'I am really excited for the festival this weekend! Is anyone else going? It would be great to meet some new people.',
    likes: 12,
    time: '2 hours ago',
  };

  const [comment, setComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([
    {
      id: '1',
      username: 'Sarah',
      text: 'I am going! Really looking forward to it.',
      time: '1 hour ago',
    },
    {
      id: '2',
      username: 'Mohamed',
      text: 'Same here! Which performances are you watching?',
      time: '45 mins ago',
    },
  ]);

  const addComment = () => {
    if (comment.trim() === '') return;

    const newComment = {
      id: Date.now().toString(),
      username: 'You',
      text: comment.trim(),
      time: 'Just now',
    };

    setComments((previousComments) => [...previousComments, newComment]);
    setComment('');
  };

  const renderComment = ({ item }) => (
    <View
      style={[
        styles.commentCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: colors.input }]}> 
        <Text style={[styles.avatarText, { color: colors.textMuted }]}>
          {item.username.charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={[styles.commentUsername, { color: colors.text }]}>{item.username}</Text>
          <Text style={[styles.commentTime, { color: colors.textMuted }]}>{item.time}</Text>
        </View>
        <Text style={[styles.commentText, { color: colors.textMuted }]}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <SafeScreen style={[styles.screen, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greetingText, { color: colors.textMuted }]}>Community</Text>
            <Text style={[styles.nameText, { color: colors.text }]}>Forum Discussions</Text>
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
              <View style={[styles.notificationDot, { backgroundColor: colors.error }]} />
            </TouchableOpacity>
            <ThemeToggle />
          </View>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: colors.input }]}> 
          <Feather name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search discussions..."
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity>
            <Feather name="sliders" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={renderComment}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <View style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
                <LinearGradient
                  colors={['rgba(139,92,246,0.08)', 'transparent']}
                  style={StyleSheet.absoluteFillObject}
                />

                <View style={styles.userRow}>
                  <View style={[styles.avatar, { backgroundColor: colors.input }]}> 
                    <Text style={[styles.avatarText, { color: colors.textMuted }]}>
                      {post.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.userInfo}>
                    <Text style={[styles.username, { color: colors.text }]}>{post.username}</Text>
                    <Text style={[styles.postTime, { color: colors.textMuted }]}>{post.time}</Text>
                  </View>

                  <TouchableOpacity>
                    <Feather name="more-horizontal" size={22} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.postTitle, { color: colors.text }]}>{post.title}</Text>
                <Text style={[styles.postContent, { color: colors.textMuted }]}>{post.content}</Text>

                <View style={[styles.actions, { borderTopColor: colors.border }]}> 
                  <TouchableOpacity style={styles.actionButton} onPress={() => setLiked(!liked)}>
                    <Ionicons
                      name={liked ? 'heart' : 'heart-outline'}
                      size={22}
                      color={liked ? colors.error : colors.textMuted}
                    />
                    <Text style={[styles.actionText, { color: colors.textMuted }]}>
                      {liked ? post.likes + 1 : post.likes}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.actionButton}>
                    <Ionicons name="chatbubble-outline" size={21} color={colors.textMuted} />
                    <Text style={[styles.actionText, { color: colors.textMuted }]}>{comments.length}</Text>
                  </View>

                  <TouchableOpacity style={styles.actionButton}>
                    <Feather name="share-2" size={20} color={colors.textMuted} />
                    <Text style={[styles.actionText, { color: colors.textMuted }]}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Comments</Text>
              </View>
            </>
          }
          ListEmptyComponent={
            <Text style={[styles.noComments, { color: colors.textMuted }]}>No comments yet. Be the first to comment!</Text>
          }
        />

        <View
          style={[
            styles.inputContainer,
            { backgroundColor: colors.card, borderTopColor: colors.border },
          ]}
        >
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
            placeholder="Write a comment..."
            placeholderTextColor={colors.textMuted}
            value={comment}
            onChangeText={setComment}
            multiline
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: colors.primary },
              comment.trim() === '' && styles.sendButtonDisabled,
            ]}
            onPress={addComment}
            disabled={comment.trim() === ''}
          >
            <Ionicons name="send" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1 },
  greetingText: { fontSize: 14, marginBottom: 2 },
  nameText: { fontSize: 18, fontWeight: 'bold' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerIcons: { flexDirection: 'row', gap: 12 },
  iconButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 15 },
  listContent: {
    paddingBottom: 16,
  },
  postCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '700',
  },
  postTime: {
    fontSize: 12,
    marginTop: 2,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 23,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  commentCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  commentContent: {
    flex: 1,
    marginLeft: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUsername: {
    fontSize: 15,
    fontWeight: '700',
  },
  commentTime: {
    fontSize: 11,
    marginLeft: 10,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  noComments: {
    textAlign: 'center',
    padding: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },
  input: {
    flex: 1,
    minHeight: 45,
    maxHeight: 100,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontSize: 14,
    marginRight: 8,
  },
  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#b8b8b8',
  },
});