// Server-side authentication and role checks for Cloud Functions.
// The browser's route guards are only a convenience; these checks are the real enforcement.

// Rejects anonymous callers. HttpsError is loaded lazily so unit tests do not need the Functions runtime.
function requireAuth(request) {
  if (!request.auth) {
    const { HttpsError } = require('firebase-functions/v2/https');
    throw new HttpsError('unauthenticated', 'Please sign in.');
  }
  return request.auth;
}

// Allows only the listed roles. A missing role claim counts as 'fan', the least privileged role.
function requireRole(request, allowedRoles) {
  const auth = requireAuth(request);
  if (!allowedRoles.includes(auth.token.role ?? 'fan')) {
    const { HttpsError } = require('firebase-functions/v2/https');
    throw new HttpsError('permission-denied', 'You do not have permission to do that.');
  }
  return auth;
}

module.exports = { requireAuth, requireRole };
