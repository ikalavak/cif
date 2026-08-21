import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
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
  isPublished: true,
  isFeatured: false,
};

export default function EventsAdmin() {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null); // null = creating, otherwise editing this doc id

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setEvents(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => console.error("Error fetching events:", error),
    );
    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  // Populate the form with an existing event's data and switch to edit mode
  const startEdit = (ev) => {
    setEditingId(ev.id);
    setForm({
      title: ev.title || "",
      imageUrl: ev.image_url || "",
      category: ev.category || "",
      venue: ev.venue || "",
      startDate: ev.start_date
        ? new Date(ev.start_date.toDate()).toISOString().slice(0, 16)
        : "",
      status: ev.status || "Open",
      isPublished: !!ev.published,
      isFeatured: !!ev.featured,
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
        published: Boolean(form.isPublished),
        featured: Boolean(form.isFeatured),
      };

      if (editingId) {
        // Update existing event — created_at stays untouched
        await updateDoc(doc(db, "events", editingId), payload);
        alert("Event updated!");
      } else {
        // Create new event
        await addDoc(collection(db, "events"), {
          ...payload,
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
        // If the deleted event was mid-edit, clear the form
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
      ev.category?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="events-page-container" style={{ padding: 24 }}>
      <h1>Events</h1>
      <p style={{ color: "#666", marginBottom: 16 }}>
        Manage lifecycle, visibility, and featured status for festival events.
      </p>

      <input
        type="text"
        placeholder="Search..."
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
            placeholder="https://res.cloudinary.com/..."
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
            <label style={styles.label}>Start date</label>
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
              <th style={styles.th}>PUBLISHED</th>
              <th style={styles.th}>FEATURED</th>
              <th style={styles.th}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  style={{
                    textAlign: "center",
                    padding: "32px",
                    color: "#a0aec0",
                  }}
                >
                  No items yet.
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
                  <td style={styles.td}>
                    {ev.start_date
                      ? ev.start_date.toDate().toLocaleString()
                      : "—"}
                  </td>
                  <td style={styles.td}>{ev.status}</td>
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
