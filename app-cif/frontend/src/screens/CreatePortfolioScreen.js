import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import SafeScreen from "../components/SafeScreen";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

import { auth, db } from "../config/firebase";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

export default function CreatePortfolioScreen({ navigation }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () => getStyles(colors),
    [colors]
  );

  const [name, setName] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [education, setEducation] = useState("");
  const [bio, setBio] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ==================================================
  // LOAD EXISTING PORTFOLIO
  // ==================================================

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        Alert.alert(
          "Not signed in",
          "Please sign in to create your portfolio."
        );

        setLoading(false);
        return;
      }

      const portfolioRef = doc(
        db,
        "users",
        user.uid,
        "portfolio", 
        "profile"
      );

      const portfolioSnapshot = await getDoc(
        portfolioRef
      );

      if (portfolioSnapshot.exists()) {
        const data = portfolioSnapshot.data();

        setName(data.name || "");
        setEducation(data.education || "");
        setBio(data.bio || "");
      }
    } catch (error) {
      console.error(
        "Error loading portfolio:",
        error
      );

      Alert.alert(
        "Error",
        "Could not load your portfolio."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // SAVE PORTFOLIO
  // ==================================================

  const savePortfolio = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        Alert.alert(
          "Not signed in",
          "Please sign in before saving your portfolio."
        );
        return;
      }

      if (!name.trim()) {
        Alert.alert(
          "Name required",
          "Please enter your name."
        );
        return;
      }

      if (!education.trim()) {
        Alert.alert(
          "Education required",
          "Please enter your education."
        );
        return;
      }

      if (!bio.trim()) {
        Alert.alert(
          "Bio required",
          "Please enter your bio."
        );
        return;
      }

      setSaving(true);

      const portfolioRef = doc(
        db,
        "users",
        user.uid,
        "portfolio",
        "profile"
      );

      /*
       * IMPORTANT:
       *
       * We use createdAt instead of updatedAt.
       *
       * merge: true means existing portfolio
       * information will not be deleted.
       */
      await setDoc(
        portfolioRef,
        {
          name: name.trim(),
          education: education.trim(),
          bio: bio.trim(),
          createdAt: serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      Alert.alert(
        "Success",
        "Your portfolio has been saved."
      );
    } catch (error) {
      console.error(
        "Error saving portfolio:",
        error
      );

      Alert.alert(
        "Error",
        "Could not save your portfolio."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==================================================
// DELETE PORTFOLIO
// ==================================================

const deletePortfolio = async () => {
  try {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert(
        "Not signed in",
        "Please sign in before deleting your portfolio."
      );
      return;
    }

    Alert.alert(
      "Delete Portfolio",
      "Are you sure you want to permanently delete your portfolio?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setSaving(true);

              const portfolioRef = doc(
                db,
                "users",
                user.uid,
                "portfolio",
                "profile"
              );

              await deleteDoc(portfolioRef);

              // Clear the form
              setName("");
              setEducation("");
              setBio("");

              Alert.alert(
                "Portfolio Deleted",
                "Your portfolio has been deleted."
              );
            } catch (error) {
              console.error(
                "Error deleting portfolio:",
                error
              );

              Alert.alert(
                "Delete Failed",
                "Could not delete your portfolio. Please try again."
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  } catch (error) {
    console.error(
      "Delete portfolio error:",
      error
    );
  }
};

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <SafeScreen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text style={styles.loadingText}>
            Loading portfolio...
          </Text>
        </View>
      </SafeScreen>
    );
  }

  // ==================================================
  // SCREEN
  // ==================================================

  return (
    <SafeScreen
      scroll
      style={styles.screen}
      contentContainerStyle={styles.container}
    >
      {/* BACK BUTTON */}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          if (
            navigation &&
            typeof navigation.goBack === "function"
          ) {
            navigation.goBack();
          }
        }}
      >
        <Feather
          name="arrow-left"
          size={22}
          color={colors.text}
        />

        <Text style={styles.backText}>
          Back
        </Text>
      </TouchableOpacity>

      {/* HEADER */}

      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Feather
            name="briefcase"
            size={40}
            color={colors.primary}
          />
        </View>

        <Text style={styles.title}>
          Create My Portfolio
        </Text>

        <Text style={styles.subtitle}>
          Create your personal portfolio by
          adding your name, education and bio.
        </Text>
      </View>

      {/* NAME */}

      <View style={styles.section}>
        <Text style={styles.label}>
          Name
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      </View>

      {/* LINKEDIN */}

<View style={styles.section}>
  <Text style={styles.label}>
    LinkedIn
  </Text>

  <TextInput
    style={styles.input}
    placeholder="Enter your LinkedIn profile URL"
    placeholderTextColor={colors.textMuted}
    value={linkedin}
    onChangeText={setLinkedin}
    autoCapitalize="none"
    autoCorrect={false}
    keyboardType="url"
  />
</View>

      {/* EDUCATION */}

      <View style={styles.section}>
        <Text style={styles.label}>
          Education
        </Text>

        <TextInput
          style={[
            styles.input,
            styles.textArea,
          ]}
          placeholder="Enter your education"
          placeholderTextColor={colors.textMuted}
          value={education}
          onChangeText={setEducation}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.example}>
          Example: BSc (Hons) Computer Science,
          University of East London
        </Text>
      </View>

      {/* BIO */}

      <View style={styles.section}>
        <Text style={styles.label}>
          Bio
        </Text>

        <TextInput
          style={[
            styles.input,
            styles.bioInput,
          ]}
          placeholder="Tell people about yourself..."
          placeholderTextColor={colors.textMuted}
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={7}
          textAlignVertical="top"
        />

        <Text style={styles.example}>
          Write about yourself, your interests,
          experience and goals.
        </Text>
      </View>

      {/* SAVE */}

      <TouchableOpacity
        style={[
          styles.saveButton,
          {
            backgroundColor:
              colors.primary,
            opacity: saving ? 0.7 : 1,
          },
        ]}
        onPress={savePortfolio}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Feather
              name="save"
              size={20}
              color="#fff"
            />

            <Text style={styles.saveButtonText}>
              Save Portfolio
            </Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.deleteButton,
          {
            backgroundColor:
              colors.danger,
            opacity: saving ? 0.7 : 1,
          },
        ]}
        onPress={deletePortfolio}
        disabled={saving}
      >
        <Feather
          name="trash-2"
          size={20}
          color="#fff"
        />

        <Text style={styles.deleteButtonText}>
          Delete Portfolio
        </Text>
      </TouchableOpacity>
    </SafeScreen>
  );
}

