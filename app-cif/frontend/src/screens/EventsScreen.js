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
} from "react-native";
import SafeScreen from "../components/SafeScreen";
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
const TIME_FORMAT = { hour: "2-digit", minute: "2-digit" };

export default function EventsScreen({ navigation, route }) {
  const { colors } = useTheme();
  const isGuest = route?.params?.isGuest === true;
  const [events, setEvents] = useState([]);
  const [myBookingIds, setMyBookingIds] = useState(new Set());
  const [bookingInProgress, setBookingInProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query_, setQuery] = useState("");
  const [activeDay, setActiveDay] = useState(null);

  const user = auth.currentUser;

  // Live events, published only (matches Firestore rules for public reads)
  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("start_date", "asc"));
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

  // Live list of THIS user's own bookings, so the button state stays correct
  // across devices/re-renders without extra reads per event.
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

  const { days, eventsByDay } = useMemo(() => {
    const grouped = {};
    const order = [];
    events.forEach((event) => {
      const date = event.start_date.toDate();
      const key = date.toDateString();
      if (!grouped[key]) {
        grouped[key] = {
          label: date.toLocaleDateString("en-GB", DAY_FORMAT),
          items: [],
        };
        order.push(key);
      }
      grouped[key].items.push(event);
    });
    return { days: order, eventsByDay: grouped };
  }, [events]);

  useEffect(() => {
    if (!activeDay && days.length > 0) setActiveDay(days[0]);
  }, [days, activeDay]);

  const dayEvents = activeDay ? eventsByDay[activeDay]?.items || [] : [];
  const filteredEvents = query_
    ? dayEvents.filter((e) =>
        e.title?.toLowerCase().includes(query_.toLowerCase()),
      )
    : dayEvents;

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

        // Booking succeeded — show confirmation with the ticket reference
        Alert.alert(
          "Booking Confirmed! 🎉",
          `Ticket Ref: ${bookingId}\n\nYou can view your barcode and ticket details in your profile or tickets tab.`,
          [
            { text: "OK" },
            {
              text: "View Tickets",
              onPress: () => navigation?.navigate?.("MyTickets"),
            },
          ],
        );
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
    <SafeScreen
      scroll
      style={[styles.screen, { backgroundColor: colors.bg }]}
      contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}
    >
      {/* Header — matches JobBoard's pattern: back arrow + title combined, one tap target */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>
            ← Events
          </Text>
        </TouchableOpacity>
        <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
          Festival schedule, day by day
        </Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.input }]}>
        <Feather
          name="search"
          size={20}
          color={colors.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search this day's events..."
          placeholderTextColor={colors.textMuted}
          value={query_}
          onChangeText={setQuery}
        />
      </View>

      {loading ? (
        <Text style={{ color: colors.textMuted, paddingHorizontal: 20 }}>
          Loading events...
        </Text>
      ) : days.length === 0 ? (
        <Text style={{ color: colors.textMuted, paddingHorizontal: 20 }}>
          No events published yet — check back soon.
        </Text>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dayScroll}
          >
            {days.map((key) => {
              const active = key === activeDay;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setActiveDay(key)}
                  style={[
                    styles.dayPill,
                    {
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active
                        ? colors.primary + "22"
                        : undefined,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      {
                        color: active ? colors.primary : colors.textMuted,
                        fontWeight: active ? "700" : "500",
                      },
                    ]}
                  >
                    {eventsByDay[key].label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
            {filteredEvents.length === 0 ? (
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                No events match your search.
              </Text>
            ) : (
              filteredEvents.map((event) => {
                const isBooked = myBookingIds.has(event.id);
                const isFull =
                  event.capacity != null &&
                  (event.booked_count || 0) >= event.capacity &&
                  !isBooked;
                const isLoadingThis = bookingInProgress === event.id;

                return (
                  <View
                    key={event.id}
                    style={[
                      styles.eventRow,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      {event.image_url ? (
                        <Image
                          source={{ uri: event.image_url }}
                          style={styles.thumb}
                        />
                      ) : (
                        <View
                          style={[
                            styles.timeBadge,
                            { backgroundColor: colors.primary + "18" },
                          ]}
                        >
                          <Text
                            style={[styles.timeText, { color: colors.primary }]}
                          >
                            {event.start_date
                              .toDate()
                              .toLocaleTimeString("en-GB", TIME_FORMAT)}
                          </Text>
                        </View>
                      )}

                      <View style={{ flex: 1 }}>
                        {event.image_url && (
                          <Text
                            style={[
                              styles.timeTextSmall,
                              { color: colors.primary },
                            ]}
                          >
                            {event.start_date
                              .toDate()
                              .toLocaleTimeString("en-GB", TIME_FORMAT)}
                          </Text>
                        )}
                        <Text
                          style={[styles.eventTitle, { color: colors.text }]}
                          numberOfLines={2}
                        >
                          {event.title}
                        </Text>
                        {!!event.category && (
                          <Text
                            style={[styles.metaText, { color: colors.primary }]}
                          >
                            {event.category}
                          </Text>
                        )}
                        {!!event.venue && (
                          <View style={styles.metaRow}>
                            <Feather
                              name="map-pin"
                              size={12}
                              color={colors.textMuted}
                            />
                            <Text
                              style={[
                                styles.metaText,
                                { color: colors.textMuted },
                              ]}
                            >
                              {event.venue}
                            </Text>
                          </View>
                        )}
                        {event.capacity != null && (
                          <Text
                            style={[
                              styles.metaText,
                              { color: colors.textMuted, marginTop: 2 },
                            ]}
                          >
                            {Math.max(
                              0,
                              event.capacity - (event.booked_count || 0),
                            )}{" "}
                            spots left
                          </Text>
                        )}
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleBook(event)}
                      disabled={isLoadingThis || (isFull && !isBooked)}
                      style={[
                        styles.bookButton,
                        {
                          backgroundColor: isBooked
                            ? "transparent"
                            : isFull
                              ? colors.border
                              : colors.primary,
                          borderColor: isBooked
                            ? colors.primary
                            : "transparent",
                          borderWidth: isBooked ? 1 : 0,
                          opacity: isLoadingThis ? 0.6 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.bookButtonText,
                          {
                            color: isBooked
                              ? colors.primary
                              : isFull
                                ? colors.textMuted
                                : colors.onPrimary || "#fff",
                          },
                        ]}
                      >
                        {isLoadingThis
                          ? "..."
                          : isBooked
                            ? "Booked — tap to cancel"
                            : isFull
                              ? "Fully booked"
                              : "Book"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        </>
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  pageTitle: { fontSize: 28, fontWeight: "bold" },
  pageSubtitle: { fontSize: 15, marginTop: 8, marginBottom: 4 },
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 15 },

  dayScroll: { paddingLeft: 20, marginBottom: 16, flexGrow: 0 },
  dayPill: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    height: 36,
    justifyContent: "center",
  },
  dayText: { fontSize: 13 },

  eventRow: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  timeBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 52,
    alignItems: "center",
  },
  timeText: { fontSize: 12, fontWeight: "700" },
  timeTextSmall: { fontSize: 11, fontWeight: "700", marginBottom: 2 },
  thumb: { width: 56, height: 56, borderRadius: 10 },
  eventTitle: { fontSize: 14, fontWeight: "600", lineHeight: 19 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  metaText: { fontSize: 12, marginTop: 2 },

  bookButton: {
    marginTop: 12,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  bookButtonText: { fontSize: 13, fontWeight: "700" },
});
