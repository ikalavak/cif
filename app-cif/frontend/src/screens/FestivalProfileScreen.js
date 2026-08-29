// src/screens/FestivalProfileScreen.js

import React, { useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
} from "react-native";

import SafeScreen from "../components/SafeScreen";
import QRCode from "react-native-qrcode-svg";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import * as ImagePicker from "expo-image-picker";

import { auth } from "../config/firebase";

export default function FestivalProfileScreen({
  navigation,
}) {
  const { colors } = useTheme();

  // ==================================================
  // CURRENT USER
  // ==================================================

  const [currentUser, setCurrentUser] = useState(
    auth.currentUser
  );

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(
      (user) => {
        setCurrentUser(user);
      }
    );

    return () => unsubscribe();
  }, []);

  // ==================================================
  // USER DETAILS
  // ==================================================

  const userName =
    currentUser?.displayName?.trim() || "User";

  const userInitials =
    userName
      .split(/\s+/)
      .filter(Boolean)
      .map((name) => name.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  const [photoUri, setPhotoUri] = useState(
    currentUser?.photoURL || null
  );

  // ==================================================
  // NAVIGATION
  // ==================================================

  const navigateSafely = (routeName) => {
    const parentNavigation =
      navigation.getParent();

    if (parentNavigation?.navigate) {
      parentNavigation.navigate(routeName);
    } else {
      navigation.navigate(routeName);
    }
  };

  // ==================================================
  // PICK PROFILE PHOTO
  // ==================================================

  const pickImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== "granted") {
          Alert.alert(
            "Permission required",
            "Permission to access photos is required to update your profile photo."
          );

          return;
        }
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes:
            ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

      if (
        !result.canceled &&
        result.assets &&
        result.assets.length > 0
      ) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.warn(
        "Image pick error:",
        error
      );
    }
  };

  // ==================================================
  // SCREEN
  // ==================================================

  return (
    <SafeScreen
      scroll
      style={[
        styles.safeArea,
        {
          backgroundColor: colors.bg,
        },
      ]}
      contentContainerStyle={{
        paddingBottom: 40,
        paddingTop: 12,
      }}
    >
      {/* ==================================================
          HEADER
      ================================================== */}

      <View style={styles.backRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
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
          style={[
            styles.backTitle,
            {
              color: colors.text,
            },
          ]}
        >
          Profile
        </Text>
      </View>

      {/* ==================================================
          PROFILE HEADER
      ================================================== */}

      <View style={styles.headerRow}>
        <View style={styles.avatarWrap}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={pickImage}
          >
            {photoUri ? (
              <Image
                source={{
                  uri: photoUri,
                }}
                style={styles.avatarImage}
              />
            ) : (
              <View
                style={[
                  styles.avatarCircle,
                  {
                    backgroundColor:
                      colors.card,
                    borderColor:
                      colors.primary ||
                      "#8B5CF6",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.avatarInitials,
                    {
                      color:
                        colors.primary ||
                        "#8B5CF6",
                    },
                  ]}
                >
                  {userInitials}
                </Text>
              </View>
            )}

            <View
              style={[
                styles.cameraBadge,
                {
                  backgroundColor:
                    colors.primary ||
                    "#8B5CF6",
                },
              ]}
            >
              <Feather
                name="camera"
                size={12}
                color="#fff"
              />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.headerInfo}>
          <Text
            style={[
              styles.nameText,
              {
                color: colors.text,
              },
            ]}
          >
            {userName}
          </Text>

          {/* <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  (colors.primary ||
                    "#8B5CF6") + "22",
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color:
                    colors.primary ||
                    "#8B5CF6",
                },
              ]}
            >
              Pass Type: VIP
            </Text>
          </View> */}
        </View>

        <TouchableOpacity
          style={[
            styles.iconButton,
            {
              backgroundColor:
                colors.card,
            },
          ]}
          onPress={() =>
            navigateSafely("Settings")
          }
          activeOpacity={0.8}
        >
          <Ionicons
            name="settings-sharp"
            size={18}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

    {/* { ==================================================
          VIP TICKET
      ================================================== }

      <View
        style={[
          styles.ticketCard,
          {
            backgroundColor:
              colors.card,
            borderColor:
              colors.border,
          },
        ]}
      >
        <View style={styles.ticketRow}>
          <View style={styles.ticketInfo}>
            <Text
              style={[
                styles.ticketTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              VIP Pass
            </Text>

            <Text
              style={[
                styles.ticketSub,
                {
                  color:
                    colors.textMuted,
                },
              ]}
            >
              All-access + Backstage
            </Text>

            <Text
              style={[
                styles.ticketHolder,
                {
                  color: colors.text,
                },
              ]}
            >
              Holder: {userName}
            </Text>
          </View>

          <View style={styles.qrWrap}>
            <View style={styles.qrBox}>
              <QRCode
                value={
                  currentUser?.uid
                    ? `CIF-USER-${currentUser.uid}`
                    : "CIF-VIP-12345"
                }
                size={74}
                backgroundColor="#ffffff"
                color="#000000"
              />
            </View>
          </View>
        </View>

        <View style={styles.ticketFooter}>
          <Text
            style={[
              styles.ticketFooterText,
              {
                color:
                  colors.textMuted,
              },
            ]}
          >
            UID:{" "}
            {currentUser?.uid
              ? `${currentUser.uid.slice(
                  0,
                  10
                )}...`
              : "CIF-VIP-12345"}
          </Text>

          <Text
            style={[
              styles.ticketFooterText,
              {
                color:
                  colors.textMuted,
              },
            ]}
          >
            Online
          </Text>
        </View>
      </View> */}

      {/* ==================================================
          MY EVENT TICKETS
      ================================================== */}

      <TouchableOpacity
        style={[
          styles.menuTile,
          {
            backgroundColor:
              colors.card,
            borderColor:
              colors.border,
          },
        ]}
        onPress={() =>
          navigateSafely("MyTickets")
        }
        activeOpacity={0.8}
      >
        <View style={styles.menuTileLeft}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor:
                  (colors.primary ||
                    "#8B5CF6") + "22",
              },
            ]}
          >
            <Feather
              name="ticket"
              size={20}
              color={
                colors.primary ||
                "#8B5CF6"
              }
            />
          </View>

          <View style={styles.menuTextContainer}>
            <Text
              style={[
                styles.menuTileTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              My Event Tickets
            </Text>

            <Text
              style={[
                styles.menuTileSub,
                {
                  color:
                    colors.textMuted,
                },
              ]}
            >
              View your event tickets
            </Text>
          </View>
        </View>

        <Feather
          name="chevron-right"
          size={20}
          color={colors.textMuted}
        />
      </TouchableOpacity>

      {/* ==================================================
          SAVED PORTFOLIOS
      ================================================== */}

      <TouchableOpacity
        style={[
          styles.menuTile,
          {
            backgroundColor:
              colors.card,
            borderColor:
              colors.border,
          },
        ]}
        onPress={() =>
          navigateSafely(
            "SavedPortfolios"
          )
        }
        activeOpacity={0.8}
      >
        <View style={styles.menuTileLeft}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor:
                  (colors.primary ||
                    "#8B5CF6") + "22",
              },
            ]}
          >
            <Feather
              name="briefcase"
              size={20}
              color={
                colors.primary ||
                "#8B5CF6"
              }
            />
          </View>

          <View style={styles.menuTextContainer}>
            <Text
              style={[
                styles.menuTileTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Saved Portfolios
            </Text>

            <Text
              style={[
                styles.menuTileSub,
                {
                  color:
                    colors.textMuted,
                },
              ]}
            >
              View your saved portfolios
            </Text>
          </View>
        </View>

        <Feather
          name="chevron-right"
          size={20}
          color={colors.textMuted}
        />
      </TouchableOpacity>

      {/* ==================================================
          SAVED JOBS
      ================================================== */}

      <TouchableOpacity
        style={[
          styles.menuTile,
          {
            backgroundColor:
              colors.card,
            borderColor:
              colors.border,
          },
        ]}
        onPress={() =>
          navigateSafely("SavedJobs")
        }
        activeOpacity={0.8}
      >
        <View style={styles.menuTileLeft}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor:
                  (colors.primary ||
                    "#8B5CF6") + "22",
              },
            ]}
          >
            <Feather
              name="bookmark"
              size={20}
              color={
                colors.primary ||
                "#8B5CF6"
              }
            />
          </View>

          <View style={styles.menuTextContainer}>
            <Text
              style={[
                styles.menuTileTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Saved Jobs
            </Text>

            <Text
              style={[
                styles.menuTileSub,
                {
                  color:
                    colors.textMuted,
                },
              ]}
            >
              View your saved jobs
            </Text>
          </View>
        </View>

        <Feather
          name="chevron-right"
          size={20}
          color={colors.textMuted}
        />
      </TouchableOpacity>
    </SafeScreen>
  );
}

