import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useLiveQuery } from '../../hooks/useLiveQuery';
import { formatMoney } from '../../utils/money';
import { SPORT_IDS, sportEmoji, sportLabel, sportOf } from '../../utils/sports';

const entries = (o) => Object.entries(o ?? {}).sort(([a], [b]) => a.localeCompare(b));

export default function SalesDashboardPage() {
  const { docs: matches } = useLiveQuery(() => query(collection(db, 'matches'), orderBy('kickoff', 'desc')), []);
  const { docs: allStats } = useLiveQuery(() => collection(db, 'stats'), []);
  const [matchId, setMatchId] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!matchId) { setStats(null); return undefined; }
    return onSnapshot(doc(db, 'stats', matchId), (s) => setStats(s.exists() ? s.data() : {}));
  }, [matchId]);

  const statsById = new Map(allStats.map((s) => [s.id, s]));
  const bySport = new Map();
  matches.forEach((m) => {
    const id = sportOf(m);
    const s = statsById.get(m.id) ?? {};
    const row = bySport.get(id) ?? { events: 0, sold: 0, revenue: 0, entered: 0 };
    row.events += 1;
    row.sold += s.soldCount ?? 0;
    row.revenue += s.revenueMinor ?? 0;
    row.entered += s.attendance ?? 0;
    bySport.set(id, row);
  });
  const rows = SPORT_IDS.filter((id) => bySport.has(id));
  const total = rows.reduce((t, id) => {
    const r = bySport.get(id);
    return { events: t.events + r.events, sold: t.sold + r.sold, revenue: t.revenue + r.revenue, entered: t.entered + r.entered };
  }, { events: 0, sold: 0, revenue: 0, entered: 0 });

  return (
    <section>
      <h2>Sales by sport</h2>
      <table>
        <thead><tr><th>Sport</th><th>Events</th><th>Tickets sold</th><th>Revenue</th><th>Entered</th></tr></thead>
        <tbody>
          {rows.map((id) => {
            const r = bySport.get(id);
            return (
              <tr key={id}>
                <td>{sportEmoji(id)} {sportLabel(id)}</td><td>{r.events}</td><td>{r.sold}</td>
                <td>{formatMoney(r.revenue)}</td><td>{r.entered}</td>
              </tr>
            );
          })}
          <tr><th>All sports</th><th>{total.events}</th><th>{total.sold}</th><th>{formatMoney(total.revenue)}</th><th>{total.entered}</th></tr>
        </tbody>
      </table>

      <h2>One event</h2>
      <label htmlFor="match">Event</label>
      <select id="match" value={matchId} onChange={(e) => setMatchId(e.target.value)}>
        <option value="">Select an event…</option>
        {matches.map((m) => (
          <option key={m.id} value={m.id}>{sportEmoji(m.sport)} {m.homeTeam} vs {m.awayTeam} ({m.status})</option>
        ))}
      </select>
      {stats && (
        <>
          <ul className="cards">
            <li className="card"><h3>Tickets sold</h3><p>{stats.soldCount ?? 0}</p></li>
            <li className="card"><h3>Revenue</h3><p>{formatMoney(stats.revenueMinor ?? 0)}</p></li>
            <li className="card"><h3>Refunded</h3><p>{stats.refundedCount ?? 0}</p></li>
            <li className="card"><h3>Entered</h3><p>{stats.attendance ?? 0}</p></li>
          </ul>
          <h3>Sold by seat type</h3>
          <ul>{entries(stats.soldByCategory).map(([c, n]) => <li key={c}>{c}: {n}</li>)}</ul>
          <h3>Entries by gate</h3>
          <ul>{entries(stats.attendanceByGate).map(([g, n]) => <li key={g}>Gate {g}: {n}</li>)}</ul>
        </>
      )}
    </section>
  );
}
