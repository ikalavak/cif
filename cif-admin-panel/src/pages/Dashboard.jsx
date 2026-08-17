import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebaseClient";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

// Updated collections tailored for a 5,000 attendee music festival
const COLLECTIONS = [
  "sets", // Replaced 'events' with individual artist sets
  "stages", // Replaced 'venues' with festival stages
  "lineup", // Replaced 'speakers' with performing artists/bands
  "tickets", // Added for 5k crowd management tracking
  "vendors", // Added for food trucks, merch booths, and bar logs
  "announcements", // Retained for urgent mass-push notification logs
  "gallery", // Retained for site map / media asset tracking
  "sponsors", // Retained for festival partner logging
];

export default function Dashboard() {
  const [counts, setCounts] = useState({});
  const [sets, setSets] = useState([]);
  const [liveAttendance, setLiveAttendance] = useState(0);

  useEffect(() => {
    // 1. Live count tracking for all primary collections
    const unsubscribes = COLLECTIONS.map((name) =>
      onSnapshot(collection(db, name), (snapshot) => {
        setCounts((prev) => ({ ...prev, [name]: snapshot.size }));
      }),
    );

    // 2. Query upcoming musical sets ordered chronologically
    const setsQuery = query(
      collection(db, "sets"),
      orderBy("start_time", "asc"),
    );
    const unsubSets = onSnapshot(setsQuery, (snapshot) => {
      setSets(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // 3. Real-time scanning calculation for the 5,000 person capacity gate
    const unsubTickets = onSnapshot(collection(db, "tickets"), (snapshot) => {
      const insideCount = snapshot.docs.filter(
        (doc) => doc.data().scannedIn === true,
      ).length;
      setLiveAttendance(insideCount);
    });

    return () => {
      unsubscribes.forEach((u) => u());
      unsubSets();
      unsubTickets();
    };
  }, []);

  // Filter calculations based on live music operations
  const confirmedSets = sets.filter((s) => s.status === "Confirmed").length;
  const tentativeSets = sets.filter((s) => s.status !== "Confirmed").length;
  const upcomingSets = sets.slice(0, 5);

  // Re-mapped statistics grid optimized for multi-stage crowd logistics
  const stats = [
    {
      label: "Live Gate Count",
      value: liveAttendance,
      hint: "Total bodies currently inside gates",
      to: "/tickets",
    },
    {
      label: "Tickets Sold",
      value: counts.tickets ?? "0",
      hint: "Target cap: 5,000 attendees",
      to: "/tickets",
    },
    {
      label: "Total Show Sets",
      value: sets.length,
      hint: "Total performances scheduled",
      to: "/sets",
    },
    {
      label: "Confirmed Acts",
      value: confirmedSets,
      hint: "Locked into the schedule grid",
      to: "/sets",
    },
    {
      label: "Tentative/Hold",
      value: tentativeSets,
      hint: "Pending contract or technical riders",
      to: "/sets",
    },
    {
      label: "Festival Stages",
      value: counts.stages ?? "—",
      hint: "Active sound & performance zones",
      to: "/stages",
    },
    {
      label: "Booked Artists",
      value: counts.lineup ?? "—",
      hint: "Total roster profiles created",
      to: "/lineup",
    },
    {
      label: "Active Food & Retail",
      value: counts.vendors ?? "—",
      hint: "Approved grounds concessions",
      to: "/vendors",
    },
    {
      label: "Emergency Alerts",
      value: counts.announcements ?? "—",
      hint: "Push alerts pushed to user app",
      to: "/announcements",
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Festival Control Dashboard</h1>
          <p className="muted">
            Live operational control room. Real-time metrics for crowd safety,
            scheduling, and stages.
          </p>
        </div>
      </div>

      {/* Grid displays original look with updated high-value festival content */}
      <div className="stat-grid">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-hint">{s.hint}</div>
          </Link>
        ))}
      </div>

      <div className="dashboard-lower">
        {/* Next 5 performances upcoming on the festival grounds */}
        <div className="upcoming-panel">
          <h3>Upcoming Live Sets</h3>
          <p className="muted">
            Next 5 scheduled performances across all festival stages.
          </p>
          <table className="data-table">
            <thead>
              <tr>
                <th>Artist / Act</th>
                <th>Stage</th>
                <th>Set Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {upcomingSets.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.artistName || s.title}</strong>
                  </td>
                  <td>{s.stageName || s.stage || "—"}</td>
                  <td>
                    {s.start_time
                      ? new Date(s.start_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td>
                    <span
                      className={`status-pill status-${(s.status || "Scheduled").toLowerCase().replace(/\s/g, "-")}`}
                    >
                      {s.status || "Scheduled"}
                    </span>
                  </td>
                </tr>
              ))}
              {upcomingSets.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="muted"
                    style={{ textAlign: "center", padding: 20 }}
                  >
                    No festival sets populated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Quick actions panel updated to fit festival manager workflow */}
        <div className="quick-actions-panel">
          <h3>Ground Actions</h3>
          <p className="muted">
            Rapidly add festival assets and broadcast urgent notices.
          </p>
          <Link
            className="quick-action"
            to="/announcements"
            style={{ borderLeft: "4px solid #d9534f" }}
          >
            🚨 Broadcast Emergency Alert
          </Link>
          <Link className="quick-action" to="/sets">
            + Schedule New Set
          </Link>
          <Link className="quick-action" to="/stages">
            + Provision New Stage
          </Link>
          <Link className="quick-action" to="/lineup">
            + Add Artist Profile
          </Link>
          <Link className="quick-action" to="/vendors">
            + Register Vendor Box
          </Link>
          <Link className="quick-action" to="/tickets">
            + Scan/Look Up Pass
          </Link>
        </div>
      </div>
    </div>
  );
}
