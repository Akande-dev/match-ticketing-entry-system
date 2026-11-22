import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { collection, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { requestRefund } from '../../services/api';
import { useLiveQuery } from '../../hooks/useLiveQuery';
import { useAuth } from '../auth/AuthContext';

const REFUND_LABEL = { Requested: 'Refund requested', Approved: 'Refund approved', Rejected: 'Refund rejected' };

export default function MyTicketsPage() {
  const { user } = useAuth();
  const tickets = useLiveQuery(() => user && query(collection(db, 'tickets'), where('userId', '==', user.uid)), [user?.uid]);
  const refunds = useLiveQuery(() => user && query(collection(db, 'refunds'), where('userId', '==', user.uid)), [user?.uid]);
  const [message, setMessage] = useState('');
  const refundByTicket = new Map(refunds.docs.map((r) => [r.ticketId, r]));

  async function handleRefund(ticketId) {
    if (!window.confirm('Request a refund for this ticket?')) return;
    try { await requestRefund({ ticketId }); setMessage(''); }
    catch (err) { setMessage(err.message || 'Could not request a refund.'); }
  }

  if (tickets.loading) return <main><p>Loading tickets…</p></main>;
  if (!tickets.docs.length) return <main><p>You have no tickets yet.</p></main>;

  return (
    <main>
      <h1>My tickets</h1>
      {message && <p role="alert">{message}</p>}
      <ul className="cards">
        {tickets.docs.map((t) => {
          const refund = refundByTicket.get(t.id);
          return (
            <li key={t.id} className="card">
              <h2>{t.matchLabel}</h2>
              <p>{t.seatLabel}</p>
              {t.status === 'Valid' && <QRCodeSVG value={t.qrPayload} size={180} />}
              <p>Status: <strong>{t.status.toUpperCase()}</strong></p>
              {refund && <p>{REFUND_LABEL[refund.status]}{refund.note ? `: ${refund.note}` : ''}</p>}
              {t.status === 'Valid' && (!refund || refund.status === 'Rejected') && (
                <button type="button" onClick={() => handleRefund(t.id)}>Request refund</button>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
