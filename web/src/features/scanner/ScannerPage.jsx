// Gate scanner for stewards: scans a QR code with the camera (or pasted text) and shows the result.
// The decision is made on the server; this page only displays it.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { collection, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { validateTicket } from '../../services/api';
import { useLiveQuery } from '../../hooks/useLiveQuery';
import { sportEmoji } from '../../utils/sports';

// Text shown for each server result.
const MESSAGES = {
  Valid: 'VALID: let them in', AlreadyUsed: 'ALREADY USED', Invalid: 'INVALID TICKET',
  WrongMatch: 'WRONG MATCH', Cancelled: 'CANCELLED OR TRANSFERRED TICKET',
};

export default function ScannerPage() {
  const { docs: matches } = useLiveQuery(() => query(collection(db, 'matches'), where('status', '==', 'OnSale')), []);
  const [matchId, setMatchId] = useState('');
  const [gate, setGate] = useState('A');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [manual, setManual] = useState('');
  const last = useRef({ payload: '', at: 0 });

  // Sends one QR value to the server. The same code seen again within 3 seconds is ignored,
  // because the camera reads the same code many times a second.
  const check = useCallback(async (payload) => {
    const now = Date.now();
    if (payload === last.current.payload && now - last.current.at < 3000) return;
    last.current = { payload, at: now };
    try { setResult(await validateTicket({ payload, matchId, gate })); }
    catch (err) { setResult({ result: 'Error', message: err.message }); }
  }, [matchId, gate]);

  // Keeps the newest check function available to the camera callback without restarting the camera.
  const checkRef = useRef(check);
  useEffect(() => { checkRef.current = check; }, [check]);

  // Starts the rear camera while scanning is on, and stops it when it is turned off.
  useEffect(() => {
    if (!scanning) return undefined;
    const scanner = new Html5Qrcode('qr-reader');
    scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: 250 }, (t) => checkRef.current(t), () => {})
      .catch(() => { setCameraError('Camera unavailable. Use manual entry below.'); setScanning(false); });
    return () => { scanner.stop().then(() => scanner.clear()).catch(() => {}); };
  }, [scanning]);

  const ready = matchId && gate.trim();
  const ok = result?.result === 'Valid';

  return (
    <main>
      <h1>Gate scanner</h1>
      <label htmlFor="match">Match</label>
      <select id="match" value={matchId} onChange={(e) => setMatchId(e.target.value)}>
        <option value="">Select a match…</option>
        {matches.map((m) => <option key={m.id} value={m.id}>{sportEmoji(m.sport)} {m.homeTeam} vs {m.awayTeam}</option>)}
      </select>
      <label htmlFor="gate">Gate</label>
      <input id="gate" value={gate} maxLength={20} onChange={(e) => setGate(e.target.value)} />
      <button type="button" disabled={!ready} onClick={() => setScanning((s) => !s)}>
        {scanning ? 'Stop camera' : 'Start camera'}
      </button>
      {cameraError && <p role="alert">{cameraError}</p>}
      <div id="qr-reader" style={{ width: 300 }} />
      <form onSubmit={(e) => { e.preventDefault(); if (ready && manual.trim()) check(manual.trim()); }}>
        <label htmlFor="manual">Manual entry (paste QR text)</label>
        <input id="manual" value={manual} onChange={(e) => setManual(e.target.value)} />
        <button type="submit" disabled={!ready}>Check</button>
      </form>
      {result && (
        <section role="status" className={`scan-result ${ok ? 'scan-ok' : 'scan-bad'}`}>
          <strong>{result.result === 'Error' ? `ERROR: ${result.message}` : MESSAGES[result.result]}</strong>
          {ok && <p>{result.seatLabel}</p>}
          {result.result === 'AlreadyUsed' && result.firstUsedAt && (
            <p>First scanned {new Date(result.firstUsedAt).toLocaleTimeString()} at gate {result.firstGate}</p>
          )}
        </section>
      )}
    </main>
  );
}
