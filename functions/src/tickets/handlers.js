// Cloud Function entry points for tickets: gate validation (steward/admin) and transfer (owner).

const { FieldValue } = require('firebase-admin/firestore');
const { callable } = require('../shared/callable');
const { DomainError } = require('../shared/errors');
const { buildTicketValidator } = require('./composition');
const { TicketSigner } = require('./TicketSigner');
const { transferTicketCore } = require('./transferService');

// Converts a Firestore timestamp to plain milliseconds for the browser.
const toMillis = (v) => (v?.toMillis ? v.toMillis() : v instanceof Date ? v.getTime() : null);

// Gate scan. Only stewards and admins may call it; the heavy lifting is in TicketValidator.
exports.validateTicket = callable(['steward', 'admin'], async ({ auth, data, db }) => {
  const { payload, matchId, gate } = data;
  if (typeof payload !== 'string' || typeof matchId !== 'string' ||
      typeof gate !== 'string' || !gate || gate.length > 20) {
    throw new DomainError('invalid-argument', 'payload, matchId and gate are required.');
  }
  const validator = buildTicketValidator({ db, secret: process.env.TICKET_HMAC_SECRET });
  const outcome = await validator.validate(payload, { matchId, gate, stewardId: auth.uid });
  // Only a successful entry counts towards attendance.
  if (outcome.result === 'Valid') {
    await db.collection('stats').doc(matchId).set({
      attendance: FieldValue.increment(1),
      attendanceByGate: { [gate]: FieldValue.increment(1) },
    }, { merge: true });
  }
  return { ...outcome, firstUsedAt: toMillis(outcome.firstUsedAt) };
});

// Ticket transfer, limited to 5 attempts per minute per user.
exports.transferTicket = callable(null,
  ({ auth, data, db }) => transferTicketCore(db, new TicketSigner(process.env.TICKET_HMAC_SECRET), {
    uid: auth.uid, ticketId: data.ticketId, recipientEmail: data.recipientEmail,
  }),
  { rateLimit: { action: 'transfer', limit: 5, windowMs: 60_000 } });
