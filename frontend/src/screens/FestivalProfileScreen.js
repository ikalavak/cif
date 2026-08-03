import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import SafeScreen from '../components/SafeScreen';
import QRCode from 'react-native-qrcode-svg';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Festival Profile Screen
export default function FestivalProfileScreen({ navigation }) {
  const { colors } = useTheme();

  // Simulated state: whether ticket is cached for offline use
  const [offlineCached, setOfflineCached] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);

  const schedule = useMemo(
    () => [
      { id: '1', title: 'Opening Keynote', time: '09:00 AM', stage: 'Main Stage' },
      { id: '2', title: 'AI & Creativity', time: '11:00 AM', stage: 'Talk Tent' },
      { id: '3', title: 'Interactive Installations', time: '02:00 PM', stage: 'Expo Hall' },
    ],
    []
  );

  const savedPortfolios = useMemo(
    () => [
      { id: 'p1', name: 'Alex Johnson', title: 'Visual Artist' },
      { id: 'p2', name: 'Sora Lee', title: 'Sound Designer' },
    ],
    []
  );

  const handleToggleOfflineCache = () => {
    // In real app, this would cache ticket to AsyncStorage/filesystem
    setOfflineCached(prev => !prev);
    Alert.alert('Offline Cache', `Ticket ${offlineCached ? 'removed from' : 'saved to'} device.`);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => {
          const parent = navigation.getParent && navigation.getParent();
          if (parent && parent.replace) parent.replace('Login');
          else navigation.replace('Login');
        } },
    ]);
  };

  return (
    <SafeScreen scroll style={[styles.safeArea, { backgroundColor: colors.bg }]} contentContainerStyle={{ paddingBottom: 40, paddingTop: 12 }}>
      {/* Header: Avatar + Pass Type */}
      <View style={styles.headerRow}>
        <View style={styles.avatarWrap}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.card }]}> 
            <Text style={[styles.avatarInitials, { color: colors.primary }]}>CI</Text>
          </View>
        </View>

        <View style={styles.headerInfo}>
          <Text style={[styles.festivalName, { color: colors.text }]}>Creative Industries Festival</Text>
          <View style={[styles.badge, { backgroundColor: colors.primary + '22' }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>Pass Type: VIP</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.card }]}
        >
          <Ionicons name="settings-sharp" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Ticket Card */}
      <View style={[styles.ticketCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.ticketRow}>
          <View style={styles.ticketInfo}>
            <Text style={[styles.ticketTitle, { color: colors.text }]}>VIP Pass</Text>
            <Text style={[styles.ticketSub, { color: colors.textMuted }]}>All-access + Backstage</Text>
            <Text style={[styles.ticketHolder, { color: colors.text }]}>Holder: You</Text>
          </View>

          <View style={styles.qrWrap}>
            <View style={[styles.qrBox, { backgroundColor: colors.white, padding: 6, borderRadius: 8 }]}> 
              <QRCode value="CIF-VIP-12345" size={74} backgroundColor={colors.white} color={colors.black} />
            </View>
          </View>
        </View>

        <View style={styles.ticketFooter}>
          <Text style={[styles.ticketFooterText, { color: colors.textMuted }]}>Ticket ID: CIF-VIP-12345</Text>
          <Text style={[styles.ticketFooterText, { color: colors.textMuted }]}>{offlineCached ? 'Cached Offline' : 'Online'}</Text>
        </View>
      </View>

      {/* Dashboard: My Schedule */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>My Schedule</Text>
          <TouchableOpacity onPress={() => Alert.alert('Schedule', 'Open full schedule')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          horizontal
          data={schedule}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 16 }}
          renderItem={({ item }) => <EventCard item={item} colors={colors} />}
        />
      </View>

      {/* Saved Portfolios */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Saved Portfolios</Text>
        <View style={{ marginTop: 12 }}>
          {savedPortfolios.map(p => (
            <SavedPortfolioCard key={p.id} item={p} colors={colors} />
          ))}
        </View>
      </View>

      {/* Settings & Offline */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>
        <View style={{ marginTop: 8 }}>
          <SettingRow
            label="Push Notifications"
            value={pushEnabled}
            onValueChange={val => setPushEnabled(val)}
            colors={colors}
          />

          <SettingRow
            label="Offline Mode (cache ticket)"
            value={offlineCached}
            onValueChange={handleToggleOfflineCache}
            colors={colors}
            useToggle={false}
            onPress={handleToggleOfflineCache}
          />

          <View style={[styles.offlineIndicatorRow, { borderColor: colors.border }]}> 
            <Text style={{ color: colors.text, fontWeight: '600' }}>Offline Status</Text>
            <View style={styles.offlineStatusRight}>
              <View style={[styles.dot, { backgroundColor: offlineCached ? colors.success : colors.error }]} />
              <Text style={{ color: colors.textMuted, marginLeft: 8 }}>{offlineCached ? 'Ticket cached locally' : 'Not cached'}</Text>
            </View>
          </View>
          <View style={{ marginTop: 14, marginHorizontal: 16 }}>
            <TouchableOpacity onPress={handleLogout} style={[styles.logoutBtn, { backgroundColor: colors.error }] } activeOpacity={0.85}>
              <Text style={{ color: colors.white, fontWeight: '700' }}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeScreen>
  );
}

function EventCard({ item, colors }) {
  return (
    <View style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
      <Text style={[styles.eventMeta, { color: colors.textMuted }]}>{item.time} • {item.stage}</Text>
    </View>
  );
}

function SavedPortfolioCard({ item, colors }) {
  return (
    <TouchableOpacity style={[styles.portfolioCard, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.8}>
      <View style={styles.portfolioLeft}>
        <View style={[styles.portfolioAvatar, { backgroundColor: colors.primary + '22' }]}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>{(item.name || '?').split(' ').map(n => n[0]).slice(0,2).join('')}</Text>
        </View>
        <View style={{ marginLeft: 12 }}>
          <Text style={{ color: colors.text, fontWeight: '600' }}>{item.name}</Text>
          <Text style={{ color: colors.textMuted }}>{item.title}</Text>
        </View>
      </View>

      <Feather name="chevron-right" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function SettingRow({ label, value, onValueChange, colors, useToggle = true, onPress }) {
  return (
    <TouchableOpacity
      onPress={() => {
        if (!useToggle && onPress) onPress();
      }}
      activeOpacity={useToggle ? 1 : 0.7}
      style={[styles.settingRow, { borderColor: colors.border }]}
    >
      <Text style={{ color: colors.text }}>{label}</Text>
      {useToggle ? (
        <Switch value={value} onValueChange={onValueChange} thumbColor={value ? colors.primary : undefined} />
      ) : (
          <TouchableOpacity onPress={onPress} style={[styles.cacheBtn, { backgroundColor: colors.primary }]}> 
          <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>{value ? 'Remove' : 'Cache'}</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatarWrap: { marginRight: 12 },
  avatarCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 18, fontWeight: '800' },
  headerInfo: { flex: 1 },
  festivalName: { fontSize: 16, fontWeight: '800' },
  badge: { marginTop: 6, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  shareBtn: { padding: 8 },

  ticketCard: { marginHorizontal: 16, borderRadius: 12, padding: 16, borderWidth: 1, marginBottom: 18 },
  ticketRow: { flexDirection: 'row', alignItems: 'center' },
  ticketInfo: { flex: 1 },
  ticketTitle: { fontSize: 18, fontWeight: '800' },
  ticketSub: { marginTop: 4 },
  ticketHolder: { marginTop: 8, fontWeight: '700' },
  qrWrap: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  qrBox: { alignItems: 'center', justifyContent: 'center' },
  ticketFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  ticketFooterText: { fontSize: 12 },

  section: { marginTop: 8, paddingHorizontal: 0, paddingVertical: 8 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginLeft: 0 },
  seeAll: { fontSize: 13, fontWeight: '700' },

  eventCard: { width: 180, padding: 12, marginRight: 12, marginTop: 12, borderRadius: 10, borderWidth: 1 },
  eventTitle: { fontSize: 14, fontWeight: '800' },
  eventMeta: { marginTop: 6, fontSize: 12 },

  portfolioCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, marginHorizontal: 16, marginTop: 10, borderRadius: 10, borderWidth: 1 },
  portfolioLeft: { flexDirection: 'row', alignItems: 'center' },
  portfolioAvatar: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1 },
  cacheBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  offlineIndicatorRow: { marginTop: 12, marginHorizontal: 16, padding: 12, borderWidth: 1, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  offlineStatusRight: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 6 },
  logoutBtn: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center' },
});
