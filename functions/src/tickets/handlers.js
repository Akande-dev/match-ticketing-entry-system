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

const { findTicketByNumberCore } = require('./ticketLookup');

// Staff search: find a ticket by its number (steward and admin only, rate limited).
exports.findTicketByNumber = callable(['steward', 'admin'],
  ({ data, db }) => findTicketByNumberCore(db, data.ticketNumber),
  { rateLimit: { action: 'ticketLookup', limit: 30, windowMs: 60_000 } });

const { demoScanCore } = require('./demoScan');

// Demo only: a sample scan through the real validator. Disabled unless ALLOW_MOCK_PAYMENTS=true.
exports.demoScan = callable(['steward', 'admin'], async ({ auth, data, db }) => {
  if (process.env.ALLOW_MOCK_PAYMENTS !== 'true') {
    throw new DomainError('permission-denied', 'Demo scans are disabled.');
  }
  const { kind, matchId, gate } = data;
  if (typeof matchId !== 'string' || !matchId || typeof gate !== 'string' || !gate || gate.length > 20) {
    throw new DomainError('invalid-argument', 'matchId and gate are required.');
  }
  const validator = buildTicketValidator({ db, secret: process.env.TICKET_HMAC_SECRET });
  const outcome = await demoScanCore(db, validator, { kind, matchId, gate, stewardId: auth.uid });
  if (outcome.result === 'Valid') {
    await db.collection('stats').doc(matchId).set({
      attendance: FieldValue.increment(1),
      attendanceByGate: { [gate]: FieldValue.increment(1) },
    }, { merge: true });
  }
  return { ...outcome, firstUsedAt: toMillis(outcome.firstUsedAt) };
}, { rateLimit: { action: 'demoScan', limit: 30, windowMs: 60_000 } });
