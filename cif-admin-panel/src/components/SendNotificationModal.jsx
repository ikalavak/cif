// admin-panel/src/components/SendNotificationModal.jsx
import React, { useState } from 'react';
import { broadcastPushNotification } from '../services/broadcastNotification';

export default function SendNotificationModal() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setIsSending(true);
    setStatus(null);

    try {
      const result = await broadcastPushNotification({
        title,
        body,
        data: { timestamp: Date.now() },
      });
      setStatus(`Successfully sent to ${result.count} devices!`);
      setTitle('');
      setBody('');
    } catch (err) {
      setStatus(`Failed: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 500, background: '#fff', borderRadius: 8 }}>
      <h3>Broadcast Push Notification</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Notification Title</label>
          <input
            type="text"
            style={{ width: '100%', padding: 8 }}
            placeholder="e.g. Schedule Update"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Message Body</label>
          <textarea
            style={{ width: '100%', padding: 8, minHeight: 80 }}
            placeholder="e.g. The Workshop starts in 15 minutes at The Source."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={isSending} 
          style={{ padding: '10px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 4 }}
        >
          {isSending ? 'Sending...' : 'Send to All Devices'}
        </button>
      </form>

      {status && <p style={{ marginTop: 12, fontWeight: 500 }}>{status}</p>}
    </div>
  );
}