import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
} from 'react-native';

import SafeScreen from '../components/SafeScreen';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const docklandsMap = require('../../assets/docklands-map.png');
const stratfordMap = require('../../assets/stratford-map.png');

export default function MapsScreen() {
  const [activeScreen, setActiveScreen] = useState('Docklands');

  const { colors } = useTheme();

  return (
    <SafeScreen
      style={[
        styles.screen,
        { backgroundColor: colors.bg },
      ]}
    >
      {/* HEADER */}
<View style={styles.headerRow}>
  <View>
    <Text
      style={[
        styles.pageTitle,
        { color: colors.text },
      ]}
    >
      Campus Explorer
    </Text>

    <Text
      style={[
        styles.pageSubtitle,
        { color: colors.textMuted },
      ]}
    >
      Explore all University of East London campuses
    </Text>
  </View>
</View>

      {/* CAMPUS TOGGLE */}
      <View
        style={[
          styles.toggleContainer,
          { backgroundColor: '#E2E8F0' },
        ]}
      >
        {['Docklands', 'Stratford'].map((tab) => {
          const active = tab === activeScreen;

          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.toggleButton,
                active
                  ? {
                      backgroundColor: colors.card,
                      shadowColor: '#000',
                      shadowOpacity: 0.1,
                      shadowOffset: {
                        width: 0,
                        height: 2,
                      },
                      shadowRadius: 6,
                      elevation: 4,
                    }
                  : {
                      backgroundColor: 'transparent',
                    },
              ]}
              onPress={() => setActiveScreen(tab)}
            >
              <Text
                style={[
                  styles.toggleText,
                  {
                    color: active
                      ? colors.text
                      : colors.textMuted,
                  },
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* MAP */}
      <View style={styles.mapContainer}>
        <Image
          source={
            activeScreen === 'Docklands'
              ? docklandsMap
              : stratfordMap
          }
          style={styles.mapImage}
          resizeMode="contain"
        />
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },

  pageTitle: {
    fontSize: 26,
    fontWeight: 'bold',
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 15,
  },

  toggleButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 999,
  },

  toggleText: {
    fontSize: 14,
    fontWeight: '700',
  },

  mapContainer: {
    flex: 1,
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mapImage: {
    width: '100%',
    height: '100%',
  },
});