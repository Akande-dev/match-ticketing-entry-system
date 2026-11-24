process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'demo-mtses' });
const { getFirestore } = require('firebase-admin/firestore');
const { holdSeatsCore, cancelOrderCore } = require('../src/reservations/reservationService');
const { releaseExpiredHoldsCore } = require('../src/reservations/expiryService');
const { confirmPaymentCore } = require('../src/payments/paymentService');
const { requestRefundCore, decideRefundCore } = require('../src/refunds/refundService');
const { buildTicketValidator } = require('../src/tickets/composition');
const { SECRET, signer, uniqueId, seedMatch, buyTickets } = require('./helpers');

const db = getFirestore();
const U1 = uniqueId('u'); // fresh users each run, so leftover holds never build up (DEF-009)
const U9 = uniqueId('u');
const validator = buildTicketValidator({ db, secret: SECRET });
const scan = (payload, matchId, gate = 'A') => validator.validate(payload, { matchId, gate, stewardId: 's1' });
const seat = async (matchId, id) => (await db.doc(`matches/${matchId}/inventory/${id}`).get()).data();
const refundsFor = async (orderId) => (await db.collection('refunds').where('orderId', '==', orderId).get()).size;
const ticketCount = async (orderId) => (await db.collection('tickets').where('orderId', '==', orderId).get()).size;

test('IT-RES-01: ten concurrent buyers, exactly one gets the seat', async () => {
  const matchId = uniqueId('m');
  await seedMatch(db, matchId, 1);
  const results = await Promise.allSettled(
    Array.from({ length: 10 }, (_, i) => holdSeatsCore(db, { uid: `u${i}`, matchId, seatIds: ['S1'] })));
  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
});

test('IT-RES-03: a user cannot hold more than the allowed number of open orders', async () => {
  const matchId = uniqueId('m');
  await seedMatch(db, matchId, 4);
  await holdSeatsCore(db, { uid: U9, matchId, seatIds: ['S1'] });
  await holdSeatsCore(db, { uid: U9, matchId, seatIds: ['S2'] });
  await expect(holdSeatsCore(db, { uid: U9, matchId, seatIds: ['S3'] })).rejects.toThrow(/open seat holds/);
});

test('IT-RES-04: cancel frees seats; only the owner may cancel', async () => {
  const matchId = uniqueId('m');
  await seedMatch(db, matchId, 1);
  const { orderId } = await holdSeatsCore(db, { uid: U1, matchId, seatIds: ['S1'] });
  await expect(cancelOrderCore(db, { uid: 'other', orderId })).rejects.toThrow(/not found/i);
  expect(await cancelOrderCore(db, { uid: U1, orderId })).toEqual({ status: 'Cancelled' });
  expect((await seat(matchId, 'S1')).status).toBe('Available');
});

test('IT-RES-05: the expiry job frees stale holds only', async () => {
  const matchId = uniqueId('m');
  await seedMatch(db, matchId, 2);
  const past = new Date(Date.now() - 20 * 60 * 1000);
  const stale = await holdSeatsCore(db, { uid: uniqueId('u'), matchId, seatIds: ['S1'], now: past });
  const live = await holdSeatsCore(db, { uid: uniqueId('u'), matchId, seatIds: ['S2'] });
  await releaseExpiredHoldsCore(db);
  expect((await db.doc(`orders/${stale.orderId}`).get()).data().status).toBe('Expired');
  expect((await seat(matchId, 'S1')).status).toBe('Available');
  expect((await db.doc(`orders/${live.orderId}`).get()).data().status).toBe('Pending');
});

test('IT-PAY-01: payment is idempotent and issues one signed ticket per seat', async () => {
  const matchId = uniqueId('m');
  await seedMatch(db, matchId, 2);
  const { orderId, totalMinor } = await holdSeatsCore(db, { uid: U1, matchId, seatIds: ['S1', 'S2'] });
  const args = { orderId, providerRef: `p1-${orderId}`, amountMinor: totalMinor };
  await confirmPaymentCore(db, signer, args);
  expect((await confirmPaymentCore(db, signer, args)).alreadyPaid).toBe(true);
  const tickets = (await db.collection('tickets').where('orderId', '==', orderId).get()).docs.map((d) => ({ id: d.id, ...d.data() }));
  expect(tickets).toHaveLength(2);
  tickets.forEach((t) => expect(signer.verify(t.qrPayload)).toEqual({ ticketId: t.id, matchId }));
});

