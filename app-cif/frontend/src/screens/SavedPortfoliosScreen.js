// src/screens/SavedPortfolioScreen.js

import React, { useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import SafeScreen from "../components/SafeScreen";
import { useTheme } from "../context/ThemeContext";
import { auth, db } from "../config/firebase";
import { Feather } from "@expo/vector-icons";

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

export default function SavedPortfolioScreen({
  navigation,
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => getStyles(colors),
    [colors]
  );

  const [savedPortfolios, setSavedPortfolios] =
    useState([]);

  const [selectedPortfolio, setSelectedPortfolio] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [unsaving, setUnsaving] =
    useState(false);

  // ============================================================
  // LOAD SAVED PORTFOLIOS
  // ============================================================

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setSavedPortfolios([]);
      setLoading(false);
      return;
    }

    const savedPortfoliosRef = collection(
      db,
      "users",
      user.uid,
      "saved_portfolios"
    );

    const savedQuery = query(
      savedPortfoliosRef,
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      savedQuery,
      (snapshot) => {
        const portfolios = snapshot.docs.map(
          (savedDoc) => {
            const data = savedDoc.data();

            return {
              id: savedDoc.id,

              name:
                data.name ||
                "Creative Professional",

              role:
                data.role ||
                "Creative Professional",

              education:
                data.education || "",

              bio:
                data.bio ||
                "N/A",

              category:
                data.category ||
                "Creative Industries",

              originalUserId:
                data.originalUserId ||
                savedDoc.id,

              savedBy:
                data.savedBy ||
                user.uid,

              createdAt:
                data.createdAt || null,
            };
          }
        );

        setSavedPortfolios(portfolios);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error(
          "Error loading saved portfolios:",
          error
        );

        setLoading(false);
        setRefreshing(false);

        Alert.alert(
          "Notice",
          "Could not load your saved portfolios."
        );
      }
    );

    return unsubscribe;
  }, []);

  // ============================================================
  // REFRESH
  // ============================================================

  const onRefresh = () => {
    setRefreshing(true);

    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  // ============================================================
  // OPEN PORTFOLIO MODAL
  // ============================================================

  const handleOpenPortfolio = (portfolio) => {
    setSelectedPortfolio(portfolio);
  };

  // ============================================================
  // CLOSE PORTFOLIO MODAL
  // ============================================================

  const handleCloseModal = () => {
    if (!unsaving) {
      setSelectedPortfolio(null);
    }
  };

  // ============================================================
  // UNSAVE PORTFOLIO
  // ============================================================

  const handleUnsavePortfolio = async () => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert(
        "Sign In Required",
        "Please sign in first."
      );
      return;
    }

    if (!selectedPortfolio) {
      return;
    }

    try {
      setUnsaving(true);

      const savedPortfolioRef = doc(
        db,
        "users",
        user.uid,
        "saved_portfolios",
        selectedPortfolio.id
      );

      await deleteDoc(savedPortfolioRef);

      // Remove immediately from the local list
      setSavedPortfolios((previous) =>
        previous.filter(
          (portfolio) =>
            portfolio.id !==
            selectedPortfolio.id
        )
      );

      // Close modal
      setSelectedPortfolio(null);

      Alert.alert(
        "Portfolio Unsaved",
        `${selectedPortfolio.name}'s portfolio has been removed from your saved portfolios.`
      );
    } catch (error) {
      console.error(
        "Error unsaving portfolio:",
        error
      );

      Alert.alert(
        "Unsave Failed",
        `Could not unsave portfolio: ${error.message}`
      );
    } finally {
      setUnsaving(false);
    }
  };

  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (loading) {
    return (
      <SafeScreen style={styles.screen}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={
              colors.primary || "#8B5CF6"
            }
          />

          <Text style={styles.loadingText}>
            Loading saved portfolios...
          </Text>
        </View>
      </SafeScreen>
    );
  }

  // ============================================================
  // MAIN SCREEN
  // ============================================================

  return (
    <SafeScreen
      scroll
      style={styles.screen}
      contentContainerStyle={
        styles.content
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={
            colors.primary || "#8B5CF6"
          }
          colors={[
            colors.primary || "#8B5CF6",
          ]}
        />
      }
    >
      {/* ======================================================
          HEADER
          ====================================================== */}

      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => {
            if (
              navigation &&
              typeof navigation.goBack ===
                "function"
            ) {
              navigation.goBack();
            }
          }}
          style={styles.backIconBtn}
          hitSlop={{
            top: 8,
            bottom: 8,
            left: 8,
            right: 8,
          }}
        >
          <Feather
            name="arrow-left"
            size={22}
            color={colors.text}
          />
        </TouchableOpacity>

        <Text
          style={styles.headerTitle}
          pointerEvents="none"
        >
          Saved Portfolios
        </Text>
      </View>

      {/* ======================================================
          SUBTITLE
          ====================================================== */}

      <Text style={styles.subtitle}>
        Portfolios you have saved to your profile.
      </Text>

      {/* ======================================================
          COUNT
          ====================================================== */}

      <View style={styles.countContainer}>
        <Feather
          name="bookmark"
          size={17}
          color={
            colors.primary || "#8B5CF6"
          }
        />

        <Text style={styles.countText}>
          {savedPortfolios.length}{" "}
          {savedPortfolios.length === 1
            ? "Saved Portfolio"
            : "Saved Portfolios"}
        </Text>
      </View>

      {/* ======================================================
          EMPTY STATE
          ====================================================== */}

      {savedPortfolios.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Feather
              name="bookmark"
              size={40}
              color={colors.textMuted}
            />
          </View>

          <Text style={styles.emptyTitle}>
            No Saved Portfolios
          </Text>

          <Text style={styles.emptyText}>
            When you save someone's portfolio,
            it will appear here.
          </Text>

          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => {
              if (
                navigation &&
                typeof navigation.navigate ===
                  "function"
              ) {
                navigation.navigate(
                  "PortfolioScreen"
                );
              }
            }}
            activeOpacity={0.8}
          >
            <Text
              style={styles.browseButtonText}
            >
              Browse Portfolios
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ====================================================
           SAVED PORTFOLIO CARDS
           ==================================================== */

        <View style={styles.list}>
          {savedPortfolios.map(
            (portfolio) => (
              <TouchableOpacity
                key={portfolio.id}
                style={styles.card}
                onPress={() =>
                  handleOpenPortfolio(
                    portfolio
                  )
                }
                activeOpacity={0.85}
              >
                {/* AVATAR */}

                <View style={styles.avatar}>
                  <Text
                    style={
                      styles.avatarText
                    }
                  >
                    {portfolio.name
                      ? portfolio.name
                          .charAt(0)
                          .toUpperCase()
                      : "U"}
                  </Text>
                </View>

                {/* NAME */}

                <Text
                  style={
                    styles.personName
                  }
                >
                  {portfolio.name}
                </Text>

                {/* ROLE */}

                <Text
                  style={
                    styles.roleText
                  }
                >
                  {portfolio.education ||
                    portfolio.role ||
                    "Creative Professional"}
                </Text>

                {/* BIO */}

                <Text
                  style={styles.bio}
                  numberOfLines={3}
                >
                  {portfolio.bio || "N/A"}
                </Text>

                {/* SAVED LABEL */}

                <View
                  style={
                    styles.savedLabel
                  }
                >
                  <Feather
                    name="bookmark"
                    size={13}
                    color={
                      colors.primary ||
                      "#8B5CF6"
                    }
                  />

                  <Text
                    style={
                      styles.savedLabelText
                    }
                  >
                    Saved to My Profile
                  </Text>
                </View>
              </TouchableOpacity>
            )
          )}
        </View>
      )}

      {/* ======================================================
          PORTFOLIO DETAIL MODAL
          ====================================================== */}

      <Modal
        visible={Boolean(
          selectedPortfolio
        )}
        transparent
        animationType="fade"
        onRequestClose={
          handleCloseModal
        }
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>

            {/* ==================================================
                CLOSE BUTTON
                ================================================== */}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={
                handleCloseModal
              }
              disabled={unsaving}
              activeOpacity={0.8}
            >
              <Feather
                name="x"
                size={18}
                color={colors.text}
              />
            </TouchableOpacity>

            {/* ==================================================
                MODAL AVATAR
                ================================================== */}

            <View style={styles.modalAvatar}>
              <Text
                style={
                  styles.modalAvatarText
                }
              >
                {selectedPortfolio?.name
                  ?.charAt(0)
                  ?.toUpperCase() || "U"}
              </Text>
            </View>

            {/* ==================================================
                NAME
                ================================================== */}

            <Text
              style={styles.modalName}
            >
              {selectedPortfolio?.name ||
                "N/A"}
            </Text>

            {/* ==================================================
                ROLE & EDUCATION
                ================================================== */}

            <Text
              style={
                styles.modalSectionTitle
              }
            >
              Role & Education
            </Text>

            <Text
              style={
                styles.modalEducation
              }
            >
              {selectedPortfolio
                ?.education ||
                selectedPortfolio
                  ?.role ||
                "N/A"}
            </Text>

            {/* ==================================================
                ABOUT
                ================================================== */}

            <Text
              style={
                styles.modalSectionTitle
              }
            >
              About
            </Text>

            <Text
              style={styles.modalBio}
            >
              {selectedPortfolio?.bio ||
                "N/A"}
            </Text>

            {/* ==================================================
                UNSAVE
                ================================================== */}

            <TouchableOpacity
              style={[
                styles.unsaveButton,
                {
                  opacity: unsaving
                    ? 0.6
                    : 1,
                },
              ]}
              onPress={
                handleUnsavePortfolio
              }
              disabled={unsaving}
              activeOpacity={0.85}
            >
              {unsaving ? (
                <ActivityIndicator
                  size="small"
                  color="#fff"
                />
              ) : (
                <>
                  <Feather
                    name="bookmark"
                    size={15}
                    color="#fff"
                  />

                  <Text
                    style={
                      styles.unsaveButtonText
                    }
                  >
                    Unsave from My Profile
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeScreen>
  );
}

