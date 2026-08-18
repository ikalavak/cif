// cif-admin-panel/src/components/AdminRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function AdminRoute({ children }) {
  const { session, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading application...</p>
      </div>
    );
  }

  // Not logged in -> send to login page
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but not an admin -> show message
  if (!isAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '12px' }}>
        <h2>Access Denied</h2>
        <p>Your account does not have administrator privileges.</p>
        <button
          onClick={() => window.location.href = '/login'}
          style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          Back to Login
        </button>
      </div>
    );
  }

  // Admin verified -> Render children (Layout) or Outlet
  return children ? children : <Outlet />;
}