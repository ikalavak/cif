import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  ActivityIndicator,
} from 'react-native';
import SafeScreen from '../components/SafeScreen';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Firebase Firestore Imports
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

function NotificationRow({ item, onPress }) {
  const { colors } = useTheme();
  const { type, title, message, time, isUnread } = item;

  const iconName =
    type === 'schedule'
      ? 'calendar'
      : type === 'network'
      ? 'user'
      : 'alert-circle';

  return (
    <TouchableOpacity
      style={[
        styles.row,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.left, { backgroundColor: colors.input || colors.border }]}>
        <Feather name={iconName} size={20} color={colors.primary} />
      </View>

      <View style={styles.mid}>
        <View style={styles.rowTop}>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text style={[styles.time, { color: colors.textMuted }]}>{time}</Text>
        </View>
        <Text
          style={[styles.message, { color: colors.textMuted }]}
          numberOfLines={2}
        >
          {message}
        </Text>
      </View>

      {isUnread ? (
        <View
          style={[styles.unreadDot, { backgroundColor: colors.primary }]}
        />
      ) : null}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen({ navigation }) {
  const { colors } = useTheme();
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState(new Set());
  const [data, setData] = useState([]);

  const filters = ['All', 'Schedule', 'Networking', 'Alerts'];

  // Subscribe to real-time Firestore notifications collection
  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'notifications'), orderBy('sentAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const items = snapshot.docs.map((docSnap) => {
          const docData = docSnap.data();
          const timestamp = docData.sentAt?.toDate ? docData.sentAt.toDate() : new Date();
          const isToday = timestamp >= todayStart;

          // Format readable time string (e.g., '10:30 AM' or 'Aug 19')
          const timeString = isToday
            ? timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' });

          return {
            id: docSnap.id,
            type: docData.type || 'alert',
            title: docData.title || 'Notification',
            message: docData.body || docData.message || '',
            targetScreen: docData.targetScreen || 'Home',
            time: timeString,
            when: isToday ? 'today' : 'earlier',
            isUnread: !readIds.has(docSnap.id),
          };
        });

        setData(items);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to listen to notifications:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [readIds]);

  const markAllAsRead = useCallback(() => {
    setReadIds(new Set(data.map((item) => item.id)));
    setData((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  }, [data]);

  const handlePressNotification = (item) => {
    setReadIds((prev) => new Set(prev).add(item.id));
    setData((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isUnread: false } : n))
    );

    const target = item.targetScreen || 'Home';
    const tabScreens = ['Home', 'Events', 'Maps', 'Profile'];

    if (tabScreens.includes(target)) {
      navigation.navigate('MainApp', {
        screen: target,
        params: item.params || {},
      });
    } else if (target !== 'Notifications') {
      try {
        navigation.navigate(target, item.params || {});
      } catch (err) {
        console.warn(`Could not navigate to target screen "${target}":`, err);
        navigation.navigate('MainApp');
      }
    }
  };

  const filtered = useMemo(() => {
    const list = data.filter((n) => {
      if (filter === 'All') return true;
      if (filter === 'Schedule') return n.type === 'schedule';
      if (filter === 'Networking') return n.type === 'network';
      return n.type === 'alert';
    });

    const today = list.filter((i) => i.when === 'today');
    const earlier = list.filter((i) => i.when !== 'today');

    const sections = [];
    if (today.length > 0) sections.push({ title: 'Today', data: today });
    if (earlier.length > 0) sections.push({ title: 'Earlier', data: earlier });

    return sections;
  }, [data, filter]);

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.bg }]}>
      <Text style={[styles.sectionHeaderText, { color: colors.text }]}>
        {title}
      </Text>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyWrap}>
      <Feather name="bell" size={48} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No notifications
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
        You're all caught up for now.
      </Text>
    </View>
  );

  return (
    <SafeScreen style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            ← Notifications
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={markAllAsRead}>
          <Text style={[styles.markAll, { color: colors.primary }]}>
            Mark all as read
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {filters.map((f) => {
          const active = f === filter;
          return (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterPill,
                {
                  backgroundColor: active ? colors.primary + '18' : 'transparent',
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: active ? colors.primary : colors.textMuted },
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content List */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 40 }}
        />
      ) : (
        <SectionList
          sections={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationRow
              item={item}
              onPress={() => handlePressNotification(item)}
            />
          )}
          renderSectionHeader={renderSectionHeader}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={{ paddingBottom: 40 }}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  markAll: { fontSize: 14, fontWeight: '700' },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterText: { fontSize: 13, fontWeight: '600' },

  sectionHeader: { paddingHorizontal: 12, paddingVertical: 8 },
  sectionHeaderText: { fontSize: 13, fontWeight: '800' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  left: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mid: { flex: 1 },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 15, fontWeight: '700' },
  time: { fontSize: 12 },
  message: { marginTop: 4, fontSize: 13 },
  unreadDot: { width: 10, height: 10, borderRadius: 6, marginLeft: 12 },

  emptyWrap: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { marginTop: 12, fontSize: 18, fontWeight: '700' },
  emptySubtitle: { marginTop: 6, fontSize: 14 },
});