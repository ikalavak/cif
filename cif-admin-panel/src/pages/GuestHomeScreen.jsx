import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import SafeScreen from "../components/SafeScreen";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";

export default function GuestHomeScreen({ navigation }) {
  const { colors } = useTheme();

  // Guests are redirected to Login whenever they try to access
  // a feature that requires an account.
  const requireLogin = () => {
    navigation.navigate("Login");
  };

  return (
    <SafeScreen
      scroll
      style={[styles.screen, { backgroundColor: colors.bg }]}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.greetingText, { color: colors.textMuted }]}>
            Welcome,
          </Text>

          <Text style={[styles.nameText, { color: colors.text }]}>
            Guest 👋
          </Text>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton} onPress={requireLogin}>
            <Feather name="user" size={20} color={colors.text} />
          </TouchableOpacity>

          <ThemeToggle />
        </View>
      </View>

      {/* Guest Notice */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={requireLogin}
        style={[
          styles.loginBanner,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={[styles.bannerIcon, { backgroundColor: colors.primary }]}>
          <Feather name="log-in" size={18} color={colors.white} />
        </View>

        <View style={styles.bannerText}>
          <Text style={[styles.bannerTitle, { color: colors.text }]}>
            You're browsing as a guest
          </Text>

          <Text style={[styles.bannerSubtitle, { color: colors.textMuted }]}>
            Sign in to register for events and access your profile.
          </Text>
        </View>

        <Feather name="chevron-right" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.input }]}>
        <Feather
          name="search"
          size={20}
          color={colors.textMuted}
          style={styles.searchIcon}
        />

        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search events..."
          placeholderTextColor={colors.textMuted}
        />

        <TouchableOpacity onPress={requireLogin}>
          <Feather name="sliders" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Hero Card */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <LinearGradient
          colors={["rgba(139,92,246,0.1)", "transparent"]}
          style={StyleSheet.absoluteFillObject}
        />

        <Text style={[styles.heroTitle, { color: colors.text }]}>
          Creative Industries Festival
        </Text>

        <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>
          Discover what's happening
        </Text>

        <Text style={[styles.heroDesc, { color: colors.text }]}>
          Explore events, exhibitions, workshops and opportunities across the
          festival.
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsRow}>
        <ActionBtn
          icon="message-circle"
          color={colors.primary}
          label="Forum"
          colors={colors}
          onPress={requireLogin}
        />

        <ActionBtn
          icon="briefcase"
          color={colors.accent}
          label="Job Board"
          colors={colors}
          onPress={() => navigation.navigate("JobBoard")}
        />

        <ActionBtn
          icon="user"
          color={colors.success}
          label="Profile"
          colors={colors}
          onPress={requireLogin}
        />
      </View>

      {/* Featured Events */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Featured Events
        </Text>

        <TouchableOpacity onPress={() => navigation.navigate("Events")}>
          <Text style={[styles.seeAllText, { color: colors.primary }]}>
            See All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Events */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 20 }}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate("EventDetails")}
          style={[styles.featuredMiniCard, { backgroundColor: colors.accent }]}
        >
          <Feather
            name="heart"
            size={20}
            color={colors.white}
            style={styles.heartIconAbs}
          />

          <Text style={[styles.placeholderText, { color: colors.white }]}>
            AI Exhibition
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate("EventDetails")}
          style={[
            styles.featuredMiniCard,
            {
              backgroundColor: colors.accent2,
              marginRight: 40,
            },
          ]}
        >
          <Text style={[styles.placeholderText, { color: colors.white }]}>
            VR Demo
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Guest Registration Reminder */}
      <View
        style={[
          styles.bottomCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <Feather name="lock" size={22} color={colors.primary} />

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.bottomCardTitle, { color: colors.text }]}>
            Want to register for an event?
          </Text>

          <Text style={[styles.bottomCardText, { color: colors.textMuted }]}>
            Create an account or sign in to register.
          </Text>
        </View>

        <TouchableOpacity
          onPress={requireLogin}
          style={[styles.loginButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.loginButtonText, { color: colors.white }]}>
            Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </SafeScreen>
  );
}

const ActionBtn = ({ icon, color, label, colors, onPress }) => (
  <TouchableOpacity
    style={styles.actionBtn}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View
      style={[
        styles.actionIconBg,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <Feather name={icon} size={22} color={color} />
    </View>

    <Text style={[styles.actionLabel, { color: colors.text }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  greetingText: {
    fontSize: 14,
    marginBottom: 2,
  },

  nameText: {
    fontSize: 18,
    fontWeight: "bold",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },

  headerIcons: {
    flexDirection: "row",
    gap: 12,
  },

  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  loginBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },

  bannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  bannerText: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  bannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 3,
  },

  bannerSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },

  searchIcon: {
    marginRight: 12,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
  },

  heroCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 24,
  },

  heroTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },

  heroSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },

  heroDesc: {
    fontSize: 13,
    textAlign: "center",
  },

  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  actionBtn: {
    alignItems: "center",
    flex: 1,
  },

  actionIconBg: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
  },

  actionLabel: {
    fontSize: 12,
    fontWeight: "500",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },

  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
  },

  featuredMiniCard: {
    width: 220,
    height: 120,
    borderRadius: 16,
    padding: 16,
    justifyContent: "flex-end",
    marginRight: 16,
  },

  heartIconAbs: {
    position: "absolute",
    top: 12,
    right: 12,
  },

  placeholderText: {
    fontSize: 18,
    fontWeight: "bold",
  },

  bottomCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },

  bottomCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 3,
  },

  bottomCardText: {
    fontSize: 12,
  },

  loginButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },

  loginButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
