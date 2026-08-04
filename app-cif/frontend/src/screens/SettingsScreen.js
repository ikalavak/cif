import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import SafeScreen from '../components/SafeScreen';
import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen({ navigation }) {
  const { colors } = useTheme();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [offlineCached, setOfflineCached] = useState(false);

  const handleToggleOfflineCache = () => {
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
    <SafeScreen scroll style={[styles.safeArea, { backgroundColor: colors.bg }]} contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>
        <SettingRow
          label="Push Notifications"
          value={pushEnabled}
          onValueChange={setPushEnabled}
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
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
        <View style={styles.statusRow}>
          <Text style={{ color: colors.textMuted }}>Offline Status</Text>
          <View style={styles.statusRight}>
            <View style={[styles.dot, { backgroundColor: offlineCached ? colors.success : colors.error }]} />
            <Text style={{ color: colors.textMuted, marginLeft: 8 }}>{offlineCached ? 'Ticket cached locally' : 'Not cached'}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={[styles.logoutBtn, { backgroundColor: colors.error }]} activeOpacity={0.85}>
          <Text style={{ color: colors.white, fontWeight: '700' }}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeScreen>
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
  safeArea: { flex: 1 },
  container: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '800' },
  card: { borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1 },
  cacheBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  statusRight: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 6 },
  logoutBtn: { marginTop: 12, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
});
