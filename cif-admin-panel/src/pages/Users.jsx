// cif-admin-panel/src/pages/Users.jsx
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseClient';
import { useAuth } from '../AuthContext';
import CollectionManager from '../components/CollectionManager';

export default function Users() {
  const { isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('app_users'); // 'app_users' | 'admin_roster'
  const [appUsers, setAppUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch live app users from Firestore /users collection
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setAppUsers(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching users:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const filteredUsers = appUsers.filter((u) => {
    const term = search.toLowerCase();
    const name = (u.name || u.displayName || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const phone = (u.phone || u.phoneNumber || '').toLowerCase();
    return name.includes(term) || email.includes(term) || phone.includes(term);
  });

  const handleDeleteUserRecord = async (userId) => {
    if (!window.confirm('Delete this user profile record from Firestore?')) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      if (selectedUser?.id === userId) setSelectedUser(null);
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Top Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: '0 0 6px 0' }}>User Management</h1>
          <p className="muted" style={{ margin: 0 }}>
            Inspect mobile app attendees, registration details, and administrative accounts.
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button
          type="button"
          className={activeTab === 'app_users' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('app_users')}
          style={{ fontSize: 13 }}
        >
          📱 Mobile App Users ({appUsers.length})
        </button>
        <button
          type="button"
          className={activeTab === 'admin_roster' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('admin_roster')}
          style={{ fontSize: 13 }}
        >
          🛡️ Admin & Staff Roster
        </button>
      </div>

      {/* TAB 1: App Users Collection */}
      {activeTab === 'app_users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <input
              className="search-input"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 360 }}
            />
            <span className="muted" style={{ fontSize: 13 }}>
              {filteredUsers.length} attendee account{filteredUsers.length === 1 ? '' : 's'}
            </span>
          </div>

          {loading ? (
            <p className="muted">Loading user accounts...</p>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
              No user accounts found in the database.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            background: '#e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            color: '#475569',
                            fontSize: 13,
                          }}
                        >
                          {(user.name || user.displayName || user.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{user.name || user.displayName || 'Unnamed User'}</div>
                          <div className="muted" style={{ fontSize: 11 }}>UID: {user.id.slice(0, 10)}...</div>
                        </div>
                      </div>
                    </td>
                    <td>{user.email || '—'}</td>
                    <td>{user.phone || user.phoneNumber || '—'}</td>
                    <td>
                      {user.created_at?.toDate
                        ? user.created_at.toDate().toLocaleDateString()
                        : user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="actions-cell">
                      <button
                        type="button"
                        className="link-btn"
                        onClick={() => setSelectedUser(user)}
                      >
                        View Details
                      </button>
                      {isSuperAdmin && (
                        <button
                          type="button"
                          className="link-btn danger"
                          onClick={() => handleDeleteUserRecord(user.id)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 2: Admin Roster & Roles */}
      {activeTab === 'admin_roster' && (
        <div>
          <div className="info-banner" style={{ marginBottom: 16 }}>
            <strong>Note:</strong> Only Super Admins can modify roles in the admin roster. Users assigned the <code>superadmin</code> or <code>admin</code> role are granted access to this dashboard upon signing in.
          </div>
          <CollectionManager
            collectionName="admins"
            title="Admin Access"
            subtitle="Authorised dashboard accounts and their permission tier."
            orderByField="email"
            orderDirection="asc"
            searchFields={['email', 'role']}
            fields={[
              { key: 'email', label: 'Admin Email', type: 'text', required: true, wide: true },
              { key: 'role', label: 'Role', type: 'select', options: ['admin', 'superadmin'], default: 'admin' },
            ]}
          />
        </div>
      )}

      {/* User Details Slide-over / Modal */}
      {selectedUser && (
        <div
          onClick={() => setSelectedUser(null)}
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
              maxWidth: 550,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Attendee Details</h3>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
              <div>
                <strong className="muted" style={{ display: 'block', fontSize: 12 }}>FULL NAME</strong>
                <div>{selectedUser.name || selectedUser.displayName || '—'}</div>
              </div>
              <div>
                <strong className="muted" style={{ display: 'block', fontSize: 12 }}>EMAIL</strong>
                <div>{selectedUser.email || '—'}</div>
              </div>
              <div>
                <strong className="muted" style={{ display: 'block', fontSize: 12 }}>PHONE NUMBER</strong>
                <div>{selectedUser.phone || selectedUser.phoneNumber || '—'}</div>
              </div>
              <div>
                <strong className="muted" style={{ display: 'block', fontSize: 12 }}>FIRESTORE USER ID (UID)</strong>
                <code style={{ fontSize: 12, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                  {selectedUser.id}
                </code>
              </div>
              <div>
                <strong className="muted" style={{ display: 'block', fontSize: 12 }}>ALL RAW PROFILE DATA</strong>
                <pre
                  style={{
                    background: '#f8fafc',
                    padding: 12,
                    borderRadius: 6,
                    fontSize: 12,
                    overflowX: 'auto',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  {JSON.stringify(selectedUser, null, 2)}
                </pre>
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" type="button" onClick={() => setSelectedUser(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}