import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import SafeScreen from "../components/SafeScreen";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { db } from "../config/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

const DAY_FORMAT = { weekday: "short", day: "numeric", month: "short" };
const TIME_FORMAT = { hour: "2-digit", minute: "2-digit" };

export default function EventsScreen() {
  const { colors } = useTheme();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query_, setQuery] = useState("");
  const [activeDay, setActiveDay] = useState(null);

  // Live fetch from the same "events" collection the admin panel manages.
  // Firestore rules only expose published:true events to unauthenticated
  // reads, so this list only ever shows what's actually meant to be public.
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

  // Group events by calendar day, in the order they first appear (already
  // sorted by start_date from the query above).
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

  // Default to the first available day once data loads
  useEffect(() => {
    if (!activeDay && days.length > 0) setActiveDay(days[0]);
  }, [days, activeDay]);

  const dayEvents = activeDay ? eventsByDay[activeDay]?.items || [] : [];

  const filteredEvents = query_
    ? dayEvents.filter((e) =>
        e.title?.toLowerCase().includes(query_.toLowerCase()),
      )
    : dayEvents;

  return (
    <SafeScreen
      scroll
      style={[styles.screen, { backgroundColor: colors.bg }]}
      contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Events</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
            Festival schedule, day by day
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.card }]}
        >
          <Ionicons name="settings-sharp" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Search */}
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
          {/* Day selector */}
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

          {/* Event list for the selected day */}
          <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
            {filteredEvents.length === 0 ? (
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                No events match your search.
              </Text>
            ) : (
              filteredEvents.map((event) => (
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
                          style={[styles.metaText, { color: colors.textMuted }]}
                        >
                          {event.venue}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  pageTitle: { fontSize: 26, fontWeight: "bold", marginBottom: 4 },
  pageSubtitle: { fontSize: 14 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
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
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
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
});
