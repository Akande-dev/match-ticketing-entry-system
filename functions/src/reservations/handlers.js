const { callable } = require('../shared/callable');
const { holdSeatsCore, cancelOrderCore } = require('./reservationService');

exports.holdSeats = callable(null,
  ({ auth, data, db }) => holdSeatsCore(db, { uid: auth.uid, matchId: data.matchId, seatIds: data.seatIds }),
  { rateLimit: { action: 'hold', limit: 10, windowMs: 60_000 } });

exports.cancelOrder = callable(null,
  ({ auth, data, db }) => cancelOrderCore(db, { uid: auth.uid, orderId: data.orderId }),
  { rateLimit: { action: 'cancel', limit: 20, windowMs: 60_000 } });

Object.assign(exports, require('./scheduled'));
