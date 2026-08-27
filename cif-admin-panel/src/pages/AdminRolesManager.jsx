import React, { useState, useEffect } from "react";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../firebaseClient";
import { recordAuditLog } from "../utils/auditLogger";

export default function AdminRolesManager() {
  const [adminList, setAdminList] = useState([]);
  const [targetEmail, setTargetEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("admin");
  const [loading, setLoading] = useState(false);
  const [currentAdminRole, setCurrentAdminRole] = useState(null);

  // 1. Check current logged-in user's role
  useEffect(() => {
    const fetchCurrentRole = async () => {
      if (auth.currentUser) {
        const snap = await getDoc(doc(db, "admins", auth.currentUser.uid));
        if (snap.exists()) {
          setCurrentAdminRole(snap.data().role);
        }
      }
    };
    fetchCurrentRole();
  }, []);

  // 2. Realtime listener on admins collection
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "admins"), (snapshot) => {
      const docs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setAdminList(docs);
    });
    return () => unsubscribe();
  }, []);

  // 3. Grant Admin Access by Email
  const handleGrantAccess = async (e) => {
    e.preventDefault();
    if (!targetEmail.trim()) return;

    if (currentAdminRole !== "superadmin") {
      alert("Only Super Admins can assign or revoke permissions.");
      return;
    }

    setLoading(true);
    try {
      // Find the user's Auth UID from the users collection
      const q = query(
        collection(db, "users"),
        where("email", "==", targetEmail.trim().toLowerCase())
      );
      const userSnap = await getDocs(q);

      if (userSnap.empty) {
        alert(
          `No user found with email "${targetEmail}". Ensure the user has registered in the app first.`
        );
        setLoading(false);
        return;
      }

      const targetUid = userSnap.docs[0].id;
      const targetUserData = userSnap.docs[0].data();
      const normalizedEmail = targetUserData.email || targetEmail.trim().toLowerCase();

      // Write to /admins/{uid}
      await setDoc(
        doc(db, "admins", targetUid),
        {
          email: normalizedEmail,
          displayName: targetUserData.displayName || "Admin User",
          role: selectedRole,
          grantedAt: serverTimestamp(),
          grantedBy: auth.currentUser?.email || "SuperAdmin",
        },
        { merge: true }
      );

      // Audit Log: Record role assignment
      await recordAuditLog({
        action: "GRANT_ROLE",
        resource: "admins",
        resourceId: targetUid,
        actor: auth.currentUser,
        details: {
          targetEmail: normalizedEmail,
          assignedRole: selectedRole,
          displayName: targetUserData.displayName || "Admin User",
        },
      });

      alert(`Admin access granted to ${targetEmail} as ${selectedRole}!`);
      setTargetEmail("");
    } catch (error) {
      console.error("Error granting admin access:", error);
      alert("Failed to grant access: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Revoke Admin Access
  const handleRevokeAccess = async (adminDoc) => {
    if (currentAdminRole !== "superadmin") {
      alert("Only Super Admins can revoke access.");
      return;
    }

    if (adminDoc.id === auth.currentUser?.uid) {
      alert("You cannot revoke your own Super Admin access.");
      return;
    }

    if (window.confirm(`Revoke admin privileges for ${adminDoc.email}?`)) {
      try {
        await deleteDoc(doc(db, "admins", adminDoc.id));

        // Audit Log: Record role revocation
        await recordAuditLog({
          action: "REVOKE_ROLE",
          resource: "admins",
          resourceId: adminDoc.id,
          actor: auth.currentUser,
          details: {
            revokedEmail: adminDoc.email,
            previousRole: adminDoc.role,
          },
        });

        alert("Access revoked successfully.");
      } catch (error) {
        console.error("Error revoking access:", error);
        alert("Failed to revoke access: " + error.message);
      }
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h1>Admin & Role Management</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Super Admins can grant or revoke admin panel permissions for team members.
      </p>

      {/* Grant Role Form */}
      <form onSubmit={handleGrantAccess} style={styles.card}>
        <h2 style={{ fontSize: 17, fontWeight: "bold", marginBottom: 16 }}>
          Grant Admin Access
        </h2>
        <div style={styles.row}>
          <div style={{ flex: 2 }}>
            <label style={styles.label}>User Email</label>
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={styles.input}
            >
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              type="submit"
              disabled={loading || currentAdminRole !== "superadmin"}
              style={{
                backgroundColor: "#5850ec",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "600",
                height: 42,
              }}
            >
              {loading ? "Processing..." : "Grant Access"}
            </button>
          </div>
        </div>
        {currentAdminRole !== "superadmin" && (
          <p style={{ color: "#e53e3e", fontSize: 12, marginTop: 8 }}>
            * You are currently signed in as "{currentAdminRole || "viewer"}". Only Super Admins can grant roles.
          </p>
        )}
      </form>

      {/* Admin Roster Table */}
      <div style={{ ...styles.card, marginTop: 24 }}>
        <h2 style={{ fontSize: 17, fontWeight: "bold", marginBottom: 16 }}>
          Active Admins ({adminList.length})
        </h2>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #edf2f7", color: "#718096", fontSize: 12 }}>
              <th style={styles.th}>EMAIL</th>
              <th style={styles.th}>USER UID</th>
              <th style={styles.th}>ROLE</th>
              <th style={styles.th}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {adminList.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: 24, color: "#a0aec0" }}>
                  No admin accounts found.
                </td>
              </tr>
            ) : (
              adminList.map((adm) => (
                <tr key={adm.id} style={{ borderBottom: "1px solid #edf2f7", fontSize: 14 }}>
                  <td style={styles.td}>
                    <strong>{adm.email || "No Email"}</strong>
                    {adm.id === auth.currentUser?.uid && (
                      <span style={styles.youBadge}>You</span>
                    )}
                  </td>
                  <td style={{ ...styles.td, fontFamily: "monospace", fontSize: 12, color: "#718096" }}>
                    {adm.id}
                  </td>
                  <td style={styles.td}>
                    <span style={adm.role === "superadmin" ? styles.superBadge : styles.adminBadge}>
                      {adm.role}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {adm.id !== auth.currentUser?.uid && (
                      <button
                        onClick={() => handleRevokeAccess(adm)}
                        disabled={currentAdminRole !== "superadmin"}
                        style={{
                          color: "#e53e3e",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Revoke Access
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    padding: 24,
  },
  row: { display: "flex", gap: 16 },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: "600",
    color: "#4a5568",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #cbd5e0",
    fontSize: 14,
    boxSizing: "border-box",
  },
  th: { padding: "12px 16px", fontWeight: "bold" },
  td: { padding: "14px 16px" },
  youBadge: {
    marginLeft: 8,
    fontSize: 11,
    backgroundColor: "#edf2f7",
    padding: "2px 8px",
    borderRadius: 12,
    color: "#4a5568",
  },
  adminBadge: {
    backgroundColor: "#ebf8ff",
    color: "#2b6cb0",
    padding: "4px 10px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: "600",
  },
  superBadge: {
    backgroundColor: "#feebc8",
    color: "#c05621",
    padding: "4px 10px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: "700",
  },
};