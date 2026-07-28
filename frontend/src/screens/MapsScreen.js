import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../theme';

export default function MapsScreen() {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Campus Explorer</Text>
          <Text style={styles.pageSubtitle}>Explore all University of East London campuses</Text>
        </View>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.card }]}>
          <Ionicons name="settings-sharp" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.campusList, { paddingHorizontal: 20, paddingBottom: 20 }]}>
        {/* Campus Card 1 */}
        <View style={[styles.campusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <LinearGradient colors={['#db2777', '#4f46e5', '#2563eb']} style={styles.campusImage}>
            <Text style={styles.placeholderLogo}>CREATIVE INDUSTRIES FESTIVAL</Text>
          </LinearGradient>
          <View style={styles.campusContent}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.campusTitle, { color: colors.text }]}>Docklands Campus</Text>
              <Text style={[styles.campusSub, { color: colors.textMuted }]}>Royal Albert Dock</Text>
              <Text style={[styles.campusSub, { color: colors.textMuted }]}>London E16</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.text} />
          </View>
        </View>

        {/* Campus Card 2 */}
        <View style={[styles.campusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <LinearGradient colors={['#ff0055', '#cc0044']} style={styles.campusImage}>
            <Text style={[styles.placeholderLogo, { fontSize: 48, fontWeight: '900' }]}>DC</Text>
          </LinearGradient>
          <View style={styles.campusContent}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.campusTitle, { color: colors.text }]}>Stratford Campus</Text>
              <Text style={[styles.campusSub, { color: colors.textMuted }]}>Water Lane</Text>
              <Text style={[styles.campusSub, { color: colors.textMuted }]}>London E15</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.text} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  pageTitle: { color: COLORS.text, fontSize: 26, fontWeight: 'bold', marginBottom: 4 },
  pageSubtitle: { color: COLORS.textMuted, fontSize: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  iconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center' },
  campusList: { paddingHorizontal: 20, paddingBottom: 20 },
  campusCard: { backgroundColor: COLORS.card, borderRadius: 20, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  campusImage: { height: 160, justifyContent: 'center', alignItems: 'center' },
  placeholderLogo: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  campusContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  campusTitle: { color: COLORS.text, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  campusSub: { color: COLORS.textMuted, fontSize: 12 },
});
