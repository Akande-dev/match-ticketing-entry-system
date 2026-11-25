// Ticket transfer: the old ticket is retired and a new one is issued to the recipient.

const { FieldValue } = require('firebase-admin/firestore');
const { DomainError } = require('../shared/errors');
const { requireString } = require('../shared/validation');
const { writeAudit } = require('../shared/audit');
const { checkTransferEligibility } = require('./transferLogic');
const { generateTicketNumber } = require('./ticketNumber');

// A simple shape check only; whether the account exists is checked against the users collection.
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Moves a ticket to another registered user by issuing a NEW ticket (new id, new QR)
 * and retiring the old one, so the previous holder's QR code stops working.
 */
async function transferTicketCore(db, signer, { uid, ticketId, recipientEmail, now = new Date() }) {
  const id = requireString(ticketId, 'ticketId', 100);
  const email = requireString(recipientEmail, 'Recipient email', 254).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) throw new DomainError('invalid-argument', 'Enter a valid email address.');

  const found = await db.collection('users').where('email', '==', email).limit(1).get();
  const recipient = found.docs[0];
  // One message for every failure, so nobody can use this form to discover who has an account.
  const cannotTransfer = new DomainError('failed-precondition',
    'We could not transfer to that address. The recipient needs a registered, active account.');
  if (!recipient || recipient.data().active === false) throw cannotTransfer;
  if (recipient.id === uid) throw new DomainError('invalid-argument', 'You already own this ticket.');

  return db.runTransaction(async (tx) => {
    const oldRef = db.collection('tickets').doc(id);
    const oldSnap = await tx.get(oldRef);
    if (!oldSnap.exists || oldSnap.data().userId !== uid) throw new DomainError('not-found', 'Ticket not found.');
    const ticket = oldSnap.data();

    const [matchSnap, refundSnap] = await Promise.all([
      tx.get(db.collection('matches').doc(ticket.matchId)),
      tx.get(db.collection('refunds').doc(id)),
    ]);
    const verdict = checkTransferEligibility({
      ticket, match: matchSnap.data(), openRefundStatus: refundSnap.data()?.status, nowMs: now.getTime(),
    });
    if (!verdict.ok) throw new DomainError('failed-precondition', verdict.reason);

    // New id and new QR code, so the previous holder's QR stops working immediately.
    const newRef = db.collection('tickets').doc();
    // The new ticket gets its own number, so a search never finds two live tickets.
    const newNumber = generateTicketNumber();
    tx.create(db.collection('ticketNumbers').doc(newNumber), { ticketId: newRef.id });
    tx.set(newRef, {
      ...ticket,
      userId: recipient.id,
      status: 'Valid',
      ticketNumber: newNumber,
      previousTicketNumber: ticket.ticketNumber ?? null,
      qrPayload: signer.sign(newRef.id, ticket.matchId),
      usedAt: null,
      usedGate: null,
      transferCount: (ticket.transferCount ?? 0) + 1,
      transferredFrom: id,
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.update(oldRef, { status: 'Transferred', transferredTo: recipient.id, transferredAt: FieldValue.serverTimestamp() });
    writeAudit(tx, db, {
      actorId: uid, action: 'TICKET_TRANSFERRED', target: id, meta: { newTicketId: newRef.id, to: recipient.id },
    });
    return { ticketId: newRef.id };
  });
}

module.exports = { transferTicketCore };
