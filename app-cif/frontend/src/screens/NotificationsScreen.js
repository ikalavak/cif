import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  ActivityIndicator,
  Alert,
} from "react-native";

import SafeScreen from "../components/SafeScreen";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

import { db, auth } from "../config/firebase";

function NotificationRow({ item, onPress }) {
  const { colors } = useTheme();

  const {
    type,
    title,
    message,
    time,
    isUnread,
  } = item;

  const iconName =
    type === "schedule"
      ? "calendar"
      : type === "network"
      ? "user"
      : "alert-circle";

  return (
    <TouchableOpacity
      style={[
        styles.row,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Icon */}
      <View
        style={[
          styles.left,
          {
            backgroundColor:
              colors.input || colors.border,
          },
        ]}
      >
        <Feather
          name={iconName}
          size={20}
          color={colors.primary}
        />
      </View>

      {/* Content */}
      <View style={styles.mid}>
        <View style={styles.rowTop}>
          <Text
            style={[
              styles.title,
              {
                color: colors.text,
                fontWeight: isUnread ? "800" : "600",
              },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>

          <Text
            style={[
              styles.time,
              {
                color: colors.textMuted,
              },
            ]}
          >
            {time}
          </Text>
        </View>

        <Text
          style={[
            styles.message,
            {
              color: colors.textMuted,
            },
          ]}
          numberOfLines={2}
        >
          {message}
        </Text>
      </View>

      {/* Unread indicator */}
      {isUnread ? (
        <View
          style={[
            styles.unreadDot,
            {
              backgroundColor: colors.primary,
            },
          ]}
        />
      ) : null}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen({ navigation }) {
  const { colors } = useTheme();

  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(new Set());

  const filters = [
    "All",
    "Schedule",
    "Networking",
    "Alerts",
  ];

  /*
   * ---------------------------------------------------------
   * LISTEN FOR USER'S READ NOTIFICATIONS
   * ---------------------------------------------------------
   *
   * users/{uid}/notificationReads/{notificationId}
   *
   * Each document contains:
   * {
   *   read: true,
   *   readAt: timestamp
   * }
   */
  useEffect(() => {
    const user = auth?.currentUser;

    if (!user) {
      console.log(
        "NotificationsScreen: No authenticated user"
      );

      setReadIds(new Set());
      return;
    }

    const readCollection = collection(
      db,
      "users",
      user.uid,
      "notificationReads"
    );

    const unsubscribe = onSnapshot(
      readCollection,
      (snapshot) => {
        const ids = new Set();

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();

          if (data.read === true) {
            ids.add(docSnap.id);
          }
        });

        setReadIds(ids);
      },
      (error) => {
        console.error(
          "Error loading notification read status:",
          error
        );
      }
    );

    return () => unsubscribe();
  }, []);

  /*
   * ---------------------------------------------------------
   * LISTEN FOR NOTIFICATIONS
   * ---------------------------------------------------------
   */
  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const notificationsQuery = query(
      collection(db, "notifications"),
      orderBy("sentAt", "desc")
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const todayStart = new Date();

        todayStart.setHours(0, 0, 0, 0);

        const items = snapshot.docs.map((docSnap) => {
          const docData = docSnap.data();

          let timestamp;

          if (docData.sentAt?.toDate) {
            timestamp = docData.sentAt.toDate();
          } else if (docData.sentAt) {
            timestamp = new Date(docData.sentAt);
          } else {
            timestamp = new Date();
          }

          const isToday = timestamp >= todayStart;

          const timeString = isToday
            ? timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : timestamp.toLocaleDateString([], {
                month: "short",
                day: "numeric",
              });

          return {
            id: docSnap.id,

            type: docData.type || "alert",

            title:
              docData.title ||
              "Notification",

            message:
              docData.body ||
              docData.message ||
              "",

            targetScreen:
              docData.targetScreen ||
              "Home",

            params:
              docData.params ||
              {},

            time: timeString,

            when: isToday
              ? "today"
              : "earlier",

            /*
             * Check Firestore read status
             */
            isUnread: !readIds.has(docSnap.id),
          };
        });

        setNotifications(items);
        setLoading(false);
      },
      (error) => {
        console.error(
          "Failed to listen to notifications:",
          error
        );

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [readIds]);

  /*
   * ---------------------------------------------------------
   * MARK ONE NOTIFICATION AS READ
   * ---------------------------------------------------------
   */
  const markAsRead = useCallback(async (notificationId) => {
    const user = auth?.currentUser;

    if (!user) {
      console.warn(
        "Cannot mark notification as read: no user."
      );
      return;
    }

    try {
      const readRef = doc(
        db,
        "users",
        user.uid,
        "notificationReads",
        notificationId
      );

      await setDoc(
        readRef,
        {
          read: true,
          readAt: serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      /*
       * Immediately update local UI.
       */
      setReadIds((previous) => {
        const updated = new Set(previous);

        updated.add(notificationId);

        return updated;
      });

      console.log(
        "Notification marked as read:",
        notificationId
      );
    } catch (error) {
      console.error(
        "Error marking notification as read:",
        error
      );
    }
  }, []);

  /*
   * ---------------------------------------------------------
   * MARK ALL NOTIFICATIONS AS READ
   * ---------------------------------------------------------
   */
  const markAllAsRead = useCallback(async () => {
    const user = auth?.currentUser;

    if (!user) {
      Alert.alert(
        "Not signed in",
        "Please sign in to mark notifications as read."
      );
      return;
    }

    if (notifications.length === 0) {
      return;
    }

    try {
      /*
       * Create a read document for every notification.
       */
      await Promise.all(
        notifications.map(async (notification) => {
          const readRef = doc(
            db,
            "users",
            user.uid,
            "notificationReads",
            notification.id
          );

          await setDoc(
            readRef,
            {
              read: true,
              readAt: serverTimestamp(),
            },
            {
              merge: true,
            }
          );
        })
      );

      /*
       * Immediately update the UI.
       */
      setReadIds((previous) => {
        const updated = new Set(previous);

        notifications.forEach((notification) => {
          updated.add(notification.id);
        });

        return updated;
      });

      console.log(
        "All notifications marked as read."
      );
    } catch (error) {
      console.error(
        "Error marking all notifications as read:",
        error
      );

      Alert.alert(
        "Error",
        "Could not mark all notifications as read."
      );
    }
  }, [notifications]);

  /*
   * ---------------------------------------------------------
   * WHEN USER PRESSES A NOTIFICATION
   * ---------------------------------------------------------
   */
  const handlePressNotification = useCallback(
    async (item) => {
      /*
       * Mark notification as read first.
       */
      await markAsRead(item.id);

      const target = item.targetScreen || "Home";

      const tabScreens = [
        "Home",
        "Events",
        "Maps",
        "Profile",
      ];

      /*
       * Navigate to a tab inside MainApp.
       */
      if (tabScreens.includes(target)) {
        navigation.navigate("MainApp", {
          screen: target,
          params: item.params || {},
        });

        return;
      }

      /*
       * Do not navigate back to Notifications.
       */
      if (target === "Notifications") {
        return;
      }

      /*
       * Navigate to another screen.
       */
      try {
        navigation.navigate(
          target,
          item.params || {}
        );
      } catch (error) {
        console.warn(
          `Could not navigate to target screen "${target}":`,
          error
        );

        navigation.navigate("MainApp");
      }
    },
    [markAsRead, navigation]
  );

  /*
   * ---------------------------------------------------------
   * FILTER NOTIFICATIONS
   * ---------------------------------------------------------
   */
  const filtered = useMemo(() => {
    const list = notifications.filter((notification) => {
      if (filter === "All") {
        return true;
      }

      if (filter === "Schedule") {
        return notification.type === "schedule";
      }

      if (filter === "Networking") {
        return notification.type === "network";
      }

      if (filter === "Alerts") {
        return notification.type === "alert";
      }

      return true;
    });

    const today = list.filter(
      (item) => item.when === "today"
    );

    const earlier = list.filter(
      (item) => item.when !== "today"
    );

    const sections = [];

    if (today.length > 0) {
      sections.push({
        title: "Today",
        data: today,
      });
    }

    if (earlier.length > 0) {
      sections.push({
        title: "Earlier",
        data: earlier,
      });
    }

    return sections;
  }, [notifications, filter]);

  /*
   * ---------------------------------------------------------
   * SECTION HEADER
   * ---------------------------------------------------------
   */
  const renderSectionHeader = ({
    section: { title },
  }) => (
    <View
      style={[
        styles.sectionHeader,
        {
          backgroundColor: colors.bg,
        },
      ]}
    >
      <Text
        style={[
          styles.sectionHeaderText,
          {
            color: colors.text,
          },
        ]}
      >
        {title}
      </Text>
    </View>
  );

  /*
   * ---------------------------------------------------------
   * EMPTY LIST
   * ---------------------------------------------------------
   */
  const ListEmpty = () => (
    <View style={styles.emptyWrap}>
      <Feather
        name="bell"
        size={48}
        color={colors.textMuted}
      />

      <Text
        style={[
          styles.emptyTitle,
          {
            color: colors.text,
          },
        ]}
      >
        No notifications
      </Text>

      <Text
        style={[
          styles.emptySubtitle,
          {
            color: colors.textMuted,
          },
        ]}
      >
        You're all caught up for now.
      </Text>
    </View>
  );

  /*
   * ---------------------------------------------------------
   * SCREEN
   * ---------------------------------------------------------
   */
  return (
    <SafeScreen
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{
            top: 10,
            bottom: 10,
            left: 10,
            right: 10,
          }}
        >
          <Text
            style={[
              styles.headerTitle,
              {
                color: colors.text,
              },
            ]}
          >
            ← Notifications
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={markAllAsRead}
          disabled={notifications.length === 0}
        >
          <Text
            style={[
              styles.markAll,
              {
                color:
                  notifications.length === 0
                    ? colors.textMuted
                    : colors.primary,
              },
            ]}
          >
            Mark all as read
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {filters.map((f) => {
          const active = f === filter;

          return (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterPill,
                {
                  backgroundColor: active
                    ? colors.primary + "18"
                    : "transparent",

                  borderColor: active
                    ? colors.primary
                    : colors.border,
                },
              ]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: active
                      ? colors.primary
                      : colors.textMuted,
                  },
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 40 }}
        />
      ) : (
        <SectionList
          sections={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationRow
              item={item}
              onPress={() =>
                handlePressNotification(item)
              }
            />
          )}
          renderSectionHeader={renderSectionHeader}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={{
            paddingBottom: 40,
            flexGrow:
              filtered.length === 0 ? 1 : 0,
          }}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeScreen>
  );
}

/*
 * ---------------------------------------------------------
 * STYLES
 * ---------------------------------------------------------
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
  },

  markAll: {
    fontSize: 14,
    fontWeight: "700",
  },

  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },

  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },

  filterText: {
    fontSize: 13,
    fontWeight: "600",
  },

  sectionHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  sectionHeaderText: {
    fontSize: 13,
    fontWeight: "800",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },

  left: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  mid: {
    flex: 1,
  },

  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },

  time: {
    fontSize: 12,
  },

  message: {
    marginTop: 4,
    fontSize: 13,
  },

  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 6,
    marginLeft: 12,
  },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "700",
  },

  emptySubtitle: {
    marginTop: 6,
    fontSize: 14,
  },
});