test('IT-PAY-02: a wrong amount creates no tickets and records a refund', async () => {
  const matchId = uniqueId('m');
  await seedMatch(db, matchId, 1);
  const { orderId } = await holdSeatsCore(db, { uid: U1, matchId, seatIds: ['S1'] });
  expect(await confirmPaymentCore(db, signer, { orderId, providerRef: `p-${orderId}`, amountMinor: 1 }))
    .toEqual({ refundDue: true, mismatch: true });
  expect(await ticketCount(orderId)).toBe(0);
  expect(await refundsFor(orderId)).toBe(1);
});

test('IT-PAY-05: a second payment on a paid order creates exactly one refund record', async () => {
  const matchId = uniqueId('m');
  await seedMatch(db, matchId, 1);
  const { orderId, totalMinor } = await holdSeatsCore(db, { uid: U1, matchId, seatIds: ['S1'] });
  await confirmPaymentCore(db, signer, { orderId, providerRef: `r1-${orderId}`, amountMinor: totalMinor });
  expect(await confirmPaymentCore(db, signer, { orderId, providerRef: `r2-${orderId}`, amountMinor: totalMinor })).toEqual({ refundDue: true });
  expect(await confirmPaymentCore(db, signer, { orderId, providerRef: `r2-${orderId}`, amountMinor: totalMinor })).toEqual({ alreadyHandled: true });
  expect(await refundsFor(orderId)).toBe(1);
  expect(await ticketCount(orderId)).toBe(1);
});

test('IT-PAY-06: a payment after the hold expired creates a refund, not a ticket', async () => {
  const matchId = uniqueId('m');
  await seedMatch(db, matchId, 1);
  const past = new Date(Date.now() - 20 * 60 * 1000);
  const { orderId, totalMinor } = await holdSeatsCore(db, { uid: U1, matchId, seatIds: ['S1'], now: past });
  await releaseExpiredHoldsCore(db);
  expect(await confirmPaymentCore(db, signer, { orderId, providerRef: `late-${orderId}`, amountMinor: totalMinor })).toEqual({ refundDue: true });
  expect(await ticketCount(orderId)).toBe(0);
});

test('IT-VAL-01: one-time use, even with two gates scanning at once', async () => {
  const matchId = uniqueId('m');
  await seedMatch(db, matchId, 2);
  const { tickets } = await buyTickets(db, { matchId, uid: uniqueId('u'), seatIds: ['S1', 'S2'] });
  expect((await scan(tickets[0].qrPayload, matchId, 'A')).result).toBe('Valid');
  expect(await scan(tickets[0].qrPayload, matchId, 'B')).toMatchObject({ result: 'AlreadyUsed', firstGate: 'A' });
  const both = await Promise.all([scan(tickets[1].qrPayload, matchId, 'A'), scan(tickets[1].qrPayload, matchId, 'B')]);
  expect(both.map((r) => r.result).sort()).toEqual(['AlreadyUsed', 'Valid']);
});

test('IT-VAL-03: a ticket for another match is refused and stays unused', async () => {
  const matchId = uniqueId('m');
  await seedMatch(db, matchId, 1);
  const { tickets } = await buyTickets(db, { matchId, uid: uniqueId('u'), seatIds: ['S1'] });
  expect((await scan(tickets[0].qrPayload, 'other-match')).result).toBe('WrongMatch');
  expect((await db.doc(`tickets/${tickets[0].id}`).get()).data().status).toBe('Valid');
});

test('IT-REF-01: approved refund cancels the ticket, frees the seat, and the gate refuses it', async () => {
  const matchId = uniqueId('m');
  const uid = uniqueId('u');
  await seedMatch(db, matchId, 1);
  const { tickets } = await buyTickets(db, { matchId, uid, seatIds: ['S1'] });
  await requestRefundCore(db, { uid, ticketId: tickets[0].id, reason: 'Cannot attend' });
  await decideRefundCore(db, { uid: 'mgr', ticketId: tickets[0].id, decision: 'approve' });
  expect((await seat(matchId, 'S1')).status).toBe('Available');
  expect((await scan(tickets[0].qrPayload, matchId)).result).toBe('Cancelled');
  const stats = (await db.doc(`stats/${matchId}`).get()).data();
  expect(stats.soldCount).toBe(0);
  expect(stats.refundedCount).toBe(1);
});

test('IT-REF-02: a different user cannot request a refund on a ticket they do not own', async () => {
  const matchId = uniqueId('m');
  await seedMatch(db, matchId, 1);
  const { tickets } = await buyTickets(db, { matchId, uid: 'owner', seatIds: ['S1'] });
  await expect(requestRefundCore(db, { uid: 'intruder', ticketId: tickets[0].id })).rejects.toThrow(/not found/i);
});
