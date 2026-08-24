// src/screens/PortfolioScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import SafeScreen from "../components/SafeScreen";
import { useTheme } from "../context/ThemeContext";
import { auth, db } from "../config/firebase";
import { Feather } from "@expo/vector-icons";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

export default function PortfolioScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [portfolios, setPortfolios] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPortfolios();
  }, []);

  // ==================================================
  // LOAD PORTFOLIOS
  // ==================================================
  const loadPortfolios = async (isPullToRefresh = false) => {
    try {
      if (isPullToRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const loadedPortfolios = [];

      // Fetch all registered users
      const usersSnapshot = await getDocs(collection(db, "users"));

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        try {
          // Direct read on the specific subcollection profile doc
          const profileRef = doc(db, "users", userId, "portfolio", "profile");
          const profileSnap = await getDoc(profileRef);

          if (profileSnap.exists()) {
            const data = profileSnap.data();

            if (data.name || data.education || data.bio || data.role) {
              loadedPortfolios.push({
                id: userId,
                name: data.name || data.fullName || "Festival Attendee",
                education:
                  data.education || data.role || "Creative Professional",
                role: data.role || data.education || "Creative Professional",
                bio: data.bio || "No biography provided.",
                category: data.category || "Creative Industries",
                createdAt: data.createdAt || null,
              });
            }
          }
        } catch (err) {
          // Gracefully continue without interrupting remaining items
        }
      }

      setPortfolios(loadedPortfolios);
    } catch (error) {
      console.error("Error loading portfolios:", error);
      Alert.alert("Notice", "Could not load portfolios.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadPortfolios(true);
  };

  // ==================================================
  // SEARCH FILTER
  // ==================================================
  const filtered = portfolios.filter((person) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;

    return (
      (person.name && person.name.toLowerCase().includes(term)) ||
      (person.education && person.education.toLowerCase().includes(term)) ||
      (person.role && person.role.toLowerCase().includes(term)) ||
      (person.bio && person.bio.toLowerCase().includes(term))
    );
  });

  // ==================================================
  // SAVE PORTFOLIO (Saves to saved_portfolios matching rules)
  // ==================================================
  const handleSavePortfolio = async (person) => {
    try {
      const user = auth.currentUser;

      if (!user) {
        Alert.alert(
          "Sign In Required",
          "Please sign in before saving a portfolio.",
        );
        return;
      }

      if (!person) {
        Alert.alert("Error", "No portfolio selected.");
        return;
      }

      if (person.id === user.uid) {
        Alert.alert("Your Portfolio", "This is your own portfolio profile.");
        return;
      }

      setSaving(true);

      const savedPortfolioRef = doc(
        db,
        "users",
        user.uid,
        "saved_portfolios",
        person.id,
      );

      await setDoc(
        savedPortfolioRef,
        {
          name: person.name || "Creative Professional",
          role: person.role || person.education || "Creative Attendee",
          education: person.education || "",
          bio: person.bio || "",
          category: person.category || "Creative Industries",
          originalUserId: person.id,
          savedBy: user.uid,
          createdAt: serverTimestamp(),
        },
        { merge: true },
      );

      Alert.alert(
        "Portfolio Saved! 🎉",
        `${person.name}'s portfolio has been saved to your profile bookmarks.`,
        [
          {
            text: "OK",
            onPress: () => setSelected(null),
          },
        ],
      );
    } catch (error) {
      console.error("Error saving portfolio:", error);
      Alert.alert("Save Failed", `Could not save portfolio: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ==================================================
  // DELETE MY OWN PORTFOLIO
  // ==================================================
  const handleDeleteMyPortfolio = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        Alert.alert("Sign In Required", "Please sign in first.");
        return;
      }

      Alert.alert(
        "Delete My Portfolio",
        "Are you sure you want to permanently delete your public portfolio?",
        [
          { text: "Cancel", style: "cancel" },
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
                  "profile",
                );

                await deleteDoc(portfolioRef);

                Alert.alert(
                  "Portfolio Deleted",
                  "Your public portfolio has been removed.",
                  [{ text: "OK", onPress: () => loadPortfolios() }],
                );
              } catch (error) {
                console.error("Delete error:", error);
                Alert.alert("Delete Failed", error.message);
              } finally {
                setSaving(false);
              }
            },
          },
        ],
      );
    } catch (error) {
      console.error("Delete portfolio error:", error);
    }
  };

  if (loading) {
    return (
      <SafeScreen style={styles.screen}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary || "#8B5CF6"} />
          <Text style={styles.loadingText}>Loading festival portfolios...</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen
      scroll
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary || "#8B5CF6"}
          colors={[colors.primary || "#8B5CF6"]}
        />
      }
    >
      {/* HEADER — arrow fixed left, title absolutely centered over the row */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => {
            if (navigation && typeof navigation.goBack === "function") {
              navigation.goBack();
            }
          }}
          style={styles.backIconBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.backText} pointerEvents="none">
          Portfolios
        </Text>
      </View>

      <Text style={styles.subtitle}>
        Discover talent, collaborators, and creative work from festival
        attendees.
      </Text>

      {/* CREATE / DELETE ACTIONS */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => {
          if (navigation?.navigate) {
            navigation.navigate("CreatePortfolioScreen");
          }
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.createButtonText}>
          + Create / Edit My Portfolio
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deletePortfolioButton}
        onPress={handleDeleteMyPortfolio}
        disabled={saving}
        activeOpacity={0.8}
      >
        <Text style={styles.deletePortfolioButtonText}>
          {saving ? "Processing..." : "Delete My Portfolio"}
        </Text>
      </TouchableOpacity>

      {/* SEARCH INPUT */}
      <TextInput
        style={styles.search}
        placeholder="Search by name, role, skills, or bio..."
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />

      {/* PORTFOLIO LIST */}
      <View style={styles.grid}>
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="folder" size={40} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Portfolios Found</Text>
            <Text style={styles.emptyText}>
              {portfolios.length === 0
                ? "Be the first to publish a portfolio!"
                : "Try adjusting your search terms."}
            </Text>
          </View>
        ) : (
          filtered.map((person) => (
            <View style={styles.card} key={person.id}>
              {/* AVATAR */}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {person.name ? person.name.charAt(0).toUpperCase() : "U"}
                </Text>
              </View>

              {/* NAME */}
              <Text style={styles.personName}>{person.name}</Text>

              {/* ROLE / EDUCATION */}
              <Text style={styles.educationTitle}>Role / Background</Text>
              <Text style={styles.educationText}>{person.education}</Text>

              {/* BIO */}
              <Text style={styles.bio} numberOfLines={3}>
                {person.bio}
              </Text>

              {/* VIEW ACTION */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setSelected(person)}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>View Portfolio</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* VIEW & SAVE DETAIL MODAL */}
      <Modal
        visible={Boolean(selected)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!saving) setSelected(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {/* CLOSE BUTTON */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                if (!saving) setSelected(null);
              }}
              disabled={saving}
            >
              <Feather name="x" size={20} color={colors.text} />
            </TouchableOpacity>

            {/* MODAL AVATAR */}
            <View style={styles.modalAvatar}>
              <Text style={styles.avatarText}>
                {selected?.name?.charAt(0)?.toUpperCase()}
              </Text>
            </View>

            {/* NAME */}
            <Text style={styles.modalName}>{selected?.name}</Text>

            {/* EDUCATION / ROLE */}
            <Text style={styles.skillsTitle}>Role & Education</Text>
            <Text style={styles.modalEducation}>{selected?.education}</Text>

            {/* BIO */}
            <Text style={styles.skillsTitle}>About</Text>
            <Text style={styles.modalBio}>{selected?.bio}</Text>

            {/* ACTION BUTTONS */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.saveButton, { opacity: saving ? 0.6 : 1 }]}
                onPress={() => handleSavePortfolio(selected)}
                disabled={saving}
                activeOpacity={0.85}
              >
                <Text style={styles.actionButtonText}>
                  {saving ? "Saving..." : "Save to My Profile"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeScreen>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 40,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      position: "relative",
      minHeight: 32,
      marginBottom: 6,
    },
    backIconBtn: { zIndex: 2 },
    backText: {
      position: "absolute",
      left: 0,
      right: 0,
      textAlign: "center",
      fontSize: 20,
      fontWeight: "800",
      color: colors.text,
    },
    subtitle: {
      marginTop: 12,
      marginBottom: 16,
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 20,
      textAlign: "center",
    },
    createButton: {
      width: "100%",
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.primary || "#8B5CF6",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    createButtonText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "700",
    },
    deletePortfolioButton: {
      width: "100%",
      height: 44,
      borderRadius: 12,
      backgroundColor: "transparent",
      borderColor: "#ef4444",
      borderWidth: 1.2,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    deletePortfolioButtonText: {
      color: "#ef4444",
      fontSize: 14,
      fontWeight: "700",
    },
    search: {
      width: "100%",
      height: 48,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.card,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 18,
      fontSize: 14,
    },
    grid: {
      gap: 14,
    },
    card: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 16,
      padding: 18,
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary || "#8B5CF6",
      marginBottom: 12,
    },
    modalAvatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary || "#8B5CF6",
      marginBottom: 12,
      alignSelf: "center",
    },
    avatarText: {
      color: "#fff",
      fontSize: 22,
      fontWeight: "800",
    },
    personName: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 8,
    },
    modalName: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.text,
      textAlign: "center",
      marginBottom: 16,
    },
    educationTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary || "#8B5CF6",
      textTransform: "uppercase",
      marginBottom: 2,
    },
    educationText: {
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 20,
      marginBottom: 10,
    },
    modalEducation: {
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 20,
      marginBottom: 14,
    },
    bio: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 14,
    },
    modalBio: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 20,
      marginBottom: 18,
    },
    skillsTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "700",
      marginBottom: 4,
    },
    actionButton: {
      alignSelf: "flex-start",
      backgroundColor: colors.primary || "#8B5CF6",
      borderRadius: 10,
      paddingVertical: 9,
      paddingHorizontal: 16,
      alignItems: "center",
    },
    actionButtonText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 13,
    },
    emptyContainer: {
      padding: 40,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "700",
      marginTop: 4,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 13,
      textAlign: "center",
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    loadingText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: "600",
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      padding: 20,
      justifyContent: "center",
    },
    modalCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      padding: 20,
      position: "relative",
      maxHeight: "85%",
    },
    closeButton: {
      position: "absolute",
      right: 14,
      top: 14,
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.bg,
      zIndex: 10,
    },
    modalButtons: {
      marginTop: 8,
    },
    saveButton: {
      backgroundColor: colors.primary || "#8B5CF6",
      borderRadius: 12,
      paddingVertical: 13,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    },
  });