// ==================================================
// STYLES
// ==================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  // ==================================================
  // BACK HEADER
  // ==================================================

  backRow: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    minHeight: 32,
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  backIconBtn: {
    zIndex: 2,
  },

  backTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800",
  },

  // ==================================================
  // PROFILE HEADER
  // ==================================================

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },

  avatarWrap: {
    marginRight: 12,
  },

  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },

  avatarInitials: {
    fontSize: 20,
    fontWeight: "800",
  },

  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    resizeMode: "cover",
  },

  cameraBadge: {
    position: "absolute",
    right: -6,
    bottom: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  headerInfo: {
    flex: 1,
  },

  nameText: {
    fontSize: 18,
    fontWeight: "800",
  },

  badge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  iconButton: {
    padding: 8,
    borderRadius: 8,
  },

  // ==================================================
  // VIP TICKET
  // ==================================================

  ticketCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },

  ticketRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  ticketInfo: {
    flex: 1,
  },

  ticketTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  ticketSub: {
    marginTop: 4,
  },

  ticketHolder: {
    marginTop: 8,
    fontWeight: "700",
  },

  qrWrap: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
  },

  qrBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#ffffff",
  },

  ticketFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  ticketFooterText: {
    fontSize: 12,
  },

  // ==================================================
  // MENU TILES
  // ==================================================

  menuTile: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },

  menuTileLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  menuTextContainer: {
    marginLeft: 12,
    flex: 1,
  },

  menuTileTitle: {
    fontSize: 15,
    fontWeight: "700",
  },

  menuTileSub: {
    fontSize: 12,
    marginTop: 3,
  },
});