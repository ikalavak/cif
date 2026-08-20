import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseClient"; // Ensure this points to your firebase config

export default function EventsAdmin() {
  // 1. Form States (matching your screenshot fields)
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("");
  const [venue, setVenue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [status, setStatus] = useState("Open");
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Table state
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 2. Real-time Listener: Keeps the table synced with Firestore
  // NOTE: collection is "events" (lowercase) to match what HomeScreen.js
  // and the rest of the app read from.
  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("created_at", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const liveData = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setEvents(liveData);
      },
      (error) => {
        console.error("Error fetching events:", error);
      },
    );

    return () => unsubscribe();
  }, []);

  // 3. Save Handler: Writes the new event to Firestore
  const handleSave = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please provide an event title.");
      return;
    }

    setLoading(true);

    try {
      // Parse the startDate into a Firestore Timestamp if provided
      let eventStartTimestamp = null;
      if (startDate) {
        eventStartTimestamp = Timestamp.fromDate(new Date(startDate));
      }

      // Add new document to /events collection
      // Field names (start_date, published, featured, created_at) match
      // what HomeScreen.js and firestore.rules expect elsewhere in the app.
      await addDoc(collection(db, "events"), {
        title: title.trim(),
        image_url: imageUrl.trim(),
        category: category.trim(),
        venue: venue.trim(),
        start_date: eventStartTimestamp,
        status: status,
        published: Boolean(isPublished),
        featured: Boolean(isFeatured),
        created_at: serverTimestamp(),
      });

      // Clear Form Fields on success
      setTitle("");
      setImageUrl("");
      setCategory("");
      setVenue("");
      setStartDate("");
      setStatus("Open");
      setIsPublished(true);
      setIsFeatured(false);

      alert("Event successfully created and saved to database!");
    } catch (error) {
      console.error("Error adding event to Firestore:", error);
      alert("Failed to save event: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Delete Handler
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await deleteDoc(doc(db, "events", id));
      } catch (error) {
        alert("Error deleting event: " + error.message);
      }
    }
  };

  // Filter events based on search query
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

      {/* Search Bar */}
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

      {/* New Event Form Card */}
      <form onSubmit={handleSave} style={styles.card}>
        <h2 style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>
          New Event
        </h2>

        {/* Title */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.input}
          />
        </div>

        {/* Image URL */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Image URL</label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            style={styles.input}
            placeholder="https://res.cloudinary.com/..."
          />
        </div>

        {/* Category & Venue Row */}
        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Venue</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        {/* Start Date & Status Row */}
        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Start date</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={styles.input}
            >
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
              <option value="Draft">Draft</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Checkboxes Row */}
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
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
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
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
            />
            Featured
          </label>
        </div>

        {/* Buttons */}
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
            {loading ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              setTitle("");
              setImageUrl("");
              setCategory("");
              setVenue("");
              setStartDate("");
            }}
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

      {/* Events Table */}
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
  formGroup: {
    marginBottom: 16,
  },
  row: {
    display: "flex",
    gap: 16,
    marginBottom: 16,
  },
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
  th: {
    padding: "12px 16px",
    fontWeight: "bold",
  },
  td: {
    padding: "14px 16px",
  },
};
