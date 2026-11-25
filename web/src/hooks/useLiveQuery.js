// Hook that keeps a Firestore query live: the component re-renders whenever the data changes.

import { useEffect, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';

/** `makeQuery` returns a Firestore query, or a falsy value to stay idle. */
export function useLiveQuery(makeQuery, deps) {
  const [state, setState] = useState({ docs: [], loading: true, error: '' });
  useEffect(() => {
    const q = makeQuery();
    if (!q) return undefined;
    return onSnapshot(
      q,
      (snap) => setState({ docs: snap.docs.map((d) => ({ id: d.id, ...d.data() })), loading: false, error: '' }),
      () => setState({ docs: [], loading: false, error: 'Could not load data.' }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}
