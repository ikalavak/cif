import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import SafeScreen from "../components/SafeScreen";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { db } from "../config/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

const { width } = Dimensions.get("window");
const GAP = 12;
const COLUMN_COUNT = 2;
const CARD_WIDTH = (width - 40 - GAP) / COLUMN_COUNT; // 40 = horizontal screen padding (20 each side)

export default function GalleryScreen({ navigation }) {
  const { colors } = useTheme();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const q = query(collection(db, "gallery"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setImages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  return (
    <SafeScreen style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Back button — icon only, since the page title right below already says "Gallery" */}
      <View style={styles.backRow}>
        <TouchableOpacity
          onPress={() => navigation?.goBack?.()}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.headerRow}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Gallery</Text>
        <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
          Photos from the festival
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : error ? (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          Couldn't load the gallery right now.
        </Text>
      ) : images.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          No photos yet — check back soon.
        </Text>
      ) : (
        <FlatList
          data={images}
          keyExtractor={(item) => item.id}
          numColumns={COLUMN_COUNT}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: GAP }}
          renderItem={({ item }) => (
            <View style={[styles.card, { width: CARD_WIDTH, backgroundColor: colors.card, borderColor: colors.border }]}>
              <Image
                source={{ uri: item.image_url }}
                style={styles.image}
                resizeMode="cover"
              />
              {!!item.caption && (
                <Text
                  style={[styles.caption, { color: colors.textMuted }]}
                  numberOfLines={2}
                >
                  {item.caption}
                </Text>
              )}
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
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backText: {
    fontSize: 15,
    fontWeight: "600",
  },
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  pageTitle: { fontSize: 26, fontWeight: "bold", marginBottom: 4 },
  pageSubtitle: { fontSize: 14 },
  emptyText: { textAlign: "center", marginTop: 40, fontSize: 14, paddingHorizontal: 20 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    aspectRatio: 1,
  },
  caption: {
    fontSize: 12,
    padding: 10,
  },
});