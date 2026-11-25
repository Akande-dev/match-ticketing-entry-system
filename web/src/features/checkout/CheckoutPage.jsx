// Checkout: shows the held seats with a countdown, then starts payment or cancels the hold.

import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { cancelOrder, createCheckout, verifyPayment } from '../../services/api';
import { formatMoney } from '../../utils/money';

// Formats milliseconds as mm:ss for the hold countdown.
const clock = (ms) => {
  const s = Math.ceil(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export default function CheckoutPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const returned = params.has('reference') || params.has('trxref');

  // Live view of the order, so the page reacts when payment completes or the hold expires.
  useEffect(() => onSnapshot(doc(db, 'orders', orderId),
    (s) => setOrder(s.exists() ? { id: s.id, ...s.data() } : null), () => setError('Order not found.')), [orderId]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { if (order?.status === 'Paid') navigate('/my-tickets', { replace: true }); }, [order, navigate]);
  // Back from the payment provider: ask the server to confirm the payment.
  useEffect(() => { if (returned) verifyPayment({ orderId }).catch(() => {}); }, [orderId, returned]);

  if (error) return <main><p role="alert">{error}</p></main>;
  if (!order) return <main><p>Loading…</p></main>;
  if (order.status !== 'Pending') return <main><p>This order is {order.status}. <a href="/">Back to matches</a></p></main>;

  const remaining = Math.max(0, order.holdExpiresAt.toMillis() - now);

  // Asks the server for a payment page, then goes there (the mock page or the real provider).
  async function handlePay() {
    setBusy(true);
    setError('');
    try {
      const { checkoutUrl } = await createCheckout({ orderId });
      if (checkoutUrl.startsWith('/')) navigate(checkoutUrl);
      else window.location.assign(checkoutUrl);
    } catch (err) {
      setError(err.message || 'Could not start payment.');
      setBusy(false);
    }
  }
  // Gives the seats back to other buyers.
  async function handleCancel() {
    await cancelOrder({ orderId });
    navigate('/', { replace: true });
  }

  return (
    <main>
      <h1>Checkout</h1>
      <p aria-live="polite">{remaining === 0 ? 'Your hold has expired.' : `Seats held for ${clock(remaining)}`}</p>
      {returned && <p>Confirming your payment…</p>}
      <ul>{order.seatLabels.map((l) => <li key={l}>{l}</li>)}</ul>
      <p><strong>Total: {formatMoney(order.totalMinor)}</strong></p>
      {error && <p role="alert">{error}</p>}
      <button type="button" onClick={handlePay} disabled={busy || remaining === 0}>Pay now</button>{' '}
      <button type="button" onClick={handleCancel} disabled={busy}>Cancel and release seats</button>
    </main>
  );
}
