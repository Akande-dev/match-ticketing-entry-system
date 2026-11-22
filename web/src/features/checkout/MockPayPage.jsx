import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { simulateMockPayment } from '../../services/api';

export default function MockPayPage() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(outcome) {
    setBusy(true);
    setError('');
    try {
      await simulateMockPayment({ orderId, outcome });
      navigate(outcome === 'success' ? '/my-tickets' : '/', { replace: true });
    } catch (err) {
      setError(err.message || 'Mock payment failed.');
      setBusy(false);
    }
  }

  return (
    <main>
      <h1>Mock payment gateway</h1>
      <p>Development only. No real money moves.</p>
      {error && <p role="alert">{error}</p>}
      <button type="button" disabled={busy} onClick={() => run('success')}>Simulate successful payment</button>{' '}
      <button type="button" disabled={busy} onClick={() => run('failure')}>Simulate failed payment</button>
    </main>
  );
}
