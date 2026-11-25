import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Demo only: shown when the app is connected to the local emulators.
// The password below belongs to emulator demo data, never to a real system.
const DEMO_PASSWORD = 'Demo1234!';
const ACCOUNTS = [
  { label: 'Fan', email: 'fan@demo.com' },
  { label: 'Steward', email: 'steward@demo.com' },
  { label: 'Admin', email: 'admin@demo.com' },
];

export default function DemoSwitcher() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  if (import.meta.env.VITE_USE_EMULATORS !== 'true') return null;

  async function switchTo(email) {
    setBusy(email);
    setError('');
    try {
      await login(email, DEMO_PASSWORD);
      navigate('/');
    } catch {
      setError('Demo account not found. Restart the demo.');
    }
    setBusy('');
  }

  return (
    <div role="region" aria-label="Demo role switcher"
      style={{ background: '#0b1b3a', color: '#fff', padding: '6px 16px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <b>Demo mode</b>
      <span>Switch role:</span>
      {ACCOUNTS.map((a) => (
        <button key={a.email} type="button" disabled={busy !== ''}
          onClick={() => switchTo(a.email)}
          style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #fff', cursor: 'pointer', background: user?.email === a.email ? '#e11d48' : 'transparent', color: '#fff' }}>
          {a.label}
        </button>
      ))}
      {error && <span role="alert">{error}</span>}
    </div>
  );
}
