import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Login() {
  const { session, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (session) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      const message = err.code === 'auth/invalid-credential'
        ? 'Invalid email or password. Check that the user exists in Firebase Auth and that the password is correct.'
        : err.message || 'Login failed. Please try again.';
      setError(message);
      console.error('Login error:', err.code, err.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>CIF Admin</h1>
        <p className="muted">Sign in to manage the festival.</p>

        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        {error && <div className="form-error">{error}</div>}

        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
