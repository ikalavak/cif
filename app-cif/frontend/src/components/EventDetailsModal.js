// src/components/EventDetailsModal.js
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import QRCode from "react-native-qrcode-svg";

const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&q=80";

export default function EventDetailsModal({
  visible,
  event,
  onClose,
  isBooked,
  isSaved,
  onToggleBookmark,
  onBook,
  bookingInProgress,
  currentUser,
}) {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const [showQrPass, setShowQrPass] = useState(false);

  if (!event) return null;

  const dateObj = event.start_date?.toDate ? event.start_date.toDate() : null;

  const fullDateStr = dateObj
    ? dateObj.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Date TBC";

  const timeStr = dateObj
    ? dateObj.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : event.time || "Time TBC";

  const capacity = event.capacity || 100;
  const booked = event.booked_count || 0;

  const spotsRemaining = Math.max(0, capacity - booked);

  const isFull = event.capacity != null && booked >= capacity && !isBooked;

  /*
   * -------------------------------------------------------
   * GUEST LOGIN CHECK
   * -------------------------------------------------------
   *
   * Guests can browse events, but anything that requires
   * an account sends them to the Login screen.
   */
  const requireLogin = () => {
    onClose();

    navigation.navigate("Login");
  };

  /*
   * -------------------------------------------------------
   * HANDLE REGISTRATION
   * -------------------------------------------------------
   */
  const handleBooking = () => {
    // Guest user
    if (!currentUser) {
      requireLogin();
      return;
    }

    // Logged-in user
    if (onBook) {
      onBook(event);
    }
  };

  /*
   * -------------------------------------------------------
   * HANDLE BOOKMARK
   * -------------------------------------------------------
   */
  const handleBookmark = () => {
    // Guest user
    if (!currentUser) {
      requireLogin();
      return;
    }

    // Logged-in user
    if (onToggleBookmark) {
      onToggleBookmark(event.id);
    }
  };

  /*
   * -------------------------------------------------------
   * SHARE EVENT
   * -------------------------------------------------------
   */
  const handleShare = async () => {
    try {
      await Share.share({
        title: event.title,
        message: `Check out "${event.title}" at the Creative Industries Festival 2026!

📅 Date: ${fullDateStr}
⏰ Time: ${timeStr} BST
📍 Location: ${event.venue || "Royal Docks & Stratford"}

Book your spot now!`,
      });
    } catch (err) {
      console.warn("Share error:", err);
    }
  };

  const bookingId = currentUser?.uid
    ? `${event.id}_${currentUser.uid}`
    : event.id;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* =====================================================
            TOP NAVIGATION BAR
        ====================================================== */}
        <View
          style={[
            styles.navBar,
            {
              backgroundColor: colors.card,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={onClose}
            style={[styles.iconCircle, { backgroundColor: colors.bg }]}
            activeOpacity={0.8}
          >
            <Feather name="x" size={20} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.navActions}>
            {/* Share */}
            <TouchableOpacity
              onPress={handleShare}
              style={[styles.iconCircle, { backgroundColor: colors.bg }]}
              activeOpacity={0.8}
            >
              <Feather name="share-2" size={18} color={colors.text} />
            </TouchableOpacity>

            {/* Bookmark */}
            <TouchableOpacity
              onPress={handleBookmark}
              style={[styles.iconCircle, { backgroundColor: colors.bg }]}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isSaved ? "bookmark" : "bookmark-outline"}
                size={20}
                color={isSaved ? colors.primary || "#8B5CF6" : colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* =====================================================
            SCROLLABLE CONTENT
        ====================================================== */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 120,
          }}
        >
          {/* Hero Banner */}
          <Image
            source={{
              uri: event.image_url || event.image || FALLBACK_HERO,
            }}
            style={styles.heroImage}
          />

          <View style={styles.contentWrap}>
            {/* =================================================
                CATEGORY & PRICE
            ================================================== */}
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: (colors.primary || "#8B5CF6") + "20",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color: colors.primary || "#8B5CF6",
                    },
                  ]}
                >
                  {event.category || "FESTIVAL SESSION"}
                </Text>
              </View>

              <Text
                style={[
                  styles.priceTag,
                  {
                    color: colors.primary || "#8B5CF6",
                  },
                ]}
              >
                {event.price ? `£${event.price}` : "FREE PASS"}
              </Text>
            </View>

            {/* Event Title */}
            <Text style={[styles.title, { color: colors.text }]}>
              {event.title}
            </Text>

            {/* =================================================
                SHARE BANNER
            ================================================== */}
            <TouchableOpacity
              onPress={handleShare}
              style={[
                styles.shareRowBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.8}
            >
              <View style={styles.shareRowLeft}>
                <View
                  style={[
                    styles.shareIconWrap,
                    {
                      backgroundColor: (colors.primary || "#8B5CF6") + "20",
                    },
                  ]}
                >
                  <Feather
                    name="share-2"
                    size={16}
                    color={colors.primary || "#8B5CF6"}
                  />
                </View>

                <View>
                  <Text style={[styles.shareRowTitle, { color: colors.text }]}>
                    Share with friends or colleagues
                  </Text>

                  <Text
                    style={[styles.shareRowSub, { color: colors.textMuted }]}
                  >
                    Invite others to join this session
                  </Text>
                </View>
              </View>

              <Feather
                name="chevron-right"
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>

            {/* =================================================
                ORGANIZER
            ================================================== */}
            <View
              style={[
                styles.hostRow,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
            >
              <View
                style={[
                  styles.hostAvatar,
                  {
                    backgroundColor: colors.primary || "#8B5CF6",
                  },
                ]}
              >
                <Feather name="award" size={18} color="#FFFFFF" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.hostLabel, { color: colors.textMuted }]}>
                  Organised by
                </Text>

                <Text
                  style={[styles.hostName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {event.speaker ||
                    event.organizer ||
                    "Creative Industries Festival 2026"}
                </Text>
              </View>
            </View>

            {/* =================================================
                WHEN AND WHERE
            ================================================== */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                When and Where
              </Text>

              <View style={styles.infoCard}>
                {/* Date */}
                <View style={styles.infoItem}>
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Feather
                      name="calendar"
                      size={18}
                      color={colors.primary || "#8B5CF6"}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.infoHeading, { color: colors.text }]}>
                      Date and Time
                    </Text>

                    <Text style={[styles.infoSub, { color: colors.textMuted }]}>
                      {fullDateStr}
                    </Text>

                    <Text style={[styles.infoSub, { color: colors.textMuted }]}>
                      {timeStr} BST
                    </Text>
                  </View>
                </View>

                {/* Location */}
                <View style={[styles.infoItem, { marginTop: 14 }]}>
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Feather
                      name="map-pin"
                      size={18}
                      color={colors.primary || "#8B5CF6"}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.infoHeading, { color: colors.text }]}>
                      Location
                    </Text>

                    <Text style={[styles.infoSub, { color: colors.textMuted }]}>
                      {event.venue || "University of East London / Royal Docks"}
                    </Text>

                    {!!event.room && (
                      <Text
                        style={[
                          styles.infoSub,
                          {
                            color: colors.textMuted,
                          },
                        ]}
                      >
                        Room: {event.room}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>

            {/* =================================================
                ABOUT EVENT
            ================================================== */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                About this Event
              </Text>

              <Text style={[styles.description, { color: colors.text }]}>
                {event.description ||
                  "Join us for an inspiring session exploring creative innovation, interactive workshops, and collaborative industry projects. Network with peers and gain first-hand insights."}
              </Text>
            </View>

            {/* =================================================
                CAPACITY
            ================================================== */}
            {event.capacity != null && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Ticket Availability
                </Text>

                <View
                  style={[
                    styles.capacityBox,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.capacityMeta}>
                    <Text
                      style={[styles.capacityTitle, { color: colors.text }]}
                    >
                      General Admission Pass
                    </Text>

                    <Text
                      style={[
                        styles.capacityCount,
                        {
                          color: colors.textMuted,
                        },
                      ]}
                    >
                      {spotsRemaining} of {capacity} spots remaining
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.barBase,
                      {
                        backgroundColor: colors.input,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.min(100, (booked / capacity) * 100)}%`,
                          backgroundColor:
                            booked >= capacity
                              ? "#ef4444"
                              : colors.primary || "#8B5CF6",
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* =====================================================
            STICKY BOTTOM ACTION BAR
        ====================================================== */}
        <View
          style={[
            styles.bottomCheckoutBar,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
            },
          ]}
        >
          <View>
            <Text
              style={[styles.bottomPriceLabel, { color: colors.textMuted }]}
            >
              {isBooked ? "Booking Status" : "Pass Type"}
            </Text>

            <Text
              style={[
                styles.bottomPrice,
                {
                  color: isBooked ? "#10b981" : colors.text,
                },
              ]}
            >
              {isBooked
                ? "Confirmed ✓"
                : event.price
                  ? `£${event.price}`
                  : "Free Pass"}
            </Text>
          </View>

          <View style={styles.bottomButtonsGroup}>
            {/* =================================================
                VIEW PASS
            ================================================== */}
            {isBooked && (
              <TouchableOpacity
                onPress={() => setShowQrPass(true)}
                style={[
                  styles.viewPassBtn,
                  {
                    backgroundColor: colors.primary || "#8B5CF6",
                  },
                ]}
                activeOpacity={0.85}
              >
                <Feather
                  name="maximize-2"
                  size={14}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />

                <Text style={styles.viewPassBtnText}>View Pass</Text>
              </TouchableOpacity>
            )}

            {/* =================================================
                REGISTER / CANCEL
            ================================================== */}
            <TouchableOpacity
              onPress={handleBooking}
              disabled={bookingInProgress || (isFull && !isBooked)}
              style={[
                styles.checkoutBtn,
                {
                  backgroundColor: isBooked
                    ? colors.bg
                    : isFull
                      ? colors.border
                      : colors.primary || "#8B5CF6",

                  borderColor: isBooked ? "#ef4444" : "transparent",

                  borderWidth: isBooked ? 1.2 : 0,

                  paddingHorizontal: isBooked ? 14 : 24,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.checkoutBtnText,
                  {
                    color: isBooked
                      ? "#ef4444"
                      : isFull
                        ? colors.textMuted
                        : "#FFFFFF",
                  },
                ]}
              >
                {bookingInProgress
                  ? "..."
                  : isBooked
                    ? "Cancel"
                    : isFull
                      ? "Sold Out"
                      : "Register Now"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* =====================================================
            QR PASS MODAL
        ====================================================== */}
        <Modal
          visible={showQrPass}
          animationType="fade"
          transparent
          onRequestClose={() => setShowQrPass(false)}
        >
          <View style={styles.qrModalOverlay}>
            <View
              style={[
                styles.qrModalContent,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* QR Header */}
              <View style={styles.qrModalHeader}>
                <View>
                  <Text
                    style={[
                      styles.qrModalTag,
                      {
                        color: colors.primary || "#8B5CF6",
                      },
                    ]}
                  >
                    CIF 2026 ENTRY PASS
                  </Text>

                  <Text
                    style={[styles.qrModalTitle, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {event.title}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setShowQrPass(false)}
                  style={[
                    styles.qrCloseBtn,
                    {
                      backgroundColor: colors.bg,
                    },
                  ]}
                >
                  <Feather name="x" size={18} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* QR Code */}
              <View style={styles.qrCenterBox}>
                <View style={styles.qrWhiteContainer}>
                  <QRCode
                    value={`CIF-TICKET-${bookingId}`}
                    size={160}
                    backgroundColor="#ffffff"
                    color="#0f172a"
                  />
                </View>

                <Text
                  style={[
                    styles.qrRefText,
                    {
                      color: colors.textMuted,
                    },
                  ]}
                >
                  REF: {bookingId.slice(0, 10).toUpperCase()}
                </Text>

                <Text style={styles.qrScanLabel}>
                  Present code at venue check-in
                </Text>
              </View>

              {/* QR Meta */}
              <View
                style={[
                  styles.qrMetaRow,
                  {
                    borderTopColor: colors.border,
                  },
                ]}
              >
                <View>
                  <Text
                    style={[
                      styles.qrMetaLabel,
                      {
                        color: colors.textMuted,
                      },
                    ]}
                  >
                    DATE & TIME
                  </Text>

                  <Text style={[styles.qrMetaVal, { color: colors.text }]}>
                    {fullDateStr.split(",")[0]}, {timeStr}
                  </Text>
                </View>

                <View>
                  <Text
                    style={[
                      styles.qrMetaLabel,
                      {
                        color: colors.textMuted,
                      },
                    ]}
                  >
                    LOCATION
                  </Text>

                  <Text style={[styles.qrMetaVal, { color: colors.text }]}>
                    {event.venue ? event.venue.slice(0, 18) : "Festival Hub"}
                  </Text>
                </View>
              </View>

              {/* Done */}
              <TouchableOpacity
                style={[
                  styles.qrDoneBtn,
                  {
                    backgroundColor: colors.primary || "#8B5CF6",
                  },
                ]}
                onPress={() => setShowQrPass(false)}
              >
                <Text style={styles.qrDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  navBar: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
  },

  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  navActions: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },

  heroImage: {
    width: "100%",
    height: 220,
    resizeMode: "cover",
  },

  contentWrap: {
    padding: 20,
  },

  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },

  categoryText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  priceTag: {
    fontSize: 14,
    fontWeight: "900",
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
    marginBottom: 14,
  },

  shareRowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },

  shareRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },

  shareIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  shareRowTitle: {
    fontSize: 13,
    fontWeight: "700",
  },

  shareRowSub: {
    fontSize: 11,
    marginTop: 1,
  },

  hostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },

  hostAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  hostLabel: {
    fontSize: 11,
    fontWeight: "600",
  },

  hostName: {
    fontSize: 14,
    fontWeight: "700",
  },

  section: {
    marginBottom: 22,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 10,
  },

  infoCard: {
    gap: 4,
  },

  infoItem: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },

  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  infoHeading: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },

  infoSub: {
    fontSize: 13,
    lineHeight: 18,
  },

  description: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.9,
  },

  capacityBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },

  capacityMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  capacityTitle: {
    fontSize: 13,
    fontWeight: "700",
  },

  capacityCount: {
    fontSize: 12,
  },

  barBase: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },

  barFill: {
    height: "100%",
    borderRadius: 3,
  },

  bottomCheckoutBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 84,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  bottomPriceLabel: {
    fontSize: 11,
    fontWeight: "600",
  },

  bottomPrice: {
    fontSize: 16,
    fontWeight: "900",
  },

  bottomButtonsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  viewPassBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },

  viewPassBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },

  checkoutBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  checkoutBtnText: {
    fontSize: 13,
    fontWeight: "800",
  },

  // QR Modal

  qrModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },

  qrModalContent: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    elevation: 6,
  },

  qrModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },

  qrModalTag: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  qrModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 2,
    maxWidth: 220,
  },

  qrCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  qrCenterBox: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },

  qrWhiteContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    elevation: 3,
  },

  qrRefText: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 10,
  },

  qrScanLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },

  qrMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 12,
  },

  qrMetaLabel: {
    fontSize: 9,
    fontWeight: "800",
  },

  qrMetaVal: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },

  qrDoneBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  qrDoneBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
});
