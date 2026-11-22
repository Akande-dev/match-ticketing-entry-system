import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { holdSeats } from '../../services/api';
import { formatMoney } from '../../utils/money';

const MAX_SEATS = 6;
const SYMBOL = { available: '○', selected: '✓', held: '◐', sold: '×' };

function seatState(seat, selected, nowMs) {
  let base = 'available';
  if (seat.status === 'Sold') base = 'sold';
  else if (seat.status === 'Held' && (seat.holdExpiresAt?.toMillis?.() ?? 0) > nowMs) base = 'held';
  return selected && base === 'available' ? 'selected' : base;
}

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
  if (!match) return <main><p role="alert">Match not found.</p></main>;

  const nowMs = Date.now();
  const sections = {};
  seats.forEach((s) => {
    const { row, number } = parseSeatId(s.id);
    (sections[s.sectionId] ??= { category: s.category, seats: [] }).seats.push({ ...s, row, number });
  });
  Object.values(sections).forEach((sec) => sec.seats.sort((a, b) => a.row - b.row || a.number - b.number));

  const total = [...selected].reduce((sum, id) => sum + (prices[seats.find((s) => s.id === id)?.category] ?? 0), 0);

  function toggle(seat) {
    setMessage('');
    const next = new Set(selected);
    if (next.has(seat.id)) next.delete(seat.id);
    else if (next.size >= MAX_SEATS) { setMessage(`You can select up to ${MAX_SEATS} seats.`); return; }
    else next.add(seat.id);
    setSelected(next);
  }

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
      <h1>{match.homeTeam} vs {match.awayTeam}</h1>
      <p>{match.kickoff.toDate().toLocaleString()}</p>
      <p>Legend: ○ available, ✓ selected, ◐ held by someone, × sold</p>
      {Object.entries(sections).map(([id, sec]) => (
        <section key={id}>
          <h2>{id.toUpperCase()} ({sec.category}, {formatMoney(prices[sec.category])})</h2>
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
        <span>{selected.size} seat(s) · {formatMoney(total)}</span>
        {message && <span role="alert"> {message}</span>}
        <button type="button" disabled={!selected.size || busy} onClick={handleHold}>
          {busy ? 'Holding…' : 'Hold seats & continue'}
        </button>
      </footer>
    </main>
  );
}
