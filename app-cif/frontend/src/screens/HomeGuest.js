import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import SafeScreen from '../components/SafeScreen';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import { auth } from '../config/firebase';

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  
  // Get the current user from Firebase and extract their name
  const user = auth.currentUser;
  const userName = user?.displayName || 'User';

  return (
    <SafeScreen scroll style={[styles.screen, { backgroundColor: colors.bg }]} contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.greetingText, { color: colors.textMuted }]}>Good Morning,</Text>
          <Text style={[styles.nameText, { color: colors.text }]}>{userName} 👋</Text>        
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton} onPress={() => {
            const parent = navigation.getParent && navigation.getParent();
            if (parent && parent.navigate) parent.navigate('Notifications');
            else navigation.navigate('Notifications');
          }}>
            <Feather name="bell" size={18} color={colors.text} />
            <View style={[styles.notificationDot, { backgroundColor: colors.error }]} />
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
          <Feather name="sliders" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

               {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }] }>
          <LinearGradient
            colors={['rgba(139,92,246,0.1)', 'transparent']}
            style={StyleSheet.absoluteFillObject}
          />
          <Text style={[styles.heroTitle, { color: colors.text }]}>Creative Industries Festival</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>Coming Soon</Text>
          <Text style={[styles.heroDesc, { color: colors.text }]}>Stay tuned for exciting announcements.</Text>
        </View>  

      

      <View style={styles.quickActionsRow}>
        <ActionBtn
          icon="message-circle"
          color={colors.primary}
          label="Forum"
          colors={colors}
     
        />
        <ActionBtn
          icon="briefcase"
          color={colors.accent}
          label="Job Board"
          colors={colors}
        
        />
        <ActionBtn
          icon="user"
          color={colors.success}
          label="Portfolio"
          colors={colors}
   
        />
      </View>

      {/* Featured Events Header */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Events</Text>
        <TouchableOpacity>
          <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Scroll Placeholder */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 20 }}>
        <View style={[styles.featuredMiniCard, { backgroundColor: colors.accent } ]}>
          <Feather name="heart" size={20} color={colors.white} style={styles.heartIconAbs} />
          <Text style={[styles.placeholderText, { color: colors.white }]}>AI Exhibition</Text>
        </View>
        <View style={[styles.featuredMiniCard, { backgroundColor: colors.accent2, marginRight: 40 }]}>
           <Text style={[styles.placeholderText, { color: colors.white }]}>VR Demo</Text>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const ActionBtn = ({ icon, color, label, colors, onPress }) => (
  <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.actionIconBg, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name={icon} size={22} color={color} />
    </View>
    <Text style={[styles.actionLabel, { color: colors.text }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  screen: { flex: 1 },
  greetingText: { fontSize: 14, marginBottom: 2 },
  nameText: { fontSize: 18, fontWeight: 'bold' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  headerIcons: { flexDirection: 'row', gap: 12 },
  iconButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  notificationDot: { position: 'absolute', top: 8, right: 10, width: 6, height: 6, borderRadius: 3 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 20, borderRadius: 12, paddingHorizontal: 16, height: 50 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 15 },
  heroCard: { marginHorizontal: 20, borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, overflow: 'hidden', marginBottom: 24 },
  heroTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  heroSubtitle: { fontSize: 14, marginBottom: 12 },
  heroDesc: { fontSize: 13, textAlign: 'center' },
  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  actionBtn: { alignItems: 'center', flex: 1 },
  actionIconBg: { width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1 },
  actionLabel: { fontSize: 12, fontWeight: '500' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  seeAllText: { fontSize: 14, fontWeight: '600' },
  featuredMiniCard: { width: 220, height: 120, borderRadius: 16, padding: 16, justifyContent: 'flex-end', marginRight: 16 },
  heartIconAbs: { position: 'absolute', top: 12, right: 12 },
  placeholderText: { fontSize: 18, fontWeight: 'bold' },
});
