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

  // Form State Values
  const [name, setName] = useState("");
  const [type, setType] = useState("talks");
  const [color, setColor] = useState("#3b82f6");
  const [imageUrl, setImageUrl] = useState("");

  // 1. Live stream actual records from Firestore
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

  // Filter client table arrays
  const filteredCategories = categories.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.type?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const typeLabel = (t) =>
    t === "talks"
      ? "🎤 Talks"
      : t === "workshops"
        ? "🛠️ Workshops"
        : t === "exhibitions"
          ? "🖼️ Exhibitions"
          : t === "networking"
            ? "🤝 Networking"
            : "🎉 Festival";

  return (
    <div style={{ background: "#fff", color: "#333" }}>
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
          <h1>Event Categories</h1>
          <p className="muted">
            Organise events by type — Talks, Workshops, Exhibitions, and more.
            These power the category filters attendees use in the app.
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
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          style={{
            width: "100%",
            padding: "12px",
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            color: "#333",
          }}
        />
      </div>

      {/* Main Core Responsive Data Layout */}
      <table
        className="data-table"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr
            style={{
              textAlign: "left",
              borderBottom: "2px solid #e5e7eb",
              color: "#6b7280",
              fontSize: 12,
            }}
          >
            <th style={{ padding: 12 }}>PREVIEW</th>
            <th style={{ padding: 12 }}>CATEGORY NAME</th>
            <th style={{ padding: 12 }}>TYPE</th>
            <th style={{ padding: 12 }}>THEME COLOUR</th>
            <th style={{ padding: 12, textAlign: "right" }}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {filteredCategories.map((c) => (
            <tr
              key={c.id}
              style={{ borderBottom: "1px solid #e5e7eb", color: "#1f2937" }}
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
                    background: "#f3f4f6",
                    border: "1px solid #e5e7eb",
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
                    fontWeight: "600",
                    color: "#4b5563",
                    background: "#f3f4f6",
                    padding: "4px 8px",
                    borderRadius: 4,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  {typeLabel(c.type)}
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
                      border: "1px solid rgba(0,0,0,0.1)",
                    }}
                  ></span>
                  <code style={{ color: "#6b7280" }}>{c.color}</code>
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
                    fontWeight: "500",
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
                style={{ textAlign: "center", padding: 32, color: "#6b7280" }}
              >
                No categories matched or found. Click create to add one!
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Built-in Custom Modal Popup - Styled Bright & Clean */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 24,
              width: "100%",
              maxWidth: 440,
              color: "#1f2937",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3 style={{ margin: "0 0 4px 0", color: "#111827" }}>
              Create Event Category
            </h3>
            <p
              className="muted"
              style={{ fontSize: 12, margin: "0 0 20px 0", color: "#6b7280" }}
            >
              Add a new category attendees can use to filter events in the app.
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
                    color: "#4b5563",
                    fontWeight: "500",
                  }}
                >
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Fashion Design Workshop, AI Keynote Talk"
                  style={{
                    width: "100%",
                    padding: 10,
                    background: "#fff",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    color: "#333",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    marginBottom: 6,
                    color: "#4b5563",
                    fontWeight: "500",
                  }}
                >
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 10,
                    background: "#fff",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    color: "#333",
                  }}
                >
                  <option value="talks">
                    🎤 Talks (Keynotes, Panels, Q&As)
                  </option>
                  <option value="workshops">
                    🛠️ Workshops (Hands-on sessions)
                  </option>
                  <option value="exhibitions">
                    🖼️ Exhibitions (Showcases, Installations)
                  </option>
                  <option value="networking">
                    🤝 Networking (Meetups, Socials)
                  </option>
                  <option value="festival">
                    🎉 Festival (General festival programming)
                  </option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    marginBottom: 6,
                    color: "#4b5563",
                    fontWeight: "500",
                  }}
                >
                  Filter Colour (hex)
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#3b82f6"
                  style={{
                    width: "100%",
                    padding: 10,
                    background: "#fff",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    color: "#333",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    marginBottom: 6,
                    color: "#4b5563",
                    fontWeight: "500",
                  }}
                >
                  Thumbnail Image URL
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste any web image URL link"
                  style={{
                    width: "100%",
                    padding: 10,
                    background: "#fff",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    color: "#333",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "end",
                  gap: 10,
                  marginTop: 12,
                  borderTop: "1px solid #e5e7eb",
                  paddingTop: 16,
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#6b7280",
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
