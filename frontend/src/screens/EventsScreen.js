import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import SafeScreen from '../components/SafeScreen';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function EventsScreen() {
  const { colors, scheme } = useTheme();
  const filters = ['All', 'Workshops', 'Talks', 'Exhibitions', 'Networking'];

  return (
    <SafeScreen scroll style={[styles.screen, { backgroundColor: colors.bg }]} contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Events</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>Discover sessions, workshops and exhibitions</Text>
        </View>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.card }]}>
          <Ionicons name="settings-sharp" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.input }] }>
        <Feather name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search events, speakers..."
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} nestedScrollEnabled>
        {filters.map((filter, index) => {
          const active = index === 0;
          const pillBg = active ? colors.primary + '22' : undefined;
          const pillBorder = active ? colors.primary : colors.border;
          const textColor = active ? (scheme === 'dark' ? colors.text : colors.primary) : (scheme === 'light' ? colors.text : colors.textMuted);

          return (
            <TouchableOpacity
              key={index}
              style={[styles.filterPill, { borderColor: pillBorder, backgroundColor: pillBg }]}
            >
              <Text style={[styles.filterText, { color: textColor, fontWeight: active ? '700' : '500' }]}>{filter}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Featured Events */}
      <Text style={[styles.sectionTitle, { marginLeft: 20, marginBottom: 16, color: colors.text }]}>Featured Events</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 20, marginBottom: 24 }} nestedScrollEnabled>
        <View style={[styles.largeEventCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <LinearGradient colors={[colors.primary, colors.accent]} style={styles.largeEventImage}>
              <View style={[styles.badge, { backgroundColor: colors.primary }]}><Text style={[styles.badgeText, { color: colors.onPrimary }]}>Talks</Text></View>
              <TouchableOpacity style={[styles.heartBtn, { backgroundColor: colors.white }]}><Feather name="heart" size={18} color={colors.text} /></TouchableOpacity>
            </LinearGradient>
          <View style={[styles.largeEventContent, { backgroundColor: colors.card }] }>
            <Text style={[styles.eventTitle, { color: colors.text }]}>Opening Keynote: The Future of Creative Intelligence</Text>
            <Text style={[styles.eventDetails, { color: colors.textMuted }]}>Oct 12, 2026 • 10:00 AM</Text>
            <View style={styles.eventFooter}>
              <Text style={[styles.eventDetails, { color: colors.textMuted }]}>Innovation Hall</Text>
              <Feather name="arrow-right" size={18} color={colors.primary} />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  pageTitle: { fontSize: 26, fontWeight: 'bold', marginBottom: 4 },
  pageSubtitle: { fontSize: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  iconButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 20, borderRadius: 12, paddingHorizontal: 16, height: 50 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 15 },
  filterScroll: { paddingLeft: 20, marginBottom: 24, flexGrow: 0 },
  filterPill: { borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 12, height: 36, justifyContent: 'center' },
  filterPillActive: { backgroundColor: 'rgba(139,92,246,0.2)' },
  filterText: { fontSize: 13, fontWeight: '500' },
  filterTextActive: { fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  largeEventCard: { width: 280, borderRadius: 20, marginRight: 16, borderWidth: 1, overflow: 'hidden' },
  largeEventImage: { height: 140, padding: 12, justifyContent: 'space-between', flexDirection: 'row' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  heartBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  largeEventContent: { padding: 16 },
  eventTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, lineHeight: 22 },
  eventDetails: { fontSize: 12 },
  eventFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
});
