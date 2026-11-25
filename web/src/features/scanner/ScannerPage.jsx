// Gate scanner for stewards: scans a QR code with the camera (or pasted text) and shows the result.
// The decision is made on the server; this page only displays it.
// In demo mode (emulator) it also offers sample scans that run through the same server validator.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { collection, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { validateTicket, demoScan } from '../../services/api';
import { useLiveQuery } from '../../hooks/useLiveQuery';
import { sportEmoji } from '../../utils/sports';
import TicketLookup from '../common/TicketLookup';

// Text shown for each server result.
const MESSAGES = {
  Valid: 'VALID: let them in', AlreadyUsed: 'ALREADY USED', Invalid: 'INVALID TICKET',
  WrongMatch: 'WRONG MATCH', Cancelled: 'CANCELLED OR TRANSFERRED TICKET',
};
// Colour band of each result: ok (green), warn (amber), bad (red).
const TONE = { Valid: 'ok', WrongMatch: 'warn', AlreadyUsed: 'bad', Invalid: 'bad', Cancelled: 'bad', Error: 'bad' };

// Sample scans (demo mode only). Each runs the real validator on the server.
const SAMPLES = [
  { kind: 'valid', label: 'Simulate valid scan', cls: 'sim-green' },
  { kind: 'passback', label: 'Test already used', cls: 'sim-red' },
  { kind: 'wrongMatch', label: 'Test wrong match', cls: 'sim-amber' },
  { kind: 'invalid', label: 'Test tampered QR', cls: 'sim-purple' },
  { kind: 'cancelled', label: 'Test cancelled ticket', cls: 'sim-blue' },
];

export default function ScannerPage() {
  const { docs: matches } = useLiveQuery(() => query(collection(db, 'matches'), where('status', '==', 'OnSale')), []);
  const [matchId, setMatchId] = useState('');
  const [gate, setGate] = useState('A');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [manual, setManual] = useState('');
  const [counts, setCounts] = useState({ total: 0, valid: 0, rejected: 0 });
  const last = useRef({ payload: '', at: 0 });

  // Shows a result and adds it to this session's counters (real scans only, reset on reload).
  const record = useCallback((res) => {
    setResult(res);
    setCounts((c) => ({
      total: c.total + 1,
      valid: c.valid + (res.result === 'Valid' ? 1 : 0),
      rejected: c.rejected + (res.result === 'Valid' ? 0 : 1),
    }));
  }, []);

  // Sends one QR value to the server. The same code seen again within 3 seconds is ignored,
  // because the camera reads the same code many times a second.
  const check = useCallback(async (payload) => {
    const now = Date.now();
    if (payload === last.current.payload && now - last.current.at < 3000) return;
    last.current = { payload, at: now };
    try { record(await validateTicket({ payload, matchId, gate })); }
    catch (err) { record({ result: 'Error', message: err.message }); }
  }, [matchId, gate, record]);

  // Runs a sample scan on the server (demo mode only).
  async function sample(kind) {
    try { record(await demoScan({ kind, matchId, gate })); }
    catch (err) { record({ result: 'Error', message: err.message }); }
  }

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
  const tone = TONE[result?.result] ?? 'bad';
  const demo = import.meta.env.VITE_USE_EMULATORS === 'true';

  return (
    <main>
      <div className="scn">
        <header className="scn-head">
          <div>
            <h1>Gate scanner</h1>
            <p>Server-side verification: signed QR, one-time use, wrong-match and cancelled-ticket checks.</p>
          </div>
          <div className="scn-controls">
            <label htmlFor="match">Match</label>
            <select id="match" value={matchId} onChange={(e) => setMatchId(e.target.value)}>
              <option value="">Select a match...</option>
              {matches.map((m) => <option key={m.id} value={m.id}>{sportEmoji(m.sport)} {m.homeTeam} vs {m.awayTeam}</option>)}
            </select>
            <label htmlFor="gate">Gate</label>
            <input id="gate" value={gate} maxLength={20} onChange={(e) => setGate(e.target.value)} />
          </div>
        </header>

        <div className="scn-grid">
          <section className="scn-panel">
            <div className={'scn-reticle' + (scanning ? ' on' : '')}>
              <div id="qr-reader" />
              {!scanning && <p>ALIGN QR CODE WITHIN THE FRAME<small>Press Start camera, or use manual entry</small></p>}
            </div>
            <button type="button" className="scn-btn" disabled={!ready} onClick={() => setScanning((s) => !s)}>
              {scanning ? 'Stop camera' : 'Start camera'}
            </button>
            {cameraError && <p role="alert">{cameraError}</p>}
            {demo && (
              <div className="scn-samples">
                <p className="scn-note">Demo sample scans (real validator; a valid sample uses up a ticket)</p>
                <div className="scn-sample-row">
                  {SAMPLES.map((s) => (
                    <button key={s.kind} type="button" className={'scn-btn ' + s.cls} disabled={!ready} onClick={() => sample(s.kind)}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <aside className="scn-panel">
            <h2>This session</h2>
            <div className="scn-stats">
              <div><small>SCANS</small><b>{counts.total}</b></div>
              <div><small>ADMITTED</small><b className="g">{counts.valid}</b></div>
              <div><small>REFUSED</small><b className="r">{counts.rejected}</b></div>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if (ready && manual.trim()) check(manual.trim()); }}>
              <label htmlFor="manual">Manual entry (paste QR text)</label>
              <input id="manual" value={manual} onChange={(e) => setManual(e.target.value)} />
              <button type="submit" className="scn-btn" disabled={!ready}>Check</button>
            </form>
          </aside>
        </div>

        {result && (
          <section role="status" className={'scn-result ' + tone}>
            <strong>{result.result === 'Error' ? `ERROR: ${result.message}` : MESSAGES[result.result]}</strong>
            {result.result === 'Valid' && <p>{result.seatLabel}</p>}
            {result.sampleTicketNumber && <p>Sample ticket: {result.sampleTicketNumber}</p>}
            {result.result === 'AlreadyUsed' && result.firstUsedAt && (
              <p>First scanned {new Date(result.firstUsedAt).toLocaleTimeString()} at gate {result.firstGate}</p>
            )}
          </section>
        )}
      </div>
      <TicketLookup />
    </main>
  );
}
