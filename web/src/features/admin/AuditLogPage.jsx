// Admin audit log: who did what and when (role changes, refunds, transfers, payments).

import { collection, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useLiveQuery } from '../../hooks/useLiveQuery';

export default function AuditLogPage() {
  // Live list of the 100 newest audit entries; it updates by itself when new entries arrive.
  const { docs: logs, loading, error } = useLiveQuery(
    () => query(collection(db, 'auditLogs'), orderBy('at', 'desc'), limit(100)), []);
  if (loading) return <main><p>Loading…</p></main>;
  if (error) return <main><p role="alert">{error}</p></main>;
  return (
    <main>
      <h1>Audit log (latest 100)</h1>
      <table>
        <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Target</th><th>Details</th></tr></thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id}>
              <td>{l.at?.toDate().toLocaleString() ?? ''}</td>
              <td>{l.actorId}</td><td>{l.action}</td><td>{l.target}</td><td>{JSON.stringify(l.meta ?? {})}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
