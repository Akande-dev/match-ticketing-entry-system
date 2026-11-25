// Business-rule errors that are safe to show to the user (for example 'seat already taken').

class DomainError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code; // an HttpsError code, e.g. 'failed-precondition'
  }
}

// Converts a DomainError to the error type Firebase sends to the browser.
function toHttpsError(err) {
  if (!(err instanceof DomainError)) return err;
  // Loaded lazily so pure logic and unit tests never need the Functions runtime.
  const { HttpsError } = require('firebase-functions/v2/https');
  return new HttpsError(err.code, err.message);
}

module.exports = { DomainError, toHttpsError };
