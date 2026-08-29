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
  Platform,
} from "react-native";
import SafeScreen from "../components/SafeScreen";
import EventDetailsModal from "../components/EventDetailsModal";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { auth, db } from "../config/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  doc,
  runTransaction,
  deleteDoc,
} from "firebase/firestore";

const DAY_FORMAT = { weekday: "short", day: "numeric", month: "short" };
const CARD_DATE_MONTH = { month: "short" };
const TIME_FORMAT = { hour: "2-digit", minute: "2-digit" };

export default function EventsScreen({ navigation, route }) {
  const { colors } = useTheme();
  const isGuest = route?.params?.isGuest === true;
  const [events, setEvents] = useState([]);
  const [myBookingIds, setMyBookingIds] = useState(new Set());
  const [savedIds, setSavedIds] = useState(new Set());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [bookingInProgress, setBookingInProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query_, setQuery] = useState(route?.params?.initialSearch || "");
  const [activeDay, setActiveDay] = useState("All Days");
  const [activeCategory, setActiveCategory] = useState("All");

  const user = auth.currentUser;

  // Live events, published only (matches Firestore rules for public reads)
  useEffect(() => {
    const q = query(
      collection(db, "events"),
      where("published", "==", true),
      orderBy("start_date", "asc"),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((e) => e.published && e.start_date);
        setEvents(data);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsubscribe;
  }, []);

  // Live list of THIS user's own bookings, so button/status state stays
  // correct across devices/re-renders without extra reads per event.
  useEffect(() => {
    if (!user) {
      setMyBookingIds(new Set());
      return;
    }
    const q = query(
      collection(db, "bookings"),
      where("userId", "==", user.uid),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMyBookingIds(new Set(snapshot.docs.map((d) => d.data().eventId)));
    });
    return unsubscribe;
  }, [user?.uid]);

  // Day labels for the filter row, always including "All Days" first
  const dayLabels = useMemo(() => {
    const seen = new Map();
    events.forEach((event) => {
      const date = event.start_date.toDate();
      const key = date.toDateString();
      if (!seen.has(key)) {
        seen.set(key, date.toLocaleDateString("en-GB", DAY_FORMAT));
      }
    });
    return ["All Days", ...Array.from(seen.values())];
  }, [events]);

  // Category labels for the filter row, derived from whatever categories
  // actually exist on published events, always including "All" first
  const categoryLabels = useMemo(() => {
    const set = new Set();
    events.forEach((e) => {
      if (e.category) set.add(e.category);
    });
    return ["All", ...Array.from(set)];
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const eventDayLabel = event.start_date
        .toDate()
        .toLocaleDateString("en-GB", DAY_FORMAT);
      const matchesDay =
        activeDay === "All Days" || eventDayLabel === activeDay;
      const matchesCategory =
        activeCategory === "All" || event.category === activeCategory;
      const matchesSearch = query_
        ? `${event.title || ""} ${event.venue || ""} ${event.speaker || ""}`
            .toLowerCase()
            .includes(query_.toLowerCase())
        : true;
      return matchesDay && matchesCategory && matchesSearch;
    });
  }, [events, activeDay, activeCategory, query_]);

  const toggleSaved = (eventId) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  };

  const handleBook = async (event) => {
    if (isGuest) {
      // Guests can't book — explain why, then send them to Sign Up.
      Alert.alert(
        "Sign up required",
        "You need an account to book events. Create one now — it only takes a minute.",
        [
          { text: "Not now", style: "cancel" },
          {
            text: "Sign Up",
            onPress: () => {
              const parent = navigation?.getParent?.();
              if (parent?.replace) {
                parent.replace("SignUp");
              } else {
                navigation?.replace?.("SignUp");
              }
            },
          },
        ],
      );
      return;
    }

    if (!user) {
      Alert.alert("Sign in required", "Please log in to book events.", [
        { text: "Cancel", style: "cancel" },
        { text: "Log in", onPress: () => navigation?.navigate?.("Login") },
      ]);
      return;
    }

    const bookingId = `${event.id}_${user.uid}`;
    const alreadyBooked = myBookingIds.has(event.id);
    setBookingInProgress(event.id);

    // Format event date & time strings to save inside the booking document
    const eventDateStr = event.start_date?.toDate
      ? event.start_date.toDate().toLocaleDateString("en-GB", DAY_FORMAT)
      : "—";
    const eventTimeStr = event.start_date?.toDate
      ? event.start_date.toDate().toLocaleTimeString("en-GB", TIME_FORMAT)
      : "—";

    try {
      if (alreadyBooked) {
        // Cancel: delete booking, decrement count via transaction
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
        // Book: check capacity, create booking with details & status, increment count — all atomic
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
            userId: user.uid,
            userEmail: user.email || null,
            eventTitle: event.title || "Untitled Event",
            eventDate: eventDateStr,
            eventTime: eventTimeStr,
            quantity: 1,
            status: "Valid",
            created_at: new Date(),
          });
          transaction.update(eventRef, { booked_count: currentCount + 1 });
        });

        // Booking succeeded — show confirmation with the ticket reference.
        // Alert.alert doesn't reliably render on web, so use window.confirm
        // there instead, with the same "go to tickets" action on OK.
        const confirmMessage = `Booking Confirmed! 🎉\n\nTicket Ref: ${bookingId}\n\nYou can view your barcode and ticket details in your profile or tickets tab.`;

        if (Platform.OS === "web") {
          const wantsToViewTickets = window.confirm(
            confirmMessage + "\n\nClick OK to view your tickets now.",
          );
          if (wantsToViewTickets) {
            navigation?.navigate?.("MyTickets");
          }
        } else {
          Alert.alert(
            "Booking Confirmed! 🎉",
            confirmMessage.replace("Booking Confirmed! 🎉\n\n", ""),
            [
              { text: "OK" },
              {
                text: "View Tickets",
                onPress: () => navigation?.navigate?.("MyTickets"),
              },
            ],
          );
        }
      }
    } catch (err) {
      if (err.message === "FULL") {
        Alert.alert("Fully booked", "Sorry, this event has no spots left.");
      } else {
        Alert.alert("Something went wrong", err.message);
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
        contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}
      >
        {/* Header — arrow fixed left, title absolutely centered, matching the rest of the app */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation?.goBack?.()}
            style={styles.backIconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text
            style={[styles.pageTitle, { color: colors.text }]}
            pointerEvents="none"
          >
            Explore Events
          </Text>
        </View>
        <Text style={[styles.eyebrowText, { color: colors.textMuted }]}>
          CREATIVE INDUSTRIES FESTIVAL
        </Text>

        {/* Search bar */}
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather
            name="search"
            size={20}
            color={colors.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Find events..."
            placeholderTextColor={colors.textMuted}
            value={query_}
            onChangeText={setQuery}
          />
        </View>

        {loading ? (
          <Text style={{ color: colors.textMuted, paddingHorizontal: 20 }}>
            Loading events...
          </Text>
        ) : events.length === 0 ? (
          <Text style={{ color: colors.textMuted, paddingHorizontal: 20 }}>
            No events published yet — check back soon.
          </Text>
        ) : (
          <>
            {/* Day filter pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.pillScroll}
            >
              {dayLabels.map((label) => {
                const active = label === activeDay;
                return (
                  <TouchableOpacity
                    key={label}
                    onPress={() => setActiveDay(label)}
                    style={[
                      styles.dayPill,
                      active
                        ? {
                            backgroundColor: colors.primary,
                            borderColor: colors.primary,
                          }
                        : {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                          },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayPillText,
                        {
                          color: active ? "#fff" : colors.text,
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

            {/* Category filter pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.pillScrollSmall}
            >
              {categoryLabels.map((label) => {
                const active = label === activeCategory;
                return (
                  <TouchableOpacity
                    key={label}
                    onPress={() => setActiveCategory(label)}
                    style={[
                      styles.categoryPill,
                      active
                        ? {
                            backgroundColor: colors.primary + "1A",
                            borderColor: colors.primary,
                          }
                        : {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                          },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        { color: active ? colors.primary : colors.textMuted },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Event cards */}
            <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
              {filteredEvents.length === 0 ? (
                <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                  No events match your filters.
                </Text>
              ) : (
                filteredEvents.map((event) => {
                  const isBooked = myBookingIds.has(event.id);
                  const isSaved = savedIds.has(event.id);
                  const isFull =
                    event.capacity != null &&
                    (event.booked_count || 0) >= event.capacity &&
                    !isBooked;
                  const isLoadingThis = bookingInProgress === event.id;
                  const dateObj = event.start_date.toDate();

                  return (
                    <TouchableOpacity
                      key={event.id}
                      activeOpacity={0.9}
                      onPress={() => setSelectedEvent(event)}
                      style={[
                        styles.card,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View style={styles.cardImageWrap}>
                        <Image
                          source={{
                            uri:
                              event.image_url ||
                              "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80",
                          }}
                          style={styles.cardImage}
                        />

                        {/* Date badge */}
                        <View style={styles.dateBadge}>
                          <Text style={styles.dateBadgeMonth}>
                            {dateObj
                              .toLocaleDateString("en-GB", CARD_DATE_MONTH)
                              .toUpperCase()}
                          </Text>
                          <Text style={styles.dateBadgeDay}>
                            {dateObj.getDate()}
                          </Text>
                        </View>

                        {/* Save/bookmark button */}
                        <TouchableOpacity
                          style={styles.bookmarkBtn}
                          onPress={() => toggleSaved(event.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons
                            name={isSaved ? "bookmark" : "bookmark-outline"}
                            size={18}
                            color={isSaved ? colors.primary : "#1e293b"}
                          />
                        </TouchableOpacity>

                        {/* Free/price tag */}
                        <View style={styles.priceTag}>
                          <Text style={styles.priceTagText}>
                            {event.price ? `£${event.price}` : "FREE"}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.cardContent}>
                        <View style={styles.cardTopRow}>
                          {!!event.category && (
                            <Text
                              style={[
                                styles.categoryLabel,
                                { color: colors.primary },
                              ]}
                            >
                              {event.category}
                            </Text>
                          )}
                          <Text
                            style={[
                              styles.timeLabel,
                              { color: colors.textMuted },
                            ]}
                          >
                            {dateObj.toLocaleTimeString("en-GB", TIME_FORMAT)}
                          </Text>
                        </View>

                        <Text
                          style={[styles.cardTitle, { color: colors.text }]}
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
                            >
                              {event.venue}
                            </Text>
                          </View>
                        )}

                        {event.capacity != null && !isBooked && !isFull && (
                          <Text
                            style={[
                              styles.spotsText,
                              { color: colors.textMuted },
                            ]}
                          >
                            {Math.max(
                              0,
                              event.capacity - (event.booked_count || 0),
                            )}{" "}
                            spots left
                          </Text>
                        )}

                        {/* Tapping the card already opens the detail modal — this link
                          just makes that affordance explicit, matching Job Board's
                          "View Details & Apply" pattern. Actual booking now only
                          happens inside the modal, not directly from the list. */}
                        <TouchableOpacity
                          onPress={() => setSelectedEvent(event)}
                          style={styles.viewDetailsRow}
                        >
                          <Text
                            style={[
                              styles.viewDetailsText,
                              { color: colors.primary },
                            ]}
                          >
                            {isBooked
                              ? "Registered — View Pass →"
                              : isFull
                                ? "Fully booked — View Details →"
                                : "View Details & Register →"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </>
        )}
      </SafeScreen>

      <EventDetailsModal
        visible={!!selectedEvent}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        isBooked={selectedEvent ? myBookingIds.has(selectedEvent.id) : false}
        isSaved={selectedEvent ? savedIds.has(selectedEvent.id) : false}
        onToggleBookmark={toggleSaved}
        onBook={handleBook}
        bookingInProgress={bookingInProgress === selectedEvent?.id}
        currentUser={user}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    minHeight: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backIconBtn: { zIndex: 2 },
  eyebrowText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 8,
  },
  pageTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 50,
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 15 },

  pillScroll: { paddingLeft: 20, marginBottom: 10, flexGrow: 0 },
  dayPill: {
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    marginRight: 10,
    height: 42,
    justifyContent: "center",
  },
  dayPillText: { fontSize: 13 },

  pillScrollSmall: { paddingLeft: 20, marginBottom: 16, flexGrow: 0 },
  categoryPill: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    marginRight: 8,
    height: 32,
    justifyContent: "center",
  },
  categoryPillText: { fontSize: 12, fontWeight: "600" },

  card: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 18,
  },
  cardImageWrap: { position: "relative" },
  cardImage: { width: "100%", height: 200 },

  dateBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
  },
  dateBadgeMonth: {
    fontSize: 9,
    fontWeight: "800",
    color: "#ef4444",
    letterSpacing: 0.5,
  },
  dateBadgeDay: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: 20,
  },

  bookmarkBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  priceTag: {
    position: "absolute",
    bottom: 12,
    left: 12,
    backgroundColor: "#0f172a",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  priceTagText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  cardContent: { padding: 16 },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  categoryLabel: { fontSize: 12, fontWeight: "700" },
  timeLabel: { fontSize: 12, fontWeight: "600" },

  cardTitle: {
    fontSize: 19,
    fontWeight: "800",
    lineHeight: 24,
    marginBottom: 8,
  },

  venueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  venueText: { fontSize: 13 },

  spotsText: { fontSize: 12, marginTop: 2, marginBottom: 10 },

  viewDetailsRow: { marginTop: 12 },
  viewDetailsText: { fontSize: 14, fontWeight: "700" },
});
