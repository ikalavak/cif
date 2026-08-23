// cif-admin-panel/src/pages/HomeSettings.jsx
import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseClient";
import * as FeatherIcons from "react-feather";

// Replace with your own values from Cloudinary → Settings → Upload
// (unsigned upload preset, so no secret key needed in frontend code)
const CLOUDINARY_CLOUD_NAME = "Chijioke Chiagorom"; // <-- Replace with your Cloudinary cloud name
const CLOUDINARY_UPLOAD_PRESET = "cif_admin_uploads";

// Expo-compatible Feather icon list
const AVAILABLE_ICONS = [
  "Activity",
  "Airplay",
  "Award",
  "BookOpen",
  "Bookmark",
  "Box",
  "Briefcase",
  "Calendar",
  "Camera",
  "Cast",
  "CheckCircle",
  "Clock",
  "Compass",
  "Cpu",
  "Crosshair",
  "Disc",
  "Droplet",
  "Eye",
  "Feather",
  "Film",
  "Flag",
  "Folder",
  "Gift",
  "Globe",
  "Headphones",
  "Heart",
  "HelpCircle",
  "Image",
  "Layers",
  "LifeBuoy",
  "Link",
  "Map",
  "MapPin",
  "Maximize",
  "MessageCircle",
  "Mic",
  "Monitor",
  "Music",
  "Navigation",
  "Package",
  "PenTool",
  "Play",
  "Radio",
  "Scissors",
  "Share2",
  "Smile",
  "Speaker",
  "Star",
  "Tag",
  "Target",
  "Tv",
  "User",
  "Users",
  "Video",
  "Volume2",
  "Watch",
  "Wifi",
  "Zap",
];

const toKebabCase = (str) =>
  str
    .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/^-/, "");

const toPascalCase = (str) =>
  str
    ? str
        .split("-")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join("")
    : "Star";

function IconPicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const activePascal = toPascalCase(value || "star");
  const SelectedIcon = FeatherIcons[activePascal] || FeatherIcons.Star;

  const filteredIcons = AVAILABLE_ICONS.filter(
    (name) =>
      name.toLowerCase().includes(search.toLowerCase()) ||
      toKebabCase(name).includes(search.toLowerCase()),
  );

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: 8,
          cursor: "pointer",
          width: "100%",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            backgroundColor: "rgba(139, 92, 246, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#8b5cf6",
          }}
        >
          <SelectedIcon size={16} />
        </div>
        <div style={{ textAlign: "left", flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
            {value || "star"}
          </div>
          <div style={{ fontSize: 10, color: "#64748b" }}>Change Icon</div>
        </div>
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            width: 280,
            maxHeight: 250,
            zIndex: 50,
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 10,
            boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
            padding: 10,
            marginTop: 6,
          }}
        >
          <input
            type="text"
            placeholder="Search icon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 8px",
              fontSize: 12,
              borderRadius: 6,
              border: "1px solid #e2e8f0",
              marginBottom: 8,
              boxSizing: "border-box",
            }}
            autoFocus
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 6,
              maxHeight: 160,
              overflowY: "auto",
              paddingRight: 4,
            }}
          >
            {filteredIcons.map((iconKey) => {
              const IconComp = FeatherIcons[iconKey];
              const kebabName = toKebabCase(iconKey);
              const isSelected = (value || "star") === kebabName;

              return (
                <button
                  key={iconKey}
                  type="button"
                  title={kebabName}
                  onClick={() => {
                    onChange(kebabName);
                    setIsOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 8,
                    borderRadius: 6,
                    border: isSelected
                      ? "2px solid #8b5cf6"
                      : "1px solid #e2e8f0",
                    background: isSelected
                      ? "rgba(139, 92, 246, 0.1)"
                      : "#f8fafc",
                    color: isSelected ? "#8b5cf6" : "#475569",
                    cursor: "pointer",
                  }}
                >
                  <IconComp size={16} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomeSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [heroUploading, setHeroUploading] = useState(false);

  const [formData, setFormData] = useState({
    hero_badge: "FREE FESTIVAL",
    hero_title: "Creative Industries Festival 2026",
    hero_subtitle: "Creative Balance: Good Work, Health and Life",
    hero_dates: "2 – 5 September 2026",
    hero_locations: "Royal Docks & Stratford",
    hero_image_url: "",
    about_text:
      "Explore how creativity can help us find balance in our work, health and lives. Discover talks, workshops and industry collaborations focused on inclusion, wellbeing, innovation and the future of creative work.",
    cta_title: "Don't miss the festival",
    cta_text:
      "Explore the programme, save your favourite events and connect with the creative community.",
    cta_button_text: "Explore Events",
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
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const snap = await getDoc(doc(db, "site_settings", "home"));
        if (snap.exists()) {
          const data = snap.data();
          setFormData((prev) => ({
            ...prev,
            ...data,
            highlights: data.highlights || prev.highlights,
          }));
        }
      } catch (err) {
        console.error("Error fetching home settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Opens Cloudinary's upload widget instead of Firebase Storage — Firebase
  // Storage requires the paid Blaze plan to provision a bucket at all, which
  // is why uploads were stuck at 0%. Cloudinary's free tier works with no
  // billing setup, and the widget gives the same drag-and-drop experience.
  const openUploadWidget = () => {
    if (!window.cloudinary) {
      setStatus(
        "Upload widget failed to load. Check your internet connection and refresh the page.",
      );
      return;
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        sources: ["local", "camera", "url"],
        multiple: false,
        maxFileSize: 10000000, // 10MB
        clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
        styles: {
          palette: {
            window: "#FFFFFF",
            windowBorder: "#d5d7de",
            tabIcon: "#8b5cf6",
            link: "#8b5cf6",
          },
        },
      },
      (err, result) => {
        if (err) {
          setStatus("Upload failed: " + err.message);
          setHeroUploading(false);
          return;
        }
        if (result.event === "success") {
          setFormData((prev) => ({
            ...prev,
            hero_image_url: result.info.secure_url,
          }));
          setHeroUploading(false);
        }
        if (result.event === "close") {
          setHeroUploading(false);
        }
      },
    );

    setHeroUploading(true);
    widget.open();
  };

  const handleHighlightChange = (index, field, value) => {
    const updated = [...formData.highlights];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, highlights: updated });
  };

  const addHighlight = () => {
    setFormData({
      ...formData,
      highlights: [
        ...formData.highlights,
        {
          id: Date.now().toString(),
          icon: "star",
          title: "New Highlight",
          text: "Highlight description...",
        },
      ],
    });
  };

  const removeHighlight = (index) => {
    const updated = formData.highlights.filter((_, i) => i !== index);
    setFormData({ ...formData, highlights: updated });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus("");

    try {
      await setDoc(
        doc(db, "site_settings", "home"),
        {
          ...formData,
          updated_at: serverTimestamp(),
        },
        { merge: true },
      );
      setStatus("Home settings saved successfully!");
    } catch (err) {
      setStatus("Error saving settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading settings...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <h1>Home Screen Settings</h1>
      <p className="muted">
        Manage mobile app hero banners, about details, and interactive highlight
        vector icons.
      </p>

      {status && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            marginBottom: 20,
            backgroundColor:
              status.includes("Error") || status.includes("failed")
                ? "#fee2e2"
                : "#dcfce7",
            color:
              status.includes("Error") || status.includes("failed")
                ? "#991b1b"
                : "#166534",
            fontWeight: 600,
          }}
        >
          {status}
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* HERO SECTION */}
        <div
          style={{
            background: "#f8fafc",
            padding: 20,
            borderRadius: 10,
            marginBottom: 24,
            border: "1px solid #e2e8f0",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Hero Banner</h3>

          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                fontSize: 13,
                marginBottom: 4,
              }}
            >
              Hero Badge
            </label>
            <input
              type="text"
              className="search-input"
              value={formData.hero_badge}
              onChange={(e) =>
                setFormData({ ...formData, hero_badge: e.target.value })
              }
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                fontSize: 13,
                marginBottom: 4,
              }}
            >
              Hero Title
            </label>
            <input
              type="text"
              className="search-input"
              value={formData.hero_title}
              onChange={(e) =>
                setFormData({ ...formData, hero_title: e.target.value })
              }
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                fontSize: 13,
                marginBottom: 4,
              }}
            >
              Hero Subtitle
            </label>
            <input
              type="text"
              className="search-input"
              value={formData.hero_subtitle}
              onChange={(e) =>
                setFormData({ ...formData, hero_subtitle: e.target.value })
              }
              style={{ width: "100%" }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  fontSize: 13,
                  marginBottom: 4,
                }}
              >
                Dates Display
              </label>
              <input
                type="text"
                className="search-input"
                value={formData.hero_dates}
                onChange={(e) =>
                  setFormData({ ...formData, hero_dates: e.target.value })
                }
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  fontSize: 13,
                  marginBottom: 4,
                }}
              >
                Location Display
              </label>
              <input
                type="text"
                className="search-input"
                value={formData.hero_locations}
                onChange={(e) =>
                  setFormData({ ...formData, hero_locations: e.target.value })
                }
                style={{ width: "100%" }}
              />
            </div>
          </div>

          {/* HERO IMAGE UPLOADER — Cloudinary widget instead of Firebase Storage */}
          <div
            style={{
              background: "#ffffff",
              padding: 18,
              borderRadius: 10,
              border: "1px solid #cbd5e1",
            }}
          >
            <label
              style={{
                display: "block",
                fontWeight: 700,
                fontSize: 13,
                marginBottom: 10,
              }}
            >
              Hero Banner Image
            </label>

            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                className="btn-secondary"
                onClick={openUploadWidget}
                disabled={heroUploading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 16px",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: heroUploading ? "not-allowed" : "pointer",
                }}
              >
                <FeatherIcons.UploadCloud size={16} />
                {heroUploading ? "Uploading..." : "Upload Image"}
              </button>

              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>
                OR
              </span>

              <div style={{ flex: 1, minWidth: 260 }}>
                <input
                  type="url"
                  className="search-input"
                  value={formData.hero_image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, hero_image_url: e.target.value })
                  }
                  style={{ width: "100%", fontSize: 13, margin: 0 }}
                  placeholder="Paste image URL (https://...)"
                />
              </div>
            </div>

            {formData.hero_image_url ? (
              <div style={{ marginTop: 16 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#64748b",
                    marginBottom: 6,
                  }}
                >
                  Preview:
                </div>
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: 180,
                    borderRadius: 10,
                    overflow: "hidden",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#1e293b",
                  }}
                >
                  <img
                    src={formData.hero_image_url}
                    alt="Hero preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, hero_image_url: "" })
                    }
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      background: "rgba(15, 23, 42, 0.75)",
                      color: "#ffffff",
                      border: "1px solid rgba(255,255,255,0.2)",
                      padding: "6px 10px",
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <FeatherIcons.Trash2 size={13} />
                    Remove
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* ABOUT SECTION */}
        <div
          style={{
            background: "#f8fafc",
            padding: 20,
            borderRadius: 10,
            marginBottom: 24,
            border: "1px solid #e2e8f0",
          }}
        >
          <h3 style={{ marginTop: 0 }}>About the Festival</h3>
          <textarea
            rows={4}
            className="search-input"
            value={formData.about_text}
            onChange={(e) =>
              setFormData({ ...formData, about_text: e.target.value })
            }
            style={{ width: "100%", resize: "vertical" }}
          />
        </div>

        {/* FESTIVAL HIGHLIGHTS SECTION */}
        <div
          style={{
            background: "#f8fafc",
            padding: 20,
            borderRadius: 10,
            marginBottom: 24,
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h3 style={{ margin: 0 }}>Festival Highlights</h3>
            <button
              type="button"
              className="btn-secondary"
              onClick={addHighlight}
              style={{ fontSize: 12 }}
            >
              + Add Highlight
            </button>
          </div>

          {formData.highlights.map((hl, index) => (
            <div
              key={hl.id || index}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: 14,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 13 }}>
                  Highlight #{index + 1}
                </span>
                {formData.highlights.length > 1 && (
                  <button
                    type="button"
                    className="link-btn danger"
                    style={{ fontSize: 12 }}
                    onClick={() => removeHighlight(index)}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "170px 1fr 2fr",
                  gap: 12,
                  alignItems: "start",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      fontSize: 12,
                      marginBottom: 4,
                    }}
                  >
                    Vector Icon
                  </label>
                  <IconPicker
                    value={hl.icon || "star"}
                    onChange={(newIcon) =>
                      handleHighlightChange(index, "icon", newIcon)
                    }
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      fontSize: 12,
                      marginBottom: 4,
                    }}
                  >
                    Title
                  </label>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Title"
                    value={hl.title}
                    onChange={(e) =>
                      handleHighlightChange(index, "title", e.target.value)
                    }
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      fontSize: 12,
                      marginBottom: 4,
                    }}
                  >
                    Description
                  </label>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Description"
                    value={hl.text}
                    onChange={(e) =>
                      handleHighlightChange(index, "text", e.target.value)
                    }
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA BANNER */}
        <div
          style={{
            background: "#f8fafc",
            padding: 20,
            borderRadius: 10,
            marginBottom: 24,
            border: "1px solid #e2e8f0",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Call to Action Card</h3>
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                fontSize: 13,
                marginBottom: 4,
              }}
            >
              CTA Title
            </label>
            <input
              type="text"
              className="search-input"
              value={formData.cta_title}
              onChange={(e) =>
                setFormData({ ...formData, cta_title: e.target.value })
              }
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                fontSize: 13,
                marginBottom: 4,
              }}
            >
              CTA Text
            </label>
            <textarea
              rows={2}
              className="search-input"
              value={formData.cta_text}
              onChange={(e) =>
                setFormData({ ...formData, cta_text: e.target.value })
              }
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                fontSize: 13,
                marginBottom: 4,
              }}
            >
              Button Text
            </label>
            <input
              type="text"
              className="search-input"
              value={formData.cta_button_text}
              onChange={(e) =>
                setFormData({ ...formData, cta_button_text: e.target.value })
              }
              style={{ width: "100%" }}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={saving || heroUploading}
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
