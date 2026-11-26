// My tickets: the logged-in user's tickets with QR codes, refund requests and transfer to a friend.
// Only the owner's own tickets are queried, and the server checks ownership again on every action.

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { collection, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { requestRefund, transferTicket } from '../../services/api';
import { useLiveQuery } from '../../hooks/useLiveQuery';
import { useAuth } from '../auth/AuthContext';
import { sportEmoji } from '../../utils/sports';
import PendingOrders from './PendingOrders';

// Text shown for each refund status.
const REFUND_LABEL = { Requested: 'Refund requested', Approved: 'Refund approved', Rejected: 'Refund rejected' };

export default function MyTicketsPage() {
  const { user } = useAuth();
  // Live lists of this user's tickets and refund requests (idle until the user is known).
  const tickets = useLiveQuery(() => user && query(collection(db, 'tickets'), where('userId', '==', user.uid)), [user?.uid]);
  const refunds = useLiveQuery(() => user && query(collection(db, 'refunds'), where('userId', '==', user.uid)), [user?.uid]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [transferId, setTransferId] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  // Quick lookup from ticket id to its refund request.
  const refundByTicket = new Map(refunds.docs.map((r) => [r.ticketId, r]));

  // Asks for a refund after confirmation; the manager approves or rejects it later.
  async function handleRefund(ticketId) {
    if (!window.confirm('Request a refund for this ticket?')) return;
    setError('');
    setNotice('');
    try { await requestRefund({ ticketId }); }
    catch (err) { setError(err.message || 'Could not request a refund.'); }
  }

  // Sends the ticket to another registered user. The server issues a new ticket and retires this one.
  async function handleTransfer(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      await transferTicket({ ticketId: transferId, recipientEmail: email.trim() });
      setNotice('Ticket transferred. Your copy no longer works.');
      setTransferId('');
      setEmail('');
    } catch (err) {
      setError(err.message || 'Could not transfer the ticket.');
    } finally {
      setBusy(false);
    }
  }

  if (tickets.loading) return <main><p>Loading tickets…</p></main>;
  // With no paid tickets the page still shows any unpaid holds, so payment can be resumed.
  if (!tickets.docs.length) return <main><PendingOrders /><p>You have no tickets yet.</p></main>;

  return (
    <main>
      <h1>My tickets</h1>
      <PendingOrders />
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <ul className="cards">
        {tickets.docs.map((t) => {
          const refund = refundByTicket.get(t.id);
          const refundOpen = refund && refund.status !== 'Rejected';
          // Buttons show only for a Valid ticket with no open refund; each ticket can be transferred once.
          const canAct = t.status === 'Valid' && !refundOpen;
          const canTransfer = canAct && (t.transferCount ?? 0) < 1;
          return (
            <li key={t.id} className="card">
              <h2>{sportEmoji(t.sport)} {t.matchLabel}</h2>
              <p>{t.seatLabel}</p>
              {t.ticketNumber && <p>Ticket no: <strong>{t.ticketNumber}</strong></p>}
              {t.status === 'Valid' && <QRCodeSVG value={t.qrPayload} size={180} />}
              <p>Status: <strong>{t.status.toUpperCase()}</strong></p>
              {t.transferredFrom && <p>Received by transfer.</p>}
              {t.status === 'Transferred' && <p>You transferred this ticket to another fan.</p>}
              {refund && <p>{REFUND_LABEL[refund.status]}{refund.note ? `: ${refund.note}` : ''}</p>}

              {canAct && transferId !== t.id && (
                <p>
                  <button type="button" onClick={() => handleRefund(t.id)}>Request refund</button>{' '}
                  {canTransfer && (
                    <button type="button" onClick={() => { setTransferId(t.id); setError(''); setNotice(''); }}>
                      Transfer to a friend
                    </button>
                  )}
                </p>
              )}

              {transferId === t.id && (
                <form onSubmit={handleTransfer}>
                  <label htmlFor={`to-${t.id}`}>Friend's email (they must have an account)</label>
                  <input id={`to-${t.id}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  <p>Your copy will stop working as soon as you send.</p>
                  <button type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send ticket'}</button>{' '}
                  <button type="button" disabled={busy} onClick={() => setTransferId('')}>Cancel</button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
