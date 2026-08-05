import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebaseClient';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

const COLLECTIONS = ['events', 'venues', 'categories', 'speakers', 'gallery', 'sponsors', 'announcements'];

export default function Dashboard() {
  const [counts, setCounts] = useState({});
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const unsubscribes = COLLECTIONS.map((name) =>
      onSnapshot(collection(db, name), (snapshot) => {
        setCounts((prev) => ({ ...prev, [name]: snapshot.size }));
      })
    );

    const eventsQuery = query(collection(db, 'events'), orderBy('start_date', 'asc'));
    const unsubEvents = onSnapshot(eventsQuery, (snapshot) => {
      setEvents(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubscribes.forEach((u) => u());
      unsubEvents();
    };
  }, []);

  const publishedEvents = events.filter((e) => e.published).length;
  const draftEvents = events.filter((e) => !e.published).length;
  const upcoming = events.slice(0, 5);

  const stats = [
    { label: 'Total Events', value: events.length, hint: 'All events in the system', to: '/events' },
    { label: 'Published Events', value: publishedEvents, hint: 'Visible to end users', to: '/events' },
    { label: 'Draft Events', value: draftEvents, hint: 'Pending publication', to: '/events' },
    { label: 'Venues', value: counts.venues ?? '—', hint: 'Available locations', to: '/venues' },
    { label: 'Categories', value: counts.categories ?? '—', hint: 'Event classification', to: '/categories' },
    { label: 'Speakers', value: counts.speakers ?? '—', hint: 'Speaker profiles', to: '/speakers' },
    { label: 'Announcements', value: counts.announcements ?? '—', hint: 'Home feed notifications', to: '/announcements' },
    { label: 'Gallery Images', value: counts.gallery ?? '—', hint: 'Media assets', to: '/gallery' },
    { label: 'Sponsors', value: counts.sponsors ?? '—', hint: 'Partner records', to: '/sponsors' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="muted">Live overview of events, content modules, and system health.</p>
        </div>
      </div>

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
        <div className="upcoming-panel">
          <h3>Upcoming Events</h3>
          <p className="muted">Next 5 scheduled events, live from Firestore.</p>
          <table className="data-table">
            <thead>
              <tr><th>Event</th><th>Venue</th><th>Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {upcoming.map((e) => (
                <tr key={e.id}>
                  <td>{e.title}</td>
                  <td>{e.venue}</td>
                  <td>{e.start_date ? new Date(e.start_date).toLocaleDateString() : '—'}</td>
                  <td><span className={`status-pill status-${(e.status || '').toLowerCase().replace(/\s/g, '-')}`}>{e.status}</span></td>
                </tr>
              ))}
              {upcoming.length === 0 && (
                <tr><td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 20 }}>No events yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="quick-actions-panel">
          <h3>Quick Actions</h3>
          <p className="muted">Navigate to common admin workflows.</p>
          <Link className="quick-action" to="/events">+ Create Event</Link>
          <Link className="quick-action" to="/venues">+ Add Venue</Link>
          <Link className="quick-action" to="/speakers">+ Add Speaker</Link>
          <Link className="quick-action" to="/categories">+ Add Category</Link>
          <Link className="quick-action" to="/announcements">+ Create Announcement</Link>
          <Link className="quick-action" to="/gallery">+ Upload Gallery Image</Link>
        </div>
      </div>
    </div>
  );
}
