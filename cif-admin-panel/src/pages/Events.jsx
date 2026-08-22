// src/pages/EventsAdmin.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  onSnapshot,
  deleteDoc,
  doc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { db, storage } from "../firebaseClient";

const emptyForm = {
  title: "",
  description: "",
  speaker: "",
  imageUrl: "",
  category: "",
  venue: "",
  room: "",
  price: "",
  startDate: "",
  status: "Open",
  capacity: "",
  isPublished: true,
  isFeatured: false,
};

// Safe date formatter for table display
const formatDate = (dateVal) => {
  if (!dateVal) return "—";
  if (dateVal && typeof dateVal.toDate === "function") {
    return dateVal.toDate().toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  const parsed = new Date(dateVal);
  return !isNaN(parsed.getTime()) ? parsed.toLocaleString() : "—";
};

// Safe date parser for form input (datetime-local format: YYYY-MM-DDTHH:mm)
const getDatetimeInputString = (dateVal) => {
  if (!dateVal) return "";
  try {
    const d =
      typeof dateVal.toDate === "function"
        ? dateVal.toDate()
        : new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  } catch {
    return "";
  }
};

export default function EventsAdmin() {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "events"),
      (snapshot) => {
        const fetchedDocs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        // Sort by start date or creation date
        fetchedDocs.sort((a, b) => {
          const timeA = a.start_date?.toMillis
            ? a.start_date.toMillis()
            : a.created_at?.toMillis || 0;
          const timeB = b.start_date?.toMillis
            ? b.start_date.toMillis()
            : b.created_at?.toMillis || 0;
          return timeB - timeA;
        });

        setEvents(fetchedDocs);
      },
      (error) => {
        console.error("Error fetching events in admin panel:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (PNG, JPG, WEBP, etc.)");
      return;
    }

    if (!storage) {
      alert("Firebase Storage instance not found in firebaseClient.js");
      return;
    }

    setUploadingImage(true);
    setUploadProgress(0);

    const fileName = `events/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const fileRef = storageRef(storage, fileName);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Image upload failed:", error);
        alert("Upload failed: " + error.message);
        setUploadingImage(false);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setForm((prev) => ({ ...prev, imageUrl: downloadUrl }));
        } catch (err) {
          console.error("Failed to retrieve download URL:", err);
          alert("Failed to retrieve uploaded image URL.");
        } finally {
          setUploadingImage(false);
        }
      }
    );
  };

  const startEdit = (ev) => {
    setEditingId(ev.id);
    setForm({
      title: ev.title || "",
      description: ev.description || "",
      speaker: ev.speaker || ev.organizer || "",
      imageUrl: ev.image_url || ev.image || "",
      category: ev.category || "",
      venue: ev.venue || "",
      room: ev.room || "",
      price: ev.price != null ? String(ev.price) : "",
      startDate: getDatetimeInputString(ev.start_date),
      status: ev.status || "Open",
      capacity: ev.capacity != null ? String(ev.capacity) : "",
      isPublished: ev.published !== undefined ? Boolean(ev.published) : true,
      isFeatured: ev.featured !== undefined ? Boolean(ev.featured) : false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Please provide an event title.");
      return;
    }

    setLoading(true);

    try {
      const eventStartTimestamp = form.startDate
        ? Timestamp.fromDate(new Date(form.startDate))
        : null;

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        speaker: form.speaker.trim(),
        organizer: form.speaker.trim() || "Creative Industries Festival",
        image_url: form.imageUrl.trim(),
        category: form.category.trim() || "Creative Festival Session",
        venue: form.venue.trim(),
        room: form.room.trim(),
        price: form.price ? Number(form.price) : null,
        start_date: eventStartTimestamp,
        status: form.status,
        capacity: form.capacity ? Number(form.capacity) : null,
        published: Boolean(form.isPublished),
        featured: Boolean(form.isFeatured),
      };

      if (editingId) {
        await updateDoc(doc(db, "events", editingId), payload);
        alert("Event updated successfully!");
      } else {
        await addDoc(collection(db, "events"), {
          ...payload,
          booked_count: 0,
          created_at: serverTimestamp(),
        });
        alert("New festival event published!");
      }

      resetForm();
    } catch (error) {
      console.error("Error saving event to Firestore:", error);
      alert("Failed to save event: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this event? This will also remove it from the mobile app."
      )
    ) {
      try {
        await deleteDoc(doc(db, "events", id));
        if (editingId === id) resetForm();
      } catch (error) {
        alert("Error deleting event: " + error.message);
      }
    }
  };

  const filteredEvents = events.filter(
    (ev) =>
      ev.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.venue?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.speaker?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="events-page-container"
      style={{ padding: 28, maxWidth: 1200, margin: "0 auto" }}
    >
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: "800", color: "#1a202c" }}>
          Festival Events Management
        </h1>
        <p style={{ color: "#718096", marginTop: 4 }}>
          Publish and update live festival sessions, schedules, room
          assignments, and ticket availability across mobile apps.
        </p>
      </div>

      <input
        type="text"
        placeholder="Search by title, speaker, venue, or category..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          width: "100%",
          maxWidth: 420,
          padding: "12px 16px",
          borderRadius: 10,
          border: "1px solid #cbd5e0",
          marginBottom: 24,
          fontSize: 14,
        }}
      />

      <form onSubmit={handleSave} style={styles.card}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: "bold",
            marginBottom: 20,
            color: "#2d3748",
          }}
        >
          {editingId ? "✏️ Edit Event Details" : "➕ Create New Festival Event"}
        </h2>

        {/* Title */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Event Title *</label>
          <input
            type="text"
            required
            placeholder="e.g. Future of Digital Fashion & AR"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={styles.input}
          />
        </div>

        {/* Description */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Description & Session Overview</label>
          <textarea
            rows="4"
            placeholder="Detailed overview shown in the Eventbrite-style detail sheet on mobile..."
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            style={{ ...styles.input, resize: "vertical" }}
          />
        </div>

        {/* Speaker & Image (URL or Picker) */}
        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Speaker / Host / Presenter</label>
            <input
              type="text"
              placeholder="e.g. Dr. Alex Vance, Prof. Sarah Jenkins"
              value={form.speaker}
              onChange={(e) => setForm({ ...form, speaker: e.target.value })}
              style={styles.input}
            />
          </div>

          <div style={{ flex: 1.3 }}>
            <label style={styles.label}>Hero Banner Image</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="text"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                style={{ ...styles.input, flex: 1 }}
                placeholder="Paste URL or choose file →"
              />

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                style={{
                  backgroundColor: "#edf2f7",
                  color: "#2d3748",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e0",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: 13,
                  whiteSpace: "nowrap",
                }}
              >
                {uploadingImage ? `Uploading ${uploadProgress}%` : "📁 Choose File"}
              </button>
            </div>

            {/* Thumbnail Preview */}
            {form.imageUrl ? (
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  style={{
                    width: 60,
                    height: 40,
                    objectFit: "cover",
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                <span style={{ fontSize: 12, color: "#718096" }}>
                  Image selected
                </span>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, imageUrl: "" }))}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#e53e3e",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  Clear
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Category, Venue, Room */}
        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Category</label>
            <input
              type="text"
              placeholder="e.g. Keynote, Workshop, Media Lab"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              style={styles.input}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Venue / Campus</label>
            <input
              type="text"
              placeholder="e.g. Royal Docks Centre for Sustainability"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              style={styles.input}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Room / Stage / Floor</label>
            <input
              type="text"
              placeholder="e.g. Main Auditorium / Lab 304"
              value={form.room}
              onChange={(e) => setForm({ ...form, room: e.target.value })}
              style={styles.input}
            />
          </div>
        </div>

        {/* Date, Status, Capacity, Price */}
        <div style={styles.row}>
          <div style={{ flex: 1.2 }}>
            <label style={styles.label}>Start Date & Time *</label>
            <input
              type="datetime-local"
              required
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              style={styles.input}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              style={styles.input}
            >
              <option value="Open">Open</option>
              <option value="Almost Full">Almost Full</option>
              <option value="Sold Out">Sold Out</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div style={{ flex: 0.8 }}>
            <label style={styles.label}>Capacity (blank = ∞)</label>
            <input
              type="number"
              min="0"
              placeholder="100"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              style={styles.input}
            />
          </div>
          <div style={{ flex: 0.8 }}>
            <label style={styles.label}>Ticket Price (£)</label>
            <input
              type="number"
              min="0"
              step="0.5"
              placeholder="0 (Free)"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              style={styles.input}
            />
          </div>
        </div>

        {/* Checkboxes */}
        <div style={{ display: "flex", gap: 28, margin: "20px 0" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              fontWeight: "600",
              color: "#4a5568",
            }}
          >
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) =>
                setForm({ ...form, isPublished: e.target.checked })
              }
              style={{ width: 18, height: 18 }}
            />
            Published on Mobile App
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              fontWeight: "600",
              color: "#4a5568",
            }}
          >
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) =>
                setForm({ ...form, isFeatured: e.target.checked })
              }
              style={{ width: 18, height: 18 }}
            />
            Feature on Home Banner
          </label>
        </div>

        {/* Submit Buttons */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="submit"
            disabled={loading || uploadingImage}
            style={{
              backgroundColor: "#8B5CF6",
              color: "#fff",
              padding: "12px 28px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: 14,
            }}
          >
            {loading
              ? "Processing..."
              : editingId
              ? "Save & Update Event"
              : "Publish Event"}
          </button>
          <button
            type="button"
            onClick={resetForm}
            style={{
              backgroundColor: "#fff",
              color: "#4a5568",
              padding: "12px 24px",
              borderRadius: 10,
              border: "1px solid #cbd5e0",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: 14,
            }}
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Events Data Table */}
      <div style={{ ...styles.card, marginTop: 28, overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "2px solid #edf2f7",
                color: "#718096",
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              <th style={styles.th}>IMAGE</th>
              <th style={styles.th}>TITLE & SPEAKER</th>
              <th style={styles.th}>CATEGORY</th>
              <th style={styles.th}>LOCATION</th>
              <th style={styles.th}>START DATE</th>
              <th style={styles.th}>PRICE</th>
              <th style={styles.th}>CAPACITY</th>
              <th style={styles.th}>BOOKED</th>
              <th style={styles.th}>PUBLISHED</th>
              <th style={styles.th}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.length === 0 ? (
              <tr>
                <td
                  colSpan="10"
                  style={{
                    textAlign: "center",
                    padding: "36px",
                    color: "#a0aec0",
                    fontWeight: "500",
                  }}
                >
                  No festival events found matching your search.
                </td>
              </tr>
            ) : (
              filteredEvents.map((ev) => (
                <tr
                  key={ev.id}
                  style={{ borderBottom: "1px solid #edf2f7", fontSize: 14 }}
                >
                  <td style={styles.td}>
                    {ev.image_url || ev.image ? (
                      <img
                        src={ev.image_url || ev.image}
                        alt="Event"
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          backgroundColor: "#edf2f7",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#a0aec0",
                          fontSize: 10,
                        }}
                      >
                        No Img
                      </div>
                    )}
                  </td>
                  <td style={styles.td}>
                    <strong style={{ color: "#2d3748" }}>{ev.title}</strong>
                    {ev.speaker && (
                      <div style={{ fontSize: 12, color: "#8B5CF6", marginTop: 2 }}>
                        🎙 {ev.speaker}
                      </div>
                    )}
                  </td>
                  <td style={styles.td}>{ev.category || "—"}</td>
                  <td style={styles.td}>
                    <div>{ev.venue || "—"}</div>
                    {ev.room && (
                      <div style={{ fontSize: 11, color: "#a0aec0" }}>
                        Room: {ev.room}
                      </div>
                    )}
                  </td>
                  <td style={styles.td}>{formatDate(ev.start_date)}</td>
                  <td style={styles.td}>{ev.price ? `£${ev.price}` : "FREE"}</td>
                  <td style={styles.td}>{ev.capacity ?? "∞"}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        backgroundColor: "#10b98120",
                        color: "#059669",
                        fontWeight: "700",
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                    >
                      {ev.booked_count ?? 0}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        color: ev.published ? "#059669" : "#dc2626",
                        fontWeight: "700",
                        fontSize: 12,
                      }}
                    >
                      {ev.published ? "✓ Live" : "Draft"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button
                      onClick={() => startEdit(ev)}
                      style={{
                        color: "#8B5CF6",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        marginRight: 12,
                        fontWeight: 700,
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(ev.id)}
                      style={{
                        color: "#e53e3e",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    padding: 24,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  },
  formGroup: { marginBottom: 16 },
  row: { display: "flex", gap: 16, marginBottom: 16 },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: "700",
    color: "#4a5568",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #cbd5e0",
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
    fontFamily: "inherit",
  },
  th: { padding: "14px 16px", fontWeight: "bold" },
  td: { padding: "14px 16px" },
};