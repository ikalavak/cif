// cif-admin-panel/src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { auth } from "../firebaseClient";
import { recordAuditLog } from "../utils/auditLogger";

export default function Login() {
  const { session, isAdmin, signIn, resetPassword } = useAuth();

  // State variables
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load saved email on mount if "Remember Me" was previously checked
  useEffect(() => {
    const savedEmail = localStorage.getItem("cif_admin_saved_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  if (session && isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError("Please enter both email and password.");
      return;
    }

    // Handle "Remember Me"
    if (rememberMe) {
      localStorage.setItem("cif_admin_saved_email", cleanEmail);
    } else {
      localStorage.removeItem("cif_admin_saved_email");
    }

    setSubmitting(true);

    try {
      await signIn(cleanEmail, cleanPassword);

      // Audit Log: Successful Admin Login
      await recordAuditLog({
        action: "LOGIN",
        resource: "auth",
        resourceId: auth.currentUser?.uid || cleanEmail,
        actor: {
          uid: auth.currentUser?.uid || "authenticated_admin",
          email: cleanEmail,
        },
        details: {
          action_type: "ADMIN_LOGIN_SUCCESS",
          email: cleanEmail,
          userAgent: navigator.userAgent,
        },
      });
    } catch (err) {
      let message = "Login failed. Please try again.";

      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        message =
          "Invalid email or password. Please verify your credentials in Firebase Auth.";
      } else if (err.code === "auth/too-many-requests") {
        message =
          "Too many failed login attempts. Please reset your password or try again later.";
      } else if (err.message) {
        message = err.message;
      }

      setError(message);
      console.error("Login error:", err.code || "CUSTOM_ERROR", err.message);

      // Audit Log: Failed Login Attempt
      await recordAuditLog({
        action: "LOGIN_FAILED",
        resource: "auth",
        resourceId: cleanEmail,
        actor: {
          uid: "unauthenticated",
          email: cleanEmail,
        },
        details: {
          action_type: "ADMIN_LOGIN_FAILED",
          email: cleanEmail,
          errorCode: err.code || "UNKNOWN_ERROR",
          errorMessage: err.message,
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async () => {
    setError("");
    setInfoMessage("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Please enter your email address first to reset your password.");
      return;
    }

    try {
      if (resetPassword) {
        await resetPassword(cleanEmail);

        // Audit Log: Password Reset Request
        await recordAuditLog({
          action: "PASSWORD_RESET",
          resource: "auth",
          resourceId: cleanEmail,
          actor: {
            uid: "unauthenticated",
            email: cleanEmail,
          },
          details: {
            action_type: "PASSWORD_RESET_REQUESTED",
            email: cleanEmail,
          },
        });
      } else {
        throw new Error(
          "Password reset function is not available in AuthContext.",
        );
      }
      setInfoMessage(
        `Password reset link sent to ${cleanEmail}. Check your inbox.`,
      );
    } catch (err) {
      setError(err.message || "Failed to send password reset email.");
    }
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>CIF Admin</h1>
        <p className="muted">Sign in to manage the festival.</p>

        {/* EMAIL INPUT */}
        <label htmlFor="admin-email">Email</label>
        <input
          id="admin-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
          required
        />

        {/* PASSWORD INPUT WITH EYE TOGGLE */}
        <label htmlFor="admin-password">Password</label>
        <div style={{ position: "relative", width: "100%" }}>
          <input
            id="admin-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            style={{ width: "100%", paddingRight: "40px" }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#6b7280",
              padding: "4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            {showPassword ? (
              /* Eye Off Icon (Hide) */
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              /* Eye Icon (Show) */
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        {/* REMEMBER ME & FORGOT PASSWORD ROW */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "12px 0 16px",
            fontSize: "13px",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              margin: 0,
            }}
          >
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            Remember me
          </label>

          <button
            type="button"
            onClick={handleForgotPassword}
            style={{
              background: "none",
              border: "none",
              color: "#3b82f6",
              cursor: "pointer",
              fontSize: "13px",
              padding: 0,
              textDecoration: "underline",
            }}
          >
            Forgot password?
          </button>
        </div>

        {/* MESSAGES */}
        {error && (
          <div
            className="form-error"
            style={{
              color: "#e53e3e",
              backgroundColor: "#fff5f5",
              padding: "10px 14px",
              borderRadius: 6,
              border: "1px solid #feb2b2",
              fontSize: 13,
              marginBottom: "12px",
            }}
          >
            {error}
          </div>
        )}

        {infoMessage && (
          <div
            style={{
              color: "#2b6cb0",
              backgroundColor: "#ebf8ff",
              padding: "10px 14px",
              borderRadius: 6,
              border: "1px solid #bee3f8",
              fontSize: 13,
              marginBottom: "12px",
            }}
          >
            {infoMessage}
          </div>
        )}

        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}