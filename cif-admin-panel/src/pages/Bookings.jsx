// cif-admin-panel/src/pages/Bookings.jsx
import React, { useState, useEffect, useMemo } from "react";
import { db, auth } from "../firebaseClient";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  runTransaction,
  updateDoc,
} from "firebase/firestore";
import { recordAuditLog } from "../utils/auditLogger";

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  // Verification state
  const [verifyInput, setVerifyInput] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);

  // 1. Live bookings listener
  useEffect(() => {
    const q = query(collection(db, "bookings"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setBookings(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        setError("Error loading bookings: " + err.message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  // 2. Live events listener
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

  // 3. Enriched dataset with formatted timestamps & event details
  const enriched = useMemo(() => {
    return bookings.map((b) => {
      const parentEvent = eventMap[b.eventId];

      let formattedDate = b.eventDate || parentEvent?.date || "—";
      let formattedTime = b.eventTime || parentEvent?.time || "—";

      if (b.created_at?.toDate) {
        formattedDate = b.eventDate || b.created_at.toDate().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        });
      }

      return {
        ...b,
        attendeeEmail: b.userEmail || b.email || `UID: ${b.userId?.substring(0, 8)}...`,
        attendeeName: b.userName || b.name || "Attendee",
        eventTitle: b.eventTitle || parentEvent?.title || "(Event not found)",
        eventDate: formattedDate,
        eventTime: formattedTime,
        venue: parentEvent?.venue || parentEvent?.location || "—",
        quantity: b.quantity || 1,
        status: b.status || "Valid",
      };
    });
  }, [bookings, eventMap]);

  // 4. Search and filter query evaluation
  const filtered = useMemo(() => {
    return enriched.filter((b) => {
      const matchesEvent = eventFilter === "all" || b.eventId === eventFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "valid" && b.status !== "Checked-In") ||
        (statusFilter === "checked_in" && b.status === "Checked-In");

      const term = search.toLowerCase().trim();
      const matchesSearch =
        !term ||
        b.attendeeEmail.toLowerCase().includes(term) ||
        b.attendeeName.toLowerCase().includes(term) ||
        b.eventTitle.toLowerCase().includes(term) ||
        b.id.toLowerCase().includes(term) ||
        (b.userId && b.userId.toLowerCase().includes(term));

      return matchesEvent && matchesStatus && matchesSearch;
    });
  }, [enriched, eventFilter, statusFilter, search]);

  // 5. Atomic Cancellation & Capacity Decrement
  const cancelBooking = async (booking) => {
    if (
      !window.confirm(
        `Cancel ${booking.attendeeEmail}'s booking for "${booking.eventTitle}"?`
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

      // Audit Log: Cancellation & capacity restoration
      await recordAuditLog({
        action: "DELETE",
        resource: "bookings",
        resourceId: booking.id,
        actor: auth.currentUser,
        details: {
          action_type: "CANCEL_BOOKING",
          attendeeEmail: booking.attendeeEmail,
          attendeeName: booking.attendeeName,
          eventTitle: booking.eventTitle,
          eventId: booking.eventId,
          quantity: booking.quantity,
        },
      });

      if (verifyResult?.id === booking.id) {
        setVerifyResult(null);
      }
    } catch (err) {
      setError("Cancellation failed: " + err.message);
    } finally {
      setCancellingId(null);
    }
  };

  // 6. Ticket Verification / Check-In Handler
  const handleVerify = (e) => {
    e.preventDefault();
    const queryTerm = verifyInput.trim().toLowerCase();
    if (!queryTerm) return;

    // Remove QR prefixes like "CIF-USER-" if scanned directly from mobile
    const cleanTerm = queryTerm.replace(/^cif-user-/, "");

    const matched = enriched.find((b) => {
      return (
        b.id.toLowerCase() === cleanTerm ||
        b.id.toLowerCase().startsWith(cleanTerm) ||
        (b.userId && b.userId.toLowerCase() === cleanTerm)
      );
    });

    if (matched) {
      setVerifyResult(matched);
    } else {
      setVerifyResult({ error: `No active reservation found for code: "${verifyInput}"` });
    }
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    const targetBooking = enriched.find((b) => b.id === bookingId);
    const previousStatus = targetBooking?.status || "Valid";

    if (previousStatus === newStatus) return;

    try {
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, { status: newStatus });

      // Audit Log: Ticket check-in or status revert
      await recordAuditLog({
        action: "UPDATE",
        resource: "bookings",
        resourceId: bookingId,
        actor: auth.currentUser,
        details: {
          action_type: "CHECK_IN_UPDATE",
          attendeeEmail: targetBooking?.attendeeEmail || "Unknown",
          attendeeName: targetBooking?.attendeeName || "Attendee",
          eventTitle: targetBooking?.eventTitle || "Unknown Event",
          from: previousStatus,
          to: newStatus,
        },
      });

      setVerifyResult((prev) => (prev ? { ...prev, status: newStatus } : null));
    } catch (err) {
      setError("Failed to update ticket status: " + err.message);
    }
  };

  const eventsWithBookings = useMemo(() => {
    const ids = new Set(bookings.map((b) => b.eventId));
    return events.filter((e) => ids.has(e.id));
  }, [events, bookings]);

  return (
    <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: "0 0 6px 0" }}>Attendee Bookings</h1>
          <p className="muted" style={{ margin: 0 }}>
            Inspect real-time event passes, check-in attendees, and manage festival capacity ({bookings.length} total).
          </p>
        </div>
      </div>

      {/* Ticket Verification Tool */}
      <div
        style={{
          background: "#f8fafc",
          padding: 18,
          borderRadius: 10,
          marginBottom: 24,
          border: "1px solid #e2e8f0",
        }}
      >
        <h3 style={{ margin: "0 0 4px 0", fontSize: 16 }}>Verify Ticket / Door Check-In</h3>
        <p className="muted" style={{ fontSize: 12, margin: "0 0 12px 0" }}>
          Scan attendee QR code or enter booking reference ID.
        </p>

        <form onSubmit={handleVerify} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            className="search-input"
            style={{ margin: 0, flex: 1, minWidth: 260, maxWidth: 420 }}
            placeholder="Scan or enter Ticket ID / User UID..."
            value={verifyInput}
            onChange={(e) => setVerifyInput(e.target.value)}
          />
          <button className="btn-primary" type="submit" style={{ padding: "8px 20px" }}>
            Verify Pass
          </button>
          {verifyResult && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setVerifyResult(null);
                setVerifyInput("");
              }}
            >
              Clear
            </button>
          )}
        </form>

        {verifyResult && (
          <div
            style={{
              marginTop: 14,
              padding: 16,
              borderRadius: 8,
              background: "#ffffff",
              border: verifyResult.error ? "1px solid #fca5a5" : "1px solid #cbd5e1",
              boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
            }}
          >
            {verifyResult.error ? (
              <div style={{ color: "#dc2626", fontWeight: 600, fontSize: 14 }}>
                ❌ {verifyResult.error}
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a" }}>
                    {verifyResult.eventTitle}
                  </div>
                  <span
                    style={{
                      backgroundColor: verifyResult.status === "Checked-In" ? "#fef3c7" : "#dcfce7",
                      color: verifyResult.status === "Checked-In" ? "#92400e" : "#166534",
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {verifyResult.status}
                  </span>
                </div>

                <div style={{ fontSize: 13, color: "#334155", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div><strong>Attendee:</strong> {verifyResult.attendeeName} ({verifyResult.attendeeEmail})</div>
                  <div><strong>Schedule:</strong> {verifyResult.eventDate} at {verifyResult.eventTime}</div>
                  <div><strong>Quantity:</strong> {verifyResult.quantity} Pass(es)</div>
                  <div><strong>Ticket ID:</strong> <code>{verifyResult.id}</code></div>
                </div>

                <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                  {verifyResult.status !== "Checked-In" ? (
                    <button
                      className="btn-primary"
                      type="button"
                      onClick={() => updateBookingStatus(verifyResult.id, "Checked-In")}
                    >
                      ✓ Mark as Checked-In
                    </button>
                  ) : (
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={() => updateBookingStatus(verifyResult.id, "Valid")}
                    >
                      Revert to Valid
                    </button>
                  )}
                  <button
                    className="link-btn danger"
                    type="button"
                    onClick={() => cancelBooking(verifyResult)}
                  >
                    Cancel Booking
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search & Filter Controls */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input
          className="search-input"
          style={{ margin: 0, flex: 1, minWidth: 260, maxWidth: 360 }}
          placeholder="Search by attendee, email, event, or Ticket ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="search-input"
          style={{ width: 220, margin: 0 }}
        >
          <option value="all">All Events ({eventsWithBookings.length})</option>
          {eventsWithBookings.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="search-input"
          style={{ width: 170, margin: 0 }}
        >
          <option value="all">All Statuses</option>
          <option value="valid">Valid (Unchecked)</option>
          <option value="checked_in">Checked-In Only</option>
        </select>
      </div>

      {error && (
        <div style={{ padding: 12, background: "#fee2e2", color: "#991b1b", borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>
          {error}
        </div>
      )}

      {loading ? (
        <p className="muted">Loading bookings...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Ticket Ref</th>
              <th>Attendee</th>
              <th>Event</th>
              <th>Event Schedule</th>
              <th>Qty</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id}>
                <td>
                  <code style={{ fontSize: 12, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>
                    {b.id.substring(0, 8).toUpperCase()}
                  </code>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{b.attendeeName}</div>
                  <div className="muted" style={{ fontSize: 11 }}>{b.attendeeEmail}</div>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{b.eventTitle}</div>
                  {b.venue && <div className="muted" style={{ fontSize: 11 }}>{b.venue}</div>}
                </td>
                <td>{b.eventDate} @ {b.eventTime}</td>
                <td>{b.quantity}</td>
                <td>
                  <span
                    style={{
                      backgroundColor: b.status === "Checked-In" ? "#fef3c7" : "#dcfce7",
                      color: b.status === "Checked-In" ? "#92400e" : "#166534",
                      padding: "3px 8px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      display: "inline-block",
                    }}
                  >
                    {b.status}
                  </span>
                </td>
                <td className="actions-cell" style={{ textAlign: "right" }}>
                  {b.status !== "Checked-In" ? (
                    <button
                      type="button"
                      className="link-btn"
                      style={{ marginRight: 8, color: "#2563eb" }}
                      onClick={() => updateBookingStatus(b.id, "Checked-In")}
                    >
                      Check-In
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="link-btn"
                      style={{ marginRight: 8, color: "#64748b" }}
                      onClick={() => updateBookingStatus(b.id, "Valid")}
                    >
                      Revert
                    </button>
                  )}
                  <button
                    type="button"
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
                <td colSpan={7} className="muted" style={{ textAlign: "center", padding: 32 }}>
                  No bookings found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}