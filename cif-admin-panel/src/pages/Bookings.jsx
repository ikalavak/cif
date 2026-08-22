import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebaseClient";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  runTransaction,
  updateDoc,
} from "firebase/firestore";

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  // Verification state
  const [verifyInput, setVerifyInput] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);

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
      }
    );
    return unsubscribe;
  }, []);

  // Live events
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "events"), (snapshot) => {
      setEvents(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, []);

  const eventMap = useMemo(() => {
    const map = {};
    events.forEach((e) => {
      map[e.id] = e;
    });
    return map;
  }, [events]);

  const enriched = useMemo(() => {
    return bookings.map((b) => {
      const parentEvent = eventMap[b.eventId];
      return {
        ...b,
        eventTitle: parentEvent?.title || "(deleted event)",
        eventDate: b.eventDate || parentEvent?.date || "—",
        eventTime: b.eventTime || parentEvent?.time || "—",
        quantity: b.quantity || 1,
        status: b.status || "Valid",
      };
    });
  }, [bookings, eventMap]);

  const filtered = enriched.filter((b) => {
    const matchesEvent = eventFilter === "all" || b.eventId === eventFilter;
    const matchesSearch =
      !search ||
      b.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      b.eventTitle?.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase());
    return matchesEvent && matchesSearch;
  });

  const cancelBooking = async (booking) => {
    if (
      !window.confirm(
        `Cancel ${booking.userEmail}'s booking for "${booking.eventTitle}"?`
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
          const qty = booking.quantity || 1;
          transaction.update(eventRef, {
            booked_count: Math.max(0, currentCount - qty),
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

  // Ticket Verification Check
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!verifyInput.trim()) return;

    const matched = enriched.find(
      (b) => b.id.toLowerCase() === verifyInput.trim().toLowerCase()
    );

    if (matched) {
      setVerifyResult(matched);
    } else {
      setVerifyResult({ error: "Ticket ID not found." });
    }
  };

  const markAsCheckedIn = async (bookingId) => {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, { status: "Checked-In" });
      setVerifyResult((prev) => ({ ...prev, status: "Checked-In" }));
    } catch (err) {
      setError("Failed to update ticket status: " + err.message);
    }
  };

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
            Manage attendee bookings & verify ticket validity — {bookings.length} total.
          </p>
        </div>
      </div>

      {/* Ticket Verification Tool */}
      <div
        style={{
          background: "#f4f5f8",
          padding: 16,
          borderRadius: 8,
          marginBottom: 24,
          border: "1px solid #e0e2e8",
        }}
      >
        <h3>Verify Ticket / Check-In</h3>
        <form onSubmit={handleVerify} style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <input
            className="search-input"
            style={{ marginBottom: 0, maxWidth: 360 }}
            placeholder="Enter Ticket ID / Booking Ref..."
            value={verifyInput}
            onChange={(e) => setVerifyInput(e.target.value)}
          />
          <button className="btn primary" type="submit">Verify</button>
        </form>

        {verifyResult && (
          <div style={{ marginTop: 14, padding: 12, borderRadius: 6, background: "#fff", border: "1px solid #ccc" }}>
            {verifyResult.error ? (
              <p style={{ color: "red", margin: 0 }}>❌ {verifyResult.error}</p>
            ) : (
              <div>
                <p style={{ margin: "0 0 6px 0" }}>
                  <strong>Attendee:</strong> {verifyResult.userEmail} | <strong>Event:</strong> {verifyResult.eventTitle}
                </p>
                <p style={{ margin: "0 0 6px 0" }}>
                  <strong>Date & Time:</strong> {verifyResult.eventDate} at {verifyResult.eventTime} | <strong>Qty:</strong> {verifyResult.quantity}
                </p>
                <p style={{ margin: "0 0 10px 0" }}>
                  <strong>Status:</strong>{" "}
                  <span style={{ color: verifyResult.status === "Checked-In" ? "orange" : "green", fontWeight: "bold" }}>
                    {verifyResult.status}
                  </span>
                </p>
                {verifyResult.status !== "Checked-In" && (
                  <button
                    className="btn primary"
                    onClick={() => markAsCheckedIn(verifyResult.id)}
                  >
                    Mark as Checked-In
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          className="search-input"
          style={{ marginBottom: 0, maxWidth: 320 }}
          placeholder="Search email, event, or Ticket Ref..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #d5d7de", fontSize: 14 }}
        >
          <option value="all">All events</option>
          {eventsWithBookings.map((e) => (
            <option key={e.id} value={e.id}>{e.title}</option>
          ))}
        </select>
      </div>

      {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <p className="muted">Loading bookings...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Ticket Ref</th>
              <th>Attendee</th>
              <th>Event</th>
              <th>Event Date & Time</th>
              <th>Qty</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id}>
                <td><code>{b.id.substring(0, 8).toUpperCase()}</code></td>
                <td>{b.userEmail || b.userId}</td>
                <td>{b.eventTitle}</td>
                <td>{b.eventDate} @ {b.eventTime}</td>
                <td>{b.quantity}</td>
                <td>
                  <span className={`badge ${b.status === "Checked-In" ? "warning" : "success"}`}>
                    {b.status}
                  </span>
                </td>
                <td>
                  <button
                    className="link-btn danger"
                    disabled={cancellingId === b.id}
                    onClick={() => cancelBooking(b)}
                  >
                    {cancellingId === b.id ? "Cancelling..." : "Cancel"}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="muted" style={{ textAlign: "center", padding: 24 }}>
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