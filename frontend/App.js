import React from 'react';
import { View, Platform, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

// --- IMPORT YOUR SCREENS ---
import LoginScreen from './src/screens/LoginScreen'; 
import SignUpScreen from './src/screens/SignUpScreen'; 
import HomeScreen from './src/screens/HomeScreen';
import EventsScreen from './src/screens/EventsScreen';
import MapsScreen from './src/screens/MapsScreen';
import FestivalProfileScreen from './src/screens/FestivalProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ==========================================
// PROFILE SCREEN
// ==========================================
function ProfileScreen({ navigation }) {
  const { colors } = useTheme();

  const handleLogout = () => {
    const parentNav = navigation.getParent();
    if (parentNav?.replace) {
      parentNav.replace('Login');
    } else {
      navigation.replace('Login');
    }
  };

  return (
    <View style={[styles.profileContainer, { backgroundColor: colors.bg || colors.background }]}>
      <Text style={[styles.profileTitle, { color: colors.text }]}>Profile</Text>
      <Text style={[styles.profileSubtitle, { color: colors.textMuted }]}>
        Tap below to logout and return to login.
      </Text>
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.primary || '#8B5CF6' }]}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Feather name="log-out" size={18} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  profileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  profileTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  profileSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

// ==========================================
// THE TABS (Main App)
// ==========================================
function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary || '#8B5CF6',
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Events') iconName = 'calendar';
          else if (route.name === 'Maps') iconName = 'map';
          else if (route.name === 'Profile') iconName = 'user';

          return (
            <View style={{
              width: 44, 
              height: 28, 
              borderRadius: 14, 
              justifyContent: 'center', 
              alignItems: 'center',
              backgroundColor: focused ? 'rgba(139,92,246,0.15)' : 'transparent',
            }}>
              <Feather 
                name={iconName} 
                size={20} 
                color={focused ? (colors.primary || '#8B5CF6') : color} 
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Maps" component={MapsScreen} />
      <Tab.Screen name="Profile" component={FestivalProfileScreen} />
    </Tab.Navigator>
  );
}

// ==========================================
// ROOT NAVIGATOR (The Journey)
// ==========================================
export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppInner />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

function AppInner() {
  const { colors, scheme } = useTheme();

  // 1. Get the base theme to prevent the "Cannot read property 'regular'" font error
  const baseTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;

  // 2. Merge your custom theme colors into the base theme
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: colors.bg || colors.background, 
      card: colors.card,
      text: colors.text,
      border: colors.border,
      primary: colors.primary || '#8B5CF6',
    },
  };

  return (
    // Replaced SafeAreaView with standard View to stretch edge-to-edge
    <View style={{ flex: 1, backgroundColor: colors.bg || colors.background }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Pass the merged theme into NavigationContainer */}
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          
          {/* 1. Auth Flow */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />

          {/* 2. Main App Flow */}
          <Stack.Screen name="MainApp" component={MainTabs} />

        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}