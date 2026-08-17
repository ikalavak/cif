import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text, 
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import SafeScreen from "../components/SafeScreen";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

// Schedule pulled from Schedule_and_Partner_Checklist.docx.
// Kept intentionally simple: time, title, location, and an optional Eventbrite
// link where one was listed. Some rows in the source doc had unclear/missing
// times or locations — left blank rather than guessing.
// TODO: once the admin panel's Events collection is live, replace this with a
// fetch from Firestore instead of a hardcoded schedule.
const SCHEDULE = {
  "Wed 2 Sep": [
    {
      id: "w1",
      time: "11:00",
      title: "Creative Careers Lab",
      location: "UEL",
      link: "https://www.eventbrite.co.uk/e/creative-careers-lab-tickets-199665764677",
    },
    {
      id: "w2",
      time: "11:00",
      title: "ACI Advisory Board: You've Got the Degree, Now What?",
      location: "UEL",
      link: "https://www.eventbrite.co.uk/e/industry-insiders-talk-youve-got-the-degree-now-what-tickets-199663900409",
    },
    {
      id: "w3",
      time: "11:00",
      title: "MBA Fashion: Different Ideas, Different Identities",
      location: "",
      link: "https://www.eventbrite.co.uk/e/different-ideas-different-identities-one-creative-future-tickets-199664578529",
    },
    {
      id: "w4",
      time: "11:00",
      title: "Immersive Horror Demo",
      location: "UEL",
      link: "https://www.eventbrite.co.uk/e/immersive-horror-game-demo-tickets-199663697594",
    },
    {
      id: "w5",
      time: "12:00",
      title: "Searchlight: Which Career Is Right for Me",
      location: "",
      link: "https://www.eventbrite.co.uk/e/which-career-is-right-for-me-tickets-199457551405",
    },
    {
      id: "w6",
      time: "13:00",
      title: "Lazy Oaf Workshop: Designing the Oaf Way",
      location: "Community Hub",
      link: "https://www.eventbrite.co.uk/e/designing-the-oaf-way-creative-fashion-design-workshop-with-lazy-oaf-tickets-199399588336",
    },
    {
      id: "w7",
      time: "14:00",
      title: "Searchlight Workshop: CV / Portfolio Reviews",
      location: "",
      link: "https://www.eventbrite.co.uk/e/cv-portfolio-reviews-with-searchlight-recruitment-tickets-199457583601",
    },
    {
      id: "w8",
      time: "15:00",
      title: "London Higher Panel Talk: Breaking into Screen",
      location: "",
      link: "https://www.eventbrite.co.uk/e/breaking-into-screen-a-panel-discussion-on-early-careers-in-the-screen-in-tickets-199466329360",
    },
    {
      id: "w9",
      time: "16:00",
      title: "Regenerative Fashion Archive (RFA)",
      location: "Archive Room",
      link: "https://www.eventbrite.co.uk/e/regenerative-fashion-archive-rfa-gf-rcds-emerging-designer-collection-tickets-199664327979",
    },
    {
      id: "w10",
      time: "16:00",
      title: "TLSS x UEL Global League: Installation",
      location: "",
      link: "https://www.eventbrite.co.uk/e/tlss-x-uel-global-league-tickets-199664283045",
    },
    {
      id: "w11",
      time: "16:00",
      title: "RFA x GDIPU x JISULIFE: Climate Control Centre",
      location: "",
      link: "https://www.eventbrite.co.uk/e/rfa-x-gdipu-x-jisulife-climate-control-centre-tickets-199664242362",
    },
    {
      id: "w12",
      time: "17:00",
      title: "Private View: MA Fine Art Show",
      location: "",
      link: "https://www.eventbrite.co.uk/e/ma-fine-art-exhibition-university-of-east-london-tickets-199598311221",
    },
  ],
  "Thu 3 Sep": [
    {
      id: "t1",
      time: "10:00",
      title: "Creative Futures x CIRCA Research Conference",
      location: "The Source",
      link: "https://www.eventbrite.co.uk/e/creative-industries-research-festival-building-an-inclusive-creative-indu-tickets-199494864209",
    },
    {
      id: "t2",
      time: "11:00",
      title: "MBA Fashion: Different Ideas, Different Identities",
      location: "",
      link: "https://www.eventbrite.co.uk/e/different-ideas-different-identities-one-creative-future-tickets-199664578529",
    },
    {
      id: "t3",
      time: "11:00",
      title: "TLSS x UEL Global League: Installation",
      location: "",
      link: "https://www.eventbrite.co.uk/e/tlss-x-uel-global-league-tickets-199714499644",
    },
    {
      id: "t4",
      time: "11:00",
      title: "Regenerative Fashion Archive (RFA)",
      location: "",
      link: "https://www.eventbrite.co.uk/e/regenerative-fashion-archive-rfa-gf-rcds-emerging-designer-collection-l-tickets-199714517698",
    },
    {
      id: "t5",
      time: "11:00",
      title: "RFA x GDIPU x JISULIFE: Climate Control Centre",
      location: "",
      link: "https://www.eventbrite.co.uk/e/rfa-x-gdipu-x-jisulife-climate-control-centre-tickets-199714448892",
    },
    {
      id: "t6",
      time: "11:00",
      title: "Immersive Horror Demo",
      location: "",
      link: "https://www.eventbrite.co.uk/e/immersive-horror-game-demo-tickets-199663697594",
    },
    {
      id: "t7",
      time: "11:00",
      title: "Creative Careers Lab",
      location: "UEL",
      link: "https://www.eventbrite.co.uk/e/creative-careers-lab-tickets-199665764677",
    },
    {
      id: "t8",
      time: "11:00",
      title: "Caramel Rock: Drop-in Making Workshop",
      location: "",
      link: "",
    },
    {
      id: "t9",
      time: "12:00",
      title: "Canva Workshop: Making It With Canva",
      location: "Living Library",
      link: "https://www.eventbrite.co.uk/e/making-it-with-canva-from-training-to-the-creator-economy-tickets-199400126245",
    },
    {
      id: "t10",
      time: "13:00",
      title: "London Higher Talk: Networking and Freelancing",
      location: "",
      link: "https://www.eventbrite.co.uk/e/networking-and-freelancing-essential-skills-for-the-creative-industries-tickets-199598123560",
    },
    {
      id: "t11",
      time: "14:00",
      title: "Beyond the Classroom: Achieving Success as a Graduate",
      location: "",
      link: "https://www.eventbrite.co.uk/e/beyond-the-classroom-achieving-success-as-a-graduate-tickets-199664434398",
    },
    {
      id: "t12",
      time: "14:00",
      title: "Akanda Productions: Creative Speedwriting Camp & Cypher",
      location: "Hackathon Space",
      link: "https://www.eventbrite.co.uk/e/creative-speedwriting-camp-cypher-tickets-199598198585",
    },
    {
      id: "t13",
      time: "15:00",
      title: "Learning by Doing: A Creative Applied Education Workshop",
      location: "",
      link: "https://www.eventbrite.co.uk/e/learning-by-doing-a-creative-applied-education-workshop-tickets-199663849448",
    },
  ],
  "Fri 4 Sep": [
    {
      id: "f1",
      time: "09:30",
      title: "Creative Futures x CIRCA Research Conference",
      location: "The Source",
      link: "https://www.eventbrite.co.uk/e/creative-industries-research-festival-building-an-inclusive-creative-indu-tickets-199494952673",
    },
    {
      id: "f2",
      time: "10:00",
      title: "House of Kings",
      location: "The Source",
      link: "https://www.eventbrite.co.uk/e/house-of-kings-building-young-black-creative-leaders-through-the-arts-tickets-199715368042",
    },
    {
      id: "f3",
      time: "10:00",
      title: "Grow London Local Coffee Morning",
      location: "Café Area",
      link: "",
    },
    {
      id: "f4",
      time: "11:00",
      title: "Creative Careers Lab",
      location: "UEL",
      link: "https://www.eventbrite.co.uk/e/creative-careers-lab-tickets-199665764677",
    },
    {
      id: "f5",
      time: "11:00",
      title: "TLSS x UEL Global League: Installation",
      location: "",
      link: "https://www.eventbrite.co.uk/e/tlss-x-uel-global-league-tickets-199714499644",
    },
    {
      id: "f6",
      time: "11:00",
      title: "RFA x GDIPU x JISULIFE: Climate Control Centre",
      location: "",
      link: "https://www.eventbrite.co.uk/e/rfa-x-gdipu-x-jisulife-climate-control-centre-tickets-199714448892",
    },
    {
      id: "f7",
      time: "11:00",
      title: "Regenerative Fashion Archive (RFA)",
      location: "",
      link: "https://www.eventbrite.co.uk/e/regenerative-fashion-archive-rfa-gf-rcds-emerging-designer-collection-l-tickets-199714517698",
    },
    {
      id: "f8",
      time: "11:00",
      title: "RDCS and TerraDock Open Day",
      location: "",
      link: "",
    },
    {
      id: "f9",
      time: "11:00",
      title: "One Newham: Creative Health in Newham",
      location: "Living Library",
      link: "https://www.eventbrite.co.uk/e/creative-health-in-newham-from-citizen-voice-to-neighbourhood-delivery-tickets-199563191979",
    },
    {
      id: "f10",
      time: "12:00",
      title: "DASH Arts Workshop: Speak Out, Find Your Voice",
      location: "",
      link: "https://www.eventbrite.co.uk/e/speak-out-find-your-voice-a-taster-workshop-with-dash-arts-tickets-199466316221",
    },
    {
      id: "f11",
      time: "13:00",
      title: "Different Minds, Creative Strengths Workshop",
      location: "",
      link: "https://www.eventbrite.co.uk/e/different-minds-creative-strengths-an-interactive-neurodiversity-worksho-tickets-199663864794",
    },
    {
      id: "f12",
      time: "13:00",
      title: "ACI Advisory Board: Who's in Control",
      location: "The Source",
      link: "https://www.eventbrite.co.uk/e/industry-insider-panel-discussion-whos-in-control-tickets-199663797693",
    },
    {
      id: "f13",
      time: "14:00",
      title: "Care-Centred Co-Creation with Communities Workshop",
      location: "",
      link: "https://www.eventbrite.co.uk/e/care-centred-co-creation-with-communities-tickets-199664491870",
    },
    {
      id: "f14",
      time: "14:00",
      title: "Akanda Productions: Seema — Short Film Screening & Q&A",
      location: "Hackathon Space",
      link: "https://www.eventbrite.co.uk/e/seema-short-film-screening-qa-tickets-199591156421",
    },
  ],
  "Sat 5 Sep": [
    {
      id: "s1",
      time: "15:30",
      title: "The Cypher: Black Women Own the Element",
      location: "The Source",
      link: "https://www.eventbrite.co.uk/e/the-cypher-black-women-own-the-element-tickets-199383318472",
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

  const openLink = (url) => {
    if (url) Linking.openURL(url);
  };

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
            <TouchableOpacity 
              key={event.id}
              activeOpacity={1}
              onPress={() => {}}
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

              {!!event.link && (
                <Feather
                  name="external-link"
                  size={16}
                  color={colors.textMuted}
                />
              )}
            </TouchableOpacity>
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
