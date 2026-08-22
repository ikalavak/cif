import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import SafeScreen from "../components/SafeScreen";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { auth, db } from "../config/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  runTransaction,
} from "firebase/firestore";
import QRCode from "react-native-qrcode-svg";

export default function MyTicketsScreen({ navigation }) {
  const { colors } = useTheme();
  const user = auth.currentUser;

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "bookings"),
      where("userId", "==", user.uid),
      orderBy("created_at", "desc"),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setTickets(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsubscribe;
  }, [user?.uid]);

  const cancelTicket = async (ticket) => {
    Alert.alert(
      "Cancel this ticket?",
      `${ticket.eventTitle} — ${ticket.eventDate}, ${ticket.eventTime}`,
      [
        { text: "Keep ticket", style: "cancel" },
        {
          text: "Cancel ticket",
          style: "destructive",
          onPress: async () => {
            setCancellingId(ticket.id);
            try {
              await runTransaction(db, async (transaction) => {
                const eventRef = doc(db, "events", ticket.eventId);
                const eventSnap = await transaction.get(eventRef);
                if (eventSnap.exists()) {
                  const currentCount = eventSnap.data().booked_count || 0;
                  transaction.update(eventRef, {
                    booked_count: Math.max(0, currentCount - 1),
                  });
                }
                transaction.delete(doc(db, "bookings", ticket.id));
              });
            } catch (err) {
              Alert.alert("Something went wrong", err.message);
            } finally {
              setCancellingId(null);
            }
          },
        },
      ],
    );
  };

  if (!user) {
    return (
      <SafeScreen style={[styles.screen, { backgroundColor: colors.bg }]}>
        <View style={styles.backRow}>
          <TouchableOpacity
            onPress={() => navigation?.goBack?.()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="arrow-left" size={20} color={colors.text} />
            <Text style={[styles.backText, { color: colors.text }]}>
              My Tickets
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          Please log in to view your tickets.
        </Text>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={styles.backRow}>
        <TouchableOpacity
          onPress={() => navigation?.goBack?.()}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>
            My Tickets
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.headerRow}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>
          My Tickets
        </Text>
        <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
          {tickets.length} confirmed event{tickets.length === 1 ? "" : "s"}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : tickets.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          You haven't booked any events yet.
        </Text>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, gap: 16 }}
          renderItem={({ item }) => (
            <View
              style={[
                styles.ticketCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              {/* Ticket Main Details & QR Code */}
              <View style={styles.ticketTop}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.eventTitle, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {item.eventTitle}
                  </Text>
                  <View style={styles.metaRow}>
                    <Feather
                      name="calendar"
                      size={12}
                      color={colors.textMuted}
                    />
                    <Text
                      style={[styles.metaText, { color: colors.textMuted }]}
                    >
                      {item.eventDate} • {item.eventTime}
                    </Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Feather name="user" size={12} color={colors.textMuted} />
                    <Text
                      style={[styles.metaText, { color: colors.textMuted }]}
                    >
                      {item.userEmail || "Confirmed Attendee"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: colors.primary + "18" },
                    ]}
                  >
                    <Text
                      style={[styles.statusText, { color: colors.primary }]}
                    >
                      Confirmed • {item.status || "Valid Pass"}
                    </Text>
                  </View>
                </View>

                <View style={styles.qrWrap}>
                  <QRCode value={item.id} size={72} />
                </View>
              </View>

              <View style={[styles.divider, { borderColor: colors.border }]} />

              {/* Confirmation Details Footer */}
              <View style={styles.ticketBottom}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={[styles.refLabel, { color: colors.textMuted }]}>
                    TICKET REF / ENTRY CODE
                  </Text>
                  <Text
                    style={[styles.refText, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {item.id}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => cancelTicket(item)}
                  disabled={cancellingId === item.id}
                >
                  <Text style={[styles.cancelText, { color: "#d1435b" }]}>
                    {cancellingId === item.id
                      ? "Cancelling..."
                      : "Cancel Booking"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  backButton: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { fontSize: 15, fontWeight: "600" },
  headerRow: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  pageTitle: { fontSize: 26, fontWeight: "bold", marginBottom: 4 },
  pageSubtitle: { fontSize: 14 },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
    paddingHorizontal: 20,
  },

  ticketCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  ticketTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 21,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  metaText: { fontSize: 12 },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 6,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  qrWrap: {
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: { borderTopWidth: 1, marginVertical: 12 },
  ticketBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  refLabel: { fontSize: 9, fontWeight: "700", tracking: 0.5, marginBottom: 2 },
  refText: { fontSize: 12, fontWeight: "600" },
  cancelText: { fontSize: 13, fontWeight: "700" },
});
