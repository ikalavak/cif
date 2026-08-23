import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageBackground,
  Alert,
} from "react-native";
import SafeScreen from "../components/SafeScreen";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import { db } from "../config/firebase";
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&q=80";

// Defaults match what used to be hardcoded — used until Firestore loads.
// Note: the CTA card stays guest-specific ("Create your account") and is
// NOT driven by the admin panel's cta_* fields — those control the
// logged-in "Explore Events" CTA on HomeScreen.js, which doesn't make
// sense for a guest who can't book anything yet.
const DEFAULT_SETTINGS = {
  hero_badge: "FREE FESTIVAL",
  hero_title: "Creative Industries Festival 2026",
  hero_subtitle: "Creative Balance: Good Work, Health and Life",
  hero_dates: "2 – 5 September 2026",
  hero_locations: "Royal Docks & Stratford",
  hero_image_url: FALLBACK_IMAGE,
  about_text:
    "Explore how creativity can help us find balance in our work, health and lives. Discover talks, workshops and industry collaborations focused on inclusion, wellbeing, innovation and the future of creative work.",
  highlights: [
    {
      id: "1",
      icon: "briefcase",
      title: "Careers",
      text: "Meet employers and get CV and portfolio advice.",
    },
    {
      id: "2",
      icon: "scissors",
      title: "Fashion",
      text: "Explore creative fashion design and sustainable fashion-tech.",
    },
    {
      id: "3",
      icon: "film",
      title: "Screen",
      text: "Learn how to break into film and television.",
    },
    {
      id: "4",
      icon: "users",
      title: "Networking",
      text: "Connect with creatives, businesses and industry professionals.",
    },
  ],
};

