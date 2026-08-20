import React, { useEffect, useRef } from "react";
import {
  View,
  Platform,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import Constants, { ExecutionEnvironment } from "expo-constants";

import LoginScreen from "./src/screens/LoginScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import SplashScreen from "./src/screens/SplashScreen";
import HomeScreen from "./src/screens/HomeScreen";
import EventsScreen from "./src/screens/EventsScreen";
import MapsScreen from "./src/screens/MapsScreen";
import FestivalProfileScreen from "./src/screens/FestivalProfileScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import ForumScreen from "./src/screens/ForumScreen";
import JobBoard from "./src/screens/JobBoard";
import PortfolioScreen from "./src/screens/PortfolioScreen";
import HomeGuest from "./src/screens/HomeGuest";
import ProfileGuest from "./src/screens/ProfileGuest";
import EditProfileScreen from "./src/screens/EditProfileScreen";
import GalleryScreen from "./src/screens/GalleryScreen";

const isExpoGo =
  Constants?.executionEnvironment === ExecutionEnvironment.StoreClient;

async function registerForPushNotificationsAsync() {
  const isPhysicalDevice = Constants?.isDevice ?? false;

  if (isExpoGo || !isPhysicalDevice) {
    console.log(
      "[Push] Running in Expo Go / Simulator — push registration bypassed.",
    );
    return null;
  }

  try {
    const Notifications = await import("expo-notifications");

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default Channel",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#8B5CF6",
      });
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();

      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    return tokenData.data;
  } catch (error) {
    console.warn("[Push] Native module check skipped:", error.message);

    return null;
  }
}

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ProfileScreen({ navigation }) {
  const { colors } = useTheme();

  const handleLogout = () => {
    const parentNav = navigation.getParent();

    if (parentNav?.replace) {
      parentNav.replace("Login");
    } else {
      navigation.replace("Login");
    }
  };

  return (
    <View
      style={[
        styles.profileContainer,
        {
          backgroundColor: colors.bg || colors.background,
        },
      ]}
    >
      <Text
        style={[
          styles.profileTitle,
          {
            color: colors.text,
          },
        ]}
      >
        Profile
      </Text>

      <Text
        style={[
          styles.profileSubtitle,
          {
            color: colors.textMuted,
          },
        ]}
      >
        Tap below to logout and return to login.
      </Text>

      <TouchableOpacity
        style={[
          styles.logoutButton,
          {
            backgroundColor: colors.primary || "#8B5CF6",
          },
        ]}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Feather
          name="log-out"
          size={18}
          color="#fff"
          style={{ marginRight: 8 }}
        />

        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  profileContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  profileTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },

  profileSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
  },

  logoutButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});

function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary || "#8B5CF6",
        tabBarInactiveTintColor: colors.textMuted,

        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
          paddingTop: 8,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },

        tabBarIcon: ({ focused, color }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = "home";
          } else if (route.name === "Events") {
            iconName = "calendar";
          } else if (route.name === "Maps") {
            iconName = "map";
          } else if (route.name === "Profile") {
            iconName = "user";
          }

          return (
            <View
              style={{
                width: 44,
                height: 28,
                borderRadius: 14,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: focused
                  ? "rgba(139,92,246,0.15)"
                  : "transparent",
              }}
            >
              <Feather
                name={iconName}
                size={20}
                color={focused ? colors.primary || "#8B5CF6" : color}
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

function GuestTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary || "#8B5CF6",
        tabBarInactiveTintColor: colors.textMuted,

        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
          paddingTop: 8,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },

        tabBarIcon: ({ focused, color }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = "home";
          } else if (route.name === "Events") {
            iconName = "calendar";
          } else if (route.name === "Maps") {
            iconName = "map";
          } else if (route.name === "Profile") {
            iconName = "user";
          }

          return (
            <View
              style={{
                width: 44,
                height: 28,
                borderRadius: 14,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: focused
                  ? "rgba(139,92,246,0.15)"
                  : "transparent",
              }}
            >
              <Feather
                name={iconName}
                size={20}
                color={focused ? colors.primary || "#8B5CF6" : color}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeGuest} />

      <Tab.Screen name="Events" component={EventsScreen} />

      <Tab.Screen name="Maps" component={MapsScreen} />

      <Tab.Screen name="Profile" component={ProfileGuest} />
    </Tab.Navigator>
  );
}

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

  const navigationRef = useRef(null);

  useEffect(() => {
    registerForPushNotificationsAsync();

    let notificationSub;
    let responseSub;

    const isPhysicalDevice = Constants?.isDevice ?? false;

    if (!isExpoGo && isPhysicalDevice) {
      import("expo-notifications").then((Notifications) => {
        notificationSub = Notifications.addNotificationReceivedListener(
          (notification) => {
            console.log("Foreground notification:", notification);
          },
        );

        responseSub = Notifications.addNotificationResponseReceivedListener(
          (response) => {
            const data = response.notification.request.content.data;

            const target = data?.screen || "Home";

            const tabScreens = ["Home", "Events", "Maps", "Profile"];

            if (tabScreens.includes(target)) {
              navigationRef.current?.navigate("MainApp", {
                screen: target,
                params: data?.params || {},
              });
            } else {
              try {
                navigationRef.current?.navigate(target, data?.params || {});
              } catch (e) {
                console.warn(`Could not deep-link to "${target}":`, e);

                navigationRef.current?.navigate("MainApp");
              }
            }
          },
        );
      });
    }

    return () => {
      notificationSub?.remove();
      responseSub?.remove();
    };
  }, []);

  const baseTheme = scheme === "dark" ? DarkTheme : DefaultTheme;

  const navigationTheme = {
    ...baseTheme,

    colors: {
      ...baseTheme.colors,

      background: colors.bg || colors.background,

      card: colors.card,

      text: colors.text,

      border: colors.border,

      primary: colors.primary || "#8B5CF6",
    },
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg || colors.background,
      }}
    >
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      <NavigationContainer ref={navigationRef} theme={navigationTheme}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
          initialRouteName="Splash"
        >
          <Stack.Screen name="Splash" component={SplashScreen} />

          <Stack.Screen name="Login" component={LoginScreen} />

          <Stack.Screen name="SignUp" component={SignUpScreen} />

          <Stack.Screen name="Notifications" component={NotificationsScreen} />

          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              headerShown: true,
              title: "Settings",
              headerBackVisible: false,
            }}
          />

          <Stack.Screen name="Gallery" component={GalleryScreen} />

          <Stack.Screen name="ForumScreen" component={ForumScreen} />

          <Stack.Screen name="JobBoard" component={JobBoard} />

          <Stack.Screen name="PortfolioScreen" component={PortfolioScreen} />

          <Stack.Screen
            name="EditProfileScreen"
            component={EditProfileScreen}
          />

          <Stack.Screen name="MainApp" component={MainTabs} />

          <Stack.Screen name="GuestApp" component={GuestTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}
