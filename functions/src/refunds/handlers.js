const { callable } = require('../shared/callable');
const { requestRefundCore, decideRefundCore } = require('./refundService');

exports.requestRefund = callable(null,
  ({ auth, data, db }) => requestRefundCore(db, { uid: auth.uid, ticketId: data.ticketId, reason: data.reason }),
  { rateLimit: { action: 'refund', limit: 5, windowMs: 60_000 } });

exports.decideRefund = callable(['manager', 'admin'],
  ({ auth, data, db }) => decideRefundCore(db, {
    uid: auth.uid, ticketId: data.ticketId, decision: data.decision, note: data.note,
  }));
