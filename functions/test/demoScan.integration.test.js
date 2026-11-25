process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'demo-mtses' });
const { getFirestore } = require('firebase-admin/firestore');
const { buildTicketValidator } = require('../src/tickets/composition');
const { demoScanCore } = require('../src/tickets/demoScan');
const { SECRET, uniqueId, seedMatch, buyTickets } = require('./helpers');

const db = getFirestore();
const validator = buildTicketValidator({ db, secret: SECRET });
const run = (kind, matchId) => demoScanCore(db, validator, { kind, matchId, gate: 'A', stewardId: 's1' });

test('IT-SCN-01: a valid sample scan uses the ticket, then the same ticket is ALREADY USED', async () => {
  const matchId = uniqueId('m');
  await seedMatch(db, matchId, 1);
  await buyTickets(db, { matchId, uid: uniqueId('u'), seatIds: ['S1'] });
  expect((await run('valid', matchId)).result).toBe('Valid');
  expect(await run('passback', matchId)).toMatchObject({ result: 'AlreadyUsed', firstGate: 'A' });
  await expect(run('valid', matchId)).rejects.toThrow(/No unused ticket/);
});

test('IT-SCN-02: a wrong-match sample is refused and the ticket stays valid', async () => {
  const matchId = uniqueId('m');
  await seedMatch(db, matchId, 1);
  const { tickets } = await buyTickets(db, { matchId, uid: uniqueId('u'), seatIds: ['S1'] });
  expect((await run('wrongMatch', matchId)).result).toBe('WrongMatch');
  expect((await db.doc(`tickets/${tickets[0].id}`).get()).data().status).toBe('Valid');
});

test('IT-SCN-03: a tampered QR is INVALID', async () => {
  expect((await run('invalid', uniqueId('m'))).result).toBe('Invalid');
});

test('IT-SCN-04: cancelled sample is refused when no such ticket exists; unknown kinds are refused', async () => {
  await expect(run('cancelled', uniqueId('m'))).rejects.toThrow(/No cancelled/);
  await expect(run('bogus', uniqueId('m'))).rejects.toThrow(/Unknown/);
});
