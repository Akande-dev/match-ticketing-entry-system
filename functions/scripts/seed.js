// Usage: npm run seed                      (emulator, default)
//        node functions/scripts/seed.js --remote   (real project; needs credentials)
const remote = process.argv.includes('--remote');
if (!remote) process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';

const { initializeApp } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'demo-mtses' });
const db = getFirestore();

// One venue per sport. Prices are in kobo (100 kobo = 1 naira). Seat categories are unique within a venue.
const VENUES = [
  { id: 'stadium-main', name: 'National Stadium', sport: 'football', sections: [
    { id: 'vip', name: 'VIP Stand', category: 'VIP', rows: 2, perRow: 5, price: 1500000 },
    { id: 'east', name: 'East Covered', category: 'Covered', rows: 4, perRow: 10, price: 500000 },
    { id: 'north', name: 'North Terrace', category: 'Regular', rows: 5, perRow: 10, price: 200000 },
  ] },
  { id: 'arena-basketball', name: 'City Arena', sport: 'basketball', sections: [
    { id: 'courtside', name: 'Courtside', category: 'Courtside', rows: 2, perRow: 8, price: 800000 },
    { id: 'lower', name: 'Lower Bowl', category: 'Lower', rows: 4, perRow: 12, price: 400000 },
    { id: 'upper', name: 'Upper Tier', category: 'Upper', rows: 4, perRow: 12, price: 150000 },
  ] },
  { id: 'hall-volleyball', name: 'Sports Hall', sport: 'volleyball', sections: [
    { id: 'front', name: 'Front Row', category: 'Premium', rows: 2, perRow: 8, price: 300000 },
    { id: 'stands', name: 'Stands', category: 'Standard', rows: 5, perRow: 12, price: 100000 },
  ] },
  { id: 'hall-tabletennis', name: 'Indoor Table Tennis Hall', sport: 'table-tennis', sections: [
    { id: 'front', name: 'Front Row', category: 'Premium', rows: 2, perRow: 8, price: 200000 },
    { id: 'general', name: 'General Seating', category: 'Standard', rows: 4, perRow: 10, price: 80000 },
  ] },
  { id: 'arena-boxing', name: 'Fight Night Arena', sport: 'boxing', sections: [
    { id: 'ringside', name: 'Ringside', category: 'Ringside', rows: 2, perRow: 8, price: 2500000 },
    { id: 'floor', name: 'Floor', category: 'Floor', rows: 3, perRow: 12, price: 1000000 },
    { id: 'balcony', name: 'Balcony', category: 'Balcony', rows: 4, perRow: 12, price: 300000 },
  ] },
];

// Fictional teams and athletes. days = days from now, hour = start time.
const MATCHES = [
  { id: 'match-001', venue: 'stadium-main', sport: 'football', home: 'Home FC', away: 'Away United', days: 7, hour: 16 },
  { id: 'match-002', venue: 'stadium-main', sport: 'football', home: 'City SC', away: 'Rovers', days: 14, hour: 18 },
  { id: 'match-101', venue: 'arena-basketball', sport: 'basketball', home: 'Lagos Lions', away: 'Abuja Eagles', days: 3, hour: 19 },
  { id: 'match-102', venue: 'arena-basketball', sport: 'basketball', home: 'Kano Kings', away: 'Ibadan Hawks', days: 10, hour: 18 },
  { id: 'match-201', venue: 'hall-volleyball', sport: 'volleyball', home: 'Delta Spikers', away: 'Coastal Smashers', days: 4, hour: 17 },
  { id: 'match-202', venue: 'hall-volleyball', sport: 'volleyball', home: 'Capital Blockers', away: 'Northern Aces', days: 11, hour: 15 },
  { id: 'match-301', venue: 'hall-tabletennis', sport: 'table-tennis', home: 'A. Bello', away: 'C. Okafor', days: 5, hour: 14 },
  { id: 'match-302', venue: 'hall-tabletennis', sport: 'table-tennis', home: 'T. Adeyemi', away: 'M. Yusuf', days: 12, hour: 11 },
  { id: 'match-401', venue: 'arena-boxing', sport: 'boxing', home: 'Iron Tunde', away: 'Kid Lagos', days: 9, hour: 20 },
  { id: 'match-402', venue: 'arena-boxing', sport: 'boxing', home: 'Blaze Musa', away: 'Thunder Emeka', days: 16, hour: 20 },
];

function startAt(days, hour) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return Timestamp.fromDate(d);
}

async function commitInChunks(ops) {
  for (let i = 0; i < ops.length; i += 450) {
    const batch = db.batch();
    ops.slice(i, i + 450).forEach((op) => op(batch));
    await batch.commit();
  }
}

(async () => {
  const ops = [];
  const venueById = new Map(VENUES.map((v) => [v.id, v]));
  let totalSeats = 0;

  for (const v of VENUES) {
    const venueRef = db.collection('stadiums').doc(v.id);
    let capacity = 0;
    for (const s of v.sections) {
      const secRef = venueRef.collection('sections').doc(s.id);
      const count = s.rows * s.perRow;
      capacity += count;
      ops.push((b) => b.set(secRef, { name: s.name, category: s.category, seatCount: count }));
      for (let r = 1; r <= s.rows; r += 1) {
        for (let n = 1; n <= s.perRow; n += 1) {
          ops.push((b) => b.set(secRef.collection('seats').doc(`${s.id}-R${r}-S${n}`), { row: String(r), number: n }));
        }
      }
    }
    totalSeats += capacity;
    ops.push((b) => b.set(venueRef, { name: v.name, city: 'Demo City', sport: v.sport, capacity }));
  }

  for (const m of MATCHES) {
    const v = venueById.get(m.venue);
    const matchRef = db.collection('matches').doc(m.id);
    ops.push((b) => b.set(matchRef, {
      stadiumId: v.id, sport: m.sport, homeTeam: m.home, awayTeam: m.away,
      kickoff: startAt(m.days, m.hour), status: 'OnSale',
      minPrice: Math.min(...v.sections.map((s) => s.price)),
    }));
    ops.push((b) => b.set(db.collection('stats').doc(m.id), { soldCount: 0, revenueMinor: 0, refundedCount: 0, attendance: 0 }));
    for (const s of v.sections) {
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
  console.error(`Seeded ${VENUES.length} venues (${totalSeats} seats) and ${MATCHES.length} matches in 5 sports.`);
})();
