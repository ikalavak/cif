import React, { useState, useMemo } from "react";
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

// Complete dataset mapped from the 2026 Schedule document
const SCHEDULE = {
  "Wed 2 Sep": [
    {
      id: "w1",
      time: "11:00 – 16:00",
      title: "Creative Careers Lab",
      location: "RDCS GF exhibition – right",
      organizer: "UEL",
      category: "Careers & Networking",
      description:
        "Offers careers and employment support, opportunities to meet employers, view exhibitions and join in fun activities designed to help you network with fellow creatives.",
      image:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "w2",
      time: "11:00 – 12:00",
      title:
        "ACI Advisory Board - Industry Insiders Talk: You’ve got the Degree. Now What?",
      location: "RDCS GF exhibition – left",
      organizer: "UEL",
      category: "Panel Discussion",
      description:
        "Industry Insiders Talk focusing on post-graduation transitions, navigating the job market, and building long-term creative careers.",
      image:
        "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "w3",
      time: "11:00 – 15:00",
      title:
        "MBA Fashion - Different ideas. Different identities. One creative future.",
      location: "Exhibition Space",
      organizer: "UEL",
      category: "Fashion Showcase",
      description:
        "Exhibition and discussions showcasing diverse identities and creative ideas defining the future of fashion.",
      image:
        "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "w4",
      time: "11:00 – 15:00",
      title: "Immersive Horror Demo",
      location: "RDCS GF exhibition – right",
      organizer: "UEL",
      category: "Interactive & VR",
      description:
        "Hands-on experience with cutting-edge immersive horror game demos developed by emerging creators.",
      image:
        "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "w5",
      time: "12:00 – 13:00",
      title: "Searchlight: Which Career is Right for Me workshop",
      location: "RDCS GF exhibition – right",
      organizer: "Searchlight",
      category: "Workshop",
      description:
        "Interactive session designed to help you identify your core creative strengths and map out industry pathways.",
      image:
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "w6",
      time: "13:00 – 14:00",
      title: "Lazy Oaf Workshop: Designing the Oaf Way",
      location: "Community Hub – doors open",
      organizer: "Lazy Oaf",
      category: "Design Workshop",
      description:
        "Creative fashion design workshop with the Lazy Oaf team exploring bold graphics, non-conformist aesthetic choices, and playful branding.",
      image:
        "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "w7",
      time: "14:00 – 15:00",
      title: "Searchlight Workshop: CV / Portfolio Reviews",
      location: "RDCS GF exhibition – right",
      organizer: "Searchlight Recruitment",
      category: "Mentorship",
      description:
        "1-on-1 portfolio and CV review sessions delivered directly by industry professionals and recruiters.",
      image:
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "w8",
      time: "15:00 – 16:00",
      title: "London Higher Panel Talk: Breaking into Screen",
      location: "RDCS GF exhibition – left",
      organizer: "London Higher",
      category: "Film & Screen",
      description:
        "Panel discussion on early careers, networking, and entry points within the screen and media industries.",
      image:
        "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "w9",
      time: "16:00 – 19:00",
      title: "Regenerative Fashion Archive (RFA) GF RCDS MA / MFA",
      location: "Archive Room",
      organizer: "RFA / RCDS",
      category: "Exhibition",
      description:
        "Emerging designer collection showcase highlighting sustainable, regenerative practices in contemporary fashion.",
      image:
        "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "w10",
      time: "16:00 – 19:00",
      title: "TLSS x UEL GLOBAL LEAGUE",
      location: "RDCS GF exhibition – right",
      organizer: "TLSS x UEL",
      category: "Fashion-Tech",
      description:
        "Interactive installation showcasing innovative fashion design and cutting-edge Fashion-Tech developments.",
      image:
        "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "w11",
      time: "16:00 – 19:00",
      title: "RFA x GDIPU x JISULIFE - Climate Control Centre Launch",
      location: "RDCS GF exhibition – right",
      organizer: "RFA / GDIPU / JISULIFE",
      category: "Competition",
      description:
        "Launch of the Sustainable Fashion-Tech & Wearables Industry Competition focusing on climate-adaptive design.",
      image:
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "w12",
      time: "17:00 – 19:00",
      title: "Private View: MA Fine Art Show, University of East London",
      location: "AVA",
      organizer: "UEL Fine Art",
      category: "Art Gallery",
      description:
        "Exclusive opening reception celebrating the final works from the graduating MA Fine Art cohort.",
      image:
        "https://images.unsplash.com/photo-1561214115-f2f134cc4912?q=80&w=800&auto=format&fit=crop",
    },
  ],
  "Thu 3 Sep": [
    {
      id: "t1",
      time: "10:00 – 16:00",
      title: "Creative Futures CIC x CIRCA Research Conference 2026",
      location: "The Source",
      organizer: "CIRCA / CFC",
      category: "Conference",
      description:
        "Freelancers: Creative Balance: Good Work, Health and Life — explore key issues around well-being and sustainability for creative freelancers.",
      image:
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "t2",
      time: "11:00 – 15:00",
      title: "MBA Fashion - Different ideas. Different identities.",
      location: "Community Hub ground floor",
      organizer: "UEL",
      category: "Fashion",
      description:
        "Exhibition and presentations centered on inclusive creative identities in global fashion.",
      image:
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "t3",
      time: "11:00 – 15:00",
      title: "Caramel Rock – Drop in Making Workshop",
      location: "RDCS GF exhibition – right",
      organizer: "Caramel Rock",
      category: "Hands-on Workshop",
      description:
        "Drop-in making workshop hosted by fashion and creative arts education charity Caramel Rock.",
      image:
        "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "t4",
      time: "12:00 – 13:00",
      title: "Canva Workshop: Making It With Canva",
      location: "Living Library",
      organizer: "Canva",
      category: "Digital Skills",
      description:
        "From Training to the Creator Economy — learn essential layout, branding, and design tricks using Canva.",
      image:
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "t5",
      time: "13:00 – 14:00",
      title: "London Higher Talk: Networking and Freelancing",
      location: "RDCS GF exhibition – left",
      organizer: "London Higher",
      category: "Careers",
      description:
        "Essential skills for freelancing, client management, and effective industry networking.",
      image:
        "https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "t6",
      time: "14:00 – 18:00",
      title: "Akanda Productions: Creative Speedwriting Camp & Cypher",
      location: "Hackathon Space",
      organizer: "Akanda Productions",
      category: "Writing Intensive",
      description:
        "In partnership with Sustainable Creative Community Tree Tales, Karatasi Collective & RSM Records — fast-paced writing workshop and cypher.",
      image:
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800&auto=format&fit=crop",
    },
  ],
  "Fri 4 Sep": [
    {
      id: "f1",
      time: "09:30 – 13:00",
      title: "Creative Futures CIC x CIRCA Research Conference 2026",
      location: "The Source",
      organizer: "CIRCA / CFC",
      category: "Conference",
      description:
        "Day 2 sessions on creative health, sustainable freelancing models, and industry policy.",
      image:
        "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "f2",
      time: "10:00 – 12:30",
      title: "House of Kings",
      location: "The Source",
      organizer: "House of Kings",
      category: "Leadership & Arts",
      description:
        "Empowering young Black creative leaders through performance arts, mentorship, and creative platforms.",
      image:
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "f3",
      time: "10:00 – 12:00",
      title: "Grow London Local Coffee Morning",
      location: "RDCS Café Area",
      organizer: "Grow London Local",
      category: "Networking",
      description:
        "Casual coffee morning for small business owners, freelancers, and local entrepreneurs to connect.",
      image:
        "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "f4",
      time: "11:00 – 13:30",
      title: "One Newham: Creative Health in Newham",
      location: "Living Library",
      organizer: "One Newham",
      category: "Community Health",
      description:
        "From Citizen Voice to Neighbourhood Delivery — exploring community-led art and health initiatives.",
      image:
        "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "f5",
      time: "12:00 – 13:00",
      title: "DASH ARTS – WORKSHOP: Speak Out, Find Your Voice",
      location: "RDCS GF exhibition – left",
      organizer: "DASH Arts",
      category: "Performance Workshop",
      description:
        "Expressive voice and storytelling workshop encouraging participants to build stage presence.",
      image:
        "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "f6",
      time: "13:00 – 14:00",
      title: "Different Minds, Creative Strengths: Neurodiversity Workshop",
      location: "RDCS",
      organizer: "UEL",
      category: "Interactive Workshop",
      description:
        "Interactive session celebrating neurodivergent strengths and practical strategies in creative work.",
      image:
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "f7",
      time: "14:00 – 17:00",
      title: "Akanda Productions: Seema - Short Film Screening & Q&A",
      location: "Hackathon Space",
      organizer: "Akanda Productions",
      category: "Film Screening",
      description:
        "Short Film Screening ft. live Q&A with Writer Izzy Kaur & Director Daniel Oluwasayo Olabode.",
      image:
        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop",
    },
  ],
  "Sat 5 Sep": [
    {
      id: "s1",
      time: "15:30 – 17:00",
      title: "The CYPHER: Black Women Own the Element",
      location: "The Source",
      organizer: "UEL / Sadler's Wells",
      category: "Live Showcase",
      description:
        "Female DJs, B-girls, Poppers, MCs, Graffiti & filmmakers featuring guest performances from Sadlers Wells Academy Breakin' Convention.",
      image:
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop",
    },
  ],
};

