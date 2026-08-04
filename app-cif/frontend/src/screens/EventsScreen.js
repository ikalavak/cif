import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import SafeScreen from "../components/SafeScreen";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

// TODO: replace MOCK_EVENTS with a real fetch from the Eventbrite API
// (e.g. GET /v3/events/search/ or your Supabase table synced from Eventbrite webhooks).
// Keep this same shape so the UI below doesn't need to change when you wire it up.
const MOCK_EVENTS = [
  {
    id: "1",
    title: "Opening Keynote: The Future of Creative Intelligence",
    category: "Talks",
    date: "Oct 12, 2026",
    time: "10:00 AM",
    location: "Innovation Hall",
    price: "Free",
    featured: true,
  },
  {
    id: "2",
    title: "Hands-on: Generative Design Workshop",
    category: "Workshops",
    date: "Oct 12, 2026",
    time: "1:00 PM",
    location: "Studio B",
    price: "£15",
    featured: true,
  },
  {
    id: "3",
    title: "Emerging Voices Exhibition",
    category: "Exhibitions",
    date: "Oct 12–14, 2026",
    time: "All day",
    location: "East Gallery",
    price: "Free",
    featured: true,
  },
  {
    id: "4",
    title: "Founders & Freelancers Mixer",
    category: "Networking",
    date: "Oct 13, 2026",
    time: "6:00 PM",
    location: "Rooftop Terrace",
    price: "£5",
    featured: false,
  },
  {
    id: "5",
    title: "Portfolio Critique Sessions",
    category: "Workshops",
    date: "Oct 13, 2026",
    time: "11:00 AM",
    location: "Studio A",
    price: "Free",
    featured: false,
  },
];

const FILTERS = ["All", "Workshops", "Talks", "Exhibitions", "Networking"];

export default function EventsScreen() {
  const { colors, scheme } = useTheme();
  const [activeFilter, setActiveFilter] = useState("All");
  const [query, setQuery] = useState("");

  const filteredEvents = useMemo(() => {
    return MOCK_EVENTS.filter((event) => {
      const matchesFilter =
        activeFilter === "All" || event.category === activeFilter;
      const matchesQuery = event.title
        .toLowerCase()
        .includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, query]);

  const featuredEvents = filteredEvents.filter((e) => e.featured);
  const allEvents = filteredEvents;

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
            Discover sessions, workshops and exhibitions
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
          placeholder="Search events, speakers..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        nestedScrollEnabled
      >
        {FILTERS.map((filter) => {
          const active = filter === activeFilter;
          const pillBg = active ? colors.primary + "22" : undefined;
          const pillBorder = active ? colors.primary : colors.border;
          const textColor = active
            ? scheme === "dark"
              ? colors.text
              : colors.primary
            : scheme === "light"
              ? colors.text
              : colors.textMuted;

          return (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[
                styles.filterPill,
                { borderColor: pillBorder, backgroundColor: pillBg },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: textColor, fontWeight: active ? "700" : "500" },
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Featured Events */}
      {featuredEvents.length > 0 && (
        <>
          <Text
            style={[
              styles.sectionTitle,
              { marginLeft: 20, marginBottom: 16, color: colors.text },
            ]}
          >
            Featured Events
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ paddingLeft: 20, marginBottom: 24 }}
            nestedScrollEnabled
          >
            {featuredEvents.map((event) => (
              <View
                key={event.id}
                style={[
                  styles.largeEventCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <LinearGradient
                  colors={[colors.primary, colors.accent]}
                  style={styles.largeEventImage}
                >
                  <View
                    style={[styles.badge, { backgroundColor: colors.primary }]}
                  >
                    <Text
                      style={[styles.badgeText, { color: colors.onPrimary }]}
                    >
                      {event.category}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.heartBtn, { backgroundColor: colors.white }]}
                  >
                    <Feather name="heart" size={18} color={colors.text} />
                  </TouchableOpacity>
                </LinearGradient>
                <View
                  style={[
                    styles.largeEventContent,
                    { backgroundColor: colors.card },
                  ]}
                >
                  <Text
                    style={[styles.eventTitle, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {event.title}
                  </Text>
                  <Text
                    style={[styles.eventDetails, { color: colors.textMuted }]}
                  >
                    {event.date} • {event.time}
                  </Text>
                  <View style={styles.eventFooter}>
                    <Text
                      style={[styles.eventDetails, { color: colors.textMuted }]}
                    >
                      {event.location}
                    </Text>
                    <Feather
                      name="arrow-right"
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </>
      )}

      {/* All Events — scannable list: date/location/price up front, clear CTA */}
      <Text
        style={[
          styles.sectionTitle,
          { marginLeft: 20, marginBottom: 12, color: colors.text },
        ]}
      >
        All Events
      </Text>
      <View style={{ paddingHorizontal: 20 }}>
        {allEvents.length === 0 ? (
          <Text style={{ color: colors.textMuted, fontSize: 14 }}>
            No events match your search.
          </Text>
        ) : (
          allEvents.map((event) => (
            <View
              key={event.id}
              style={[
                styles.listCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.listCardTop}>
                <View
                  style={[styles.badgeOutline, { borderColor: colors.primary }]}
                >
                  <Text
                    style={[styles.badgeOutlineText, { color: colors.primary }]}
                  >
                    {event.category}
                  </Text>
                </View>
                <Text style={[styles.priceText, { color: colors.text }]}>
                  {event.price}
                </Text>
              </View>

              <Text
                style={[styles.listEventTitle, { color: colors.text }]}
                numberOfLines={2}
              >
                {event.title}
              </Text>

              <View style={styles.metaRow}>
                <Feather name="calendar" size={14} color={colors.textMuted} />
                <Text style={[styles.metaText, { color: colors.textMuted }]}>
                  {event.date} • {event.time}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Feather name="map-pin" size={14} color={colors.textMuted} />
                <Text style={[styles.metaText, { color: colors.textMuted }]}>
                  {event.location}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.ctaButton, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.ctaText, { color: colors.onPrimary }]}>
                  Get tickets
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
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
    marginBottom: 20,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 15 },
  filterScroll: { paddingLeft: 20, marginBottom: 24, flexGrow: 0 },
  filterPill: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    height: 36,
    justifyContent: "center",
  },
  filterText: { fontSize: 13, fontWeight: "500" },
  sectionTitle: { fontSize: 18, fontWeight: "bold" },

  // Featured (horizontal) cards
  largeEventCard: {
    width: 280,
    borderRadius: 20,
    marginRight: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  largeEventImage: {
    height: 140,
    padding: 12,
    justifyContent: "space-between",
    flexDirection: "row",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 10, fontWeight: "bold" },
  heartBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  largeEventContent: { padding: 16 },
  eventTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    lineHeight: 22,
  },
  eventDetails: { fontSize: 12 },
  eventFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },

  // All Events (vertical) cards — designed to be scannable per Eventbrite's guidance:
  // date/location/price up front, one clear CTA per card
  listCard: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 14 },
  listCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  badgeOutline: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeOutlineText: { fontSize: 10, fontWeight: "700" },
  priceText: { fontSize: 14, fontWeight: "700" },
  listEventTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  metaText: { fontSize: 13 },
  ctaButton: {
    marginTop: 10,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  ctaText: { fontSize: 14, fontWeight: "700" },
});
