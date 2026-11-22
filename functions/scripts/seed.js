// Usage: npm run seed                     (emulator, default)
//        node functions/scripts/seed.js --remote   (real project; needs credentials)
const remote = process.argv.includes('--remote');
if (!remote) process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';

const { initializeApp } = require('firebase-admin/app');
initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'demo-mtses' });
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const db = getFirestore();

const STADIUM_ID = 'stadium-main';
const SECTIONS = [
  { id: 'vip', name: 'VIP Stand', category: 'VIP', rows: 2, perRow: 5, price: 1500000 },
  { id: 'east', name: 'East Covered', category: 'Covered', rows: 4, perRow: 10, price: 500000 },
  { id: 'north', name: 'North Terrace', category: 'Regular', rows: 5, perRow: 10, price: 200000 },
];
const MATCHES = [
  { id: 'match-001', homeTeam: 'Home FC', awayTeam: 'Away United', days: 7 },
  { id: 'match-002', homeTeam: 'City SC', awayTeam: 'Rovers', days: 14 },
];

async function commitInChunks(ops) {
  for (let i = 0; i < ops.length; i += 450) {
    const batch = db.batch();
    ops.slice(i, i + 450).forEach((op) => op(batch));
    await batch.commit();
  }
}

(async () => {
  const ops = [];
  const stadiumRef = db.collection('stadiums').doc(STADIUM_ID);
  let capacity = 0;

  for (const s of SECTIONS) {
    const secRef = stadiumRef.collection('sections').doc(s.id);
    capacity += s.rows * s.perRow;
    ops.push((b) => b.set(secRef, { name: s.name, category: s.category, seatCount: s.rows * s.perRow }));
    for (let r = 1; r <= s.rows; r += 1) {
      for (let n = 1; n <= s.perRow; n += 1) {
        ops.push((b) => b.set(secRef.collection('seats').doc(`${s.id}-R${r}-S${n}`), { row: String(r), number: n }));
      }
    }
  }
  ops.push((b) => b.set(stadiumRef, { name: 'National Stadium', city: 'Demo City', capacity }));

  for (const m of MATCHES) {
    const matchRef = db.collection('matches').doc(m.id);
    ops.push((b) => b.set(matchRef, {
      stadiumId: STADIUM_ID, homeTeam: m.homeTeam, awayTeam: m.awayTeam,
      kickoff: Timestamp.fromMillis(Date.now() + m.days * 86400000),
      status: 'OnSale', minPrice: Math.min(...SECTIONS.map((s) => s.price)),
    }));
    ops.push((b) => b.set(db.collection('stats').doc(m.id), { soldCount: 0, revenueMinor: 0, refundedCount: 0, attendance: 0 }));
    for (const s of SECTIONS) {
      ops.push((b) => b.set(matchRef.collection('prices').doc(s.category), { amountMinor: s.price, currency: 'NGN' }));
      for (let r = 1; r <= s.rows; r += 1) {
        for (let n = 1; n <= s.perRow; n += 1) {
          ops.push((b) => b.set(matchRef.collection('inventory').doc(`${s.id}-R${r}-S${n}`), {
            sectionId: s.id, category: s.category, label: `${s.name} Row ${r} Seat ${n}`,
            status: 'Available', heldByOrderId: null, holdExpiresAt: null,
          }));
        }
      }
    }
  }

  await commitInChunks(ops);
  console.error(`Seeded stadium (${capacity} seats) and ${MATCHES.length} matches.`);
})();
