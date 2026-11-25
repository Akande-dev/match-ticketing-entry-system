// Manager list of events with Edit, Publish and Cancel actions.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, orderBy, query } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { cancelMatch, publishMatch } from '../../services/api';
import { useLiveQuery } from '../../hooks/useLiveQuery';
import { sportEmoji, sportLabel } from '../../utils/sports';

export default function MatchAdminPage() {
  const { docs: matches, loading, error } = useLiveQuery(() => query(collection(db, 'matches'), orderBy('kickoff', 'desc')), []);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');

  // Runs a server action on one event, optionally asking the manager to confirm first.
  async function run(action, matchId, confirmText) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusyId(matchId);
    setMessage('');
    try { await action({ matchId }); }
    catch (err) { setMessage(err.message || 'Action failed.'); }
    finally { setBusyId(''); }
  }

  if (loading) return <p>Loading…</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <section>
      <p><Link to="/manager/matches/new">+ New match</Link></p>
      {message && <p role="alert">{message}</p>}
      <table>
        <thead><tr><th>Sport</th><th>Match</th><th>Starts</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {matches.map((m) => (
            <tr key={m.id}>
              <td>{sportEmoji(m.sport)} {sportLabel(m.sport)}</td>
              <td>{m.homeTeam} vs {m.awayTeam}</td>
              <td>{m.kickoff.toDate().toLocaleString()}</td>
              <td>{m.status}</td>
              <td>
                {m.status === 'Draft' && <Link to={`/manager/matches/${m.id}/edit`}>Edit</Link>}{' '}
                {m.status === 'Draft' && (
                  <button type="button" disabled={busyId === m.id} onClick={() => run(publishMatch, m.id)}>Publish</button>
                )}{' '}
                {['Draft', 'OnSale'].includes(m.status) && (
                  <button type="button" disabled={busyId === m.id}
                    onClick={() => run(cancelMatch, m.id, 'Cancel this match? Ticket holders will be able to request refunds.')}>
                    Cancel match
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
