import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useLiveQuery } from '../../hooks/useLiveQuery';
import { formatMoney } from '../../utils/money';

const entries = (o) => Object.entries(o ?? {}).sort(([a], [b]) => a.localeCompare(b));

export default function SalesDashboardPage() {
  const { docs: matches } = useLiveQuery(() => query(collection(db, 'matches'), orderBy('kickoff', 'desc')), []);
  const [matchId, setMatchId] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!matchId) { setStats(null); return undefined; }
    return onSnapshot(doc(db, 'stats', matchId), (s) => setStats(s.exists() ? s.data() : {}));
  }, [matchId]);

  return (
    <section>
      <label htmlFor="match">Match</label>
      <select id="match" value={matchId} onChange={(e) => setMatchId(e.target.value)}>
        <option value="">Select a match…</option>
        {matches.map((m) => <option key={m.id} value={m.id}>{m.homeTeam} vs {m.awayTeam} ({m.status})</option>)}
      </select>
      {stats && (
        <>
          <ul className="cards">
            <li className="card"><h3>Tickets sold</h3><p>{stats.soldCount ?? 0}</p></li>
            <li className="card"><h3>Revenue</h3><p>{formatMoney(stats.revenueMinor ?? 0)}</p></li>
            <li className="card"><h3>Refunded</h3><p>{stats.refundedCount ?? 0}</p></li>
            <li className="card"><h3>Entered</h3><p>{stats.attendance ?? 0}</p></li>
          </ul>
          <h3>Sold by category</h3>
          <ul>{entries(stats.soldByCategory).map(([c, n]) => <li key={c}>{c}: {n}</li>)}</ul>
          <h3>Entries by gate</h3>
          <ul>{entries(stats.attendanceByGate).map(([g, n]) => <li key={g}>Gate {g}: {n}</li>)}</ul>
        </>
      )}
    </section>
  );
}
