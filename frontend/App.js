import React from 'react';
import { View, Platform, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from './src/theme'; // Ensure theme.js is in the same folder!
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

// --- IMPORT YOUR SCREENS ---
import LoginScreen from './src/screens/LoginScreen'; 

// Make sure this matches your exact file name's capitalization!
import SignUpScreen from './src/screens/SignUpScreen'; 

// Added /src/ to these paths so the app can find them
import HomeScreen from './src/screens/HomeScreen';
import EventsScreen from './src/screens/EventsScreen';
import MapsScreen from './src/screens/MapsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Placeholder for Profile
function ProfileScreen({ navigation }) {
  const handleLogout = () => {
    const parentNav = navigation.getParent();
    if (parentNav?.replace) {
      parentNav.replace('Login');
    } else {
      navigation.replace('Login');
    }
  };

  return (
    <View style={styles.profileContainer}>
      <Text style={styles.profileTitle}>Profile</Text>
      <Text style={styles.profileSubtitle}>Tap below to logout and return to login.</Text>
      <TouchableOpacity
        style={styles.logoutButton}
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
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  profileTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  profileSubtitle: {
    color: COLORS.textMuted,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
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
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: Platform.OS === 'ios' ? 28 : 18,
          backgroundColor: colors.card,
          borderTopColor: 'transparent',
          borderRadius: 20,
          height: Platform.OS === 'ios' ? 76 : 60,
          paddingBottom: Platform.OS === 'ios' ? 18 : 8,
          paddingTop: 8,
          elevation: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 4 },
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Events') iconName = 'calendar';
          else if (route.name === 'Maps') iconName = 'map';
          else if (route.name === 'Profile') iconName = 'user';

          return (
            <View style={{
              width: 48, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
              backgroundColor: focused ? 'rgba(139,92,246,0.2)' : 'transparent',
            }}>
              <Feather name={iconName} size={20} color={focused ? '#fff' : color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Maps" component={MapsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
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
        <SafeAreaView style={{ flex: 1 }}>
          <AppInner />
        </SafeAreaView>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

function AppInner() {
  const { colors, scheme } = useTheme();

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          
          {/* 1. Auth Flow */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />

          {/* 2. Main App Flow */}
          <Stack.Screen name="MainApp" component={MainTabs} />

        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}