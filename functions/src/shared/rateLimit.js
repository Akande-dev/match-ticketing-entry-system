// Per-user rate limiting (a defence against abuse such as seat-hoarding scripts).
// The decision logic is a pure function so it can be unit tested without Firestore.

const { FieldValue, Timestamp } = require('firebase-admin/firestore');
const { DomainError } = require('./errors');

/** Pure fixed-window counter. */
function nextWindow(state, nowMs, { limit, windowMs }) {
  const start = state?.windowStartMs;
  if (typeof start !== 'number' || nowMs - start >= windowMs) {
    return { allowed: true, state: { windowStartMs: nowMs, count: 1 } };
  }
  if (state.count >= limit) return { allowed: false, retryAfterMs: start + windowMs - nowMs };
  return { allowed: true, state: { windowStartMs: start, count: state.count + 1 } };
}

// Reads and updates the user's counter inside a transaction so two requests cannot both slip under the limit.
async function enforceRateLimit(db, { uid, action, limit, windowMs, now = new Date() }) {
  const ref = db.collection('rateLimits').doc(`${uid}_${action}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const verdict = nextWindow(snap.data(), now.getTime(), { limit, windowMs });
    if (!verdict.allowed) {
      const seconds = Math.ceil(verdict.retryAfterMs / 1000);
      throw new DomainError('resource-exhausted', `Too many requests. Try again in ${seconds} seconds.`);
    }
    tx.set(ref, {
      ...verdict.state,
      // expireAt lets a Firestore TTL policy delete old counters.
      expireAt: Timestamp.fromMillis(verdict.state.windowStartMs + windowMs * 2),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

module.exports = { nextWindow, enforceRateLimit };
