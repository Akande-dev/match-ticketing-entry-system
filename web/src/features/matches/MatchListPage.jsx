import { useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useLiveQuery } from '../../hooks/useLiveQuery';
import { formatMoney } from '../../utils/money';
import { GROUPS, SPORT_IDS, sportEmoji, sportLabel, sportOf, sportsInGroup } from '../../utils/sports';

export default function MatchListPage() {
  const { docs, loading, error } = useLiveQuery(
    () => query(collection(db, 'matches'), where('status', '==', 'OnSale'), orderBy('kickoff')), [],
  );
  const [filter, setFilter] = useState('all');

  if (loading) return <main><p>Loading matches…</p></main>;
  if (error) return <main><p role="alert">{error}</p></main>;

  const matches = docs.map((m) => ({ ...m, sport: sportOf(m) }));
  const count = (id) => matches.filter((m) => m.sport === id).length;
  const shown = filter === 'all' ? SPORT_IDS.filter((id) => count(id) > 0) : [filter];

  return (
    <main>
      <h1>Upcoming events</h1>

      <div className="chips">
        <button type="button" className="chip" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
          All sports ({matches.length})
        </button>
      </div>
      {GROUPS.map((group) => (
        <div key={group}>
          <p className="group-label">{group}</p>
          <div className="chips">
            {sportsInGroup(group).map((id) => (
              <button key={id} type="button" className="chip" aria-pressed={filter === id}
                disabled={count(id) === 0} onClick={() => setFilter(id)}>
                {sportEmoji(id)} {sportLabel(id)} ({count(id)})
              </button>
            ))}
          </div>
        </div>
      ))}

      {!matches.length && <p>No events on sale right now.</p>}
      {shown.map((id) => {
        const list = matches.filter((m) => m.sport === id);
        return (
          <section key={id}>
            <h2>{sportEmoji(id)} {sportLabel(id)}</h2>
            {!list.length && <p>No {sportLabel(id).toLowerCase()} events on sale yet.</p>}
            <ul className="cards">
              {list.map((m) => (
                <li key={m.id} className="card">
                  <span className="sport-badge">{sportEmoji(id)} {sportLabel(id)}</span>
                  <h3>{m.homeTeam} vs {m.awayTeam}</h3>
                  <p>{m.kickoff.toDate().toLocaleString()}</p>
                  <p>From {formatMoney(m.minPrice)}</p>
                  <Link to={`/matches/${m.id}`}>Buy tickets</Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
