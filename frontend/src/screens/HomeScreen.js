import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../theme';
import ThemeToggle from '../components/ThemeToggle';

export default function HomeScreen() {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greetingText}>Good Morning,</Text>
          <Text style={styles.nameText}>user 👋</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="bell" size={18} color={colors.text} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
          <ThemeToggle />
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.input }] }>
            <Feather name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search events..."
              placeholderTextColor={colors.textMuted}
            />
        <TouchableOpacity>
          <Feather name="sliders" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Hero Card */}
      <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }] }>
        <LinearGradient
          colors={['rgba(139,92,246,0.1)', 'transparent']}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={styles.heroTitle}>Creative Industries Festival</Text>
        <Text style={styles.heroSubtitle}>Coming Soon</Text>
        <Text style={styles.heroDesc}>Stay tuned for exciting announcements.</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsRow}>
        <ActionBtn icon="calendar" color="#6366f1" label="Events" />
        <ActionBtn icon="map" color="#10b981" label="Maps" />
        <ActionBtn icon="mic" color="#f59e0b" label="Speakers" />
        <ActionBtn icon="image" color="#3b82f6" label="Gallery" />
      </View>

      {/* Featured Events Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Events</Text>
        <TouchableOpacity>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
              </TouchableOpacity>
      </View>

      {/* Horizontal Scroll Placeholder */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 20 }}>
        <View style={[styles.featuredMiniCard, { backgroundColor: '#1e3a8a' }]}>
          <Feather name="heart" size={20} color="#fff" style={styles.heartIconAbs} />
          <Text style={styles.placeholderText}>AI Exhibition</Text>
        </View>
        <View style={[styles.featuredMiniCard, { backgroundColor: '#4c1d95', marginRight: 40 }]}>
           <Text style={styles.placeholderText}>VR Demo</Text>
        </View>
      </ScrollView>
    </ScrollView>
  );
}

const ActionBtn = ({ icon, color, label }) => (
  <TouchableOpacity style={styles.actionBtn}>
    <View style={styles.actionIconBg}>
      <Feather name={icon} size={22} color={color} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  greetingText: { color: COLORS.textMuted, fontSize: 14, marginBottom: 2 },
  nameText: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  headerIcons: { flexDirection: 'row', gap: 12 },
  iconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center' },
  notificationDot: { position: 'absolute', top: 8, right: 10, width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.input, marginHorizontal: 20, marginBottom: 20, borderRadius: 12, paddingHorizontal: 16, height: 50 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 15 },
  heroCard: { marginHorizontal: 20, backgroundColor: COLORS.card, borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', marginBottom: 24 },
  heroTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  heroSubtitle: { color: COLORS.textMuted, fontSize: 14, marginBottom: 12 },
  heroDesc: { color: COLORS.text, fontSize: 13, textAlign: 'center' },
  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 32 },
  actionBtn: { alignItems: 'center', flex: 1 },
  actionIconBg: { backgroundColor: COLORS.card, width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  actionLabel: { color: COLORS.text, fontSize: 12, fontWeight: '500' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  seeAllText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  featuredMiniCard: { width: 220, height: 120, borderRadius: 16, padding: 16, justifyContent: 'flex-end', marginRight: 16 },
  heartIconAbs: { position: 'absolute', top: 12, right: 12 },
  placeholderText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
