import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
} from 'react-native';

import SafeScreen from '../components/SafeScreen';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const docklandsMap = require('../../assets/docklands-map.png');
const stratfordMap = require('../../assets/stratford-map.png'); 

export default function MapsScreen() {
  const [showScreens, setShowScreens] = useState(false);
  const [activeScreen, setActiveScreen] = useState('Uss');

  const { colors, scheme } = useTheme();

  // =========================
  // THREE BLANK SCREENS
  // =========================

  if (showScreens) {
    return (
      <SafeScreen
        style={[
          styles.screen,
          { backgroundColor: colors.bg },
        ]}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[
              styles.backButton,
              { backgroundColor: colors.card },
            ]}
            onPress={() => setShowScreens(false)}
          >
            <Feather
              name="arrow-left"
              size={22}
              color={colors.text}
            />
          </TouchableOpacity>

          <Text
            style={[
              styles.pageTitle,
              { color: colors.text },
            ]}
          >
            Campus
          </Text>

          <View style={{ width: 40 }} />
        </View>

        {/* Toggle */}
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
{/* CAMPUS MAP */}
<View style={styles.mapContainer}>
  {activeScreen === 'Docklands' ? (
    // Docklands map
    <Image
      source={docklandsMap}
      style={styles.mapImage}
      resizeMode="contain"
    />
  ) : (
    // Stratford map
    <Image
      source={stratfordMap}
      style={styles.mapImage}
      resizeMode="contain"
    />
  )}
</View>
      </SafeScreen>
    );
  }

  // =========================
  // MAIN CAMPUS PAGE
  // =========================

  return (
    <SafeScreen
      scroll
      style={[
        styles.screen,
        { backgroundColor: colors.bg },
      ]}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      {/* Header */}
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

        <TouchableOpacity
          style={[
            styles.iconButton,
            { backgroundColor: colors.card },
          ]}
        >
          <Ionicons
            name="settings-sharp"
            size={18}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.campusList}>

      

        {/* DOCKLANDS */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setActiveScreen('Docklands');
            setShowScreens(true);
          }}
        >
          <View
            style={[
              styles.campusCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
              scheme === 'light'
                ? styles.cardLightElev
                : styles.cardDarkElev,
            ]}
          >
            <LinearGradient
              colors={[
                colors.error,
                colors.primary,
                colors.accent,
              ]}
              style={styles.campusImage}
            >
              <Text style={styles.placeholderLogo}>
                CREATIVE INDUSTRIES FESTIVAL
              </Text>
            </LinearGradient>

            <View style={styles.campusContent}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.campusTitle,
                    { color: colors.text },
                  ]}
                >
                  Docklands Campus
                </Text>

                <Text
                  style={[
                    styles.campusSub,
                    { color: colors.textMuted },
                  ]}
                >
                  Royal Albert Dock
                </Text>

                <Text
                  style={[
                    styles.campusSub,
                    { color: colors.textMuted },
                  ]}
                >
                  London E16
                </Text>
              </View>

              <Feather
                name="chevron-right"
                size={20}
                color={colors.text}
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* STRATFORD */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setActiveScreen('Stratford');
            setShowScreens(true);
          }}
        >
          <View
            style={[
              styles.campusCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
              scheme === 'light'
                ? styles.cardLightElev
                : styles.cardDarkElev,
            ]}
          >
            <LinearGradient
              colors={[
                colors.error,
                colors.accent2,
              ]}
              style={styles.campusImage}
            >
              <Text
                style={[
                  styles.placeholderLogo,
                  {
                    fontSize: 48,
                    fontWeight: '900',
                  },
                ]}
              >
                DC
              </Text>
            </LinearGradient>

            <View style={styles.campusContent}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.campusTitle,
                    { color: colors.text },
                  ]}
                >
                  Stratford Campus
                </Text>

                <Text
                  style={[
                    styles.campusSub,
                    { color: colors.textMuted },
                  ]}
                >
                  Water Lane
                </Text>

                <Text
                  style={[
                    styles.campusSub,
                    { color: colors.textMuted },
                  ]}
                >
                  London E15
                </Text>
              </View>

              <Feather
                name="chevron-right"
                size={20}
                color={colors.text}
              />
            </View>
          </View>
        </TouchableOpacity>

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
    marginBottom: 4,
  },

  pageSubtitle: {
    fontSize: 14,
  },

  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  campusList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  campusCard: {
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },

  cardLightElev: {
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  cardDarkElev: {
    shadowColor: 'transparent',
  },

  campusImage: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  placeholderLogo: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },

  campusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },

  campusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  campusSub: {
    fontSize: 12,
  },

  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 20,
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
  marginHorizontal: 20,
  alignItems: 'center',
  justifyContent: 'center',
},

mapImage: {
  width: '100%',
  height: 550,
},
});