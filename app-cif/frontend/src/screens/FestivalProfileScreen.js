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
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import SafeScreen from "../components/SafeScreen";
import QRCode from "react-native-qrcode-svg";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import * as ImagePicker from "expo-image-picker";

import { auth, db } from "../config/firebase";

export default function FestivalProfileScreen({ navigation }) {
  const { colors } = useTheme();

  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  // Monitor Auth state changes
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((u) => {
      setCurrentUser(u);
    });
    return () => unsubAuth();
  }, []);

  const userName = currentUser?.displayName?.trim() || "User";

  const userInitials =
    userName
      .split(/\s+/)
      .filter(Boolean)
      .map((name) => name.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  const [photoUri, setPhotoUri] = useState(currentUser?.photoURL || null);
  const [schedule, setSchedule] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [savedPortfolios, setSavedPortfolios] = useState([]);
  const [myBookings, setMyBookings] = useState([]);

  // ==================================================
  // LOAD USER BOOKINGS
  // ==================================================
  useEffect(() => {
    if (!currentUser?.uid) {
      setMyBookings([]);
      return;
    }

    const q = query(
      collection(db, "bookings"),
      where("userId", "==", currentUser.uid)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const bookingsList = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setMyBookings(bookingsList);
      },
      (error) => {
        console.warn("Bookings listener error:", error.message);
      }
    );

    return () => unsub();
  }, [currentUser?.uid]);

  // ==================================================
  // LOAD USER SCHEDULE
  // ==================================================
  useEffect(() => {
    if (!currentUser?.uid) {
      setSchedule([]);
      setScheduleLoading(false);
      return;
    }

    let isMounted = true;
    setScheduleLoading(true);

    const scheduleRef = collection(db, "users", currentUser.uid, "schedule");

    const unsubSchedule = onSnapshot(
      scheduleRef,
      async (scheduleSnapshot) => {
        try {
          const scheduleWithEvents = await Promise.all(
            scheduleSnapshot.docs.map(async (scheduleDoc) => {
              const scheduleData = scheduleDoc.data();
              const eventId =
                scheduleData.eventId ||
                scheduleData.eventID ||
                scheduleData.event;

              if (!eventId) {
                return {
                  id: scheduleDoc.id,
                  ...scheduleData,
                  event: null,
                };
              }

              try {
                const eventRef = doc(db, "events", eventId);
                const eventSnapshot = await getDoc(eventRef);

                if (!eventSnapshot.exists()) {
                  return {
                    id: scheduleDoc.id,
                    ...scheduleData,
                    event: null,
                  };
                }

                return {
                  id: scheduleDoc.id,
                  ...scheduleData,
                  event: {
                    id: eventSnapshot.id,
                    ...eventSnapshot.data(),
                  },
                };
              } catch (e) {
                return {
                  id: scheduleDoc.id,
                  ...scheduleData,
                  event: null,
                };
              }
            })
          );

          if (isMounted) {
            setSchedule(scheduleWithEvents);
            setScheduleLoading(false);
          }
        } catch (error) {
          console.warn("Error processing schedule:", error.message);
          if (isMounted) setScheduleLoading(false);
        }
      },
      (error) => {
        console.warn("Schedule listener error:", error.message);
        if (isMounted) setScheduleLoading(false);
      }
    );

    return () => {
      isMounted = false;
      unsubSchedule();
    };
  }, [currentUser?.uid]);

  // ==================================================
  // LOAD SAVED PORTFOLIOS
  // ==================================================
  useEffect(() => {
    if (!currentUser?.uid) {
      setSavedPortfolios([]);
      return;
    }

    const portfolioRef = collection(db, "users", currentUser.uid, "portfolio");

    const unsubscribe = onSnapshot(
      portfolioRef,
      (snapshot) => {
        const portfolios = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        portfolios.sort((a, b) => {
          const timeA = a.createdAt?.toMillis
            ? a.createdAt.toMillis()
            : a.createdAt || 0;
          const timeB = b.createdAt?.toMillis
            ? b.createdAt.toMillis()
            : b.createdAt || 0;
          return timeB - timeA;
        });

        setSavedPortfolios(portfolios);
      },
      (error) => {
        console.warn("Notice loading saved portfolios:", error.message);
        setSavedPortfolios([]);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // ==================================================
  // PHOTO PERMISSIONS & PICKER
  // ==================================================
  useEffect(() => {
    const requestPermission = async () => {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission required",
            "Permission to access photos is required to update a profile photo."
          );
        }
      }
    };
    requestPermission();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.warn("Image pick error:", error);
    }
  };

  return (
    <SafeScreen
      scroll
      style={[styles.safeArea, { backgroundColor: colors.bg }]}
      contentContainerStyle={{ paddingBottom: 40, paddingTop: 12 }}
    >
      {/* HEADER */}
      <View style={styles.headerRow}>
        <View style={styles.avatarWrap}>
          <TouchableOpacity activeOpacity={0.8} onPress={pickImage}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImage} />
            ) : (
              <View
                style={[
                  styles.avatarCircle,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Text style={[styles.avatarInitials, { color: colors.primary }]}>
                  {userInitials}
                </Text>
              </View>
            )}
            <View
              style={[
                styles.cameraBadge,
                { backgroundColor: colors.primary },
              ]}
            >
              <Feather name="camera" size={12} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.headerInfo}>
          <Text style={[styles.nameText, { color: colors.text }]}>
            {userName}
          </Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: colors.primary + "22" },
            ]}
          >
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              Pass Type: VIP
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.card }]}
          onPress={() => {
            const parent = navigation.getParent && navigation.getParent();
            if (parent && parent.navigate) {
              parent.navigate("Settings");
            } else {
              navigation.navigate("Settings");
            }
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="settings-sharp" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* VIP TICKET CARD */}
      <View
        style={[
          styles.ticketCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.ticketRow}>
          <View style={styles.ticketInfo}>
            <Text style={[styles.ticketTitle, { color: colors.text }]}>
              VIP Pass
            </Text>
            <Text style={[styles.ticketSub, { color: colors.textMuted }]}>
              All-access + Backstage
            </Text>
            <Text style={[styles.ticketHolder, { color: colors.text }]}>
              Holder: {userName}
            </Text>
          </View>

          <View style={styles.qrWrap}>
            <View style={[styles.qrBox, { backgroundColor: colors.white }]}>
              <QRCode
                value={currentUser?.uid ? `CIF-USER-${currentUser.uid}` : "CIF-VIP-12345"}
                size={74}
                backgroundColor={colors.white}
                color={colors.black}
              />
            </View>
          </View>
        </View>

        <View style={styles.ticketFooter}>
          <Text style={[styles.ticketFooterText, { color: colors.textMuted }]}>
            UID: {currentUser?.uid ? `${currentUser.uid.slice(0, 10)}...` : "CIF-VIP-12345"}
          </Text>
          <Text style={[styles.ticketFooterText, { color: colors.textMuted }]}>
            Online
          </Text>
        </View>
      </View>

      {/* MY EVENT TICKETS BUTTON */}
      <TouchableOpacity
        style={[
          styles.menuTile,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={() => navigation.navigate("MyTickets")}
        activeOpacity={0.8}
      >
        <View style={styles.menuTileLeft}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: (colors.primary || "#8B5CF6") + "22" },
            ]}
          >
            <Feather name="ticket" size={20} color={colors.primary || "#8B5CF6"} />
          </View>
          <View>
            <Text style={[styles.menuTileTitle, { color: colors.text }]}>
              My Event Tickets
            </Text>
            <Text style={[styles.menuTileSub, { color: colors.textMuted }]}>
              {myBookings.length} confirmed booking{myBookings.length === 1 ? "" : "s"}
            </Text>
          </View>
        </View>
        <Feather name="chevron-right" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      {/* MY SCHEDULE */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            My Schedule
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Events")}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        {scheduleLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Loading your schedule...
            </Text>
          </View>
        ) : schedule.length === 0 ? (
          <View style={styles.emptySchedule}>
            <Ionicons name="calendar-outline" size={32} color={colors.textMuted} />
            <Text style={[styles.emptyScheduleTitle, { color: colors.text }]}>
              No saved events
            </Text>
            <Text style={[styles.emptyScheduleText, { color: colors.textMuted }]}>
              Events you save will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            horizontal
            data={schedule}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
            renderItem={({ item }) => <EventCard item={item} colors={colors} />}
          />
        )}
      </View>

      {/* SAVED PORTFOLIOS */}
      <View style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, marginHorizontal: 16 },
          ]}
        >
          Saved Portfolios
        </Text>

        <View style={{ marginTop: 12 }}>
          {savedPortfolios.length === 0 ? (
            <View style={styles.emptyPortfolio}>
              <Ionicons
                name="briefcase-outline"
                size={32}
                color={colors.textMuted}
              />
              <Text style={[styles.emptyPortfolioTitle, { color: colors.text }]}>
                No saved portfolios
              </Text>
              <Text style={[styles.emptyPortfolioText, { color: colors.textMuted }]}>
                Portfolios you save will appear here.
              </Text>
            </View>
          ) : (
            savedPortfolios.map((portfolio) => (
              <SavedPortfolioCard
                key={portfolio.id}
                item={portfolio}
                colors={colors}
              />
            ))
          )}
        </View>
      </View>
    </SafeScreen>
  );
}

