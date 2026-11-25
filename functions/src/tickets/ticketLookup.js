// Looks up one ticket by its number, for stewards and admins.
// It returns only what staff need. It never returns the QR payload (that would let someone forge entry)
// or who owns the ticket.
const { DomainError } = require('../shared/errors');
const { normaliseTicketNumber } = require('./ticketNumber');

async function findTicketByNumberCore(db, input) {
  const number = normaliseTicketNumber(input);
  if (!number) throw new DomainError('invalid-argument', 'Enter a ticket number like TKT-7K4M9Q2X.');
  const snap = await db.collection('tickets').where('ticketNumber', '==', number).limit(1).get();
  if (snap.empty) throw new DomainError('not-found', 'No ticket with that number.');
  const d = snap.docs[0].data();
  return {
    ticketNumber: number,
    status: d.status,
    matchId: d.matchId,
    matchLabel: d.matchLabel,
    sport: d.sport ?? null,
    seatLabel: d.seatLabel,
    category: d.category ?? null,
    usedAtMs: d.usedAt && d.usedAt.toMillis ? d.usedAt.toMillis() : null,
    usedGate: d.usedGate ?? null,
  };
}

module.exports = { findTicketByNumberCore };
