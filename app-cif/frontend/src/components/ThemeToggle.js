import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { colors, scheme, toggleTheme, mode, setMode } = useTheme();

  const handlePress = () => {
    // simple toggle between light/dark; if system, switch to opposite of system
    if (mode === 'system') setMode(scheme === 'dark' ? 'light' : 'dark');
    else toggleTheme();
  };

  return (
    <TouchableOpacity
      style={[styles.wrap, { backgroundColor: scheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.row}>
        <Feather name={scheme === 'dark' ? 'moon' : 'sun'} size={18} color={colors.text} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 40,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: 12, marginLeft: 6 },
});
