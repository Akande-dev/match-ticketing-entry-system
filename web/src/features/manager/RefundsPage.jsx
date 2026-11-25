// Manager list of pending refund requests, with Approve and Reject.

import { useState } from 'react';
import { collection, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { decideRefund } from '../../services/api';
import { formatMoney } from '../../utils/money';
import { useLiveQuery } from '../../hooks/useLiveQuery';

export default function RefundsPage() {
  const { docs: refunds, loading, error } = useLiveQuery(
    () => query(collection(db, 'refunds'), where('status', '==', 'Requested'), orderBy('createdAt', 'desc')), []);
  const [message, setMessage] = useState('');

  // Rejecting asks for a reason that the fan will see.
  async function decide(ticketId, decision) {
    const note = decision === 'reject' ? window.prompt('Reason for rejecting (shown to the fan):') ?? '' : '';
    setMessage('');
    try { await decideRefund({ ticketId, decision, note }); }
    catch (err) { setMessage(err.message || 'Could not record the decision.'); }
  }

  if (loading) return <p>Loading…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!refunds.length) return <p>No pending refund requests.</p>;

  return (
    <section>
      {message && <p role="alert">{message}</p>}
      <ul className="cards">
        {refunds.map((r) => (
          <li key={r.id} className="card">
            <p>Ticket {r.ticketId}</p>
            <p>Amount: {r.amountMinor == null ? 'unknown' : formatMoney(r.amountMinor)}</p>
            <p>Reason: {r.reason || 'none given'}</p>
            <button type="button" onClick={() => decide(r.ticketId, 'approve')}>Approve</button>{' '}
            <button type="button" onClick={() => decide(r.ticketId, 'reject')}>Reject</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
