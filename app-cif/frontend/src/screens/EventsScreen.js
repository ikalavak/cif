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
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import { auth, db } from "../config/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  doc,
  runTransaction,
} from "firebase/firestore";

const DAY_FORMAT = { weekday: "short", day: "numeric", month: "short" };
const TIME_FORMAT = { hour: "2-digit", minute: "2-digit" };

export default function EventsScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [events, setEvents] = useState([]);
  const [myBookingIds, setMyBookingIds] = useState(new Set());
  const [bookingInProgress, setBookingInProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query_, setQuery] = useState("");
  const [activeDay, setActiveDay] = useState(null);

  const user = auth.currentUser;

  // Live events, published only
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
      () => setLoading(false)
    );
    return unsubscribe;
  }, []);

  // Live user bookings
  useEffect(() => {
    if (!user) {
      setMyBookingIds(new Set());
      return;
    }
    const q = query(
      collection(db, "bookings"),
      where("userId", "==", user.uid)
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
        e.title?.toLowerCase().includes(query_.toLowerCase())
      )
    : dayEvents;

  const handleBook = async (event) => {
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

        Alert.alert(
          "Booking Confirmed! 🎉",
          `Ticket Ref: ${bookingId}\n\nYou can view your barcode and ticket details in your profile or tickets tab.`,
          [
            { text: "OK" },
            {
              text: "View Tickets",
              onPress: () => navigation?.navigate?.("MyTickets"),
            },
          ]
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
    <SafeScreen scroll style={styles.screen} contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Matching Forum Header Layout */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greetingText}>Live Schedule</Text>
          <Text style={styles.nameText}>Events</Text>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              const parent = navigation.getParent && navigation.getParent();
              if (parent && parent.navigate) parent.navigate("Notifications");
              else navigation.navigate("Notifications");
            }}
          >
            <Feather name="bell" size={18} color={colors.text} />
          </TouchableOpacity>
          <ThemeToggle />
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search this day's events..."
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

      {loading ? (
        <Text style={styles.infoText}>Loading events...</Text>
      ) : days.length === 0 ? (
        <Text style={styles.infoText}>No events published yet — check back soon.</Text>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
            {days.map((key) => {
              const active = key === activeDay;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setActiveDay(key)}
                  style={[
                    styles.dayPill,
                    active && { backgroundColor: colors.primary || "#8B5CF6", borderColor: colors.primary || "#8B5CF6" },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: active ? "#ffffff" : colors.textMuted, fontWeight: active ? "700" : "500" },
                    ]}
                  >
                    {eventsByDay[key].label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
            {filteredEvents.length === 0 ? (
              <Text style={styles.infoText}>No events match your search.</Text>
            ) : (
              filteredEvents.map((event) => {
                const isBooked = myBookingIds.has(event.id);
                const isFull =
                  event.capacity != null &&
                  (event.booked_count || 0) >= event.capacity &&
                  !isBooked;
                const isLoadingThis = bookingInProgress === event.id;

                return (
                  <View key={event.id} style={styles.eventRow}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      {event.image_url ? (
                        <Image source={{ uri: event.image_url }} style={styles.thumb} />
                      ) : (
                        <View style={[styles.timeBadge, { backgroundColor: (colors.primary || "#8B5CF6") + "18" }]}>
                          <Text style={[styles.timeText, { color: colors.primary || "#8B5CF6" }]}>
                            {event.start_date.toDate().toLocaleTimeString("en-GB", TIME_FORMAT)}
                          </Text>
                        </View>
                      )}

                      <View style={{ flex: 1 }}>
                        {event.image_url && (
                          <Text style={[styles.timeTextSmall, { color: colors.primary || "#8B5CF6" }]}>
                            {event.start_date.toDate().toLocaleTimeString("en-GB", TIME_FORMAT)}
                          </Text>
                        )}
                        <Text style={styles.eventTitle} numberOfLines={2}>
                          {event.title}
                        </Text>
                        {!!event.category && (
                          <Text style={[styles.metaText, { color: colors.primary || "#8B5CF6" }]}>
                            {event.category}
                          </Text>
                        )}
                        {!!event.venue && (
                          <View style={styles.metaRow}>
                            <Feather name="map-pin" size={12} color={colors.textMuted} />
                            <Text style={[styles.metaText, { color: colors.textMuted }]}>
                              {event.venue}
                            </Text>
                          </View>
                        )}
                        {event.capacity != null && (
                          <Text style={[styles.metaText, { color: colors.textMuted, marginTop: 2 }]}>
                            {Math.max(0, event.capacity - (event.booked_count || 0))} spots left
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
                            : colors.primary || "#8B5CF6",
                          borderColor: isBooked ? colors.primary || "#8B5CF6" : "transparent",
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
                              ? colors.primary || "#8B5CF6"
                              : isFull
                              ? colors.textMuted
                              : "#fff",
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

const getStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg || colors.background },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 10,
    },
    greetingText: { fontSize: 13, color: colors.textMuted, marginBottom: 2 },
    nameText: { fontSize: 22, fontWeight: "bold", color: colors.text },
    headerIcons: { flexDirection: "row", gap: 12, alignItems: "center" },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 12,
      paddingHorizontal: 14,
      height: 42,
      backgroundColor: colors.input,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 14, color: colors.text },
    infoText: { color: colors.textMuted, paddingHorizontal: 20, fontSize: 14 },
    dayScroll: { paddingLeft: 16, marginBottom: 12, flexGrow: 0 },
    dayPill: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      height: 36,
      justifyContent: "center",
    },
    dayText: { fontSize: 12 },
    eventRow: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
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
    eventTitle: { fontSize: 14, fontWeight: "600", lineHeight: 19, color: colors.text },
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