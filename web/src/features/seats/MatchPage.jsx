// Event page: shows the ticket types with seats left, a live seat map, and holds the chosen seats.
// Seat data updates live, so other buyers' holds and sales appear without refreshing.

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { holdSeats } from '../../services/api';
import { formatMoney } from '../../utils/money';
import { ICON } from '../../utils/icons';
import { sportEmoji, sportLabel } from '../../utils/sports';

// Same limit as the server (reservationLogic.js); the server checks it again.
const MAX_SEATS = 6;
// Symbol drawn on each seat button for each state.
const SYMBOL = { available: '○', selected: '✓', held: '◐', sold: '×' };

// Works out how a seat should look: sold, held by someone else (hold not yet expired),
// selected by this user, or available.
function seatState(seat, selected, nowMs) {
  let base = 'available';
  if (seat.status === 'Sold') base = 'sold';
  else if (seat.status === 'Held' && (seat.holdExpiresAt?.toMillis?.() ?? 0) > nowMs) base = 'held';
  return selected && base === 'available' ? 'selected' : base;
}

// Seat ids end in -R<row>-S<number>; this reads them so seats can be sorted in order.
function parseSeatId(id) {
  const m = /-R(\d+)-S(\d+)$/.exec(id);
  return m ? { row: Number(m[1]), number: Number(m[2]) } : { row: 0, number: 0 };
}

export default function MatchPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [seats, setSeats] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  // Three live listeners: the event, its seats and its prices. All are removed when leaving the page.
  useEffect(() => {
    const ref = doc(db, 'matches', matchId);
    const unsubs = [
      onSnapshot(ref, (s) => { setMatch(s.exists() ? s.data() : null); setLoading(false); }, () => setLoading(false)),
      onSnapshot(collection(ref, 'inventory'), (s) => setSeats(s.docs.map((d) => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(ref, 'prices'), (s) => {
        const p = {};
        s.forEach((d) => { p[d.id] = d.data().amountMinor; });
        setPrices(p);
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, [matchId]);

  if (loading) return <main><p>Loading…</p></main>;
  if (!match) return <main><p role="alert">Event not found.</p></main>;

  // Group seats by section and count seats left per ticket type for the summary rows.
  const nowMs = Date.now();
  const when = match.kickoff.toDate();
  const sections = {};
  const perType = {};
  seats.forEach((s) => {
    const { row, number } = parseSeatId(s.id);
    (sections[s.sectionId] ??= { category: s.category, seats: [] }).seats.push({ ...s, row, number });
    const t = (perType[s.category] ??= { total: 0, left: 0 });
    t.total += 1;
    if (seatState(s, false, nowMs) === 'available') t.left += 1;
  });
  Object.values(sections).forEach((sec) => sec.seats.sort((a, b) => a.row - b.row || a.number - b.number));
  const types = Object.entries(perType).sort(([a], [b]) => (prices[b] ?? 0) - (prices[a] ?? 0));

  // Total price of the seats chosen so far (display only; the server calculates the real total).
  const total = [...selected].reduce((sum, id) => sum + (prices[seats.find((s) => s.id === id)?.category] ?? 0), 0);

  // Selects or unselects a seat, up to the maximum per order.
  function toggle(seat) {
    setMessage('');
    const next = new Set(selected);
    if (next.has(seat.id)) next.delete(seat.id);
    else if (next.size >= MAX_SEATS) { setMessage(`You can select up to ${MAX_SEATS} seats.`); return; }
    else next.add(seat.id);
    setSelected(next);
  }

  // Asks the server to hold the chosen seats for 10 minutes, then opens checkout.
  // If someone else got a seat first, the server refuses and the selection is cleared.
  async function handleHold() {
    setBusy(true);
    setMessage('');
    try {
      const { orderId } = await holdSeats({ matchId, seatIds: [...selected] });
      navigate(`/checkout/${orderId}`);
    } catch (err) {
      setSelected(new Set());
      setMessage(err.message || 'Could not hold those seats.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <div className="event-head">
        <p className="kicker-dark">{sportEmoji(match.sport)} {sportLabel(match.sport).toUpperCase()}{match.venueName ? ` · ${match.venueName.toUpperCase()}` : ''}</p>
        <h1>{match.homeTeam} v {match.awayTeam}</h1>
        <p className="muted">{when.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{match.venueName ? ` · ${match.venueName}` : ''}</p>
      </div>

      <h2 className="section-title"><span>TICKET</span> TYPES</h2>
      {types.map(([category, t], i) => (
        <div key={category} className={`window-row${i === 0 ? ' window-top' : ''}`}>
          <b>{category}</b>
          <span className="window-price">{formatMoney(prices[category])}</span>
          <span className={`pill${t.left === 0 ? ' pill-out' : ''}`}>{t.left === 0 ? 'Sold out' : `${t.left} of ${t.total} left`}</span>
        </div>
      ))}
      <p className="muted small">Maximum {MAX_SEATS} seats per order. Seats are held for 10 minutes while you pay.</p>

      <h2 className="section-title"><span>CHOOSE</span> YOUR SEATS</h2>
      <p className="muted small">Legend: ○ available, ✓ selected, ◐ held by someone, × sold</p>
      {Object.entries(sections).map(([id, sec]) => (
        <section key={id}>
          <h3>{id.toUpperCase()} ({sec.category}, {formatMoney(prices[sec.category])})</h3>
          <div className="seat-grid">
            {sec.seats.map((seat) => {
              const state = seatState(seat, selected.has(seat.id), nowMs);
              return (
                <button key={seat.id} type="button" className={`seat seat--${state}`}
                  disabled={state === 'held' || state === 'sold'} aria-pressed={state === 'selected'}
                  aria-label={`${seat.label}, ${state}`} title={seat.label} onClick={() => toggle(seat)}>
                  {SYMBOL[state]}
                </button>
              );
            })}
          </div>
        </section>
      ))}
      <footer className="sticky-bar">
        <span>{ICON.ticket} {selected.size} seat(s) · <b>{formatMoney(total)}</b></span>
        {message && <span role="alert"> {message}</span>}
        <button type="button" className="btn btn-red" disabled={!selected.size || busy} onClick={handleHold}>
          {busy ? 'Holding…' : `Hold seats & continue ${ICON.arrow}`}
        </button>
      </footer>
    </main>
  );
}
