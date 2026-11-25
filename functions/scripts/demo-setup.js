// Builds the demo: seed data, three demo accounts (admin, steward, fan), and two tickets already bought
// for the demo fan. Runs against the local emulators only.
process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Reads KEY=value lines from functions/.env (the ticket signing secret lives there, not in the code).
function readEnv() {
  const out = {};
  const file = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(file)) return out;
  fs.readFileSync(file, 'utf8').split('\n').forEach((line) => {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m) out[m[1]] = m[2];
  });
  return out;
}

// Demo data for the local emulators only. Never use this password on a real system.
const PASSWORD = 'Demo1234!';
const USERS = [
  { email: 'admin@demo.com', name: 'Demo Admin', role: 'admin' },
  { email: 'steward@demo.com', name: 'Demo Steward', role: 'steward' },
  { email: 'fan@demo.com', name: 'Demo Fan', role: 'fan' },
];

(async () => {
  console.error('1/3 Loading stadium and matches...');
  execFileSync(process.execPath, [path.join(__dirname, 'seed.js')], { stdio: 'inherit' });

  initializeApp({ projectId: 'demo-mtses' });
  const auth = getAuth();
  const db = getFirestore();

  // Creates each account if it does not exist, then sets its role (a custom claim in the login token)
  // and a matching profile document.
  console.error('2/3 Creating demo accounts...');
  const uids = {};
  for (const u of USERS) {
    let rec;
    try { rec = await auth.getUserByEmail(u.email); }
    catch { rec = await auth.createUser({ email: u.email, password: PASSWORD, displayName: u.name, emailVerified: true }); }
    await auth.setCustomUserClaims(rec.uid, { role: u.role });
    await db.collection('users').doc(rec.uid).set(
      { name: u.name, email: u.email, role: u.role, active: true, createdAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    uids[u.email] = rec.uid;
  }

  // Uses the same hold and payment code as the real app, so the demo tickets are genuine signed tickets.
  // A failure here is reported but does not stop the demo.
  console.error('3/3 Buying two tickets for fan@demo.com...');
  try {
    const { holdSeatsCore } = require('../src/reservations/reservationService');
    const { confirmPaymentCore } = require('../src/payments/paymentService');
    const { TicketSigner } = require('../src/tickets/TicketSigner');
    const secret = readEnv().TICKET_HMAC_SECRET;
    const signer = new TicketSigner(secret);
    const { orderId, totalMinor } = await holdSeatsCore(db, {
      uid: uids['fan@demo.com'], matchId: 'match-001', seatIds: ['north-R1-S1', 'north-R1-S2'],
    });
    await confirmPaymentCore(db, signer, { orderId, providerRef: `demo-${orderId}`, amountMinor: totalMinor });
  } catch (err) {
    console.error('Could not pre-buy tickets (continuing):', err.message);
  }
  console.error('Demo data ready.');
})().catch((err) => { console.error('Demo setup failed:', err); process.exit(1); });
