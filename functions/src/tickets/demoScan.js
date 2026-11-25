// Demo-only helper: runs a SAMPLE scan through the real validator, so the scanner screen can show
// every kind of result without needing a second phone. Results and scan logs are genuine.
// A "valid" sample really marks a ticket as used.
const { DomainError } = require('../shared/errors');

const KINDS = ['valid', 'passback', 'wrongMatch', 'invalid', 'cancelled'];

async function demoScanCore(db, validator, { kind, matchId, gate, stewardId }) {
  if (!KINDS.includes(kind)) throw new DomainError('invalid-argument', 'Unknown demo scan.');
  const ctx = { matchId, gate, stewardId };

  // Finds one ticket of this event with the given status.
  const find = async (status) => {
    const snap = await db.collection('tickets')
      .where('matchId', '==', matchId).where('status', '==', status).limit(1).get();
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
  };
  const need = (t, message) => {
    if (!t) throw new DomainError('failed-precondition', message);
    return t;
  };

  let ticket = null;
  let outcome;
  if (kind === 'valid') {
    ticket = need(await find('Valid'), 'No unused ticket for this event. Buy one as a fan first.');
    outcome = await validator.validate(ticket.qrPayload, ctx);
  } else if (kind === 'passback') {
    ticket = need(await find('Used'), 'No used ticket yet. Run "Simulate valid scan" first.');
    outcome = await validator.validate(ticket.qrPayload, ctx);
  } else if (kind === 'wrongMatch') {
    ticket = need((await find('Valid')) ?? (await find('Used')), 'No ticket for this event to use as a sample.');
    // Presenting the ticket as if at a different event; the match rule refuses it before anything changes.
    outcome = await validator.validate(ticket.qrPayload, { ...ctx, matchId: `${matchId}-other` });
  } else if (kind === 'invalid') {
    outcome = await validator.validate(`fake-ticket.${matchId}.forgedsignature`, ctx);
  } else {
    ticket = need((await find('Cancelled')) ?? (await find('Transferred')),
      'No cancelled or transferred ticket for this event. Approve a refund or transfer one first.');
    outcome = await validator.validate(ticket.qrPayload, ctx);
  }
  return { ...outcome, sampleTicketNumber: ticket?.ticketNumber ?? null };
}

module.exports = { demoScanCore };
