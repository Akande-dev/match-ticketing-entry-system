process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'demo-mtses' });
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { transferTicketCore } = require('../src/tickets/transferService');
const { buildTicketValidator } = require('../src/tickets/composition');
const { requestRefundCore, decideRefundCore } = require('../src/refunds/refundService');
const { SECRET, signer, uniqueId, seedMatch, buyTickets } = require('./helpers');

const db = getFirestore();
const validator = buildTicketValidator({ db, secret: SECRET });
const scan = (payload, matchId) => validator.validate(payload, { matchId, gate: 'A', stewardId: 's1' });

async function setup() {
  const matchId = uniqueId('m');
  const owner = uniqueId('owner');
  const friend = uniqueId('friend');
  await seedMatch(db, matchId, 1);
  await db.doc(`users/${friend}`).set({ email: `${friend}@example.com`, active: true, role: 'fan', name: 'Friend' });
  const { tickets } = await buyTickets(db, { matchId, uid: owner, seatIds: ['S1'] });
  return { matchId, owner, friend, ticket: tickets[0] };
}
const transfer = (s, over = {}) => transferTicketCore(db, signer, {
  uid: s.owner, ticketId: s.ticket.id, recipientEmail: `${s.friend}@example.com`, ...over,
});

test('IT-TRF-01: transfer issues a new valid ticket to the recipient and retires the old one', async () => {
  const s = await setup();
  const { ticketId } = await transfer(s);
  const fresh = (await db.doc(`tickets/${ticketId}`).get()).data();
  expect(fresh).toMatchObject({ userId: s.friend, status: 'Valid', transferCount: 1, transferredFrom: s.ticket.id });
  expect(signer.verify(fresh.qrPayload)).toEqual({ ticketId, matchId: s.matchId });
  expect((await db.doc(`tickets/${s.ticket.id}`).get()).data()).toMatchObject({ status: 'Transferred', transferredTo: s.friend });
});

test('IT-TRF-02: the old QR is refused at the gate and the new QR is admitted once', async () => {
  const s = await setup();
  const { ticketId } = await transfer(s);
  expect((await scan(s.ticket.qrPayload, s.matchId)).result).toBe('Cancelled');
  const fresh = (await db.doc(`tickets/${ticketId}`).get()).data();
  expect((await scan(fresh.qrPayload, s.matchId)).result).toBe('Valid');
  expect((await scan(fresh.qrPayload, s.matchId)).result).toBe('AlreadyUsed');
});

test('IT-TRF-03: only the owner can transfer, and not to themselves', async () => {
  const s = await setup();
  await expect(transfer(s, { uid: 'intruder' })).rejects.toThrow(/not found/i);
  await db.doc(`users/${s.owner}`).set({ email: `${s.owner}@example.com`, active: true, role: 'fan' });
  await expect(transfer(s, { recipientEmail: `${s.owner}@example.com` })).rejects.toThrow(/already own/i);
});

test('IT-TRF-04: unknown and disabled recipients get the same generic message', async () => {
  const s = await setup();
  const disabled = uniqueId('off');
  await db.doc(`users/${disabled}`).set({ email: `${disabled}@example.com`, active: false, role: 'fan' });
  const a = await transfer(s, { recipientEmail: 'nobody@example.com' }).catch((e) => e.message);
  const b = await transfer(s, { recipientEmail: `${disabled}@example.com` }).catch((e) => e.message);
  expect(a).toBe(b);
  expect(a).toMatch(/could not transfer/i);
});

test('IT-TRF-05: a ticket cannot be transferred twice', async () => {
  const s = await setup();
  const { ticketId } = await transfer(s);
  const second = uniqueId('second');
  await db.doc(`users/${second}`).set({ email: `${second}@example.com`, active: true, role: 'fan' });
  await expect(transferTicketCore(db, signer, {
    uid: s.friend, ticketId, recipientEmail: `${second}@example.com`,
  })).rejects.toThrow(/already been transferred/);
});

test('IT-TRF-06: an open refund request or the 2-hour cutoff blocks the transfer', async () => {
  const a = await setup();
  await requestRefundCore(db, { uid: a.owner, ticketId: a.ticket.id });
  await expect(transfer(a)).rejects.toThrow(/refund/i);

  const b = await setup();
  await db.doc(`matches/${b.matchId}`).update({ kickoff: Timestamp.fromMillis(Date.now() + 30 * 60000) });
  await expect(transfer(b)).rejects.toThrow(/2 hours/);
});

test('IT-TRF-07: the new owner can be refunded, and that frees the seat', async () => {
  const s = await setup();
  const { ticketId } = await transfer(s);
  await requestRefundCore(db, { uid: s.friend, ticketId });
  await decideRefundCore(db, { uid: 'mgr', ticketId, decision: 'approve' });
  expect((await db.doc(`matches/${s.matchId}/inventory/S1`).get()).data().status).toBe('Available');
  expect((await db.doc(`tickets/${ticketId}`).get()).data().status).toBe('Cancelled');
});
