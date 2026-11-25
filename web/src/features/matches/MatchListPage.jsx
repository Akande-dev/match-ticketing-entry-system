// Home page for logged-in users: hero banner, next event, sport tiles, event cards and the 'why buy' section.

import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useLiveQuery } from '../../hooks/useLiveQuery';
import { formatMoney } from '../../utils/money';
import { ICON } from '../../utils/icons';
import { SPORTS, SPORT_IDS, sportEmoji, sportLabel, sportOf } from '../../utils/sports';

// Date and time formatting for event cards.
const dateText = (d) => d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const timeText = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// Short selling points shown in the hero.
const PERKS = [
  { icon: ICON.phone, title: 'Instant QR ticket', text: 'On your phone' },
  { icon: ICON.lock, title: 'Secure checkout', text: 'Safe payments' },
  { icon: ICON.check, title: 'One-time entry', text: 'No fake tickets' },
];
// Longer list shown near the bottom of the page.
const WHY = [
  { icon: ICON.shield, title: 'Signed QR tickets', text: 'Every ticket is digitally signed' },
  { icon: ICON.check, title: 'No double sales', text: 'A seat can only be sold once' },
  { icon: ICON.swap, title: 'Transfer to a friend', text: 'Pass a ticket to another fan' },
  { icon: ICON.refresh, title: 'Easy refunds', text: 'Ask for a refund up to 48 hours before' },
];

export default function MatchListPage() {
  const { docs, loading, error } = useLiveQuery(
    () => query(collection(db, 'matches'), where('status', '==', 'OnSale'), orderBy('kickoff')), [],
  );
  const [filter, setFilter] = useState('all');
  const eventsRef = useRef(null);

  if (loading) return <main className="home"><div className="wrap"><p>Loading events…</p></div></main>;
  if (error) return <main className="home"><div className="wrap"><p role="alert">{error}</p></div></main>;

  // Events come live from Firestore (only those On sale); 'filter' narrows them by sport.
  const matches = docs.map((m) => ({ ...m, sport: sportOf(m) }));
  const next = matches[0];
  const count = (id) => matches.filter((m) => m.sport === id).length;
  const shown = filter === 'all' ? matches : matches.filter((m) => m.sport === filter);

  // Clicking a sport tile filters the list and scrolls down to it.
  function pick(id) {
    setFilter(id);
    eventsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <main className="home">
      <header className="hero">
        <div className="wrap hero-inner">
          <p className="kicker">FEEL THE PASSION.</p>
          <h1>Live the game.<br /><span>Be there!</span></h1>
          <p className="hero-sub">Football, basketball, volleyball, table tennis and boxing. Pick your seat, get a QR ticket, walk straight in.</p>
          <ul className="perks">
            {PERKS.map((p) => (
              <li key={p.title}><span className="perk-icon">{p.icon}</span><span><b>{p.title}</b><small>{p.text}</small></span></li>
            ))}
          </ul>
          <div className="hero-art" aria-hidden="true">
            {SPORT_IDS.map((id) => <span key={id}>{sportEmoji(id)}</span>)}
          </div>
        </div>
      </header>

      {next && (
        <section className="wrap featured">
          <div className="featured-card">
            <p className="featured-label">{sportEmoji(next.sport)} NEXT EVENT · {sportLabel(next.sport).toUpperCase()}</p>
            <div className="vs-row">
              <div className="side"><b>{next.homeTeam}</b></div>
              <span className="vs"><span>VS</span></span>
              <div className="side"><b>{next.awayTeam}</b></div>
            </div>
            <p className="meta-row">
              <span>{ICON.calendar} {dateText(next.kickoff.toDate())}</span>
              <span>{ICON.clock} {timeText(next.kickoff.toDate())}</span>
              {next.venueName && <span>{ICON.pin} {next.venueName}</span>}
            </p>
            <Link className="btn btn-red" to={`/matches/${next.id}`}>BOOK YOUR TICKETS NOW {ICON.arrow}</Link>
          </div>
        </section>
      )}

      <section className="wrap block">
        <h2 className="section-title"><span>BROWSE</span> BY SPORT</h2>
        <div className="tiles">
          {SPORT_IDS.map((id) => (
            <button key={id} type="button" className={`tile sport-${id}`} disabled={count(id) === 0} onClick={() => pick(id)}>
              <span className="tile-emoji">{sportEmoji(id)}</span>
              <b>{sportLabel(id)}</b>
              <small>{SPORTS[id].group}</small>
              <em>{count(id)} {count(id) === 1 ? 'event' : 'events'}</em>
            </button>
          ))}
        </div>
      </section>

      <section className="wrap block" ref={eventsRef}>
        <div className="section-head">
          <h2 className="section-title"><span>UPCOMING</span> EVENTS</h2>
          <div className="chips">
            <button type="button" className="chip" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All ({matches.length})</button>
            {SPORT_IDS.map((id) => (
              <button key={id} type="button" className="chip" aria-pressed={filter === id} disabled={count(id) === 0} onClick={() => setFilter(id)}>
                {sportEmoji(id)} {sportLabel(id)}
              </button>
            ))}
          </div>
        </div>
        {!shown.length && <p>No events on sale for this sport yet.</p>}
        <ul className="event-grid">
          {shown.map((m) => {
            const d = m.kickoff.toDate();
            return (
              <li key={m.id} className={`event sport-${m.sport}`}>
                <div className="event-top">
                  {m.id === next?.id && <span className="ribbon">NEXT UP</span>}
                  <span className="event-emoji">{sportEmoji(m.sport)}</span>
                  <span className="event-sides">{m.homeTeam}<em>vs</em>{m.awayTeam}</span>
                </div>
                <div className="event-body">
                  <span className="sport-badge">{sportEmoji(m.sport)} {sportLabel(m.sport)}</span>
                  <p className="meta">{ICON.calendar} {dateText(d)} · {timeText(d)}</p>
                  {m.venueName && <p className="meta">{ICON.pin} {m.venueName}</p>}
                  <div className="event-foot">
                    <div><small>FROM</small><strong className="price">{formatMoney(m.minPrice)}</strong></div>
                    <Link className="btn btn-navy" to={`/matches/${m.id}`}>VIEW SEATS</Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="wrap block">
        <div className="why">
          <h2>WHY BUY <span>HERE?</span></h2>
          <div className="why-grid">
            {WHY.map((w) => (
              <div key={w.title} className="why-item"><span className="perk-icon">{w.icon}</span><b>{w.title}</b><small>{w.text}</small></div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
