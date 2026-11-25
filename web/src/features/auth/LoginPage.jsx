import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Where each role lands after logging in.
const HOME = { fan: '/', steward: '/scanner', manager: '/manager', admin: '/admin' };

// Demo only: shown when the app is connected to the local emulators.
const DEMO_PASSWORD = 'Demo1234!';
const DEMO_ACCOUNTS = [
  { label: 'Fan', email: 'fan@demo.com' },
  { label: 'Steward', email: 'steward@demo.com' },
  { label: 'Admin', email: 'admin@demo.com' },
];

export default function LoginPage() {
  const { login, user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    const from = location.state?.from?.pathname;
    navigate(from && from !== '/' ? from : (HOME[role] ?? '/'), { replace: true });
  }, [user, role, navigate, location.state]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
    } catch {
      setError('Incorrect email or password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <h1>Log in</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={busy}>{busy ? 'Signing in...' : 'Log in'}</button>
      </form>
      <p>No account? <Link to="/register">Register</Link></p>
      {import.meta.env.VITE_USE_EMULATORS === 'true' && (
        <p>
          Demo accounts (fills the form):{' '}
          {DEMO_ACCOUNTS.map((a) => (
            <button key={a.email} type="button" style={{ marginRight: 8 }}
              onClick={() => { setEmail(a.email); setPassword(DEMO_PASSWORD); }}>
              {a.label}
            </button>
          ))}
        </p>
      )}
    </main>
  );
}
