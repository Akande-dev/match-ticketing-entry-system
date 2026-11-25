// The single wrapper used by every Cloud Function, so authentication, role checks,
// rate limiting and error mapping are done the same way everywhere.

const { onCall } = require('firebase-functions/v2/https');
const { getFirestore } = require('firebase-admin/firestore');
const { requireAuth, requireRole } = require('./auth');
const { toHttpsError } = require('./errors');
const { enforceRateLimit } = require('./rateLimit');

/**
 * Wraps a handler with authentication, an optional role check, optional rate limiting
 * and domain-error mapping.
 * @param {string[]|null} roles allowed roles, or null for any signed-in user
 * @param {Function} handler ({ auth, data, db }) => Promise<*>
 * @param {{ rateLimit?: {action, limit, windowMs} }} [options]
 */
function callable(roles, handler, { rateLimit, ...callOptions } = {}) {
  // App Check is only enforced when the environment asks for it (off in local emulators).
  const options = { enforceAppCheck: process.env.ENFORCE_APP_CHECK === 'true', ...callOptions };
  return onCall(options, async (request) => {
    const auth = roles ? requireRole(request, roles) : requireAuth(request);
    try {
      const db = getFirestore();
      if (rateLimit) await enforceRateLimit(db, { uid: auth.uid, ...rateLimit });
      return await handler({ auth, data: request.data ?? {}, db });
    } catch (err) {
      // Domain errors become client-friendly HttpsErrors; unexpected errors pass through.
      throw toHttpsError(err);
    }
  });
}

module.exports = { callable };
