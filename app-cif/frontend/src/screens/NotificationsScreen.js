import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  Image,
} from 'react-native';
import SafeScreen from '../components/SafeScreen';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

function NotificationRow({ item, onPress }) {
  const { colors } = useTheme();
  const { type, title, message, time, isUnread } = item;

  const iconName = type === 'schedule' ? 'calendar' : type === 'network' ? 'user' : 'alert-circle';

  return (
    <TouchableOpacity style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.left, { backgroundColor: colors.input }]}> 
        <Feather name={iconName} size={20} color={colors.primary} />
      </View>

      <View style={styles.mid}>
        <View style={styles.rowTop}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{title}</Text>
          <Text style={[styles.time, { color: colors.textMuted }]}>{time}</Text>
        </View>
        <Text style={[styles.message, { color: colors.textMuted }]} numberOfLines={2}>{message}</Text>
      </View>

      {isUnread ? <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} /> : null}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen({ navigation }) {
  const { colors } = useTheme();
  const [filter, setFilter] = useState('All');

  const filters = ['All', 'Schedule', 'Networking', 'Alerts'];

  const [data, setData] = useState(() => {
    // sample notifications
    return [
      { id: 'n1', type: 'schedule', title: 'Opening Keynote', message: 'Starts in 30 minutes at Main Stage', time: '9:30 AM', isUnread: true, when: 'today' },
      { id: 'n2', type: 'network', title: 'New contact request', message: 'Alex Johnson sent you a connection', time: '8:50 AM', isUnread: true, when: 'today' },
      { id: 'n3', type: 'alert', title: 'Venue change', message: 'Workshop moved to Expo Hall', time: 'Yesterday', isUnread: false, when: 'earlier' },
    ];
  });

  const markAllAsRead = useCallback(() => {
    setData(prev => prev.map(n => ({ ...n, isUnread: false })));
  }, []);

  const filtered = useMemo(() => {
    const list = data.filter(n => filter === 'All' ? true : (filter === 'Schedule' ? n.type === 'schedule' : filter === 'Networking' ? n.type === 'network' : n.type === 'alert'));
    const today = list.filter(i => i.when === 'today');
    const earlier = list.filter(i => i.when !== 'today');
    return [
      { title: 'Today', data: today },
      { title: 'Earlier', data: earlier },
    ];
  }, [data, filter]);

  const handlePressNotification = id => {
    setData(prev => prev.map(n => n.id === id ? { ...n, isUnread: false } : n));
  };

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.bg }]}> 
      <Text style={[styles.sectionHeaderText, { color: colors.text }]}>{title}</Text>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyWrap}>
      <Feather name="bell" size={48} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No notifications</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>You're all caught up for now.</Text>
    </View>
  );

  return (
    <SafeScreen style={[styles.container, { backgroundColor: colors.bg }]}> 
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() =>  navigation.goBack() }> 
          <Text style={[styles.headerTitle, { color: colors.text }]}>← Notifications</Text> 
        </TouchableOpacity> 
        <TouchableOpacity onPress={markAllAsRead}>
          <Text style={[styles.markAll, { color: colors.primary }]}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {filters.map(f => {
          const active = f === filter;
          return (
            <TouchableOpacity key={f} style={[styles.filterPill, { backgroundColor: active ? colors.primary + '18' : 'transparent', borderColor: active ? colors.primary : colors.border }]} onPress={() => setFilter(f)}>
              <Text style={[styles.filterText, { color: active ? colors.primary : colors.textMuted }]}>{f}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <SectionList
        sections={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <NotificationRow item={item} onPress={() => handlePressNotification(item.id)} />}
        renderSectionHeader={renderSectionHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={{ paddingBottom: 40 }}
        stickySectionHeadersEnabled={false}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  markAll: { fontSize: 14, fontWeight: '700' },

  filterRow: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 8 },
  filterPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  filterText: { fontSize: 13, fontWeight: '600' },

  sectionHeader: { paddingHorizontal: 12, paddingVertical: 8 },
  sectionHeaderText: { fontSize: 13, fontWeight: '800' },

  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1 },
  left: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  mid: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '700' },
  time: { fontSize: 12 },
  message: { marginTop: 4, fontSize: 13 },
  unreadDot: { width: 10, height: 10, borderRadius: 6, marginLeft: 12 },

  emptyWrap: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { marginTop: 12, fontSize: 18, fontWeight: '700' },
  emptySubtitle: { marginTop: 6, fontSize: 14 },
});
