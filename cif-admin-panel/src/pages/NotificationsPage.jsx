import React, { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebaseClient';

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetScreen, setTargetScreen] = useState('Home');
  const [type, setType] = useState('alert'); // 'alert' | 'schedule' | 'network'
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);

  // Fetch recent broadcast history
  const loadHistory = async () => {
    try {
      const q = query(
        collection(db, 'notifications'),
        orderBy('sentAt', 'desc'),
        limit(8)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setHistory(list);
    } catch (err) {
      console.warn('Could not fetch notifications history:', err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setLoading(true);
    setStatus(null);

    try {
      // 1. Fetch registered tokens from 'users' and 'device_tokens' collections
      const tokenSet = new Set();

      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        usersSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.expoPushToken && data.expoPushToken.startsWith('ExponentPushToken')) {
            tokenSet.add(data.expoPushToken);
          }
        });
      } catch (e) {
        console.warn('Could not read users collection:', e);
      }

      try {
        const guestsSnap = await getDocs(collection(db, 'device_tokens'));
        guestsSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.expoPushToken && data.expoPushToken.startsWith('ExponentPushToken')) {
            tokenSet.add(data.expoPushToken);
          }
        });
      } catch (e) {
        console.warn('Could not read device_tokens collection:', e);
      }

      const tokens = Array.from(tokenSet);

      // 2. Always persist notification to Firestore so the in-app list updates
      await addDoc(collection(db, 'notifications'), {
        title: title.trim(),
        body: body.trim(),
        message: body.trim(), // Support dual schema naming
        type: type,
        targetScreen,
        sentAt: serverTimestamp(),
        recipientCount: tokens.length,
      });

      // 3. Dispatch Push Messages via Expo HTTP API if tokens exist
      if (tokens.length > 0) {
        const messages = tokens.map((token) => ({
          to: token,
          sound: 'default',
          title: title.trim(),
          body: body.trim(),
          data: { screen: targetScreen },
          channelId: 'default',
        }));

        const chunkSize = 100;
        for (let i = 0; i < messages.length; i += chunkSize) {
          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Accept-Encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(messages.slice(i, i + chunkSize)),
          });
        }

        setStatus({
          type: 'success',
          text: `Broadcast sent to ${tokens.length} registered device(s) and saved to in-app feed.`,
        });
      } else {
        setStatus({
          type: 'warning',
          text: 'Saved to in-app notification feed! (No physical push tokens were found on registered devices).',
        });
      }

      setTitle('');
      setBody('');
      loadHistory();
    } catch (err) {
      console.error(err);
      setStatus({
        type: 'error',
        text: err.message || 'Failed to dispatch notification.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px 40px', flex: 1, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#111827' }}>
          Push & In-App Notifications
        </h2>
        <p style={{ color: '#6b7280', marginTop: 4 }}>
          Broadcast announcements to attendees across iOS, Android, and the in-app notification feed.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 600px) 1fr', gap: 32, alignItems: 'start' }}>
        {/* BROADCAST FORM */}
        <div
          style={{
            backgroundColor: '#fff',
            padding: 28,
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <form onSubmit={handleSendNotification}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 6 }}>
                Category / Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  fontSize: 14,
                  backgroundColor: '#fff',
                  boxSizing: 'border-box',
                }}
              >
                <option value="alert">General Alert / Announcement</option>
                <option value="schedule">Schedule / Stage Reminder</option>
                <option value="network">Networking / Community</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 6 }}>
                Notification Title
              </label>
              <input
                type="text"
                placeholder="e.g. Workshop Starting Soon"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 6 }}>
                Notification Message
              </label>
              <textarea
                placeholder="e.g. Join us at The Source for the keynote talk in 15 minutes."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 6 }}>
                Open Screen on Tap
              </label>
              <select
                value={targetScreen}
                onChange={(e) => setTargetScreen(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  fontSize: 14,
                  backgroundColor: '#fff',
                  boxSizing: 'border-box',
                }}
              >
                <option value="Home">Home Screen</option>
                <option value="Events">Events Schedule</option>
                <option value="Maps">Map / Locations</option>
                <option value="Notifications">Notifications List</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: '#5B4DFF',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: 8,
                border: 'none',
                fontWeight: 600,
                fontSize: 14,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                width: '100%',
              }}
            >
              {loading ? 'Broadcasting...' : 'Broadcast Notification'}
            </button>
          </form>

          {status && (
            <div
              style={{
                marginTop: 18,
                padding: 12,
                borderRadius: 6,
                backgroundColor:
                  status.type === 'success'
                    ? '#ecfdf5'
                    : status.type === 'warning'
                    ? '#fffbeb'
                    : '#fef2f2',
                color:
                  status.type === 'success'
                    ? '#065f46'
                    : status.type === 'warning'
                    ? '#92400e'
                    : '#991b1b',
                fontSize: 14,
                fontWeight: 500,
                border: `1px solid ${
                  status.type === 'success'
                    ? '#a7f3d0'
                    : status.type === 'warning'
                    ? '#fde68a'
                    : '#fecaca'
                }`,
              }}
            >
              {status.text}
            </div>
          )}
        </div>

        {/* RECENT BROADCAST FEED */}
        <div
          style={{
            backgroundColor: '#fff',
            padding: 24,
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px 0', color: '#111827' }}>
            Recent Broadcasts
          </h3>

          {history.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: 14 }}>No notifications broadcasted yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {history.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: '#f9fafb',
                    border: '1px solid #f3f4f6',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>
                      {item.title}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        textTransform: 'uppercase',
                        padding: '2px 6px',
                        borderRadius: 4,
                        backgroundColor: '#e0e7ff',
                        color: '#4338ca',
                        fontWeight: 700,
                      }}
                    >
                      {item.type || 'alert'}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: '#4b5563', margin: '0 0 6px 0' }}>
                    {item.body || item.message}
                  </p>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>
                    Targets: <strong>{item.targetScreen || 'Home'}</strong> • Recipients:{' '}
                    <strong>{item.recipientCount ?? 0}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}