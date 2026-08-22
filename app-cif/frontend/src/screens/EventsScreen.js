// src/screens/EventsScreen.js
import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Share,
} from "react-native";
import SafeScreen from "../components/SafeScreen";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import EventDetailsModal from "../components/EventDetailsModal";
import { auth, db } from "../config/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  doc,
  runTransaction,
  serverTimestamp,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

const DAY_FORMAT = {
  weekday: "short",
  day: "numeric",
  month: "short",
};

const TIME_FORMAT = {
  hour: "2-digit",
  minute: "2-digit",
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&q=80";

export default function EventsScreen({ navigation }) {
  const { colors } = useTheme();

  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [myBookingIds, setMyBookingIds] = useState(new Set());
  const [myBookmarks, setMyBookmarks] = useState(new Set());
  const [bookingInProgress, setBookingInProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query_, setQuery] = useState("");
  const [activeDay, setActiveDay] = useState("All");

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubAuth();
  }, []);

  const navigateToMyTickets = () => {
    setSelectedEvent(null);
    const rootNav = navigation.getParent();
    if (rootNav?.navigate) {
      rootNav.navigate("MyTickets");
    } else {
      navigation.navigate("MyTickets");
    }
  };

  // 1. Live Events Listener
  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("start_date", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((d) => ({
            id: d.id,
            ...d.data(),
          }))
          .filter((e) => e.published !== false && e.start_date);

        setEvents(data);

        const uniqueCategories = [
          "All",
          ...new Set(data.map((e) => e.category).filter(Boolean)),
        ];
        setCategories(uniqueCategories);
        setLoading(false);
      },
      (err) => {
        console.warn("Live events error:", err.message);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // 2. Live Bookings Listener
  useEffect(() => {
    if (!currentUser?.uid) {
      setMyBookingIds(new Set());
      return;
    }

    const q = query(
      collection(db, "bookings"),
      where("userId", "==", currentUser.uid),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setMyBookingIds(new Set(snapshot.docs.map((d) => d.data().eventId)));
      },
      (err) => console.warn("Bookings listener notice:", err.message),
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // 3. Live Bookmarks Listener
  useEffect(() => {
    if (!currentUser?.uid) {
      setMyBookmarks(new Set());
      return;
    }

    const unsub = onSnapshot(
      collection(db, "users", currentUser.uid, "bookmarks"),
      (snap) => {
        setMyBookmarks(new Set(snap.docs.map((d) => d.id)));
      },
      (err) => console.warn("Bookmarks notice:", err.message),
    );

    return () => unsub();
  }, [currentUser?.uid]);

  const days = useMemo(() => {
    const order = ["All"];
    events.forEach((event) => {
      const date = event.start_date?.toDate ? event.start_date.toDate() : null;
      if (date) {
        const key = date.toDateString();
        if (!order.includes(key)) {
          order.push(key);
        }
      }
    });
    return order;
  }, [events]);

  const toggleBookmark = async (eventId) => {
    // Block guest / anonymous users from saving bookmarks
    if (!currentUser || currentUser.isAnonymous) {
      Alert.alert(
        "Sign in required",
        "Please log in or create an account to save events.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Log in", onPress: () => navigation?.navigate?.("Login") },
        ],
      );
      return;
    }

    const bookmarkRef = doc(db, "users", currentUser.uid, "bookmarks", eventId);
    try {
      if (myBookmarks.has(eventId)) {
        await deleteDoc(bookmarkRef);
      } else {
        await setDoc(bookmarkRef, { saved_at: serverTimestamp() });
      }
    } catch (err) {
      console.warn("Bookmark error:", err.message);
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const eventDateKey = event.start_date?.toDate?.()?.toDateString();
      const matchesDay = activeDay === "All" || eventDateKey === activeDay;

      const matchesCategory =
        selectedCategory === "All" || event.category === selectedCategory;

      const term = query_.toLowerCase().trim();
      const matchesSearch =
        !term ||
        event.title?.toLowerCase().includes(term) ||
        event.venue?.toLowerCase().includes(term) ||
        event.description?.toLowerCase().includes(term) ||
        event.category?.toLowerCase().includes(term);

      return matchesDay && matchesCategory && matchesSearch;
    });
  }, [events, activeDay, selectedCategory, query_]);

  const handleBook = async (event) => {
    // Block guest / anonymous users from registering
    if (!currentUser || currentUser.isAnonymous) {
      Alert.alert(
        "Account Required",
        "Guests cannot register for events. Please sign in or create an account to reserve your spot.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Log in", onPress: () => navigation?.navigate?.("Login") },
        ],
      );
      return;
    }

    const bookingId = `${event.id}_${currentUser.uid}`;
    const alreadyBooked = myBookingIds.has(event.id);
    setBookingInProgress(event.id);

    const eventDateStr = event.start_date?.toDate
      ? event.start_date.toDate().toLocaleDateString("en-GB", DAY_FORMAT)
      : "—";

    const eventTimeStr = event.start_date?.toDate
      ? event.start_date.toDate().toLocaleTimeString("en-GB", TIME_FORMAT)
      : "—";

    try {
      if (alreadyBooked) {
        await runTransaction(db, async (transaction) => {
          const eventRef = doc(db, "events", event.id);
          const eventSnap = await transaction.get(eventRef);
          const currentCount = eventSnap.data()?.booked_count || 0;

          transaction.update(eventRef, {
            booked_count: Math.max(0, currentCount - 1),
          });
          transaction.delete(doc(db, "bookings", bookingId));
        });
      } else {
        await runTransaction(db, async (transaction) => {
          const eventRef = doc(db, "events", event.id);
          const eventSnap = await transaction.get(eventRef);
          const data = eventSnap.data();
          const currentCount = data?.booked_count || 0;

          if (data?.capacity != null && currentCount >= data.capacity) {
            throw new Error("FULL");
          }

          transaction.set(doc(db, "bookings", bookingId), {
            eventId: event.id,
            userId: currentUser.uid,
            userEmail: currentUser.email || null,
            userName: currentUser.displayName || "Attendee",
            eventTitle: event.title || "Untitled Event",
            eventDate: eventDateStr,
            eventTime: eventTimeStr,
            quantity: 1,
            status: "Valid",
            created_at: serverTimestamp(),
          });

          transaction.update(eventRef, {
            booked_count: currentCount + 1,
          });
        });

        Alert.alert(
          "Booking Confirmed! 🎉",
          `Ticket Ref: ${bookingId.slice(0, 8).toUpperCase()}\n\nYour digital pass has been generated.`,
          [
            { text: "OK" },
            {
              text: "View My Tickets",
              onPress: navigateToMyTickets,
            },
          ],
        );
      }
    } catch (err) {
      if (err.message === "FULL") {
        Alert.alert("Fully booked", "Sorry, this event has no spots left.");
      } else {
        Alert.alert("Booking Notice", err.message);
      }
    } finally {
      setBookingInProgress(null);
    }
  };

  return (
    <>
      <SafeScreen
        scroll
        style={[styles.screen, { backgroundColor: colors.bg }]}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greetingText, { color: colors.textMuted }]}>
              Creative Industries Festival
            </Text>
            <Text style={[styles.pageTitle, { color: colors.text }]}>
              Explore Events
            </Text>
          </View>

          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.card }]}
              onPress={() => {
                const parent = navigation.getParent && navigation.getParent();
                if (parent?.navigate) parent.navigate("Notifications");
                else navigation.navigate("Notifications");
              }}
            >
              <Feather name="bell" size={18} color={colors.text} />
            </TouchableOpacity>
            <ThemeToggle />
          </View>
        </View>

        {/* Search Bar */}
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by title, venue, or speaker..."
            placeholderTextColor={colors.textMuted}
            value={query_}
            onChangeText={setQuery}
          />
          {query_.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Feather name="x" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Date Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {days.map((key) => {
            const active = key === activeDay;
            const label =
              key === "All"
                ? "All Days"
                : new Date(key).toLocaleDateString("en-GB", DAY_FORMAT);

            return (
              <TouchableOpacity
                key={key}
                onPress={() => setActiveDay(key)}
                style={[
                  styles.dayPill,
                  {
                    backgroundColor: active
                      ? colors.primary || "#8B5CF6"
                      : colors.card,
                    borderColor: active
                      ? colors.primary || "#8B5CF6"
                      : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    {
                      color: active ? "#FFFFFF" : colors.textMuted,
                      fontWeight: active ? "700" : "500",
                    },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.filterScroll, { marginTop: 8 }]}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isSelected
                      ? (colors.primary || "#8B5CF6") + "20"
                      : "transparent",
                    borderColor: isSelected
                      ? colors.primary || "#8B5CF6"
                      : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    {
                      color: isSelected
                        ? colors.primary || "#8B5CF6"
                        : colors.textMuted,
                      fontWeight: isSelected ? "700" : "500",
                    },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Event List */}
        <View style={styles.eventListWrapper}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator
                size="large"
                color={colors.primary || "#8B5CF6"}
              />
              <Text style={[styles.statusText, { color: colors.textMuted }]}>
                Loading festival schedule...
              </Text>
            </View>
          ) : filteredEvents.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons
                name="calendar-outline"
                size={48}
                color={colors.textMuted}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No events found
              </Text>
              <Text style={[styles.statusText, { color: colors.textMuted }]}>
                Try adjusting your search query or filters.
              </Text>
            </View>
          ) : (
            filteredEvents.map((event) => {
              const isBooked = myBookingIds.has(event.id);
              const isSaved = myBookmarks.has(event.id);
              const isFull =
                event.capacity != null &&
                (event.booked_count || 0) >= event.capacity &&
                !isBooked;

              const dateObj = event.start_date?.toDate
                ? event.start_date.toDate()
                : null;
              const monthStr = dateObj
                ? dateObj
                    .toLocaleDateString("en-GB", { month: "short" })
                    .toUpperCase()
                : "CIF";
              const dayStr = dateObj ? dateObj.getDate() : "--";
              const timeStr = dateObj
                ? dateObj.toLocaleTimeString("en-GB", TIME_FORMAT)
                : "Time TBC";

              const capacity = event.capacity || 100;
              const booked = event.booked_count || 0;
              const spotsRemaining = Math.max(0, capacity - booked);
              const progressRatio = Math.min(1, booked / capacity);

              return (
                <TouchableOpacity
                  key={event.id}
                  activeOpacity={0.9}
                  onPress={() => setSelectedEvent(event)}
                  style={[
                    styles.eventBriteCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {/* Hero Banner */}
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: event.image_url || FALLBACK_IMAGE }}
                      style={styles.cardImage}
                    />

                    {/* Date Badge */}
                    <View style={styles.floatingDateBadge}>
                      <Text style={styles.badgeMonthText}>{monthStr}</Text>
                      <Text style={styles.badgeDayText}>{dayStr}</Text>
                    </View>

                    {/* Bookmark Icon */}
                    <TouchableOpacity
                      style={styles.floatingBookmark}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleBookmark(event.id);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={isSaved ? "bookmark" : "bookmark-outline"}
                        size={18}
                        color={
                          isSaved ? colors.primary || "#8B5CF6" : "#0f172a"
                        }
                      />
                    </TouchableOpacity>

                    {/* Price Tag */}
                    <View style={styles.floatingPriceTag}>
                      <Text style={styles.priceTagText}>
                        {event.price ? `£${event.price}` : "FREE"}
                      </Text>
                    </View>
                  </View>

                  {/* Body Content */}
                  <View style={styles.cardContent}>
                    <View style={styles.topMetaRow}>
                      <Text
                        style={[
                          styles.categoryLabel,
                          { color: colors.primary || "#8B5CF6" },
                        ]}
                      >
                        {event.category || "FESTIVAL SESSION"}
                      </Text>
                      <Text
                        style={[styles.timeLabel, { color: colors.textMuted }]}
                      >
                        {timeStr}
                      </Text>
                    </View>

                    <Text
                      style={[styles.eventTitle, { color: colors.text }]}
                      numberOfLines={2}
                    >
                      {event.title}
                    </Text>

                    {!!event.venue && (
                      <View style={styles.venueRow}>
                        <Feather
                          name="map-pin"
                          size={13}
                          color={colors.textMuted}
                        />
                        <Text
                          style={[
                            styles.venueText,
                            { color: colors.textMuted },
                          ]}
                          numberOfLines={1}
                        >
                          {event.venue}
                        </Text>
                      </View>
                    )}

                    {!!event.description && (
                      <Text
                        style={[
                          styles.eventDescription,
                          { color: colors.textMuted },
                        ]}
                        numberOfLines={2}
                      >
                        {event.description}
                      </Text>
                    )}

                    {/* Capacity Progress Bar */}
                    {event.capacity != null && (
                      <View style={styles.capacityWrapper}>
                        <View
                          style={[
                            styles.progressBarBase,
                            { backgroundColor: colors.input },
                          ]}
                        >
                          <View
                            style={[
                              styles.progressBarCurrent,
                              {
                                width: `${progressRatio * 100}%`,
                                backgroundColor:
                                  progressRatio > 0.85
                                    ? "#ef4444"
                                    : colors.primary || "#8B5CF6",
                              },
                            ]}
                          />
                        </View>
                        <Text
                          style={[
                            styles.spotsRemainingText,
                            { color: colors.textMuted },
                          ]}
                        >
                          {isFull
                            ? "Sold Out"
                            : `${spotsRemaining} spots remaining • Tap for details`}
                        </Text>
                      </View>
                    )}

                    {/* Card Status / Action Text */}
                    <View style={styles.tapDetailsPrompt}>
                      <Text
                        style={[
                          styles.tapDetailsText,
                          { color: colors.primary || "#8B5CF6" },
                        ]}
                      >
                        {isBooked
                          ? "✓ Registered (Tap to view pass)"
                          : "View Details & Register →"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </SafeScreen>

      {/* MODAL COMPONENT */}
      <EventDetailsModal
        visible={!!selectedEvent}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        isBooked={selectedEvent ? myBookingIds.has(selectedEvent.id) : false}
        isSaved={selectedEvent ? myBookmarks.has(selectedEvent.id) : false}
        onToggleBookmark={toggleBookmark}
        onBook={handleBook}
        bookingInProgress={bookingInProgress === selectedEvent?.id}
        currentUser={currentUser}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  greetingText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pageTitle: { fontSize: 24, fontWeight: "800", marginTop: 2 },
  headerIcons: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 14,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14 },
  filterScroll: { paddingHorizontal: 20, gap: 8 },
  dayPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  dayText: { fontSize: 13 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryChipText: { fontSize: 12 },
  eventListWrapper: { paddingHorizontal: 20, marginTop: 18, gap: 18 },
  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 12,
    marginBottom: 4,
  },
  statusText: { fontSize: 13, marginTop: 8, textAlign: "center" },

  eventBriteCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 3,
  },
  imageContainer: { position: "relative", width: "100%", height: 170 },
  cardImage: { width: "100%", height: "100%", resizeMode: "cover" },
  floatingDateBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 6,
    alignItems: "center",
    elevation: 4,
  },
  badgeMonthText: { fontSize: 10, fontWeight: "800", color: "#ef4444" },
  badgeDayText: { fontSize: 15, fontWeight: "900", color: "#0f172a" },
  floatingBookmark: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#FFFFFF",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  floatingPriceTag: {
    position: "absolute",
    bottom: 12,
    left: 12,
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceTagText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },

  cardContent: { padding: 16 },
  topMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  categoryLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  timeLabel: { fontSize: 12, fontWeight: "600" },
  eventTitle: {
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 23,
    marginBottom: 6,
  },
  venueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
  },
  venueText: { fontSize: 12, flex: 1 },
  eventDescription: { fontSize: 13, lineHeight: 18, marginBottom: 12 },

  capacityWrapper: { marginBottom: 10 },
  progressBarBase: {
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 5,
  },
  progressBarCurrent: { height: "100%", borderRadius: 3 },
  spotsRemainingText: { fontSize: 11, fontWeight: "600" },
  tapDetailsPrompt: { marginTop: 6 },
  tapDetailsText: { fontSize: 13, fontWeight: "700" },
});
