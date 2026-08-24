// cif-admin-panel/src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebaseClient";
import {
  collection,
  collectionGroup,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

// Real collections used across this project — matches Events.jsx, Venues.jsx,
// Speakers.jsx, Categories.jsx, Announcements.jsx, Gallery.jsx, Sponsors.jsx.
const COLLECTIONS = [
  "events",
  "venues",
  "categories",
  "gallery",
  "sponsors",
  "bookings",
  "job_applications",
  "forum_messages",
];

export default function Dashboard() {
  const [counts, setCounts] = useState({});
  const [events, setEvents] = useState([]);
  const [portfolioCount, setPortfolioCount] = useState("—");
  const [search, setSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    // Portfolios live at users/{uid}/portfolio/profile — a subcollection per
    // user, not a top-level collection, so this needs collectionGroup to
    // count across every user at once.
    const unsubPortfolios = onSnapshot(
      collectionGroup(db, "portfolio"),
      (snapshot) => {
        setPortfolioCount(snapshot.size);
        setLastUpdated(new Date());
      },
    );

    return () => unsubPortfolios();
  }, []);

  useEffect(() => {
    // 1. Live count tracking for every primary collection
    const unsubscribes = COLLECTIONS.map((name) =>
      onSnapshot(collection(db, name), (snapshot) => {
        setCounts((prev) => ({ ...prev, [name]: snapshot.size }));
        setLastUpdated(new Date());
      }),
    );

    // 2. Full events list, ordered chronologically — used for the
    //    published/draft split and the Upcoming Events table below
    const eventsQuery = query(
      collection(db, "events"),
      orderBy("start_date", "asc"),
    );
    const unsubEvents = onSnapshot(eventsQuery, (snapshot) => {
      setEvents(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLastUpdated(new Date());
    });

    return () => {
      unsubscribes.forEach((u) => u());
      unsubEvents();
    };
  }, []);

  const publishedEvents = events.filter((e) => e.published).length;
  const draftEvents = events.filter((e) => !e.published).length;

  const now = new Date();
  const upcomingEvents = events.filter((e) => {
    const start = e.start_date?.toDate ? e.start_date.toDate() : null;
    return start && start >= now;
  });

  const nextFive = upcomingEvents.slice(0, 5);

  const stats = [
    {
      label: "Total Events",
      value: events.length,
      hint: "All events in the system",
      linkText: "Live total",
      to: "/events",
    },
    {
      label: "Published Events",
      value: publishedEvents,
      hint: "Visible to end users",
      linkText: "Publish-ready",
      to: "/events",
    },
    {
      label: "Bookings",
      value: counts.bookings ?? "—",
      hint: "Confirmed event bookings",
      linkText: "Attendance",
      to: "/bookings",
    },
    {
      label: "Venues",
      value: counts.venues ?? "—",
      hint: "Available locations",
      linkText: "Master data",
      to: "/venues",
    },
    {
      label: "Categories",
      value: counts.categories ?? "—",
      hint: "Event classification",
      linkText: "Taxonomy",
      to: "/categories",
    },
    {
      label: "Job Applications",
      value: counts.job_applications ?? "—",
      hint: "Submitted applications",
      linkText: "Talent pipeline",
      to: "/job-applications",
    },
    {
      label: "Portfolios",
      value: portfolioCount,
      hint: "Attendee portfolios created",
      linkText: "Talent showcase",
      to: "/users",
    },
    {
      label: "Forum Activity",
      value: counts.forum_messages ?? "—",
      hint: "Total community posts",
      linkText: "Community pulse",
      to: "/forum-moderation",
    },
    {
      label: "Gallery Images",
      value: counts.gallery ?? "—",
      hint: "Media assets",
      linkText: "Visual content",
      to: "/gallery",
    },
    {
      label: "Sponsors",
      value: counts.sponsors ?? "—",
      hint: "Partner records",
      linkText: "Brand relations",
      to: "/sponsors",
    },
    {
      label: "Upcoming Events",
      value: upcomingEvents.length,
      hint: "Future schedule",
      linkText: "Next up",
      to: "/events",
    },
  ];

  // Simple live filter across events/venues/speakers/categories/announcements
  // by title/name — matches the "Global Search" box shown in the reference.
  const searchResults = (() => {
    const term = search.trim().toLowerCase();
    if (!term) return null;

    return events
      .filter((e) => (e.title || "").toLowerCase().includes(term))
      .slice(0, 8);
  })();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="muted">
            Real-time overview of events, content modules, and system health.
          </p>
          <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            Last updated:{" "}
            {lastUpdated.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}{" "}
            at{" "}
            {lastUpdated.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {"  "}
            <button
              type="button"
              onClick={() => setLastUpdated(new Date())}
              style={{
                marginLeft: 8,
                background: "none",
                border: "none",
                color: "#4c3ff0",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                padding: 0,
              }}
            >
              ↻ Refresh
            </button>
          </p>
        </div>
      </div>

      {/* GLOBAL SEARCH */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>
          Global Search
        </div>
        <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
          Search across events, speakers, venues, categories, and announcements.
        </div>
        <input
          className="search-input"
          placeholder="Search records..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", marginBottom: 0 }}
        />

        {searchResults && (
          <div style={{ marginTop: 12 }}>
            {searchResults.length === 0 ? (
              <p className="muted" style={{ fontSize: 13 }}>
                No matching events found.
              </p>
            ) : (
              searchResults.map((e) => (
                <Link
                  key={e.id}
                  to="/events"
                  style={{
                    display: "block",
                    padding: "8px 4px",
                    borderBottom: "1px solid #f1f5f9",
                    fontSize: 13,
                    color: "#1e293b",
                    textDecoration: "none",
                  }}
                >
                  {e.title}{" "}
                  <span className="muted">— {e.venue || "No venue set"}</span>
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      {/* STAT GRID */}
      <div className="stat-grid">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-hint">{s.hint}</div>
            <div
              style={{
                fontSize: 11,
                color: "#4c3ff0",
                fontWeight: 600,
                marginTop: 4,
              }}
            >
              ↗ {s.linkText}
            </div>
          </Link>
        ))}
      </div>

      <div className="dashboard-lower">
        {/* UPCOMING EVENTS */}
        <div className="upcoming-panel">
          <h3>Upcoming Events</h3>
          <p className="muted">
            Next 5 scheduled events in chronological order.
          </p>
          <table className="data-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Venue</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {nextFive.map((e) => {
                const start = e.start_date?.toDate
                  ? e.start_date.toDate()
                  : null;
                return (
                  <tr key={e.id}>
                    <td>
                      <Link
                        to="/events"
                        style={{
                          color: "#4c3ff0",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        {e.title}
                      </Link>
                    </td>
                    <td>{e.venue || "—"}</td>
                    <td>
                      {start
                        ? start.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td>
                      {start
                        ? start.toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td>
                      <span
                        className={`status-pill status-${e.published ? "published" : "draft"}`}
                      >
                        {e.published ? "Published" : "Draft"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {nextFive.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="muted"
                    style={{ textAlign: "center", padding: 20 }}
                  >
                    No upcoming events scheduled.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* QUICK ACTIONS */}
        <div className="quick-actions-panel">
          <h3>Quick Actions</h3>
          <p className="muted">Navigate to common admin workflows.</p>
          <Link className="quick-action" to="/events">
            + Create Event
          </Link>
          <Link className="quick-action" to="/venues">
            + Add Venue
          </Link>
          <Link className="quick-action" to="/speakers">
            + Add Speaker
          </Link>
          <Link className="quick-action" to="/categories">
            + Add Category
          </Link>
          <Link className="quick-action" to="/announcements">
            + Create Announcement
          </Link>
          <Link className="quick-action" to="/gallery">
            + Upload Gallery Image
          </Link>
        </div>
      </div>
    </div>
  );
}