// ==================================================
// STYLES
// ==================================================

const getStyles = (colors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bg,
    },

    container: {
      padding: 20,
      paddingBottom: 50,
    },

    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.bg,
    },

    loadingText: {
      marginTop: 10,
      fontSize: 14,
      color: colors.textMuted,
    },

    // BACK

    backButton: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      marginBottom: 20,
    },

    backText: {
      marginLeft: 7,
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },

    // HEADER

    header: {
      alignItems: "center",
      marginBottom: 30,
    },

    iconContainer: {
      width: 85,
      height: 85,
      borderRadius: 42.5,
      backgroundColor:
        colors.primary + "18",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 15,
    },

    title: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
    },

    subtitle: {
      marginTop: 8,
      fontSize: 14,
      lineHeight: 21,
      color: colors.textMuted,
      textAlign: "center",
    },

    // INPUTS

    section: {
      marginBottom: 22,
    },

    label: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 8,
    },

    input: {
      width: "100%",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.input,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 15,
      color: colors.text,
    },

    textArea: {
      minHeight: 100,
    },

    bioInput: {
      minHeight: 150,
    },

    example: {
      marginTop: 7,
      fontSize: 12,
      lineHeight: 18,
      color: colors.textMuted,
    },

    // SAVE

    saveButton: {
      height: 52,
      borderRadius: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
      marginTop: 5,
    },

    saveButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
    },

    deleteButton: {
      height: 52,
      borderRadius: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
      marginTop: 5,
    },

    deleteButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
    },
  });