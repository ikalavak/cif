PortfolioScreen

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import SafeScreen from "../components/SafeScreen";
import { useTheme } from "../context/ThemeContext";

import { auth, db } from "../config/firebase";

import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

export default function PortfolioScreen({
  navigation,
}) {
  const { colors } = useTheme();

  const styles = useMemo(
    () => getStyles(colors),
    [colors]
  );

  const [portfolios, setPortfolios] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [selected, setSelected] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  // ==================================================
  // LOAD PORTFOLIOS
  // ==================================================

  useEffect(() => {
    loadPortfolios();
  }, []);

  const loadPortfolios = async () => {
    try {
      setLoading(true);

      const usersSnapshot =
        await getDocs(
          collection(db, "users")
        );

      const loadedPortfolios = [];

      for (
        const userDocument of
        usersSnapshot.docs
      ) {
        try {
          const userId =
            userDocument.id;

          /*
           * Every user's own portfolio is:
           *
           * users/{userId}/portfolio/profile
           */

          const portfolioRef =
            doc(
              db,
              "users",
              userId,
              "portfolio",
              "profile"
            );

          const portfolioSnapshot =
            await getDocs(
              collection(
                db,
                "users",
                userId,
                "portfolio"
              )
            );

          const profileDocument =
            portfolioSnapshot.docs.find(
              (document) =>
                document.id === "profile"
            );

          if (!profileDocument) {
            continue;
          }

          const data =
            profileDocument.data();

          if (
            !data.name &&
            !data.education &&
            !data.bio
          ) {
            continue;
          }

          loadedPortfolios.push({
            id: userId,

            name:
              data.name ||
              "Unnamed User",

            education:
              data.education ||
              "Education not provided.",

            bio:
              data.bio ||
              "No biography provided.",

            createdAt:
              data.createdAt || null,
          });
        } catch (error) {
          console.log(
            "Could not load portfolio for user:",
            userDocument.id,
            error
          );
        }
      }

      setPortfolios(
        loadedPortfolios
      );
    } catch (error) {
      console.error(
        "Error loading portfolios:",
        error
      );

      Alert.alert(
        "Error",
        "Could not load portfolios."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // SEARCH
  // ==================================================

  const filtered =
    portfolios.filter((person) => {
      const term =
        search
          .toLowerCase()
          .trim();

      if (!term) {
        return true;
      }

      return (
        person.name
          .toLowerCase()
          .includes(term) ||
        person.education
          .toLowerCase()
          .includes(term) ||
        person.bio
          .toLowerCase()
          .includes(term)
      );
    });

  // ==================================================
  // SAVE PORTFOLIO
  // ==================================================

  const handleSavePortfolio =
    async (person) => {
      try {
        const user =
          auth.currentUser;

        if (!user) {
          Alert.alert(
            "Sign In Required",
            "Please sign in before saving a portfolio."
          );

          return;
        }

        if (!person) {
          Alert.alert(
            "Error",
            "No portfolio was selected."
          );

          return;
        }

        /*
         * Do not allow user to save
         * their own portfolio.
         */

        if (
          person.id === user.uid
        ) {
          Alert.alert(
            "Your Portfolio",
            "This is your own portfolio."
          );

          return;
        }

        setSaving(true);

        /*
         * Saved portfolio:
         *
         * users/{currentUser.uid}
         *     /portfolio
         *     /saved_{person.id}
         */

        const savedPortfolioRef =
          doc(
            db,
            "users",
            user.uid,
            "portfolio",
            `saved_${person.id}`
          );

        await setDoc(
          savedPortfolioRef,
          {
            name: person.name,
            education:
              person.education,
            bio: person.bio,

            originalUserId:
              person.id,

            savedBy: user.uid,

            createdAt:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        Alert.alert(
          "Portfolio Saved",
          `${person.name}'s portfolio has been saved to your profile.`,
          [
            {
              text: "OK",
              onPress: () => {
                setSelected(null);
              },
            },
          ]
        );
      } catch (error) {
        console.error(
          "Error saving portfolio:",
          error
        );

        Alert.alert(
          "Save Failed",
          "Could not save this portfolio. Please try again."
        );
      } finally {
        setSaving(false);
      }
    };

  // ==================================================
  // CONTACT
  // ==================================================

  const handleContact = () => {
    if (!selected) {
      return;
    }

    Alert.alert(
      "Contact",
      `Starting contact with ${selected.name}`
    );
  };

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <SafeScreen
        style={styles.screen}
      >
        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading portfolios...
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
      contentContainerStyle={
        styles.content
      }
    >
      {/* HEADER */}

      <View
        style={styles.headerRow}
      >
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
          style={styles.backButton}
        >
          <Text
            style={styles.backText}
          >
            ← Portfolios
          </Text>
        </TouchableOpacity>
      </View>

      <Text
        style={styles.subtitle}
      >
        Discover people's education,
        experience and background.
      </Text>

      {/* CREATE */}

      <TouchableOpacity
        style={
          styles.createButton
        }
        onPress={() => {
          if (
            navigation &&
            typeof navigation.navigate ===
              "function"
          ) {
            navigation.navigate(
              "CreatePortfolioScreen"
            );
          }
        }}
      >
        <Text
          style={
            styles.createButtonText
          }
        >
          + Create My Portfolio
        </Text>
      </TouchableOpacity>

      {/* SEARCH */}

      <TextInput
        style={styles.search}
        placeholder="Search portfolios..."
        placeholderTextColor={
          colors.textMuted
        }
        value={search}
        onChangeText={setSearch}
      />

      {/* PORTFOLIOS */}

      <View style={styles.grid}>
        {filtered.length === 0 ? (
          <View
            style={
              styles.emptyContainer
            }
          >
            <Text
              style={
                styles.emptyTitle
              }
            >
              No portfolios found
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              {portfolios.length ===
              0
                ? "No users have created a portfolio yet."
                : "Try changing your search."}
            </Text>
          </View>
        ) : (
          filtered.map(
            (person) => (
              <View
                style={styles.card}
                key={person.id}
              >
                {/* AVATAR */}

                <View
                  style={styles.avatar}
                >
                  <Text
                    style={
                      styles.avatarText
                    }
                  >
                    {person.name
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>

                {/* NAME */}

                <Text
                  style={
                    styles.personName
                  }
                >
                  {person.name}
                </Text>

                {/* EDUCATION */}

                <Text
                  style={
                    styles.educationTitle
                  }
                >
                  Education
                </Text>

                <Text
                  style={
                    styles.educationText
                  }
                >
                  {person.education}
                </Text>

                {/* BIO */}

                <Text
                  style={styles.bio}
                  numberOfLines={3}
                >
                  {person.bio}
                </Text>

                {/* VIEW */}

                <TouchableOpacity
                  style={
                    styles.actionButton
                  }
                  onPress={() =>
                    setSelected(
                      person
                    )
                  }
                >
                  <Text
                    style={
                      styles.actionButtonText
                    }
                  >
                    View Portfolio
                  </Text>
                </TouchableOpacity>
              </View>
            )
          )
        )}
      </View>

      {/* ==================================================
          MODAL
      ================================================== */}

      <Modal
        visible={Boolean(selected)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!saving) {
            setSelected(null);
          }
        }}
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <View
            style={
              styles.modalCard
            }
          >
            {/* CLOSE */}

            <TouchableOpacity
              style={
                styles.closeButton
              }
              onPress={() => {
                if (!saving) {
                  setSelected(null);
                }
              }}
              disabled={saving}
            >
              <Text
                style={
                  styles.closeButtonText
                }
              >
                ×
              </Text>
            </TouchableOpacity>

            {/* AVATAR */}

            <View
              style={
                styles.modalAvatar
              }
            >
              <Text
                style={
                  styles.avatarText
                }
              >
                {selected?.name
                  ?.charAt(0)
                  ?.toUpperCase()}
              </Text>
            </View>

            {/* NAME */}

            <Text
              style={
                styles.modalName
              }
            >
              {selected?.name}
            </Text>

            {/* EDUCATION */}

            <Text
              style={
                styles.skillsTitle
              }
            >
              Education
            </Text>

            <Text
              style={
                styles.modalEducation
              }
            >
              {selected?.education}
            </Text>

            {/* BIO */}

            <Text
              style={
                styles.skillsTitle
              }
            >
              About
            </Text>

            <Text
              style={styles.modalBio}
            >
              {selected?.bio}
            </Text>

            {/* BUTTONS */}

            <View
              style={
                styles.modalButtons
              }
            >
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  {
                    opacity:
                      saving
                        ? 0.6
                        : 1,
                  },
                ]}
                onPress={() =>
                  handleSavePortfolio(
                    selected
                  )
                }
                disabled={saving}
              >
                <Text
                  style={
                    styles.actionButtonText
                  }
                >
                  {saving
                    ? "Saving..."
                    : "Save to My Profile"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.contactButton
                }
                onPress={
                  handleContact
                }
                disabled={saving}
              >
                <Text
                  style={
                    styles.contactButtonText
                  }
                >
                  Contact
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

    content: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 30,
    },

    // HEADER

    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },

    backButton: {
      marginRight: 10,
    },

    backText: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.text,
    },

    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.text,
    },

    subtitle: {
      marginTop: 6,
      marginBottom: 18,
      fontSize: 14,
      color: colors.textMuted,
    },

    // CREATE

    createButton: {
      width: "100%",
      height: 50,
      borderRadius: 10,
      backgroundColor:
        colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },

    createButtonText: {
      color:
        colors.onPrimary ||
        colors.white ||
        "#fff",
      fontSize: 15,
      fontWeight: "700",
    },

    // SEARCH

    search: {
      width: "100%",
      height: 50,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor:
        colors.input,
      color: colors.text,
      borderWidth: 1,
      borderColor:
        colors.border,
      marginBottom: 20,
    },

    // GRID

    grid: {
      gap: 14,
    },

    card: {
      backgroundColor:
        colors.card,
      borderColor:
        colors.border,
      borderWidth: 1,
      borderRadius: 14,
      padding: 18,
    },

    // AVATAR

    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        colors.primary,
      marginBottom: 12,
    },

    modalAvatar: {
      width: 70,
      height: 70,
      borderRadius: 35,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        colors.primary,
      marginBottom: 12,
      alignSelf: "center",
    },

    avatarText: {
      color:
        colors.onPrimary ||
        colors.white ||
        "#fff",
      fontSize: 24,
      fontWeight: "700",
    },

    // NAME

    personName: {
      fontSize: 19,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 10,
    },

    modalName: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: 18,
    },

    // EDUCATION

    educationTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 4,
    },

    educationText: {
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 20,
      marginBottom: 12,
    },

    modalEducation: {
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 21,
      marginBottom: 18,
    },

    // BIO

    bio: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 21,
      marginBottom: 14,
    },

    modalBio: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 22,
      marginBottom: 18,
    },

    skillsTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 8,
    },

    // ACTION

    actionButton: {
      alignSelf: "flex-start",
      backgroundColor:
        colors.primary,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 14,
      minWidth: 130,
      alignItems: "center",
    },

    actionButtonText: {
      color:
        colors.onPrimary ||
        colors.white ||
        "#fff",
      fontWeight: "700",
    },

    // EMPTY

    emptyContainer: {
      padding: 30,
      alignItems: "center",
      justifyContent: "center",
    },

    emptyTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 6,
    },

    emptyText: {
      color: colors.textMuted,
      fontSize: 14,
      textAlign: "center",
    },

    // LOADING

    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        colors.bg,
    },

    loadingText: {
      marginTop: 10,
      color: colors.textMuted,
      fontSize: 14,
    },

    // MODAL

    modalBackdrop: {
      flex: 1,
      backgroundColor:
        "rgba(11, 18, 32, 0.55)",
      padding: 20,
      justifyContent: "center",
    },

    modalCard: {
      backgroundColor:
        colors.card,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 14,
      padding: 20,
      position: "relative",
      maxHeight: "85%",
    },

    closeButton: {
      position: "absolute",
      right: 10,
      top: 8,
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        colors.input,
      zIndex: 10,
    },

    closeButtonText: {
      color: colors.text,
      fontSize: 24,
      lineHeight: 26,
    },

    // MODAL BUTTONS

    modalButtons: {
      flexDirection: "row",
      gap: 10,
      marginTop: 10,
      flexWrap: "wrap",
    },

    saveButton: {
      backgroundColor:
        colors.primary,
      borderRadius: 8,
      paddingVertical: 11,
      paddingHorizontal: 14,
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
      minWidth: 150,
    },

    contactButton: {
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 14,
      alignItems: "center",
      justifyContent: "center",
      minWidth: 100,
    },

    contactButtonText: {
      color: colors.text,
      fontWeight: "700",
    },
  });