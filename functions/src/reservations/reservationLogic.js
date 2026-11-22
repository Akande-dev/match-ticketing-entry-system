const { DomainError } = require('../shared/errors');

const MAX_SEATS_PER_ORDER = 6;
const MAX_ACTIVE_HOLDS = 2;
const HOLD_MINUTES = 10;

function validateRequest({ matchId, seatIds }) {
  if (typeof matchId !== 'string' || !matchId) {
    throw new DomainError('invalid-argument', 'matchId is required.');
  }
  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    throw new DomainError('invalid-argument', 'Select at least one seat.');
  }
  if (seatIds.length > MAX_SEATS_PER_ORDER) {
    throw new DomainError('invalid-argument', `You can book at most ${MAX_SEATS_PER_ORDER} seats.`);
  }
  if (!seatIds.every((s) => typeof s === 'string' && s) || new Set(seatIds).size !== seatIds.length) {
    throw new DomainError('invalid-argument', 'Seat list is invalid.');
  }
}

/** A seat can be taken if Available, or Held with an expired hold. */
function isSeatAvailable(seat, nowMs) {
  if (!seat) return false;
  if (seat.status === 'Available') return true;
  if (seat.status === 'Held') return (seat.holdExpiresAt?.toMillis?.() ?? 0) <= nowMs;
  return false;
}

function findUnavailable(seatDocs, nowMs) {
  return seatDocs.filter((s) => !isSeatAvailable(s.data, nowMs)).map((s) => s.id);
}

function countActiveHolds(orders, nowMs) {
  return orders.filter(
    (o) => o.status === 'Pending' && (o.holdExpiresAt?.toMillis?.() ?? 0) > nowMs,
  ).length;
}

/** prices: Map<category, amountMinor> */
function computeTotal(seatDocs, prices) {
  return seatDocs.reduce((sum, s) => {
    const price = prices.get(s.data.category);
    if (typeof price !== 'number') {
      throw new DomainError('failed-precondition', `No price set for ${s.data.category}.`);
    }
    return sum + price;
  }, 0);
}

module.exports = {
  MAX_SEATS_PER_ORDER, MAX_ACTIVE_HOLDS, HOLD_MINUTES,
  validateRequest, isSeatAvailable, findUnavailable, countActiveHolds, computeTotal,
};
