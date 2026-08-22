import React, { useState, useEffect } from "react";
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
import { db } from "../firebaseClient";

const emptyForm = {
  title: "",
  imageUrl: "",
  category: "",
  venue: "",
  startDate: "",
  status: "Open",
  capacity: "2",
  isPublished: true,
  isFeatured: false,
};

// Safe date formatter for table display
const formatDate = (dateVal) => {
  if (!dateVal) return "—";
  if (dateVal && typeof dateVal.toDate === "function") {
    return dateVal.toDate().toLocaleString();
  }
  const parsed = new Date(dateVal);
  return !isNaN(parsed.getTime()) ? parsed.toLocaleString() : "—";
};

// Safe date parser for form input (datetime-local format: YYYY-MM-DDTHH:mm)
const getDatetimeInputString = (dateVal) => {
  if (!dateVal) return "";
  try {
    const d = typeof dateVal.toDate === "function" ? dateVal.toDate() : new Date(dateVal);
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
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Fetch all events without strict server-side orderBy to include docs missing created_at
    const unsubscribe = onSnapshot(
      collection(db, "events"),
      (snapshot) => {
        const fetchedDocs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        // Sort client-side safely
        fetchedDocs.sort((a, b) => {
          const timeA = a.created_at?.toMillis
            ? a.created_at.toMillis()
            : a.start_date?.toMillis
            ? a.start_date.toMillis()
            : 0;
          const timeB = b.created_at?.toMillis
            ? b.created_at.toMillis()
            : b.start_date?.toMillis
            ? b.start_date.toMillis()
            : 0;
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
  };

  const startEdit = (ev) => {
    setEditingId(ev.id);
    setForm({
      title: ev.title || "",
      imageUrl: ev.image_url || "",
      category: ev.category || "",
      venue: ev.venue || "",
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
        image_url: form.imageUrl.trim(),
        category: form.category.trim(),
        venue: form.venue.trim(),
        start_date: eventStartTimestamp,
        status: form.status,
        capacity: form.capacity ? Number(form.capacity) : null,
        published: Boolean(form.isPublished),
        featured: Boolean(form.isFeatured),
      };

      if (editingId) {
        await updateDoc(doc(db, "events", editingId), payload);
        alert("Event updated!");
      } else {
        await addDoc(collection(db, "events"), {
          ...payload,
          booked_count: 0,
          created_at: serverTimestamp(),
        });
        alert("Event created!");
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
    if (window.confirm("Are you sure you want to delete this event?")) {
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
      ev.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="events-page-container" style={{ padding: 24 }}>
      <h1>Events</h1>
      <p style={{ color: "#666", marginBottom: 16 }}>
        Manage lifecycle, visibility, and featured status for festival events.
      </p>

      <input
        type="text"
        placeholder="Search by title, venue, or category..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          width: "100%",
          maxWidth: 400,
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px solid #ddd",
          marginBottom: 24,
        }}
      />

      <form onSubmit={handleSave} style={styles.card}>
        <h2 style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>
          {editingId ? "Edit Event" : "New Event"}
        </h2>

        <div style={styles.formGroup}>
          <label style={styles.label}>Title</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Image URL</label>
          <input
            type="text"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            style={styles.input}
            placeholder="https://..."
          />
        </div>

        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Category</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              style={styles.input}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Venue</label>
            <input
              type="text"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Start Date & Time</label>
            <input
              type="datetime-local"
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
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Capacity (blank = unlimited)</label>
            <input
              type="number"
              min="0"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              style={styles.input}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 24, margin: "16px 0" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) =>
                setForm({ ...form, isPublished: e.target.checked })
              }
            />
            Published
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) =>
                setForm({ ...form, isFeatured: e.target.checked })
              }
            />
            Featured
          </label>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: "#5850ec",
              color: "#fff",
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            {loading ? "Saving..." : editingId ? "Update" : "Save"}
          </button>
          <button
            type="button"
            onClick={resetForm}
            style={{
              backgroundColor: "#fff",
              color: "#333",
              padding: "10px 20px",
              borderRadius: 8,
              border: "1px solid #ddd",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </form>

      <div style={{ ...styles.card, marginTop: 24 }}>
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
              }}
            >
              <th style={styles.th}>TITLE</th>
              <th style={styles.th}>CATEGORY</th>
              <th style={styles.th}>VENUE</th>
              <th style={styles.th}>START DATE</th>
              <th style={styles.th}>STATUS</th>
              <th style={styles.th}>CAPACITY</th>
              <th style={styles.th}>BOOKED</th>
              <th style={styles.th}>PUBLISHED</th>
              <th style={styles.th}>FEATURED</th>
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
                    padding: "32px",
                    color: "#a0aec0",
                  }}
                >
                  No items found.
                </td>
              </tr>
            ) : (
              filteredEvents.map((ev) => (
                <tr
                  key={ev.id}
                  style={{ borderBottom: "1px solid #edf2f7", fontSize: 14 }}
                >
                  <td style={styles.td}>
                    <strong>{ev.title}</strong>
                  </td>
                  <td style={styles.td}>{ev.category || "—"}</td>
                  <td style={styles.td}>{ev.venue || "—"}</td>
                  <td style={styles.td}>{formatDate(ev.start_date)}</td>
                  <td style={styles.td}>{ev.status || "Open"}</td>
                  <td style={styles.td}>{ev.capacity ?? "Unlimited"}</td>
                  <td style={styles.td}>{ev.booked_count ?? 0}</td>
                  <td style={styles.td}>{ev.published ? "Yes" : "No"}</td>
                  <td style={styles.td}>{ev.featured ? "Yes" : "No"}</td>
                  <td style={styles.td}>
                    <button
                      onClick={() => startEdit(ev)}
                      style={{
                        color: "#5850ec",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        marginRight: 12,
                        fontWeight: 600,
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
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    padding: 24,
  },
  formGroup: { marginBottom: 16 },
  row: { display: "flex", gap: 16, marginBottom: 16 },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: "600",
    color: "#4a5568",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #cbd5e0",
    fontSize: 14,
    boxSizing: "border-box",
  },
  th: { padding: "12px 16px", fontWeight: "bold" },
  td: { padding: "14px 16px" },
};