function EventCard({ item, colors }) {
  const event = item.event;

  if (!event) {
    return (
      <View
        style={[
          styles.eventCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.eventCardContent}>
          <Text style={[styles.eventTitle, { color: colors.textMuted }]}>
            Event unavailable
          </Text>
          <Text style={[styles.eventMeta, { color: colors.textMuted }]}>
            This event is not found.
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
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {event.image || event.image_url ? (
        <Image
          source={{ uri: event.image || event.image_url }}
          style={styles.eventImage}
        />
      ) : null}

      <View style={styles.eventCardContent}>
        <Text style={[styles.eventTime, { color: colors.primary }]}>
          {event.time || event.startTime || "Time TBC"}
        </Text>
        <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>
          {event.title || "Untitled event"}
        </Text>
        <View style={styles.eventLocationRow}>
          <Feather name="map-pin" size={12} color={colors.textMuted} />
          <Text style={[styles.eventMeta, { color: colors.textMuted }]} numberOfLines={1}>
            {event.location || event.venue || "Location TBC"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function SavedPortfolioCard({ item, colors }) {
  const initials =
    (item.name || "?")
      .split(" ")
      .filter(Boolean)
      .map((name) => name[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <View
      style={[
        styles.portfolioCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.portfolioLeft}>
        <View
          style={[
            styles.portfolioAvatar,
            { backgroundColor: colors.primary + "22" },
          ]}
        >
          <Text style={{ color: colors.primary, fontWeight: "700" }}>
            {initials}
          </Text>
        </View>

        <View style={styles.portfolioInfo}>
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>
            {item.name || "Unknown"}
          </Text>
          <Text style={{ color: colors.textMuted, marginTop: 3 }}>
            {item.role || "Role not specified"}
          </Text>
          {item.category ? (
            <Text
              style={{
                color: colors.primary,
                fontSize: 12,
                fontWeight: "600",
                marginTop: 3,
              }}
            >
              {item.category}
            </Text>
          ) : null}
        </View>
      </View>

      <Feather name="chevron-right" size={18} color={colors.textMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  avatarWrap: { marginRight: 12 },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  avatarInitials: { fontSize: 20, fontWeight: "800" },
  avatarImage: { width: 64, height: 64, borderRadius: 32, resizeMode: "cover" },
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
  headerInfo: { flex: 1 },
  nameText: { fontSize: 18, fontWeight: "800" },
  badge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 12, fontWeight: "700" },
  iconButton: { padding: 8, borderRadius: 8 },
  ticketCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  ticketRow: { flexDirection: "row", alignItems: "center" },
  ticketInfo: { flex: 1 },
  ticketTitle: { fontSize: 18, fontWeight: "800" },
  ticketSub: { marginTop: 4 },
  ticketHolder: { marginTop: 8, fontWeight: "700" },
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
    justifyContent: "space-between",
    marginTop: 12,
  },
  ticketFooterText: { fontSize: 12 },
  menuTile: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  menuTileLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTileTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  menuTileSub: {
    fontSize: 12,
    marginTop: 2,
  },
  section: { marginTop: 4, paddingVertical: 8 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800" },
  seeAll: { fontSize: 13, fontWeight: "700" },
  loadingContainer: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { marginTop: 8, fontSize: 13 },
  emptySchedule: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  emptyScheduleTitle: { fontSize: 15, fontWeight: "700", marginTop: 8 },
  emptyScheduleText: { fontSize: 13, textAlign: "center", marginTop: 4 },
  eventCard: {
    width: 210,
    marginRight: 12,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  eventImage: { width: "100%", height: 95, resizeMode: "cover" },
  eventCardContent: { padding: 12 },
  eventTime: { fontSize: 11, fontWeight: "700", marginBottom: 5 },
  eventTitle: { fontSize: 14, fontWeight: "800", lineHeight: 19 },
  eventLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 5,
  },
  eventMeta: { fontSize: 12, flex: 1 },
  portfolioCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  portfolioLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  portfolioAvatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  portfolioInfo: { marginLeft: 12, flex: 1 },
  emptyPortfolio: {
    minHeight: 130,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  emptyPortfolioTitle: { fontSize: 15, fontWeight: "700", marginTop: 8 },
  emptyPortfolioText: { fontSize: 13, textAlign: "center", marginTop: 4 },
});