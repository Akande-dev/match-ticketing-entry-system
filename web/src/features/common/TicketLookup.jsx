// Search box for staff: type a ticket number and see its status, match, seat and first scan.
// Used on the Scanner page (stewards, admins) and the Admin > Tickets page. It never admits a ticket.
import { useState } from 'react';
import { findTicketByNumber } from '../../services/api';
import { sportEmoji } from '../../utils/sports';

export default function TicketLookup() {
  const [value, setValue] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Asks the server (which checks the caller is a steward or admin) and shows the answer.
  async function search(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    setBusy(true);
    try {
      setResult(await findTicketByNumber({ ticketNumber: value }));
    } catch (err) {
      setError(err.message || 'Search failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ticket-lookup">
      <h2>Find a ticket by number</h2>
      <form onSubmit={search}>
        <label htmlFor="ticket-number">Ticket number</label>
        <input id="ticket-number" value={value} maxLength={20} placeholder="TKT-7K4M9Q2X"
          onChange={(e) => setValue(e.target.value)} required />
        <button type="submit" disabled={busy}>{busy ? 'Searching...' : 'Search'}</button>
      </form>
      {error && <p role="alert">{error}</p>}
      {result && (
        <div role="status" className="card">
          <h3>{result.ticketNumber}</h3>
          <p>{sportEmoji(result.sport)} {result.matchLabel}</p>
          <p>{result.seatLabel}{result.category ? ` (${result.category})` : ''}</p>
          <p>Status: <strong>{String(result.status).toUpperCase()}</strong></p>
          {result.usedAtMs && <p>First scanned {new Date(result.usedAtMs).toLocaleString()} at gate {result.usedGate}</p>}
          <p><small>Lookup only. This does not admit the ticket.</small></p>
        </div>
      )}
    </section>
  );
}
