// Shows the user's unpaid seat holds with a live countdown, so they can resume payment or cancel.
// Only the owner's own orders are queried; the server checks ownership again on cancel.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { cancelOrder } from '../../services/api';
import { useLiveQuery } from '../../hooks/useLiveQuery';
import { useAuth } from '../auth/AuthContext';
import { formatMoney } from '../../utils/money';

// Formats milliseconds as mm:ss.
const clock = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export default function PendingOrders() {
  const { user } = useAuth();
  const orders = useLiveQuery(() => user && query(collection(db, 'orders'), where('userId', '==', user.uid)), [user?.uid]);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState('');

  // Ticks every second so the countdown moves and expired holds disappear by themselves.
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  // Pending and not yet expired. Filtered here so the query needs no composite index.
  const open = orders.docs.filter((o) => o.status === 'Pending' && o.holdExpiresAt && o.holdExpiresAt.toMillis() > now);
  if (!open.length) return null;

  async function cancel(orderId) {
    setError('');
    try { await cancelOrder({ orderId }); } catch (err) { setError(err.message || 'Could not cancel.'); }
  }

  return (
    <section className="pending-orders">
      <h2>Pending payment</h2>
      {error && <p role="alert">{error}</p>}
      <ul className="cards">
        {open.map((o) => (
          <li key={o.id} className="card">
            <p><strong>{o.seatLabels.join(', ')}</strong></p>
            <p>Total: {formatMoney(o.totalMinor)}</p>
            <p>Seats held for {clock(o.holdExpiresAt.toMillis() - now)}</p>
            <Link className="btn btn-red" to={`/checkout/${o.id}`}>Resume payment</Link>{' '}
            <button type="button" onClick={() => cancel(o.id)}>Cancel hold</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
