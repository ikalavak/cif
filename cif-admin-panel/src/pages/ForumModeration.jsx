// cif-admin-panel/src/pages/ForumModeration.jsx
import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../firebaseClient";
import { useAuth } from "../AuthContext";
import { recordAuditLog } from "../utils/auditLogger";

export default function ForumModeration() {
  const { session } = useAuth();
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all' | 'flagged' | 'pinned'
  const [search, setSearch] = useState("");

  // Broadcaster form state
  const [broadcastText, setBroadcastText] = useState("");
  const [broadcastChannel, setBroadcastChannel] = useState("General");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // 1. Subscribe to Live Forum Messages
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "forum_messages"),
      orderBy("created_at", "desc")
    );

    const unsubMessages = onSnapshot(
      q,
      (snapshot) => {
        setMessages(
          snapshot.docs.map((d) => ({
            id: d.id,
            reports: [],
            ...d.data(),
          }))
        );
        setLoading(false);
      },
      (err) => {
        console.error("Forum messages snapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsubMessages();
  }, []);

  // 2. Subscribe to Users to track Muted/Banned state
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const userMap = {};
      snapshot.docs.forEach((d) => {
        userMap[d.id] = d.data();
      });
      setUsers(userMap);
    });

    return () => unsubUsers();
  }, []);

  // Action: Toggle Pin Status
  const handleTogglePin = async (msg) => {
    const nextPinState = !msg.isPinned;
    try {
      await updateDoc(doc(db, "forum_messages", msg.id), {
        isPinned: nextPinState,
      });

      // Audit Log: Pin toggle
      await recordAuditLog({
        action: "UPDATE",
        resource: "forum_messages",
        resourceId: msg.id,
        actor: auth.currentUser || session,
        details: {
          action_type: nextPinState ? "PIN_MESSAGE" : "UNPIN_MESSAGE",
          channel: msg.channel || "General",
          authorName: msg.userName || "Attendee",
          textSnippet: (msg.text || "").substring(0, 60),
        },
      });
    } catch (err) {
      alert("Failed to update pin state: " + err.message);
    }
  };

  // Action: Dismiss Reports
  const handleDismissReports = async (msg) => {
    const reportCount = Array.isArray(msg.reports) ? msg.reports.length : 0;
    try {
      await updateDoc(doc(db, "forum_messages", msg.id), {
        reports: [],
      });

      // Audit Log: Flag dismissal
      await recordAuditLog({
        action: "UPDATE",
        resource: "forum_messages",
        resourceId: msg.id,
        actor: auth.currentUser || session,
        details: {
          action_type: "DISMISS_REPORTS",
          reportsDismissed: reportCount,
          channel: msg.channel || "General",
          authorName: msg.userName || "Attendee",
        },
      });
    } catch (err) {
      alert("Failed to clear flags: " + err.message);
    }
  };

  // Action: Delete Offensive Post
  const handleDeletePost = async (msg) => {
    if (!window.confirm("Are you sure you want to permanently delete this message?")) return;
    try {
      await deleteDoc(doc(db, "forum_messages", msg.id));

      // Audit Log: Post deletion
      await recordAuditLog({
        action: "DELETE",
        resource: "forum_messages",
        resourceId: msg.id,
        actor: auth.currentUser || session,
        details: {
          action_type: "DELETE_FORUM_POST",
          channel: msg.channel || "General",
          authorName: msg.userName || "Attendee",
          authorId: msg.userId || "Unknown",
          textSnippet: (msg.text || "").substring(0, 100),
          hadReports: Array.isArray(msg.reports) ? msg.reports.length : 0,
        },
      });
    } catch (err) {
      alert("Failed to delete post: " + err.message);
    }
  };

  // Action: Mute / Unmute User from Posting
  const handleToggleUserMute = async (userId, currentMuteState) => {
    const action = currentMuteState ? "unmute" : "mute";
    if (!window.confirm(`Are you sure you want to ${action} this user from forum posting?`)) return;

    try {
      await updateDoc(doc(db, "users", userId), {
        isForumMuted: !currentMuteState,
        mutedAt: !currentMuteState ? serverTimestamp() : null,
      });

      // Audit Log: Mute / Unmute user
      await recordAuditLog({
        action: "UPDATE",
        resource: "users",
        resourceId: userId,
        actor: auth.currentUser || session,
        details: {
          action_type: currentMuteState ? "UNMUTE_FORUM_USER" : "MUTE_FORUM_USER",
          targetUserId: userId,
          targetUserName: users[userId]?.displayName || users[userId]?.name || "Unknown User",
          targetUserEmail: users[userId]?.email || "Unknown Email",
        },
      });

      alert(`User ${action}d successfully.`);
    } catch (err) {
      alert(`Failed to ${action} user: ` + err.message);
    }
  };

  // Action: Broadcast Official Announcement & Pin
  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;

    setIsBroadcasting(true);
    try {
      // 1. Post pinned message to forum
      const forumMsgRef = await addDoc(collection(db, "forum_messages"), {
        text: broadcastText.trim(),
        channel: broadcastChannel,
        userId: session?.uid || auth.currentUser?.uid || "admin",
        userName: "Festival Organizer",
        userRole: "Organizer",
        isPinned: true,
        likes: [],
        reports: [],
        created_at: serverTimestamp(),
      });

      // 2. Create notification record
      const notifRef = await addDoc(collection(db, "notifications"), {
        title: `Official Announcement (#${broadcastChannel})`,
        body: broadcastText.trim(),
        channel: broadcastChannel,
        type: "forum_broadcast",
        createdAt: serverTimestamp(),
      });

      // Audit Log: Broadcast creation
      await recordAuditLog({
        action: "CREATE",
        resource: "forum_messages",
        resourceId: forumMsgRef.id,
        actor: auth.currentUser || session,
        details: {
          action_type: "BROADCAST_ANNOUNCEMENT",
          notificationId: notifRef.id,
          channel: broadcastChannel,
          text: broadcastText.trim(),
          isPinned: true,
        },
      });

      setBroadcastText("");
      alert("Official announcement broadcasted and pinned successfully!");
    } catch (err) {
      alert("Broadcast failed: " + err.message);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const filteredMessages = messages.filter((msg) => {
    const matchesSearch =
      `${msg.text || ""} ${msg.userName || ""} ${msg.channel || ""}`
        .toLowerCase()
        .includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === "flagged") return Array.isArray(msg.reports) && msg.reports.length > 0;
    if (filter === "pinned") return !!msg.isPinned;
    return true;
  });

  const flaggedCount = messages.filter(
    (m) => Array.isArray(m.reports) && m.reports.length > 0
  ).length;

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 6px 0" }}>Forum Moderation & Broadcast</h1>
        <p className="muted" style={{ margin: 0 }}>
          Manage live discussions, resolve flagged content, suspend problem users, and broadcast official announcements.
        </p>
      </div>

      {/* Feature 2: Admin Announcements Broadcaster */}
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          padding: 20,
          marginBottom: 28,
        }}
      >
        <h3 style={{ margin: "0 0 8px 0", fontSize: 16 }}>📢 Broadcast Official Announcement</h3>
        <p className="muted" style={{ fontSize: 13, margin: "0 0 14px 0" }}>
          Broadcasting creates a highlighted, pinned post in the community forum and triggers an attendee alert.
        </p>

        <form onSubmit={handleBroadcast}>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <select
              value={broadcastChannel}
              onChange={(e) => setBroadcastChannel(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                fontSize: 13,
                minWidth: 150,
              }}
            >
              <option value="General">#General</option>
              <option value="Meetups">#Meetups</option>
              <option value="Q&A">#Q&A</option>
              <option value="Lost & Found">#Lost & Found</option>
            </select>

            <input
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                fontSize: 13,
              }}
              placeholder="Type urgent announcement or official schedule update..."
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              required
            />

            <button
              type="submit"
              className="btn-primary"
              disabled={isBroadcasting || !broadcastText.trim()}
              style={{ whiteSpace: "nowrap" }}
            >
              {isBroadcasting ? "Broadcasting..." : "Broadcast & Pin"}
            </button>
          </div>
        </form>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <input
          className="search-input"
          placeholder="Search by user, message content, or channel..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 2, minWidth: 260 }}
        />

        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            className={filter === "all" ? "btn-primary" : "btn-secondary"}
            onClick={() => setFilter("all")}
            style={{ fontSize: 13, padding: "8px 14px" }}
          >
            All Messages ({messages.length})
          </button>
          <button
            type="button"
            className={filter === "flagged" ? "btn-primary" : "btn-secondary"}
            onClick={() => setFilter("flagged")}
            style={{
              fontSize: 13,
              padding: "8px 14px",
              backgroundColor: filter === "flagged" ? "#ef4444" : undefined,
              borderColor: filter === "flagged" ? "#dc2626" : undefined,
            }}
          >
            🚩 Flagged ({flaggedCount})
          </button>
          <button
            type="button"
            className={filter === "pinned" ? "btn-primary" : "btn-secondary"}
            onClick={() => setFilter("pinned")}
            style={{ fontSize: 13, padding: "8px 14px" }}
          >
            📌 Pinned
          </button>
        </div>
      </div>

      {/* Forum Messages Table */}
      {loading ? (
        <p className="muted">Loading forum feed...</p>
      ) : filteredMessages.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#64748b" }}>
          No messages found matching the selected criteria.
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Author & Status</th>
              <th>Channel</th>
              <th>Message Content</th>
              <th>Reports / Likes</th>
              <th>Posted At</th>
              <th style={{ textAlign: "right" }}>Moderation Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMessages.map((msg) => {
              const isFlagged = Array.isArray(msg.reports) && msg.reports.length > 0;
              const userProfile = users[msg.userId] || {};
              const isMuted = !!userProfile.isForumMuted;

              return (
                <tr
                  key={msg.id}
                  style={{
                    backgroundColor: isFlagged ? "rgba(239, 68, 68, 0.04)" : undefined,
                  }}
                >
                  <td>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>
                      {msg.userName || "Attendee"}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontWeight: 700,
                          backgroundColor:
                            msg.userRole === "Organizer" ? "#fef3c7" : "#f1f5f9",
                          color:
                            msg.userRole === "Organizer" ? "#92400e" : "#475569",
                        }}
                      >
                        {msg.userRole || "Attendee"}
                      </span>
                      {isMuted && (
                        <span
                          style={{
                            fontSize: 11,
                            padding: "2px 6px",
                            borderRadius: 4,
                            fontWeight: 700,
                            backgroundColor: "#fee2e2",
                            color: "#b91c1c",
                          }}
                        >
                          MUTED
                        </span>
                      )}
                    </div>
                  </td>

                  <td>
                    <code style={{ fontSize: 12, color: "#8b5cf6" }}>
                      #{msg.channel || "General"}
                    </code>
                  </td>

                  <td style={{ maxWidth: 360, wordBreak: "break-word" }}>
                    {msg.isPinned && (
                      <span
                        style={{
                          display: "inline-block",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#8b5cf6",
                          marginBottom: 4,
                        }}
                      >
                        📌 PINNED
                      </span>
                    )}
                    <div style={{ fontSize: 13, lineHeight: 1.4 }}>{msg.text}</div>
                  </td>

                  <td>
                    {isFlagged ? (
                      <span
                        style={{
                          backgroundColor: "#fee2e2",
                          color: "#b91c1c",
                          padding: "3px 8px",
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        🚩 {msg.reports.length} report{msg.reports.length === 1 ? "" : "s"}
                      </span>
                    ) : (
                      <span className="muted" style={{ fontSize: 12 }}>
                        ❤️ {Array.isArray(msg.likes) ? msg.likes.length : 0}
                      </span>
                    )}
                  </td>

                  <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                    {msg.created_at?.toDate
                      ? msg.created_at.toDate().toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Recently"}
                  </td>

                  {/* Feature 3: Moderation Controls */}
                  <td className="actions-cell" style={{ textAlign: "right" }}>
                    {/* Toggle Pin */}
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => handleTogglePin(msg)}
                    >
                      {msg.isPinned ? "Unpin" : "Pin"}
                    </button>

                    {/* Dismiss Flag */}
                    {isFlagged && (
                      <button
                        type="button"
                        className="link-btn"
                        onClick={() => handleDismissReports(msg)}
                      >
                        Dismiss Flag
                      </button>
                    )}

                    {/* Mute User */}
                    {msg.userId && (
                      <button
                        type="button"
                        className="link-btn danger"
                        onClick={() => handleToggleUserMute(msg.userId, isMuted)}
                      >
                        {isMuted ? "Unmute User" : "Mute User"}
                      </button>
                    )}

                    {/* Delete Post */}
                    <button
                      type="button"
                      className="link-btn danger"
                      onClick={() => handleDeletePost(msg)}
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
    </div>
  );
}