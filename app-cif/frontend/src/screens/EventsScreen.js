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
import { Feather, Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

// Schedule pulled from Schedule_and_Partner_Checklist.docx.
// Kept intentionally simple: time, title, location. Some rows in the source
// doc had unclear/missing times or locations — left blank rather than guessing.
// TODO: once the admin panel's Events collection is live, replace this with a
// fetch from Firestore instead of a hardcoded schedule.
const SCHEDULE = {
  "Wed 2 Sep": [
    { id: "w1", time: "11:00", title: "Creative Careers Lab", location: "UEL" },
    {
      id: "w2",
      time: "11:00",
      title: "ACI Advisory Board: You've Got the Degree, Now What?",
      location: "UEL",
    },
    {
      id: "w3",
      time: "11:00",
      title: "MBA Fashion: Different Ideas, Different Identities",
      location: "",
    },
    {
      id: "w4",
      time: "11:00",
      title: "Immersive Horror Demo",
      location: "UEL",
    },
    {
      id: "w5",
      time: "12:00",
      title: "Searchlight: Which Career Is Right for Me",
      location: "",
    },
    {
      id: "w6",
      time: "13:00",
      title: "Lazy Oaf Workshop: Designing the Oaf Way",
      location: "Community Hub",
    },
    {
      id: "w7",
      time: "14:00",
      title: "Searchlight Workshop: CV / Portfolio Reviews",
      location: "",
    },
    {
      id: "w8",
      time: "15:00",
      title: "London Higher Panel Talk: Breaking into Screen",
      location: "",
    },
    {
      id: "w9",
      time: "16:00",
      title: "Regenerative Fashion Archive (RFA)",
      location: "Archive Room",
    },
    {
      id: "w10",
      time: "16:00",
      title: "TLSS x UEL Global League: Installation",
      location: "",
    },
    {
      id: "w11",
      time: "16:00",
      title: "RFA x GDIPU x JISULIFE: Climate Control Centre",
      location: "",
    },
    {
      id: "w12",
      time: "17:00",
      title: "Private View: MA Fine Art Show",
      location: "",
    },
  ],
  "Thu 3 Sep": [
    {
      id: "t1",
      time: "10:00",
      title: "Creative Futures x CIRCA Research Conference",
      location: "The Source",
    },
    {
      id: "t2",
      time: "11:00",
      title: "MBA Fashion: Different Ideas, Different Identities",
      location: "",
    },
    {
      id: "t3",
      time: "11:00",
      title: "TLSS x UEL Global League: Installation",
      location: "",
    },
    {
      id: "t4",
      time: "11:00",
      title: "Regenerative Fashion Archive (RFA)",
      location: "",
    },
    {
      id: "t5",
      time: "11:00",
      title: "RFA x GDIPU x JISULIFE: Climate Control Centre",
      location: "",
    },
    { id: "t6", time: "11:00", title: "Immersive Horror Demo", location: "" },
    { id: "t7", time: "11:00", title: "Creative Careers Lab", location: "UEL" },
    {
      id: "t8",
      time: "11:00",
      title: "Caramel Rock: Drop-in Making Workshop",
      location: "",
    },
    {
      id: "t9",
      time: "12:00",
      title: "Canva Workshop: Making It With Canva",
      location: "Living Library",
    },
    {
      id: "t10",
      time: "13:00",
      title: "London Higher Talk: Networking and Freelancing",
      location: "",
    },
    {
      id: "t11",
      time: "14:00",
      title: "Beyond the Classroom: Achieving Success as a Graduate",
      location: "",
    },
    {
      id: "t12",
      time: "14:00",
      title: "Akanda Productions: Creative Speedwriting Camp & Cypher",
      location: "Hackathon Space",
    },
    {
      id: "t13",
      time: "15:00",
      title: "Learning by Doing: A Creative Applied Education Workshop",
      location: "",
    },
  ],
  "Fri 4 Sep": [
    {
      id: "f1",
      time: "09:30",
      title: "Creative Futures x CIRCA Research Conference",
      location: "The Source",
    },
    {
      id: "f2",
      time: "10:00",
      title: "House of Kings",
      location: "The Source",
    },
    {
      id: "f3",
      time: "10:00",
      title: "Grow London Local Coffee Morning",
      location: "Café Area",
    },
    { id: "f4", time: "11:00", title: "Creative Careers Lab", location: "UEL" },
    {
      id: "f5",
      time: "11:00",
      title: "TLSS x UEL Global League: Installation",
      location: "",
    },
    {
      id: "f6",
      time: "11:00",
      title: "RFA x GDIPU x JISULIFE: Climate Control Centre",
      location: "",
    },
    {
      id: "f7",
      time: "11:00",
      title: "Regenerative Fashion Archive (RFA)",
      location: "",
    },
    {
      id: "f8",
      time: "11:00",
      title: "RDCS and TerraDock Open Day",
      location: "",
    },
    {
      id: "f9",
      time: "11:00",
      title: "One Newham: Creative Health in Newham",
      location: "Living Library",
    },
    {
      id: "f10",
      time: "12:00",
      title: "DASH Arts Workshop: Speak Out, Find Your Voice",
      location: "",
    },
    {
      id: "f11",
      time: "13:00",
      title: "Different Minds, Creative Strengths Workshop",
      location: "",
    },
    {
      id: "f12",
      time: "13:00",
      title: "ACI Advisory Board: Who's in Control",
      location: "The Source",
    },
    {
      id: "f13",
      time: "14:00",
      title: "Care-Centred Co-Creation with Communities Workshop",
      location: "",
    },
    {
      id: "f14",
      time: "14:00",
      title: "Akanda Productions: Seema — Short Film Screening & Q&A",
      location: "Hackathon Space",
    },
  ],
  "Sat 5 Sep": [
    {
      id: "s1",
      time: "15:30",
      title: "The Cypher: Black Women Own the Element",
      location: "The Source",
    },
  ],
};

const DAYS = Object.keys(SCHEDULE);

export default function EventsScreen() {
  const { colors } = useTheme();
  const [activeDay, setActiveDay] = useState(DAYS[0]);
  const [query, setQuery] = useState("");

  const events = useMemo(() => {
    const dayEvents = SCHEDULE[activeDay] || [];
    if (!query) return dayEvents;
    return dayEvents.filter((e) =>
      e.title.toLowerCase().includes(query.toLowerCase()),
    );
  }, [activeDay, query]);

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
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* Day selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dayScroll}
      >
        {DAYS.map((day) => {
          const active = day === activeDay;
          return (
            <TouchableOpacity
              key={day}
              onPress={() => setActiveDay(day)}
              style={[
                styles.dayPill,
                {
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primary + "22" : undefined,
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
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Event list for the selected day */}
      <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
        {events.length === 0 ? (
          <Text style={{ color: colors.textMuted, fontSize: 14 }}>
            No events match your search.
          </Text>
        ) : (
          events.map((event) => (
            <View
              key={event.id}
              style={[
                styles.eventRow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.timeBadge,
                  { backgroundColor: colors.primary + "18" },
                ]}
              >
                <Text style={[styles.timeText, { color: colors.primary }]}>
                  {event.time}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.eventTitle, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {event.title}
                </Text>
                {!!event.location && (
                  <View style={styles.metaRow}>
                    <Feather
                      name="map-pin"
                      size={12}
                      color={colors.textMuted}
                    />
                    <Text
                      style={[styles.metaText, { color: colors.textMuted }]}
                    >
                      {event.location}
                    </Text>
                  </View>
                )}
              </View>
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
  eventTitle: { fontSize: 14, fontWeight: "600", lineHeight: 19 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  metaText: { fontSize: 12 },
});
