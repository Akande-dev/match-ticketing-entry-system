import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { listUsers, setUserRole, setUserDisabled } from '../../services/api';

const ROLE_LIST = ['fan', 'steward', 'manager', 'admin'];

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await listUsers({});
      setUsers(res.users);
      setError('');
    } catch (e) {
      setError(e.message || 'Could not load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function run(uid, fn) {
    setBusy(uid);
    setError('');
    try { await fn(); await load(); } catch (e) { setError(e.message || 'Action failed.'); }
    setBusy('');
  }

  if (loading) return <p>Loading users...</p>;

  return (
    <section>
      <h2>Users</h2>
      <p>Role changes and disabling are checked and logged by the server. Your own row is read-only. Users must log in again for a new role to apply.</p>
      {error && <p role="alert">{error}</p>}
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          {users.map((u) => {
            const self = u.uid === user?.uid;
            return (
              <tr key={u.uid}>
                <td>{u.name || '-'}</td>
                <td>{u.email}</td>
                <td>
                  <select
                    aria-label={'Role for ' + u.email}
                    value={u.role}
                    disabled={self || busy === u.uid}
                    onChange={(e) => run(u.uid, () => setUserRole({ uid: u.uid, role: e.target.value }))}
                  >
                    {ROLE_LIST.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td>{u.disabled ? 'Disabled' : 'Active'}</td>
                <td>
                  <button
                    type="button"
                    className="btn"
                    disabled={self || busy === u.uid}
                    onClick={() => run(u.uid, () => setUserDisabled({ uid: u.uid, disabled: !u.disabled }))}
                  >
                    {u.disabled ? 'Enable' : 'Disable'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
