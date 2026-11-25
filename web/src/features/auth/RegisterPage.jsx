// Registration page: creates a fan account. Admins can later change the role.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Friendly messages for the common sign-up errors.
const ERRORS = {
  'auth/email-already-in-use': 'That email is already registered.',
  'auth/weak-password': 'Password must be at least 6 characters.',
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  // Creates the account, then goes to the home page.
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(ERRORS[err.code] ?? 'Could not create your account.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <h1>Create account</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="name">Full name</label>
        <input id="name" value={form.name} onChange={update('name')} maxLength={100} required />
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={form.email} onChange={update('email')} required />
        <label htmlFor="password">Password (min 6 characters)</label>
        <input id="password" type="password" minLength={6} value={form.password} onChange={update('password')} required />
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Register'}</button>
      </form>
      <p>Already registered? <Link to="/login">Log in</Link></p>
    </main>
  );
}
