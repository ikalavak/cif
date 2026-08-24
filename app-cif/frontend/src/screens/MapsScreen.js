// src/screens/MapsScreen.js
import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  PanResponder,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import SafeScreen from "../components/SafeScreen";
import { useTheme } from "../context/ThemeContext";

const defaultDocklandsMap = require("../../assets/docklands-map.png");
const defaultStratfordMap = require("../../assets/stratford-map.png");

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAP_HEIGHT = SCREEN_HEIGHT * 0.58;

export default function MapsScreen({ navigation }) {
  const [activeScreen, setActiveScreen] = useState("Docklands");
  const [mapConfig, setMapConfig] = useState({
    docklands_map_url: null,
    stratford_map_url: null,
    docklands_description: "University Way, Royal Docks, London E16 2RD",
    stratford_description: "Water Lane, Stratford, London E15 4LZ",
  });
  const [imageLoading, setImageLoading] = useState(false);

  const { colors } = useTheme();

  // Animated Transformations (Scale & Pan)
  const scale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // Tracking values for gestures
  const currentScale = useRef(1);
  const currentPan = useRef({ x: 0, y: 0 });
  const lastTouchDistance = useRef(null);
  const lastTapTime = useRef(0);

  // Sync animation state
  useEffect(() => {
    const scaleListener = scale.addListener(
      (v) => (currentScale.current = v.value),
    );
    const panListener = pan.addListener((v) => (currentPan.current = v));
    return () => {
      scale.removeListener(scaleListener);
      pan.removeListener(panListener);
    };
  }, [scale, pan]);

  // 1. Real-time subscription to Campus Maps configuration
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "site_settings", "campus_maps"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setMapConfig({
            docklands_map_url: data.docklands_map_url || null,
            stratford_map_url: data.stratford_map_url || null,
            docklands_description:
              data.docklands_description || "Royal Docks Campus",
            stratford_description:
              data.stratford_description || "Stratford Campus",
          });
        }
      },
      (err) => {
        console.warn("Campus maps listener notice:", err.message);
      },
    );

    return () => unsub();
  }, []);

  const resetTransform = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }),
    ]).start();
  };

  const handleTabChange = (tab) => {
    setImageLoading(true);
    setActiveScreen(tab);
    resetTransform();
  };

  const handleZoomIn = () => {
    const targetScale = Math.min(currentScale.current + 0.75, 4.0);
    Animated.spring(scale, {
      toValue: targetScale,
      useNativeDriver: true,
    }).start();
  };

  const handleZoomOut = () => {
    const targetScale = Math.max(currentScale.current - 0.75, 1.0);
    if (targetScale === 1) {
      resetTransform();
    } else {
      Animated.spring(scale, {
        toValue: targetScale,
        useNativeDriver: true,
      }).start();
    }
  };

  // 2. Cross-Platform Touch & Pinch PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        pan.setOffset({ x: currentPan.current.x, y: currentPan.current.y });
        pan.setValue({ x: 0, y: 0 });
        lastTouchDistance.current = null;

        // Double Tap Zoom
        const now = Date.now();
        if (now - lastTapTime.current < 300) {
          if (currentScale.current > 1.2) {
            resetTransform();
          } else {
            Animated.spring(scale, {
              toValue: 2.2,
              useNativeDriver: true,
            }).start();
          }
        }
        lastTapTime.current = now;
      },

      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;

        // 2-Finger Pinch Calculation
        if (touches.length === 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (lastTouchDistance.current) {
            const factor = distance / lastTouchDistance.current;
            let nextScale = currentScale.current * factor;
            nextScale = Math.max(0.9, Math.min(nextScale, 4.5));
            scale.setValue(nextScale);
          }
          lastTouchDistance.current = distance;
        }
        // 1-Finger Pan (Enabled only when zoomed in)
        else if (touches.length === 1 && currentScale.current > 1.05) {
          pan.setValue({ x: gestureState.dx, y: gestureState.dy });
        }
      },

      onPanResponderRelease: () => {
        pan.flattenOffset();
        lastTouchDistance.current = null;

        // Snap back to 1.0 if zoomed out past limit
        if (currentScale.current < 1) {
          resetTransform();
        }
      },
    }),
  ).current;

  const isDocklands = activeScreen === "Docklands";
  const customUrl = isDocklands
    ? mapConfig.docklands_map_url
    : mapConfig.stratford_map_url;

  const imageSource = customUrl
    ? { uri: customUrl, cache: "reload" }
    : isDocklands
      ? defaultDocklandsMap
      : defaultStratfordMap;

  const currentSubtitle = isDocklands
    ? mapConfig.docklands_description
    : mapConfig.stratford_description;

  return (
    <SafeScreen style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Header — title made tappable with back arrow, matching Job Board / Forum's pattern */}
      <View style={styles.headerRow}>
        <View>
          <TouchableOpacity onPress={() => navigation?.goBack?.()}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>
              ← Campus Explorer
            </Text>
          </TouchableOpacity>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
            {currentSubtitle}
          </Text>
        </View>

        <View style={styles.hintBadge}>
          <Feather
            name="maximize-2"
            size={12}
            color={colors.primary || "#8B5CF6"}
          />
          <Text
            style={[styles.hintText, { color: colors.primary || "#8B5CF6" }]}
          >
            Pinch or tap +/−
          </Text>
        </View>
      </View>

      {/* Campus Toggle */}
      <View
        style={[
          styles.toggleContainer,
          {
            backgroundColor: colors.input || "#E2E8F0",
            borderColor: colors.border,
          },
        ]}
      >
        {["Docklands", "Stratford"].map((tab) => {
          const active = tab === activeScreen;

          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.toggleButton,
                active && {
                  backgroundColor: colors.card,
                  shadowColor: "#000",
                  shadowOpacity: 0.1,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 6,
                  elevation: 4,
                },
              ]}
              onPress={() => handleTabChange(tab)}
            >
              <Text
                style={[
                  styles.toggleText,
                  {
                    color: active
                      ? colors.primary || "#8B5CF6"
                      : colors.textMuted,
                    fontWeight: active ? "800" : "600",
                  },
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Interactive Map Canvas */}
      <View
        style={[
          styles.canvasContainer,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {imageLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator
              size="large"
              color={colors.primary || "#8B5CF6"}
            />
          </View>
        )}

        <View style={styles.gestureWrapper} {...panResponder.panHandlers}>
          <Animated.View
            style={[
              styles.animatedImageWrapper,
              {
                transform: [
                  { scale: scale },
                  { translateX: pan.x },
                  { translateY: pan.y },
                ],
              },
            ]}
          >
            <Image
              key={`${activeScreen}-${customUrl || "bundled"}`}
              source={imageSource}
              style={styles.mapImage}
              resizeMode="contain"
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
            />
          </Animated.View>
        </View>

        {/* Floating Manual Controls (+, −, Reset) */}
        <View style={styles.floatingControlsWrapper}>
          <TouchableOpacity
            style={[
              styles.controlBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={handleZoomIn}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={18} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={handleZoomOut}
            activeOpacity={0.8}
          >
            <Feather name="minus" size={18} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={resetTransform}
            activeOpacity={0.8}
          >
            <Feather name="refresh-cw" size={15} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  pageTitle: { fontSize: 28, fontWeight: "bold" },
  pageSubtitle: { fontSize: 13, marginTop: 2 },
  hintBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  hintText: { fontSize: 11, fontWeight: "700" },
  toggleContainer: {
    flexDirection: "row",
    borderRadius: 999,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
  },
  toggleButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 999,
  },
  toggleText: { fontSize: 14 },
  canvasContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  gestureWrapper: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  animatedImageWrapper: {
    width: SCREEN_WIDTH - 36,
    height: MAP_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  mapImage: {
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.15)",
    zIndex: 5,
  },
  floatingControlsWrapper: {
    position: "absolute",
    bottom: 16,
    right: 16,
    gap: 8,
    zIndex: 10,
  },
  controlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
});
