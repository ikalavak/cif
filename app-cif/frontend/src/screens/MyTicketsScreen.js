// src/screens/MyTicketsScreen.js
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Share,
} from "react-native";
import SafeScreen from "../components/SafeScreen";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import QRCode from "react-native-qrcode-svg";
import { auth, db } from "../config/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  runTransaction,
} from "firebase/firestore";

export default function MyTicketsScreen({ navigation }) {
  const { colors } = useTheme();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser?.uid) {
      setBookings([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "bookings"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ticketList = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setBookings(ticketList);
        setLoading(false);
      },
      (error) => {
        console.warn("Tickets listener error:", error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const handleCancelBooking = (booking) => {
    Alert.alert(
      "Cancel Registration",
      `Are you sure you want to cancel your pass for "${booking.eventTitle || "this event"}"?`,
      [
        { text: "Keep Ticket", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            setCancellingId(booking.id);
            try {
              await runTransaction(db, async (transaction) => {
                const eventRef = doc(db, "events", booking.eventId);
                const eventSnap = await transaction.get(eventRef);

                if (eventSnap.exists()) {
                  const currentCount = eventSnap.data()?.booked_count || 0;
                  transaction.update(eventRef, {
                    booked_count: Math.max(0, currentCount - 1),
                  });
                }

                transaction.delete(doc(db, "bookings", booking.id));
              });

              if (selectedTicket?.id === booking.id) {
                setSelectedTicket(null);
              }
            } catch (err) {
              Alert.alert("Cancellation Error", err.message);
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  const handleShareTicket = async (ticket) => {
    try {
      await Share.share({
        title: ticket.eventTitle,
        message: `Creative Industries Festival 2026 Pass\n\nEvent: ${ticket.eventTitle}\nDate: ${ticket.eventDate} at ${ticket.eventTime}\nPass Ref: ${ticket.id.slice(0, 8).toUpperCase()}`,
      });
    } catch (err) {
      console.warn("Share error:", err);
    }
  };

  const renderTicketCard = ({ item }) => {
    const isCancelling = cancellingId === item.id;
    const ticketRef = item.id.slice(0, 8).toUpperCase();

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setSelectedTicket(item)}
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{item.status || "CONFIRMED"}</Text>
          </View>
          <Text style={[styles.refText, { color: colors.textMuted }]}>
            REF: {ticketRef}
          </Text>
        </View>

        <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>
          {item.eventTitle || "Festival Event Pass"}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather name="calendar" size={14} color={colors.primary || "#8B5CF6"} />
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              {item.eventDate || "Date TBC"}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="clock" size={14} color={colors.primary || "#8B5CF6"} />
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              {item.eventTime || "Time TBC"}
            </Text>
          </View>
        </View>

        <View style={[styles.cardDivider, { borderColor: colors.border }]} />

        <View style={styles.cardFooter}>
          <View style={styles.ticketHolderWrap}>
            <Text style={[styles.holderLabel, { color: colors.textMuted }]}>
              Attendee
            </Text>
            <Text style={[styles.holderName, { color: colors.text }]} numberOfLines={1}>
              {item.userName || currentUser?.displayName || "Pass Holder"}
            </Text>
          </View>

          <View style={styles.footerActions}>
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                { borderColor: colors.border, backgroundColor: colors.bg },
              ]}
              onPress={() => handleCancelBooking(item)}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <Feather name="trash-2" size={16} color="#ef4444" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.viewPassBtn,
                { backgroundColor: colors.primary || "#8B5CF6" },
              ]}
              onPress={() => setSelectedTicket(item)}
            >
              <Feather name="maximize-2" size={14} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.viewPassBtnText}>Digital Pass</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeScreen
      scroll={false}
      style={[styles.screen, { backgroundColor: colors.bg }]}
    >
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.card }]}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Tickets</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary || "#8B5CF6"} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Loading your tickets...
          </Text>
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.centered}>
          <View
            style={[
              styles.emptyIconCircle,
              { backgroundColor: (colors.primary || "#8B5CF6") + "20" },
            ]}
          >
            <Feather name="ticket" size={36} color={colors.primary || "#8B5CF6"} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Bookings Found
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            You haven't registered for any festival sessions yet.
          </Text>
          <TouchableOpacity
            style={[
              styles.exploreBtn,
              { backgroundColor: colors.primary || "#8B5CF6" },
            ]}
            onPress={() => navigation.navigate("MainApp", { screen: "Events" })}
          >
            <Text style={styles.exploreBtnText}>Explore Festival Events</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={renderTicketCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FULLSCREEN DIGITAL QR MODAL */}
      <Modal
        visible={!!selectedTicket}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedTicket(null)}
      >
        {selectedTicket && (
          <View style={[styles.modalScreen, { backgroundColor: colors.bg }]}>
            {/* Modal Top Bar */}
            <View
              style={[
                styles.modalTopBar,
                { borderBottomColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <TouchableOpacity
                onPress={() => setSelectedTicket(null)}
                style={styles.modalIconBtn}
              >
                <Feather name="x" size={20} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>
                Digital Entry Pass
              </Text>
              <TouchableOpacity
                onPress={() => handleShareTicket(selectedTicket)}
                style={styles.modalIconBtn}
              >
                <Feather name="share-2" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Boarding-Pass Style Ticket */}
              <View
                style={[
                  styles.ticketModalCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.modalCardHeader}>
                  <Text style={[styles.modalFestTag, { color: colors.primary || "#8B5CF6" }]}>
                    CREATIVE INDUSTRIES FESTIVAL 2026
                  </Text>
                  <Text style={[styles.modalEventTitle, { color: colors.text }]}>
                    {selectedTicket.eventTitle}
                  </Text>
                </View>

                {/* QR Section */}
                <View style={styles.qrContainer}>
                  <View style={styles.qrWhiteBox}>
                    <QRCode
                      value={`CIF-TICKET-${selectedTicket.id}`}
                      size={170}
                      backgroundColor="#ffffff"
                      color="#0f172a"
                    />
                  </View>
                  <Text style={styles.scanNotice}>Scan at venue entrance</Text>
                </View>

                {/* Ticket Details Info */}
                <View style={styles.modalDetailGrid}>
                  <View style={styles.modalDetailCol}>
                    <Text style={[styles.modalLabel, { color: colors.textMuted }]}>
                      ATTENDEE
                    </Text>
                    <Text style={[styles.modalVal, { color: colors.text }]}>
                      {selectedTicket.userName || "Attendee"}
                    </Text>
                  </View>

                  <View style={styles.modalDetailCol}>
                    <Text style={[styles.modalLabel, { color: colors.textMuted }]}>
                      PASS REF
                    </Text>
                    <Text style={[styles.modalVal, { color: colors.text }]}>
                      {selectedTicket.id.slice(0, 8).toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={[styles.modalDetailGrid, { marginTop: 12 }]}>
                  <View style={styles.modalDetailCol}>
                    <Text style={[styles.modalLabel, { color: colors.textMuted }]}>
                      DATE
                    </Text>
                    <Text style={[styles.modalVal, { color: colors.text }]}>
                      {selectedTicket.eventDate || "Date TBC"}
                    </Text>
                  </View>

                  <View style={styles.modalDetailCol}>
                    <Text style={[styles.modalLabel, { color: colors.textMuted }]}>
                      TIME
                    </Text>
                    <Text style={[styles.modalVal, { color: colors.text }]}>
                      {selectedTicket.eventTime || "Time TBC"} BST
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.modalCardFooter,
                    { borderTopColor: colors.border, backgroundColor: colors.bg },
                  ]}
                >
                  <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>VALID ADMISSION</Text>
                  </View>
                  <Text style={[styles.admitQty, { color: colors.textMuted }]}>
                    Admit: 1 Person
                  </Text>
                </View>
              </View>

              {/* Close Pass Button */}
              <TouchableOpacity
                style={[
                  styles.closeModalBtn,
                  { backgroundColor: colors.primary || "#8B5CF6" },
                ]}
                onPress={() => setSelectedTicket(null)}
              >
                <Text style={styles.closeModalBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  listContent: { padding: 16, gap: 14 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  loadingText: { marginTop: 12, fontSize: 14, fontWeight: "600" },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", marginBottom: 6 },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  exploreBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  exploreBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10b98120",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
  },
  statusText: { fontSize: 11, fontWeight: "800", color: "#10b981" },
  refText: { fontSize: 12, fontWeight: "700" },
  eventTitle: { fontSize: 17, fontWeight: "800", lineHeight: 22, marginBottom: 10 },
  metaRow: { flexDirection: "row", gap: 16, marginBottom: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 13, fontWeight: "600" },
  cardDivider: { borderTopWidth: 1, borderStyle: "dashed", marginVertical: 12 },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ticketHolderWrap: { flex: 1, marginRight: 10 },
  holderLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  holderName: { fontSize: 13, fontWeight: "700", marginTop: 2 },
  footerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  cancelBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  viewPassBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  viewPassBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },

  // Modal Pass Styles
  modalScreen: { flex: 1 },
  modalTopBar: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  modalHeaderTitle: { fontSize: 16, fontWeight: "800" },
  modalIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: { flex: 1, padding: 20, justifyContent: "space-between" },
  ticketModalCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 4,
  },
  modalCardHeader: { padding: 18, paddingBottom: 12 },
  modalFestTag: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5, marginBottom: 4 },
  modalEventTitle: { fontSize: 20, fontWeight: "900", lineHeight: 26 },
  qrContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  qrWhiteBox: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    elevation: 3,
  },
  scanNotice: { fontSize: 12, fontWeight: "600", color: "#64748b", marginTop: 10 },
  modalDetailGrid: {
    flexDirection: "row",
    paddingHorizontal: 18,
    justifyContent: "space-between",
  },
  modalDetailCol: { flex: 1 },
  modalLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  modalVal: { fontSize: 14, fontWeight: "700", marginTop: 2 },
  modalCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    marginTop: 18,
  },
  admitQty: { fontSize: 12, fontWeight: "700" },
  closeModalBtn: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  closeModalBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});