function requireAuth(request) {
  if (!request.auth) {
    const { HttpsError } = require('firebase-functions/v2/https');
    throw new HttpsError('unauthenticated', 'Please sign in.');
  }
  return request.auth;
}

function requireRole(request, allowedRoles) {
  const auth = requireAuth(request);
  if (!allowedRoles.includes(auth.token.role ?? 'fan')) {
    const { HttpsError } = require('firebase-functions/v2/https');
    throw new HttpsError('permission-denied', 'You do not have permission to do that.');
  }
  return auth;
}

module.exports = { requireAuth, requireRole };
