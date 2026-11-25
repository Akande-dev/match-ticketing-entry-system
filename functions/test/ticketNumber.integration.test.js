process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'demo-mtses' });
const { getFirestore } = require('firebase-admin/firestore');
const { findTicketByNumberCore } = require('../src/tickets/ticketLookup');
const { transferTicketCore } = require('../src/tickets/transferService');
const { signer, uniqueId, seedMatch, buyTickets } = require('./helpers');

const db = getFirestore();

test('IT-TKN-01: every ticket gets a unique number that staff can search for', async () => {
  const matchId = uniqueId('m');
  await seedMatch(db, matchId, 2);
  const { tickets } = await buyTickets(db, { matchId, uid: uniqueId('u'), seatIds: ['S1', 'S2'] });
  const numbers = tickets.map((t) => t.ticketNumber);
  numbers.forEach((n) => expect(n).toMatch(/^TKT-[A-HJKMNP-Z2-9]{8}$/));
  expect(new Set(numbers).size).toBe(2);
  for (const t of tickets) {
    const found = await findTicketByNumberCore(db, t.ticketNumber.toLowerCase());
    expect(found).toMatchObject({ ticketNumber: t.ticketNumber, status: 'Valid', seatLabel: t.seatLabel });
    expect(found.qrPayload).toBeUndefined();
    expect(found.userId).toBeUndefined();
  }
  expect((await db.doc(`ticketNumbers/${numbers[0]}`).get()).exists).toBe(true);
});

test('IT-TKN-02: an unknown or malformed number is refused', async () => {
  await expect(findTicketByNumberCore(db, 'TKT-AAAAAAAA')).rejects.toThrow(/No ticket/);
  await expect(findTicketByNumberCore(db, 'nonsense')).rejects.toThrow(/ticket number/i);
});

test('IT-TKN-03: a transferred ticket gets a new number and the old one shows Transferred', async () => {
  const matchId = uniqueId('m');
  const owner = uniqueId('u');
  const recipientId = uniqueId('r');
  const email = `${uniqueId('x')}@test.com`;
  await db.collection('users').doc(recipientId).set({ email, active: true });
  await seedMatch(db, matchId, 1);
  const { tickets } = await buyTickets(db, { matchId, uid: owner, seatIds: ['S1'] });
  const oldNumber = tickets[0].ticketNumber;
  const { ticketId } = await transferTicketCore(db, signer, { uid: owner, ticketId: tickets[0].id, recipientEmail: email });
  const fresh = (await db.doc(`tickets/${ticketId}`).get()).data();
  expect(fresh.ticketNumber).toMatch(/^TKT-/);
  expect(fresh.ticketNumber).not.toBe(oldNumber);
  expect((await findTicketByNumberCore(db, oldNumber)).status).toBe('Transferred');
  expect((await findTicketByNumberCore(db, fresh.ticketNumber)).status).toBe('Valid');
});
