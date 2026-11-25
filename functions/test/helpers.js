// Shared helpers for the emulator integration tests.

const { randomUUID } = require('crypto');
const { Timestamp } = require('firebase-admin/firestore');
const { holdSeatsCore } = require('../src/reservations/reservationService');
const { confirmPaymentCore } = require('../src/payments/paymentService');
const { TicketSigner } = require('../src/tickets/TicketSigner');

// A fixed secret used only by tests; the real secret comes from the environment.
const SECRET = 'test-secret-test-secret-test-secret';
const signer = new TicketSigner(SECRET);
// Random ids keep every test independent, so tests can be run repeatedly on the same emulator (DEF-009).
const uniqueId = (prefix) => `${prefix}-${randomUUID().slice(0, 8)}`;

// Creates an On sale match with one price category and 'seatCount' available seats.
async function seedMatch(db, matchId, seatCount = 2) {
  const m = db.collection('matches').doc(matchId);
  await m.set({
    status: 'OnSale', homeTeam: 'A', awayTeam: 'B', stadiumId: 'st1',
    kickoff: Timestamp.fromMillis(Date.now() + 7 * 24 * 3600000),
  });
  await m.collection('prices').doc('Regular').set({ amountMinor: 200000 });
  for (let i = 1; i <= seatCount; i += 1) {
    await m.collection('inventory').doc(`S${i}`).set({
      status: 'Available', category: 'Regular', label: `Seat ${i}`, heldByOrderId: null, holdExpiresAt: null,
    });
  }
}

/** Holds seats and pays for them, returning the issued tickets. */
async function buyTickets(db, { matchId, uid, seatIds }) {
  const { orderId, totalMinor } = await holdSeatsCore(db, { uid, matchId, seatIds });
  await confirmPaymentCore(db, signer, { orderId, providerRef: `pay-${orderId}`, amountMinor: totalMinor });
  const snap = await db.collection('tickets').where('orderId', '==', orderId).get();
  return { orderId, tickets: snap.docs.map((d) => ({ id: d.id, ...d.data() })) };
}

module.exports = { SECRET, signer, uniqueId, seedMatch, buyTickets };
