const { HttpsError } = require('firebase-functions/v2/https');

class DomainError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code; // an HttpsError code, e.g. 'failed-precondition'
  }
}

function toHttpsError(err) {
  return err instanceof DomainError ? new HttpsError(err.code, err.message) : err;
}

module.exports = { DomainError, toHttpsError };
