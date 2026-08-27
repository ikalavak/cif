// src/utils/auditLogger.js
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseClient";

/**
 * Records an admin action into the audit_logs collection.
 *
 * @param {Object} params
 * @param {'CREATE'|'UPDATE'|'DELETE'|'TOGGLE_STATUS'|'ROLE_CHANGE'} params.action
 * @param {string} params.resource - Collection or entity modified (e.g., 'events', 'users')
 * @param {string} params.resourceId - Document ID affected
 * @param {Object} params.actor - The authenticated user performing the action { uid, email }
 * @param {Object|string} [params.details] - Metadata or diff describing the change
 */
export async function recordAuditLog({ action, resource, resourceId, actor, details = {} }) {
  try {
    await addDoc(collection(db, "audit_logs"), {
      action,
      resource,
      resourceId,
      actor: {
        uid: actor?.uid || "system",
        email: actor?.email || "anonymous",
      },
      details,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    // Audit log failures should not block critical client workflows
    console.error("Audit log failed to record:", err);
  }
}