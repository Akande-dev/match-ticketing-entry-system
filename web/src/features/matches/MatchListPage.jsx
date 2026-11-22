import { Link } from 'react-router-dom';
import { collection, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useLiveQuery } from '../../hooks/useLiveQuery';
import { formatMoney } from '../../utils/money';

export default function MatchListPage() {
  const { docs: matches, loading, error } = useLiveQuery(
    () => query(collection(db, 'matches'), where('status', '==', 'OnSale'), orderBy('kickoff')), [],
  );
  if (loading) return <main><p>Loading matches…</p></main>;
  if (error) return <main><p role="alert">{error}</p></main>;
  if (!matches.length) return <main><p>No matches on sale right now.</p></main>;

  return (
    <main>
      <h1>Upcoming matches</h1>
      <ul className="cards">
        {matches.map((m) => (
          <li key={m.id} className="card">
            <h2>{m.homeTeam} vs {m.awayTeam}</h2>
            <p>{m.kickoff.toDate().toLocaleString()}</p>
            <p>From {formatMoney(m.minPrice)}</p>
            <Link to={`/matches/${m.id}`}>Buy tickets</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
