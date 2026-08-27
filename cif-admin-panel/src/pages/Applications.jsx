import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db, auth } from '../firebaseClient';
import { recordAuditLog } from '../utils/auditLogger';

const STATUS_CONFIG = {
  Pending: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
  Reviewing: { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
  Shortlisted: { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' },
  Rejected: { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' },
};

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [jobFilter, setJobFilter] = useState('All');
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'job_applications'),
      orderBy('created_at', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setApplications(
          snapshot.docs.map((d) => ({
            id: d.id,
            status: 'Pending',
            ...d.data(),
          }))
        );
        setLoading(false);
      },
      (err) => {
        console.error('Applications snapshot error:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const uniqueJobs = Array.from(
    new Set(applications.map((app) => app.jobTitle).filter(Boolean))
  );

  const handleStatusChange = async (app, newStatus) => {
    const previousStatus = app.status || 'Pending';
    if (previousStatus === newStatus) return;

    try {
      await updateDoc(doc(db, 'job_applications', app.id), {
        status: newStatus,
      });

      // Audit Log: Application status change
      await recordAuditLog({
        action: 'UPDATE',
        resource: 'job_applications',
        resourceId: app.id,
        actor: auth.currentUser,
        details: {
          action_type: 'STATUS_CHANGE',
          applicantName: app.applicantName || 'Anonymous',
          applicantEmail: app.applicantEmail,
          jobTitle: app.jobTitle,
          from: previousStatus,
          to: newStatus,
        },
      });
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Could not update status: ' + err.message);
    }
  };

  const handleDelete = async (app) => {
    if (!window.confirm(`Delete application from ${app.applicantName}?`)) return;

    try {
      await deleteDoc(doc(db, 'job_applications', app.id));

      // Audit Log: Application deletion
      await recordAuditLog({
        action: 'DELETE',
        resource: 'job_applications',
        resourceId: app.id,
        actor: auth.currentUser,
        details: {
          applicantName: app.applicantName || 'Anonymous',
          applicantEmail: app.applicantEmail,
          jobTitle: app.jobTitle,
        },
      });

      if (selectedApp?.id === app.id) setSelectedApp(null);
    } catch (err) {
      console.error('Failed to delete application:', err);
      alert('Could not delete application: ' + err.message);
    }
  };

  const filtered = applications.filter((app) => {
    const matchesSearch =
      `${app.applicantName || ''} ${app.applicantEmail || ''} ${app.jobTitle || ''}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' || app.status === statusFilter;

    const matchesJob =
      jobFilter === 'All' || app.jobTitle === jobFilter;

    return matchesSearch && matchesStatus && matchesJob;
  });

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: '0 0 6px 0' }}>Job & Volunteering Applications</h1>
          <p className="muted" style={{ margin: 0 }}>
            Review candidates, update hiring stages, and inspect submission notes.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
        <input
          className="search-input"
          placeholder="Search by candidate name, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 2, minWidth: 260 }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Reviewing">Reviewing</option>
          <option value="Shortlisted">Shortlisted</option>
          <option value="Rejected">Rejected</option>
        </select>

        <select
          value={jobFilter}
          onChange={(e) => setJobFilter(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, maxWidth: 220 }}
        >
          <option value="All">All Listed Roles</option>
          {uniqueJobs.map((title) => (
            <option key={title} value={title}>{title}</option>
          ))}
        </select>

        <span className="muted" style={{ fontSize: 13, marginLeft: 'auto' }}>
          {filtered.length} application{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      {loading ? (
        <p className="muted">Loading applications...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
          No candidate applications found matching the selected filters.
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Applied Role</th>
              <th>Status</th>
              <th>Applied Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((app) => {
              const currentStatusStyle = STATUS_CONFIG[app.status] || STATUS_CONFIG.Pending;
              return (
                <tr key={app.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>
                      {app.applicantName || 'Anonymous'}
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {app.applicantEmail} {app.applicantPhone ? `· ${app.applicantPhone}` : ''}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{app.jobTitle || 'General Application'}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{app.company || 'Festival'}</div>
                  </td>
                  <td>
                    <select
                      value={app.status || 'Pending'}
                      onChange={(e) => handleStatusChange(app, e.target.value)}
                      style={{
                        backgroundColor: currentStatusStyle.bg,
                        color: currentStatusStyle.text,
                        borderColor: currentStatusStyle.border,
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Reviewing">Reviewing</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                    {app.created_at?.toDate
                      ? app.created_at.toDate().toLocaleDateString()
                      : 'Recently'}
                  </td>
                  <td className="actions-cell">
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => setSelectedApp(app)}
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                      className="link-btn danger"
                      onClick={() => handleDelete(app)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {selectedApp && (
        <div
          onClick={() => setSelectedApp(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 10,
              padding: 24,
              maxWidth: 580,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18 }}>{selectedApp.applicantName}</h3>
                <span className="muted" style={{ fontSize: 13 }}>
                  Application for <strong>{selectedApp.jobTitle}</strong> ({selectedApp.company})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 14 }}>
              <div>
                <strong className="muted" style={{ display: 'block', fontSize: 11, marginBottom: 2 }}>CONTACT INFORMATION</strong>
                <div>Email: <a href={`mailto:${selectedApp.applicantEmail}`}>{selectedApp.applicantEmail}</a></div>
                {selectedApp.applicantPhone && <div>Phone: {selectedApp.applicantPhone}</div>}
              </div>

              <div>
                <strong className="muted" style={{ display: 'block', fontSize: 11, marginBottom: 2 }}>CURRENT STAGE</strong>
                <select
                  value={selectedApp.status || 'Pending'}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    handleStatusChange(selectedApp, newStatus);
                    setSelectedApp({ ...selectedApp, status: newStatus });
                  }}
                  style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }}
                >
                  <option value="Pending">Pending</option>
                  <option value="Reviewing">Reviewing</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <strong className="muted" style={{ display: 'block', fontSize: 11, marginBottom: 4 }}>COVER NOTE / STATEMENT</strong>
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  padding: 12,
                  lineHeight: 1.5,
                  color: '#334155',
                  whiteSpace: 'pre-wrap',
                }}>
                  {selectedApp.coverNote || 'No cover note submitted.'}
                </div>
              </div>

              {selectedApp.userId && (
                <div>
                  <strong className="muted" style={{ display: 'block', fontSize: 11, marginBottom: 2 }}>REGISTERED USER UID</strong>
                  <code style={{ fontSize: 12, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                    {selectedApp.userId}
                  </code>
                </div>
              )}
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <a
                href={`mailto:${selectedApp.applicantEmail}?subject=Application update for ${encodeURIComponent(selectedApp.jobTitle)}`}
                className="btn-primary"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
              >
                ✉️ Email Candidate
              </a>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedApp(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}