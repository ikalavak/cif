import React, { useCallback, useEffect, useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";

import { Feather } from "@expo/vector-icons";

import SafeScreen from "../components/SafeScreen";
import { useTheme } from "../context/ThemeContext";

import { auth } from "../config/firebase";

import { updateProfile, updatePassword } from "firebase/auth";

// NOTE: this screen used to gate all fields behind an "email verified"
// check with its own resend/verify UI. That's now removed — LoginScreen.js
// already refuses sign-in entirely for unverified accounts (it signs the
// user back out and prompts them to verify first), so anyone who can reach
// this screen at all is already guaranteed to be verified. Keeping a second
// verification gate here was dead logic that always evaluated to "verified"
// and added an extra Firebase reload() call on every screen open for no
// actual benefit.

export default function EditProfileScreen({ navigation }) {
  const { colors } = useTheme();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(() => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert(
        "Not Logged In",
        "Please log in before editing your profile.",
      );

      if (navigation?.goBack) {
        navigation.goBack();
      }

      return;
    }

    if (user.displayName) {
      const names = user.displayName.trim().split(" ");
      setFirstName(names[0] || "");
      setLastName(names.slice(1).join(" ") || "");
    }

    setLoading(false);
  }, [navigation]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const saveProfile = async () => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert("Error", "You are not logged in.");
      return;
    }

    if (!firstName.trim()) {
      Alert.alert("Missing First Name", "Please enter your first name.");
      return;
    }

    if (!lastName.trim()) {
      Alert.alert("Missing Last Name", "Please enter your last name.");
      return;
    }

    if (password.length > 0 || confirmPassword.length > 0) {
      if (password.length < 6) {
        Alert.alert(
          "Invalid Password",
          "Password must contain at least 6 characters.",
        );
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert(
          "Passwords Do Not Match",
          "Please make sure both passwords match.",
        );
        return;
      }
    }

    setSaving(true);

    try {
      await updateProfile(user, {
        displayName: `${firstName.trim()} ${lastName.trim()}`,
      });

      if (password.trim()) {
        try {
          await updatePassword(user, password);
        } catch (passwordError) {
          if (passwordError?.code === "auth/requires-recent-login") {
            Alert.alert(
              "Log In Again",
              "For security, Firebase requires you to log in again before changing your password.",
            );
            return;
          }
          throw passwordError;
        }
      }

      setPassword("");
      setConfirmPassword("");

      Alert.alert(
        "Profile Updated",
        "Your profile has been updated successfully.",
        [
          {
            text: "OK",
            onPress: () => {
              if (navigation?.goBack) {
                navigation.goBack();
              }
            },
          },
        ],
      );
    } catch (error) {
      if (error?.code === "auth/requires-recent-login") {
        Alert.alert(
          "Log In Again",
          "For security, Firebase requires you to log in again before changing your profile.",
        );
        return;
      }

      Alert.alert(
        "Update Failed",
        error?.message || "Unable to update your profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    setPassword("");
    setConfirmPassword("");

    if (navigation?.goBack) {
      navigation.goBack();
    }
  };

  if (loading) {
    return (
      <SafeScreen style={[styles.screen, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen
      scroll
      style={[styles.screen, { backgroundColor: colors.bg }]}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.card }]}
          onPress={handleBack}
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>

        <View style={{ width: 40 }} />
      </View>

      <View style={styles.container}>
        <Text style={[styles.label, { color: colors.text }]}>First Name</Text>
        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Enter first name"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
        />

        <Text style={[styles.label, { color: colors.text }]}>Last Name</Text>
        <TextInput
          value={lastName}
          onChangeText={setLastName}
          placeholder="Enter last name"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
        />

        <Text style={[styles.label, { color: colors.text }]}>
          Change Password
        </Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Enter new password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
        />

        <Text style={[styles.label, { color: colors.text }]}>
          Confirm Password
        </Text>
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm new password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
        />

        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 },
          ]}
          onPress={saveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 22, fontWeight: "bold" },
  container: { paddingHorizontal: 20 },
  label: { fontSize: 14, fontWeight: "700", marginBottom: 8, marginTop: 15 },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 15,
  },
  saveButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
  },
  buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "bold" },
});
