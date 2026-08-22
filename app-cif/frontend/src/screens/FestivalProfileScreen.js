FestivalProfileScreen

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  ActivityIndicator,
} from "react-native";

import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

import SafeScreen from "../components/SafeScreen";
import QRCode from "react-native-qrcode-svg";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import * as ImagePicker from "expo-image-picker";

import { auth, db } from "../config/firebase";

// ==================================================
// FESTIVAL PROFILE SCREEN
// ==================================================

export default function FestivalProfileScreen({ navigation }) {
  const { colors } = useTheme();

  // ==================================================
  // USER
  // ==================================================

  const user = auth.currentUser;

  const userName =
    user?.displayName?.trim() || "User";

  // Generate initials from user's name
  const userInitials =
    userName
      .split(/\s+/)
      .filter(Boolean)
      .map((name) => name.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  // ==================================================
  // PROFILE PHOTO
  // ==================================================

  const [photoUri, setPhotoUri] = useState(
    user?.photoURL || null
  );

  // ==================================================
  // SCHEDULE
  // ==================================================

  const [schedule, setSchedule] = useState([]);
  const [scheduleLoading, setScheduleLoading] =
    useState(true);

  // ==================================================
  // SAVED PORTFOLIOS
  // ==================================================

  const [savedPortfolios, setSavedPortfolios] =
    useState([]);

  // ==================================================
  // LOAD USER SCHEDULE
  // ==================================================

  useEffect(() => {
    loadUserSchedule();
  }, []);

  const loadUserSchedule = async () => {
    try {
      setScheduleLoading(true);

      const currentUser = auth.currentUser;

      if (!currentUser) {
        console.log("No authenticated user");
        setSchedule([]);
        return;
      }

      const uid = currentUser.uid;

      console.log(
        "Loading schedule for user:",
        uid
      );

      const scheduleRef = collection(
        db,
        "users",
        uid,
        "schedule"
      );

      const scheduleSnapshot =
        await getDocs(scheduleRef);

      console.log(
        "Schedule documents found:",
        scheduleSnapshot.size
      );

      const scheduleWithEvents =
        await Promise.all(
          scheduleSnapshot.docs.map(
            async (scheduleDoc) => {
              const scheduleData =
                scheduleDoc.data();

              console.log(
                "Schedule document:",
                scheduleDoc.id,
                scheduleData
              );

              const eventId =
                scheduleData.eventId ||
                scheduleData.eventID ||
                scheduleData.event;

              if (!eventId) {
                console.warn(
                  "No eventId found in schedule document:",
                  scheduleDoc.id
                );

                return {
                  id: scheduleDoc.id,
                  ...scheduleData,
                  event: null,
                };
              }

              console.log(
                "Loading event:",
                eventId
              );

              const eventRef = doc(
                db,
                "events",
                eventId
              );

              const eventSnapshot =
                await getDoc(eventRef);

              if (!eventSnapshot.exists()) {
                console.warn(
                  "Event does not exist:",
                  eventId
                );

                return {
                  id: scheduleDoc.id,
                  ...scheduleData,
                  event: null,
                };
              }

              const eventData =
                eventSnapshot.data();

              console.log(
                "Matching event loaded:",
                eventId,
                eventData
              );

              return {
                id: scheduleDoc.id,
                ...scheduleData,
                event: {
                  id: eventSnapshot.id,
                  ...eventData,
                },
              };
            }
          )
        );

      setSchedule(scheduleWithEvents);

      console.log(
        "Final schedule:",
        scheduleWithEvents
      );
    } catch (error) {
      console.error(
        "Error loading user schedule:",
        error
      );

      Alert.alert(
        "Schedule Error",
        "Unable to load your schedule."
      );

      setSchedule([]);
    } finally {
      setScheduleLoading(false);
    }
  };

  // ==================================================
  // REQUEST PHOTO PERMISSION
  // ==================================================

  useEffect(() => {
    const requestPermission = async () => {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== "granted") {
          Alert.alert(
            "Permission required",
            "Permission to access photos is required to upload a profile photo."
          );
        }
      }
    };

    requestPermission();
  }, []);

  // ==================================================
  // PICK PROFILE IMAGE
  // ==================================================

  const pickImage = async () => {
    try {
      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes:
            ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

      if (result.canceled) {
        return;
      }

      const uri =
        result.assets &&
        result.assets.length > 0
          ? result.assets[0].uri
          : result.uri;

      if (uri) {
        setPhotoUri(uri);
      }
    } catch (error) {
      console.warn(
        "Image pick error:",
        error
      );

      Alert.alert(
        "Image Error",
        "Unable to select the image."
      );
    }
  };

  // ==================================================
  // LOAD SAVED PORTFOLIOS
  // ==================================================

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setSavedPortfolios([]);
      return;
    }

    const portfolioRef = collection(
      db,
      "users",
      currentUser.uid,
      "portfolio",
    );

    const portfolioQuery = query(
      portfolioRef,
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      portfolioQuery,
      (snapshot) => {
        const portfolios =
          snapshot.docs.map(
            (portfolioDoc) => ({
              id: portfolioDoc.id,
              ...portfolioDoc.data(),
            })
          );

        console.log(
          "Saved portfolios loaded:",
          portfolios
        );

        setSavedPortfolios(portfolios);
      },
      (error) => {
        console.error(
          "Error loading saved portfolios:",
          error
        );

        setSavedPortfolios([]);
      }
    );

    return unsubscribe;
  }, []);

  // ==================================================
  // RETURN SCREEN
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
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}

      <View style={styles.headerRow}>
        {/* PROFILE AVATAR */}

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
                      colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.avatarInitials,
                    {
                      color:
                        colors.primary,
                    },
                  ]}
                >
                  {userInitials}
                </Text>
              </View>
            )}

            {/* CAMERA BUTTON */}

            <View
              style={[
                styles.cameraBadge,
                {
                  backgroundColor:
                    colors.primary,
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

        {/* USER INFORMATION */}

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

          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  colors.primary + "22",
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color:
                    colors.primary,
                },
              ]}
            >
              Pass Type: VIP
            </Text>
          </View>
        </View>

        {/* SETTINGS */}

        <TouchableOpacity
          style={[
            styles.iconButton,
            {
              backgroundColor:
                colors.card,
            },
          ]}
          onPress={() => {
            const parent =
              navigation.getParent &&
              navigation.getParent();

            if (
              parent &&
              parent.navigate
            ) {
              parent.navigate(
                "Settings"
              );
            } else {
              navigation.navigate(
                "Settings"
              );
            }
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name="settings-sharp"
            size={18}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* ============================================ */}
      {/* TICKET CARD */}
      {/* ============================================ */}

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
              Holder: You
            </Text>
          </View>

          <View style={styles.qrWrap}>
            <View
              style={[
                styles.qrBox,
                {
                  backgroundColor:
                    colors.white,
                },
              ]}
            >
              <QRCode
                value="CIF-VIP-12345"
                size={74}
                backgroundColor={
                  colors.white
                }
                color={colors.black}
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
            Ticket ID: CIF-VIP-12345
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
      </View>

      {/* ============================================ */}
      {/* MY SCHEDULE */}
      {/* ============================================ */}

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
              },
            ]}
          >
            My Schedule
          </Text>

          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                "Schedule",
                "Open full schedule"
              )
            }
          >
            <Text
              style={[
                styles.seeAll,
                {
                  color:
                    colors.primary,
                },
              ]}
            >
              See All
            </Text>
          </TouchableOpacity>
        </View>

        {/* LOADING */}

        {scheduleLoading ? (
          <View
            style={
              styles.loadingContainer
            }
          >
            <ActivityIndicator
              size="small"
              color={
                colors.primary
              }
            />

            <Text
              style={[
                styles.loadingText,
                {
                  color:
                    colors.textMuted,
                },
              ]}
            >
              Loading your schedule...
            </Text>
          </View>
        ) : schedule.length ===
          0 ? (
          /* EMPTY SCHEDULE */

          <View
            style={
              styles.emptySchedule
            }
          >
            <Ionicons
              name="calendar-outline"
              size={32}
              color={
                colors.textMuted
              }
            />

            <Text
              style={[
                styles.emptyScheduleTitle,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              No saved events
            </Text>

            <Text
              style={[
                styles.emptyScheduleText,
                {
                  color:
                    colors.textMuted,
                },
              ]}
            >
              Events you save will
              appear here.
            </Text>
          </View>
        ) : (
          /* SCHEDULE */

          <FlatList
            horizontal
            data={schedule}
            keyExtractor={(item) =>
              item.id
            }
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={{
              paddingLeft: 16,
              paddingRight: 8,
            }}
            renderItem={({
              item,
            }) => (
              <EventCard
                item={item}
                colors={colors}
              />
            )}
          />
        )}
      </View>

      {/* ============================================ */}
      {/* SAVED PORTFOLIOS */}
      {/* ============================================ */}

      <View style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.text,
              marginHorizontal: 16,
            },
          ]}
        >
          Saved Portfolios
        </Text>

        <View
          style={{
            marginTop: 12,
          }}
        >
          {savedPortfolios.length ===
          0 ? (
            <View
              style={
                styles.emptyPortfolio
              }
            >
              <Ionicons
                name="briefcase-outline"
                size={32}
                color={
                  colors.textMuted
                }
              />

              <Text
                style={[
                  styles.emptyPortfolioTitle,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                No saved portfolios
              </Text>

              <Text
                style={[
                  styles.emptyPortfolioText,
                  {
                    color:
                      colors.textMuted,
                  },
                ]}
              >
                Portfolios you save
                will appear here.
              </Text>
            </View>
          ) : (
            savedPortfolios.map(
              (portfolio) => (
                <SavedPortfolioCard
                  key={portfolio.id}
                  item={portfolio}
                  colors={colors}
                />
              )
            )
          )}
        </View>
      </View>
    </SafeScreen>
  );
}

