// Login page: the first page a visitor sees. After login each role is sent to its own area.
// In emulator (demo) mode it also shows buttons that fill in the demo accounts.

import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { SPORT_IDS, sportEmoji } from '../../utils/sports';

// Where each role lands after logging in.
const HOME = { fan: '/', steward: '/scanner', manager: '/manager', admin: '/admin' };

// Demo only: shown when the app is connected to the local emulators.
const DEMO_PASSWORD = 'Demo1234!';
const DEMO_ACCOUNTS = [
  { label: 'Fan', email: 'fan@demo.com', cls: 'demo-fan' },
  { label: 'Steward', email: 'steward@demo.com', cls: 'demo-steward' },
  { label: 'Admin', email: 'admin@demo.com', cls: 'demo-admin' },
];

// Position, size and timing of the floating background icons.
const FLOATERS = [
  { l: '6%', t: '12%', s: '3.2rem', d: '0s', du: '11s' },
  { l: '18%', t: '70%', s: '2.6rem', d: '1.5s', du: '13s' },
  { l: '30%', t: '28%', s: '2rem', d: '3s', du: '9s' },
  { l: '42%', t: '82%', s: '3.4rem', d: '0.8s', du: '12s' },
  { l: '55%', t: '8%', s: '2.8rem', d: '2.2s', du: '10s' },
  { l: '66%', t: '60%', s: '2.2rem', d: '4s', du: '14s' },
  { l: '76%', t: '22%', s: '3.6rem', d: '1s', du: '12s' },
  { l: '86%', t: '76%', s: '2.8rem', d: '2.6s', du: '11s' },
  { l: '92%', t: '36%', s: '2.2rem', d: '3.4s', du: '15s' },
  { l: '12%', t: '44%', s: '2.4rem', d: '0.4s', du: '16s' },
];

export default function LoginPage() {
  const { login, user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Once the user and role are known, go back to the page they wanted or to their role's home.
  useEffect(() => {
    if (!user) return;
    const from = location.state?.from?.pathname;
    navigate(from && from !== '/' ? from : (HOME[role] ?? '/'), { replace: true });
  }, [user, role, navigate, location.state]);

  // Signs in; the effect above then performs the redirect. Errors show a generic message.
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
    <main className="auth-page">
      <div className="auth-bg" aria-hidden="true">
        {FLOATERS.map((f, i) => (
          <span key={i} className="floater"
            style={{ '--l': f.l, '--t': f.t, '--s': f.s, '--d': f.d, '--du': f.du }}>
            {sportEmoji(SPORT_IDS[i % SPORT_IDS.length])}
          </span>
        ))}
      </div>
      <div className="auth-card">
        <h1>Log in</h1>
        <p className="auth-sub">Welcome back. Sign in to buy tickets or manage events.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p role="alert" className="auth-error">{error}</p>}
          <button type="submit" disabled={busy}>{busy ? 'Signing in...' : 'Log in'}</button>
        </form>
        <p className="auth-alt">No account? <Link to="/register">Register</Link></p>
        {import.meta.env.VITE_USE_EMULATORS === 'true' && (
          <div className="demo-box">
            <small>Demo accounts (fills the form)</small>
            <div className="demo-row">
              {DEMO_ACCOUNTS.map((a) => (
                <button key={a.email} type="button" className={'demo-pill ' + a.cls}
                  onClick={() => { setEmail(a.email); setPassword(DEMO_PASSWORD); }}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
