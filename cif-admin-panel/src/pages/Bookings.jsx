import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebaseClient";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  runTransaction,
} from "firebase/firestore";

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  // Live bookings
  useEffect(() => {
    const q = query(collection(db, "bookings"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setBookings(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  // Live events, so we can show titles instead of raw IDs and build the filter dropdown
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "events"), (snapshot) => {
      setEvents(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, []);

  const eventTitleMap = useMemo(() => {
    const map = {};
    events.forEach((e) => {
      map[e.id] = e.title;
    });
    return map;
  }, [events]);

  const enriched = useMemo(() => {
    return bookings.map((b) => ({
      ...b,
      eventTitle: eventTitleMap[b.eventId] || "(deleted event)",
    }));
  }, [bookings, eventTitleMap]);

  const filtered = enriched.filter((b) => {
    const matchesEvent = eventFilter === "all" || b.eventId === eventFilter;
    const matchesSearch =
      !search ||
      b.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      b.eventTitle?.toLowerCase().includes(search.toLowerCase());
    return matchesEvent && matchesSearch;
  });

  const cancelBooking = async (booking) => {
    if (
      !window.confirm(
        `Cancel ${booking.userEmail}'s booking for "${booking.eventTitle}"?`,
      )
    )
      return;
    setCancellingId(booking.id);
    setError("");

    try {
      await runTransaction(db, async (transaction) => {
        const eventRef = doc(db, "events", booking.eventId);
        const eventSnap = await transaction.get(eventRef);
        if (eventSnap.exists()) {
          const currentCount = eventSnap.data().booked_count || 0;
          transaction.update(eventRef, {
            booked_count: Math.max(0, currentCount - 1),
          });
        }
        transaction.delete(doc(db, "bookings", booking.id));
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  // Events that actually have at least one booking, for a cleaner filter list
  const eventsWithBookings = useMemo(() => {
    const ids = new Set(bookings.map((b) => b.eventId));
    return events.filter((e) => ids.has(e.id));
  }, [events, bookings]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Bookings</h1>
          <p className="muted">
            Who's booked what — {bookings.length} total booking
            {bookings.length === 1 ? "" : "s"}.
          </p>
        </div>
      </div>

      <div
        style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}
      >
        <input
          className="search-input"
          style={{ marginBottom: 0, maxWidth: 320 }}
          placeholder="Search by email or event..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #d5d7de",
            fontSize: 14,
          }}
        >
          <option value="all">All events</option>
          {eventsWithBookings.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="form-error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading ? (
        <p className="muted">Loading bookings...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Attendee</th>
              <th>Event</th>
              <th>Booked At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id}>
                <td>{b.userEmail || b.userId}</td>
                <td>{b.eventTitle}</td>
                <td>
                  {b.created_at?.toDate
                    ? b.created_at.toDate().toLocaleString()
                    : b.created_at instanceof Date
                      ? b.created_at.toLocaleString()
                      : "—"}
                </td>
                <td>
                  <button
                    className="link-btn danger"
                    disabled={cancellingId === b.id}
                    onClick={() => cancelBooking(b)}
                  >
                    {cancellingId === b.id ? "Cancelling..." : "Cancel booking"}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="muted"
                  style={{ textAlign: "center", padding: 24 }}
                >
                  No bookings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