// ==================================================
// EVENT CARD
// ==================================================

function EventCard({ item, colors }) {
  const event = item.event;

  if (!event) {
    return (
      <View
        style={[
          styles.eventCard,
          {
            backgroundColor:
              colors.card,
            borderColor:
              colors.border,
          },
        ]}
      >
        <View
          style={
            styles.eventCardContent
          }
        >
          <Text
            style={[
              styles.eventTitle,
              {
                color:
                  colors.textMuted,
              },
            ]}
          >
            Event unavailable
          </Text>

          <Text
            style={[
              styles.eventMeta,
              {
                color:
                  colors.textMuted,
              },
            ]}
          >
            This event no longer
            exists.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[
        styles.eventCard,
        {
          backgroundColor:
            colors.card,
          borderColor:
            colors.border,
        },
      ]}
    >
      {event.image ? (
        <Image
          source={{
            uri: event.image,
          }}
          style={styles.eventImage}
        />
      ) : null}

      <View
        style={styles.eventCardContent}
      >
        <Text
          style={[
            styles.eventTime,
            {
              color:
                colors.primary,
            },
          ]}
        >
          {event.time ||
            event.startTime ||
            "Time TBC"}
        </Text>

        <Text
          style={[
            styles.eventTitle,
            {
              color: colors.text,
            },
          ]}
          numberOfLines={2}
        >
          {event.title ||
            "Untitled event"}
        </Text>

        <View
          style={
            styles.eventLocationRow
          }
        >
          <Feather
            name="map-pin"
            size={12}
            color={
              colors.textMuted
            }
          />

          <Text
            style={[
              styles.eventMeta,
              {
                color:
                  colors.textMuted,
              },
            ]}
            numberOfLines={1}
          >
            {event.location ||
              "Location TBC"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ==================================================
// SAVED PORTFOLIO CARD
// ==================================================

function SavedPortfolioCard({
  item,
  colors,
}) {
  const initials =
    (item.name || "?")
      .split(" ")
      .filter(Boolean)
      .map(
        (name) => name[0]
      )
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <View
      style={[
        styles.portfolioCard,
        {
          backgroundColor:
            colors.card,
          borderColor:
            colors.border,
        },
      ]}
    >
      {/* LEFT SIDE */}

      <View
        style={styles.portfolioLeft}
      >
        {/* AVATAR */}

        <View
          style={[
            styles.portfolioAvatar,
            {
              backgroundColor:
                colors.primary +
                "22",
            },
          ]}
        >
          <Text
            style={{
              color:
                colors.primary,
              fontWeight: "700",
            }}
          >
            {initials}
          </Text>
        </View>

        {/* PORTFOLIO INFORMATION */}

        <View
          style={styles.portfolioInfo}
        >
          <Text
            style={{
              color: colors.text,
              fontWeight: "700",
              fontSize: 15,
            }}
          >
            {item.name ||
              "Unknown"}
          </Text>

          <Text
            style={{
              color:
                colors.textMuted,
              marginTop: 3,
            }}
          >
            {item.role ||
              "Role not specified"}
          </Text>

          {item.category ? (
            <Text
              style={{
                color:
                  colors.primary,
                fontSize: 12,
                fontWeight:
                  "600",
                marginTop: 3,
              }}
            >
              {item.category}
            </Text>
          ) : null}

          {/* SKILLS */}

          {Array.isArray(
            item.skills
          ) &&
          item.skills.length >
            0 ? (
            <View
              style={
                styles.savedSkillsWrap
              }
            >
              {item.skills.map(
                (skill) => (
                  <View
                    key={skill}
                    style={[
                      styles.savedSkillChip,
                      {
                        backgroundColor:
                          colors.input,
                        borderColor:
                          colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color:
                          colors.primary,
                        fontSize: 11,
                        fontWeight:
                          "600",
                      }}
                    >
                      {skill}
                    </Text>
                  </View>
                )
              )}
            </View>
          ) : null}

          {/* BIO */}

          {item.bio ? (
            <Text
              numberOfLines={2}
              style={{
                color:
                  colors.textMuted,
                fontSize: 12,
                marginTop: 6,
                lineHeight: 17,
              }}
            >
              {item.bio}
            </Text>
          ) : null}
        </View>
      </View>

      <Feather
        name="chevron-right"
        size={18}
        color={
          colors.textMuted
        }
      />
    </View>
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
  // HEADER
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
  // TICKET
  // ==================================================

  ticketCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 18,
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
  },

  ticketFooter: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    marginTop: 12,
  },

  ticketFooterText: {
    fontSize: 12,
  },

  // ==================================================
  // SECTIONS
  // ==================================================

  section: {
    marginTop: 8,
    paddingVertical: 8,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
  },

  seeAll: {
    fontSize: 13,
    fontWeight: "700",
  },

  // ==================================================
  // SCHEDULE
  // ==================================================

  loadingContainer: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 8,
    fontSize: 13,
  },

  emptySchedule: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  emptyScheduleTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 8,
  },

  emptyScheduleText: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },

  eventCard: {
    width: 210,
    marginRight: 12,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },

  eventImage: {
    width: "100%",
    height: 95,
    resizeMode: "cover",
  },

  eventCardContent: {
    padding: 12,
  },

  eventTime: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 5,
  },

  eventTitle: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
  },

  eventLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 5,
  },

  eventMeta: {
    fontSize: 12,
    flex: 1,
  },

  // ==================================================
  // PORTFOLIOS
  // ==================================================

  portfolioCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    padding: 12,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
  },

  portfolioLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  portfolioAvatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  portfolioInfo: {
    marginLeft: 12,
    flex: 1,
  },

  savedSkillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 7,
  },

  savedSkillChip: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },

  emptyPortfolio: {
    minHeight: 130,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  emptyPortfolioTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 8,
  },

  emptyPortfolioText: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },
});