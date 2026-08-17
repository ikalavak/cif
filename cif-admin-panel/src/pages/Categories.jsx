import React, { useState, useEffect } from "react";
import { db } from "../firebaseClient";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Form State Values matching festival documents
  const [name, setName] = useState("");
  const [type, setType] = useState("music");
  const [color, setColor] = useState("#3b82f6");
  const [imageUrl, setImageUrl] = useState("");

  // 1. Stream actual rows from Firestore
  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCategories(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
    });
    return () => unsubscribe();
  }, []);

  // 2. Submit new entry safely to Firebase
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await addDoc(collection(db, "categories"), {
        name: name.trim(),
        type: type,
        color: color.trim(),
        image_url: imageUrl.trim() || "https://unsplash.com",
      });

      setName("");
      setImageUrl("");
      setIsOpen(false);
    } catch (error) {
      console.error("Error writing document to Firestore: ", error);
    }
  };

  // 3. Remove entry
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this category?")) {
      await deleteDoc(doc(db, "categories", id));
    }
  };

  // Filter client table lists using search bar
  const filteredCategories = categories.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.type?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div>
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h1>Festival Categories & Zones</h1>
          <p className="muted">
            Manage the schedule classification tracks, technical zones, and
            workshop types derived from the 2026 program.
          </p>
        </div>
        <button
          className="quick-action"
          onClick={() => setIsOpen(true)}
          style={{
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          + Create
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search scheduled genres or zone types..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          style={{
            width: "100%",
            padding: "12px",
            background: "#1a1a1e",
            border: "1px solid #2a2a32",
            borderRadius: 8,
            color: "#fff",
          }}
        />
      </div>

      {/* Main Core Schedule Category Matrix */}
      <table
        className="data-table"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr
            style={{
              textAlign: "left",
              borderBottom: "1px solid #2a2a32",
              color: "#9ca3af",
              fontSize: 12,
            }}
          >
            <th style={{ padding: 12 }}>PREVIEW</th>
            <th style={{ padding: 12 }}>CATEGORY TRACK NAME</th>
            <th style={{ padding: 12 }}>CLASSIFICATION</th>
            <th style={{ padding: 12 }}>MAP TARGET COLOUR</th>
            <th style={{ padding: 12, textAlign: "right" }}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {filteredCategories.map((c) => (
            <tr
              key={c.id}
              style={{ borderBottom: "1px solid #1a1a1e", color: "#e5e7eb" }}
            >
              <td style={{ padding: 12 }}>
                <img
                  src={c.image_url}
                  alt=""
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 6,
                    objectFit: "cover",
                    background: "#2a2a32",
                  }}
                />
              </td>
              <td style={{ padding: 12 }}>
                <strong>{c.name}</strong>
              </td>
              <td style={{ padding: 12 }}>
                <span
                  style={{
                    textTransform: "uppercase",
                    fontSize: 11,
                    background: "#2a2a32",
                    padding: "4px 8px",
                    borderRadius: 4,
                  }}
                >
                  {c.type === "music"
                    ? "🎵 Music"
                    : c.type === "food"
                      ? "🍔 Food"
                      : c.type === "tech"
                        ? "⚡ Tech"
                        : "🎪 Activity"}
                </span>
              </td>
              <td style={{ padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: c.color,
                    }}
                  ></span>
                  <code style={{ color: "#9ca3af" }}>{c.color}</code>
                </div>
              </td>
              <td style={{ padding: 12, textAlign: "right" }}>
                <button
                  onClick={() => handleDelete(c.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#ef4444",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {filteredCategories.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="muted"
                style={{ textAlign: "center", padding: 32 }}
              >
                No schedule tracks detected. Use the Create window to add items.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Built-in Modal Popup tailored with context guidelines */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#1a1a1e",
              border: "1px solid #2a2a32",
              borderRadius: 12,
              padding: 24,
              width: "100%",
              maxWidth: 440,
              color: "#fff",
            }}
          >
            <h3 style={{ margin: "0 0 4px 0" }}>Add Schedule Track</h3>
            <p className="muted" style={{ fontSize: 12, margin: "0 0 20px 0" }}>
              Assign new tracks based on the active event schedules.
            </p>

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    marginBottom: 6,
                    color: "#9ca3af",
                  }}
                >
                  Track / Zone Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Fashion-Tech Installations, Creative Panel Talks"
                  style={{
                    width: "100%",
                    padding: 10,
                    background: "#121214",
                    border: "1px solid #2a2a32",
                    borderRadius: 6,
                    color: "#fff",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    marginBottom: 6,
                    color: "#9ca3af",
                  }}
                >
                  Classification Track
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 10,
                    background: "#121214",
                    border: "1px solid #2a2a32",
                    borderRadius: 6,
                    color: "#fff",
                  }}
                >
                  <option value="music">
                    🎵 Music (The Cypher / Performances)
                  </option>
                  <option value="food">🍔 Food (Café Area / Bars)</option>
                  <option value="tech">
                    ⚡ Tech (Immersive Horror, Wearables, VR)
                  </option>
                  <option value="activities">
                    🎪 Non-Tech Activities (Careers Labs, Creative Workshops)
                  </option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    marginBottom: 6,
                    color: "#9ca3af",
                  }}
                >
                  Theme Hex Colour (Map Marker)
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#3b82f6"
                  style={{
                    width: "100%",
                    padding: 10,
                    background: "#121214",
                    border: "1px solid #2a2a32",
                    borderRadius: 6,
                    color: "#fff",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    marginBottom: 6,
                    color: "#9ca3af",
                  }}
                >
                  Display Image URL
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste image asset address link"
                  style={{
                    width: "100%",
                    padding: 10,
                    background: "#121214",
                    border: "1px solid #2a2a32",
                    borderRadius: 6,
                    color: "#fff",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "end",
                  gap: 10,
                  marginTop: 12,
                  borderTop: "1px solid #2a2a32",
                  paddingTop: 16,
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#9ca3af",
                    cursor: "pointer",
                    padding: "8px 12px",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: "#3b82f6",
                    color: "#fff",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