export default function HomeGuest({ navigation }) {
  const { colors } = useTheme();

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const promptSignUp = () => {
    Alert.alert(
      "Sign up required",
      "You need an account to view a portfolio. Create one now — it only takes a minute.",
      [
        { text: "Not now", style: "cancel" },
        { text: "Sign Up", onPress: () => navigation.navigate("SignUp") },
      ],
    );
  };

  useEffect(() => {
    const ref = doc(db, "site_settings", "home");
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSettings({
          ...DEFAULT_SETTINGS,
          ...data,
          hero_image_url: data.hero_image_url || FALLBACK_IMAGE,
          highlights:
            Array.isArray(data.highlights) && data.highlights.length > 0
              ? data.highlights
              : DEFAULT_SETTINGS.highlights,
        });
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    });
    return unsubscribe;
  }, []);

  const [festivalEvents, setFestivalEvents] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "events"),
      orderBy("start_date", "asc"),
      limit(6),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFestivalEvents(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, []);

  return (
    <SafeScreen
      scroll
      style={[styles.screen, { backgroundColor: colors.bg }]}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* HEADER */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.greetingText, { color: colors.textMuted }]}>
            Welcome, Guest 👋
          </Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Creative Industries Festival
          </Text>
        </View>

        <View style={styles.headerIcons}>
          <ThemeToggle />
        </View>
      </View>

      {/* HERO CARD */}
      <View
        style={[
          styles.heroCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <ImageBackground
          source={{ uri: settings.hero_image_url }}
          resizeMode="cover"
          style={styles.heroImage}
          imageStyle={styles.heroImageRadius}
        >
          <View style={styles.heroFallbackBg} />
          <View style={styles.heroOverlay} />

          <View style={styles.heroContent}>
            <View
              style={[styles.freeBadge, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.freeBadgeText}>{settings.hero_badge}</Text>
            </View>

            <Text style={styles.heroTitle}>{settings.hero_title}</Text>
            <Text style={styles.heroSubtitle}>{settings.hero_subtitle}</Text>

            <View style={styles.heroInfoRow}>
              <Feather name="calendar" size={16} color="#FFFFFF" />
              <Text style={styles.heroInfoText}>{settings.hero_dates}</Text>
            </View>
            <View style={styles.heroInfoRow}>
              <Feather name="map-pin" size={16} color="#FFFFFF" />
              <Text style={styles.heroInfoText}>{settings.hero_locations}</Text>
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* ABOUT */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          About the Festival
        </Text>
        <Text style={[styles.bodyText, { color: colors.textMuted }]}>
          {settings.about_text}
        </Text>
      </View>

      {/* QUICK ACTIONS — Events and Gallery are still account-only for guests.
          Portfolio is included but guarded: tapping it prompts sign-up
          instead of navigating, since portfolios belong to a real account. */}
      <View style={styles.quickActionsRow}>
        <ActionBtn
          icon="message-circle"
          color={colors.accent}
          label="Forum"
          colors={colors}
          onPress={() => navigation.navigate("ForumScreen")}
        />
        <ActionBtn
          icon="briefcase"
          color={colors.success}
          label="Jobs"
          colors={colors}
          onPress={() => navigation.navigate("JobBoard")}
        />
        <ActionBtn
          icon="user"
          color={colors.primary}
          label="Portfolio"
          colors={colors}
          onPress={promptSignUp}
        />
      </View>

      {/* FESTIVAL EVENTS */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Festival Events
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
            Discover what's happening
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("Events")}>
          <Text style={[styles.seeAllText, { color: colors.primary }]}>
            See All
          </Text>
        </TouchableOpacity>
      </View>

      {festivalEvents.length === 0 ? (
        <Text
          style={{
            color: colors.textMuted,
            fontSize: 13,
            paddingHorizontal: 20,
            marginBottom: 20,
          }}
        >
          No events published yet — check back soon.
        </Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.eventsScroll}
        >
          {festivalEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              activeOpacity={0.9}
              style={[
                styles.eventCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => navigation.navigate("Events")}
            >
              <Image
                source={{ uri: event.image_url || settings.hero_image_url }}
                style={styles.eventImage}
              />
              <View style={styles.eventContent}>
                <View style={styles.eventDateRow}>
                  <Feather name="calendar" size={13} color={colors.primary} />
                  <Text style={[styles.eventDate, { color: colors.primary }]}>
                    {event.start_date
                      ? event.start_date
                          .toDate()
                          .toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                          })
                      : ""}
                  </Text>
                </View>
                <Text
                  style={[styles.eventTitle, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {event.title}
                </Text>
                {!!event.category && (
                  <Text
                    style={[
                      styles.eventDescription,
                      { color: colors.textMuted },
                    ]}
                    numberOfLines={2}
                  >
                    {event.category}
                  </Text>
                )}
                {!!event.venue && (
                  <View style={styles.locationRow}>
                    <Feather
                      name="map-pin"
                      size={13}
                      color={colors.textMuted}
                    />
                    <Text
                      style={[styles.locationText, { color: colors.textMuted }]}
                    >
                      {event.venue}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* FESTIVAL HIGHLIGHTS */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Festival Highlights
        </Text>
      </View>
      <View style={styles.highlightsGrid}>
        {settings.highlights.map((hl, i) => (
          <HighlightCard
            key={hl.id || i}
            icon={hl.icon}
            title={hl.title}
            text={hl.text}
            colors={colors}
          />
        ))}
      </View>

      {/* VENUES */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Festival Venues
        </Text>
      </View>
      <View
        style={[
          styles.venueCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={[styles.venueIcon, { backgroundColor: colors.input }]}>
          <Feather name="map-pin" size={22} color={colors.primary} />
        </View>
        <View style={styles.venueTextContainer}>
          <Text style={[styles.venueTitle, { color: colors.text }]}>
            Royal Docks Centre for Sustainability
          </Text>
          <Text style={[styles.venueDescription, { color: colors.textMuted }]}>
            University Way, London, E16 2RD
          </Text>
        </View>
      </View>
      <View
        style={[
          styles.venueCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={[styles.venueIcon, { backgroundColor: colors.input }]}>
          <Feather name="map-pin" size={22} color={colors.accent} />
        </View>
        <View style={styles.venueTextContainer}>
          <Text style={[styles.venueTitle, { color: colors.text }]}>
            The Source, Stratford
          </Text>
          <Text style={[styles.venueDescription, { color: colors.textMuted }]}>
            Theatre Square, Stratford, London, E15 1BX
          </Text>
        </View>
      </View>

      {/* CTA — sign up, instead of the logged-in "Explore Events" CTA */}
      <View style={[styles.ctaCard, { backgroundColor: colors.primary }]}>
        <Feather
          name="user-plus"
          size={26}
          color="#FFFFFF"
          style={{ marginBottom: 10 }}
        />
        <Text style={styles.ctaTitle}>Create your account</Text>
        <Text style={styles.ctaText}>
          Sign up to book events, save your favourites and connect with the
          creative community.
        </Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate("SignUp")}
        >
          <Text style={[styles.ctaButtonText, { color: colors.primary }]}>
            Sign Up
          </Text>
          <Feather name="arrow-right" size={17} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </SafeScreen>
  );
}

const ActionBtn = ({ icon, color, label, colors, onPress }) => (
  <TouchableOpacity
    style={styles.actionBtn}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View
      style={[
        styles.actionIconBg,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Feather name={icon} size={21} color={color} />
    </View>
    <Text style={[styles.actionLabel, { color: colors.text }]}>{label}</Text>
  </TouchableOpacity>
);

const HighlightCard = ({ icon, title, text, colors }) => (
  <View
    style={[
      styles.highlightCard,
      { backgroundColor: colors.card, borderColor: colors.border },
    ]}
  >
    <Feather name={icon || "star"} size={22} color={colors.primary} />
    <Text style={[styles.highlightTitle, { color: colors.text }]}>{title}</Text>
    <Text style={[styles.highlightText, { color: colors.textMuted }]}>
      {text}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
  },
  headerTextContainer: { flex: 1 },
  greetingText: { fontSize: 13, marginBottom: 4 },
  headerTitle: { fontSize: 16, fontWeight: "700", maxWidth: 240 },
  headerIcons: { flexDirection: "row", alignItems: "center", gap: 10 },

  heroCard: {
    marginHorizontal: 20,
    marginBottom: 26,
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  heroImage: {
    width: "100%",
    height: 310,
    justifyContent: "flex-end",
    backgroundColor: "#1a1a2e",
  },
  heroImageRadius: { borderRadius: 22 },
  heroFallbackBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#15161f",
    borderRadius: 22,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.52)",
    zIndex: 1,
    borderRadius: 22,
  },
  heroContent: { padding: 22, zIndex: 2 },
  freeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 11,
  },
  freeBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "800",
    marginBottom: 9,
  },
  heroSubtitle: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    marginBottom: 15,
  },
  heroInfoRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  heroInfoText: {
    color: "#FFFFFF",
    fontSize: 13,
    marginLeft: 8,
    fontWeight: "600",
  },

  section: { paddingHorizontal: 20, marginBottom: 25 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 19, fontWeight: "800" },
  sectionSubtitle: { fontSize: 12, marginTop: 3 },
  bodyText: { fontSize: 14, lineHeight: 22, marginTop: 8 },
  seeAllText: { fontSize: 13, fontWeight: "700" },

  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 30,
  },
  actionBtn: { alignItems: "center", flex: 1 },
  actionIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 7,
    borderWidth: 1,
  },
  actionLabel: { fontSize: 11, fontWeight: "600" },

  eventsScroll: { paddingLeft: 20, paddingRight: 20, paddingBottom: 10 },
  eventCard: {
    width: 275,
    borderRadius: 18,
    borderWidth: 1,
    marginRight: 14,
    overflow: "hidden",
    elevation: 2,
  },
  eventImage: { width: "100%", height: 145 },
  eventContent: { padding: 15 },
  eventDateRow: { flexDirection: "row", alignItems: "center", marginBottom: 7 },
  eventDate: { fontSize: 11, fontWeight: "700", marginLeft: 5 },
  eventTitle: {
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 21,
    marginBottom: 7,
  },
  eventDescription: { fontSize: 12, lineHeight: 18, marginBottom: 10 },
  locationRow: { flexDirection: "row", alignItems: "center" },
  locationText: { fontSize: 11, marginLeft: 5 },

  highlightsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 25,
  },
  highlightCard: {
    width: "48%",
    minHeight: 145,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  highlightTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginTop: 12,
    marginBottom: 6,
  },
  highlightText: { fontSize: 11, lineHeight: 17 },

  venueCard: {
    marginHorizontal: 20,
    borderRadius: 15,
    borderWidth: 1,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  venueIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  venueTextContainer: { flex: 1, marginLeft: 13 },
  venueTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  venueDescription: { fontSize: 11, lineHeight: 16 },

  ctaCard: {
    marginHorizontal: 20,
    marginTop: 18,
    padding: 22,
    borderRadius: 20,
  },
  ctaTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
    marginBottom: 8,
  },
  ctaText: {
    color: "#FFFFFF",
    opacity: 0.9,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 18,
  },
  ctaButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaButtonText: { fontSize: 13, fontWeight: "800" },
});