const DAYS = Object.keys(SCHEDULE);

export default function EventsScreen() {
  const { colors } = useTheme();
  const [activeDay, setActiveDay] = useState(DAYS[0]);
  const [query, setQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const events = useMemo(() => {
    const dayEvents = SCHEDULE[activeDay] || [];
    if (!query) return dayEvents;
    return dayEvents.filter(
      (e) =>
        e.title.toLowerCase().includes(query.toLowerCase()) ||
        e.category.toLowerCase().includes(query.toLowerCase()),
    );
  }, [activeDay, query]);

  // Dedicated Detail View
  if (selectedEvent) {
    return (
      <SafeScreen
        scroll
        style={[styles.screen, { backgroundColor: colors.bg }]}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.detailHeader}>
          <TouchableOpacity
            onPress={() => setSelectedEvent(null)}
            style={[styles.backButton, { backgroundColor: colors.card }]}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.detailHeaderTitle, { color: colors.text }]}>
            Event Details
          </Text>
        </View>

        <Image
          source={{ uri: selectedEvent.image }}
          style={styles.detailBannerImage}
        />

        <View style={styles.detailContent}>
          <Text style={[styles.categoryTag, { color: colors.primary }]}>
            {selectedEvent.category}
          </Text>
          <Text style={[styles.detailTitle, { color: colors.text }]}>
            {selectedEvent.title}
          </Text>
          <Text style={[styles.organizerText, { color: colors.textMuted }]}>
            By {selectedEvent.organizer}
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={colors.primary}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                Date & Time
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {activeDay} • {selectedEvent.time}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="location-outline"
              size={20}
              color={colors.primary}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                Location
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {selectedEvent.location}
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionHeading, { color: colors.text }]}>
            About this event
          </Text>
          <Text style={[styles.descriptionText, { color: colors.textMuted }]}>
            {selectedEvent.description}
          </Text>

          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: colors.primary }]}
            onPress={() => alert("Added to your schedule!")}
          >
            <Text style={styles.ctaButtonText}>Save Event</Text>
          </TouchableOpacity>
        </View>
      </SafeScreen>
    );
  }

  // Eventbrite Style Feed
  return (
    <SafeScreen
      scroll
      style={[styles.screen, { backgroundColor: colors.bg }]}
      contentContainerStyle={{ paddingBottom: 30, paddingTop: 8 }}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Events</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
            Explore festival sessions
          </Text>
        </View>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.input }]}>
        <Feather
          name="search"
          size={18}
          color={colors.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search events, topics..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
        />
      </View>

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
                  backgroundColor: active ? colors.primary : colors.card,
                },
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  {
                    color: active ? "#FFF" : colors.text,
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

      <View style={{ paddingHorizontal: 20 }}>
        {events.length === 0 ? (
          <Text
            style={{ color: colors.textMuted, fontSize: 14, marginTop: 12 }}
          >
            No events found matching your criteria.
          </Text>
        ) : (
          events.map((event) => (
            <TouchableOpacity
              key={event.id}
              activeOpacity={0.88}
              onPress={() => setSelectedEvent(event)}
              style={[
                styles.eventCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Image source={{ uri: event.image }} style={styles.cardImage} />

              <View style={styles.cardBody}>
                <Text style={[styles.cardTime, { color: colors.primary }]}>
                  {event.time}
                </Text>

                <Text
                  style={[styles.cardTitle, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {event.title}
                </Text>

                <View style={styles.cardFooter}>
                  <Feather name="map-pin" size={12} color={colors.textMuted} />
                  <Text
                    style={[styles.locationText, { color: colors.textMuted }]}
                    numberOfLines={1}
                  >
                    {event.location}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  pageTitle: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 13, marginTop: 2 },
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14 },

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

  /* Eventbrite Style Cards */
  eventCard: {
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardImage: {
    width: "100%",
    height: 140,
  },
  cardBody: {
    padding: 14,
  },
  cardTime: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    fontSize: 12,
    flex: 1,
  },

  /* Detail View */
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  detailHeaderTitle: { fontSize: 16, fontWeight: "600" },
  detailBannerImage: {
    width: "100%",
    height: 220,
  },
  detailContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  categoryTag: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
    marginBottom: 6,
  },
  organizerText: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  infoLabel: { fontSize: 11, fontWeight: "500" },
  infoValue: { fontSize: 13, fontWeight: "600", marginTop: 2 },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  ctaButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
