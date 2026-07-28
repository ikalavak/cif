import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../theme';

export default function EventsScreen() {
  const { colors } = useTheme();
  const filters = ['All', 'Workshops', 'Talks', 'Exhibitions', 'Networking'];

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Events</Text>
          <Text style={styles.pageSubtitle}>Discover sessions, workshops and exhibitions</Text>
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {filters.map((filter, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.filterPill,
              { borderColor: colors.border },
              index === 0 && { backgroundColor: 'rgba(139,92,246,0.12)', borderColor: colors.primary },
            ]}
          >
            <Text style={[styles.filterText, index === 0 && { color: colors.primary, fontWeight: 'bold' }]}>{filter}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Featured Events */}
      <Text style={[styles.sectionTitle, { marginLeft: 20, marginBottom: 16, color: colors.text }]}>Featured Events</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 20, marginBottom: 24 }}>
        <View style={styles.largeEventCard}>
          <LinearGradient colors={['#7e22ce', '#3b82f6']} style={styles.largeEventImage}>
            <View style={styles.badge}><Text style={styles.badgeText}>Talks</Text></View>
            <TouchableOpacity style={styles.heartBtn}><Feather name="heart" size={18} color="#000" /></TouchableOpacity>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  pageTitle: { color: COLORS.text, fontSize: 26, fontWeight: 'bold', marginBottom: 4 },
  pageSubtitle: { color: COLORS.textMuted, fontSize: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  iconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.input, marginHorizontal: 20, marginBottom: 20, borderRadius: 12, paddingHorizontal: 16, height: 50 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 15 },
  filterScroll: { paddingLeft: 20, marginBottom: 24, flexGrow: 0 },
  filterPill: { borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 12, height: 36, justifyContent: 'center' },
  filterPillActive: { backgroundColor: 'rgba(139,92,246,0.2)', borderColor: COLORS.primary },
  filterText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '500' },
  filterTextActive: { color: COLORS.primary, fontWeight: 'bold' },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  largeEventCard: { width: 280, backgroundColor: COLORS.card, borderRadius: 20, marginRight: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  largeEventImage: { height: 140, padding: 12, justifyContent: 'space-between', flexDirection: 'row' },
  badge: { backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  heartBtn: { backgroundColor: '#fff', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  largeEventContent: { padding: 16 },
  eventTitle: { color: COLORS.text, fontSize: 16, fontWeight: 'bold', marginBottom: 8, lineHeight: 22 },
  eventDetails: { color: COLORS.textMuted, fontSize: 12 },
  eventFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
});
