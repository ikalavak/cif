import React, { useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
} from "react-native";
import SafeScreen from "../components/SafeScreen";
import { useTheme } from "../context/ThemeContext";
import { Feather } from "@expo/vector-icons";
import { auth, db } from "../config/firebase";
import { signOut } from "firebase/auth";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

export default function SettingsScreen({ navigation }) {
  const { colors } = useTheme();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const [pushEnabled, setPushEnabled] = useState(true);
  const [offlineCached, setOfflineCached] = useState(false);

  const handleToggleOfflineCache = () => {
    setOfflineCached((prev) => !prev);
    Alert.alert(
      "Offline Cache",
      `Ticket ${offlineCached ? "removed from" : "saved to"} device.`,
    );
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            const parent = navigation.getParent && navigation.getParent();
            if (parent && parent.replace) parent.replace("Login");
            else navigation.replace("Login");
          } catch (error) {
            Alert.alert("Logout Error", error.message);
          }
        },
      },
    ]);
  };

  const handleSoftDeleteAccount = async () => {
    const user = auth.currentUser;

    if (!user) return;

    try {
      // 1. Flag the Firestore user record as soft-deleted
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        is_deleted: true,
        status: "deactivated",
        deleted_at: serverTimestamp(),
      });

      // 2. Safely sign out the user
      await signOut(auth);

      // 3. Navigate back to Login
      const parent = navigation.getParent && navigation.getParent();
      if (parent && parent.replace) parent.replace("Login");
      else navigation.replace("Login");
    } catch (error) {
      console.error("Soft delete error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to deactivate account. Please try again.",
      );
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Deactivate Account",
      "Are you sure you want to deactivate your account? Your profile and schedule will no longer be visible to other attendees, but your data will be preserved.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          onPress: handleSoftDeleteAccount,
          style: "destructive",
        },
      ],
    );
  };

  return (
    <SafeScreen
      scroll
      style={[styles.safeArea, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.container}
    >
      {/* Header — arrow fixed left, title absolutely centered over the row */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backIconBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={[styles.title, { color: colors.text }]}
          pointerEvents="none"
        >
          Settings
        </Text>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Preferences
        </Text>
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

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Account
        </Text>

        <View style={styles.statusRow}>
          <Text style={{ color: colors.textMuted }}>Offline Status</Text>
          <View style={styles.statusRight}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: offlineCached
                    ? colors.success
                    : colors.error,
                },
              ]}
            />
            <Text style={{ color: colors.textMuted, marginLeft: 8 }}>
              {offlineCached ? "Ticket cached locally" : "Not cached"}
            </Text>
          </View>
        </View>

        {/* Edit Profile button */}
        <TouchableOpacity
          style={[styles.editProfileButton, { backgroundColor: "#7B61FF" }]}
          onPress={() => navigation.navigate("EditProfileScreen")}
        >
          <Text style={styles.editProfileButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.logoutBtn, { backgroundColor: colors.error }]}
          activeOpacity={0.85}
        >
          <Text style={{ color: colors.white, fontWeight: "700" }}>Logout</Text>
        </TouchableOpacity>

        {/* Soft Delete Account button */}
        <TouchableOpacity
          onPress={confirmDelete}
          style={[styles.deleteBtn, { borderColor: colors.error }]}
          activeOpacity={0.85}
        >
          <Text style={{ color: colors.error, fontWeight: "700" }}>
            Deactivate Account
          </Text>
        </TouchableOpacity>
      </View>
    </SafeScreen>
  );
}

function SettingRow({
  label,
  value,
  onValueChange,
  colors,
  useToggle = true,
  onPress,
}) {
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
        <Switch
          value={value}
          onValueChange={onValueChange}
          thumbColor={value ? colors.primary : undefined}
        />
      ) : (
        <TouchableOpacity
          onPress={onPress}
          style={[styles.cacheBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={{ color: colors.onPrimary, fontWeight: "700" }}>
            {value ? "Remove" : "Cache"}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 16, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    minHeight: 32,
    marginBottom: 20,
  },
  backIconBtn: { zIndex: 2 },
  title: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800",
  },
  card: { borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 8 },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  cacheBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  statusRight: { flexDirection: "row", alignItems: "center" },
  dot: { width: 10, height: 10, borderRadius: 6 },
  editProfileButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  editProfileButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  logoutBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    backgroundColor: "transparent",
  },
});
