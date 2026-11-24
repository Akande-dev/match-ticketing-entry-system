import { useEffect, useState } from 'react';
import { listUsers } from '../../services/api';

export default function AdminOverviewPage() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listUsers({}).then((r) => setUsers(r.users)).catch((e) => setError(e.message || 'Could not load.'));
  }, []);

  if (error) return <p role="alert">{error}</p>;
  if (!users) return <p>Loading...</p>;

  const count = (role) => users.filter((u) => u.role === role).length;
  return (
    <section>
      <h2>Overview</h2>
      <ul>
        <li>Total accounts: {users.length}</li>
        <li>Fans: {count('fan')}</li>
        <li>Stewards: {count('steward')}</li>
        <li>Managers: {count('manager')}</li>
        <li>Admins: {count('admin')}</li>
        <li>Disabled accounts: {users.filter((u) => u.disabled).length}</li>
      </ul>
    </section>
  );
}