// ============================================================
// STYLES
// ============================================================

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

    // ========================================================
    // HEADER
    // ========================================================

    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      position: "relative",
      minHeight: 32,
      marginBottom: 6,
    },

    backIconBtn: {
      zIndex: 2,
    },

    headerTitle: {
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

    // ========================================================
    // COUNT
    // ========================================================

    countContainer: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 14,
      marginBottom: 18,
    },

    countText: {
      marginLeft: 7,
      color: colors.text,
      fontSize: 13,
      fontWeight: "700",
    },

    // ========================================================
    // LIST
    // ========================================================

    list: {
      gap: 14,
    },

    // ========================================================
    // CARD
    // ========================================================

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
      backgroundColor:
        colors.primary || "#8B5CF6",
      marginBottom: 12,
    },

    avatarText: {
      color: "#fff",
      fontSize: 21,
      fontWeight: "800",
    },

    personName: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 6,
    },

    roleText: {
      fontSize: 14,
      color:
        colors.primary || "#8B5CF6",
      lineHeight: 20,
      marginBottom: 8,
    },

    bio: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 12,
    },

    savedLabel: {
      flexDirection: "row",
      alignItems: "center",
    },

    savedLabelText: {
      color:
        colors.primary || "#8B5CF6",
      fontSize: 12,
      fontWeight: "700",
      marginLeft: 5,
    },

    // ========================================================
    // MODAL
    // ========================================================

    modalBackdrop: {
      flex: 1,
      backgroundColor:
        "rgba(0, 0, 0, 0.55)",
      paddingHorizontal: 7,
      justifyContent: "flex-start",
      paddingTop: 12,
    },

    modalCard: {
      width: "100%",
      backgroundColor: colors.card,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 15,
      paddingTop: 15,
      paddingBottom: 15,
      position: "relative",
    },

    closeButton: {
      position: "absolute",
      right: 11,
      top: 11,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.bg,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 20,
    },

    // ========================================================
    // MODAL AVATAR
    // ========================================================

    modalAvatar: {
      width: 49,
      height: 49,
      borderRadius: 25,
      alignSelf: "center",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        colors.primary || "#8B5CF6",
      marginBottom: 10,
    },

    modalAvatarText: {
      color: "#fff",
      fontSize: 17,
      fontWeight: "800",
    },

    // ========================================================
    // MODAL NAME
    // ========================================================

    modalName: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.text,
      textAlign: "center",
      marginBottom: 14,
    },

    // ========================================================
    // MODAL TEXT
    // ========================================================

    modalSectionTitle: {
      fontSize: 11,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 3,
    },

    modalEducation: {
      fontSize: 12,
      color:
        colors.primary || "#6D5CE7",
      lineHeight: 17,
      marginBottom: 10,
    },

    modalBio: {
      fontSize: 12,
      color: colors.textMuted,
      lineHeight: 17,
      marginBottom: 14,
    },

    // ========================================================
    // MODAL UNSAVE BUTTON
    // ========================================================

    unsaveButton: {
      width: "100%",
      height: 34,
      borderRadius: 9,
      backgroundColor:
        colors.primary || "#8B5CF6",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      marginTop: 2,
    },

    unsaveButtonText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "700",
      marginLeft: 6,
    },

    // ========================================================
    // EMPTY
    // ========================================================

    emptyContainer: {
      padding: 35,
      alignItems: "center",
      justifyContent: "center",
    },

    emptyIcon: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 15,
    },

    emptyTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "800",
      marginBottom: 8,
    },

    emptyText: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
      textAlign: "center",
      maxWidth: 280,
      marginBottom: 20,
    },

    browseButton: {
      backgroundColor:
        colors.primary || "#8B5CF6",
      borderRadius: 11,
      paddingVertical: 12,
      paddingHorizontal: 20,
    },

    browseButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "700",
    },

    // ========================================================
    // LOADING
    // ========================================================

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
  });