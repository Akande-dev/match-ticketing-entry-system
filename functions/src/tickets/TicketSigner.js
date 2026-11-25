// Creates and checks the HMAC signature in each QR code, so a ticket cannot be forged or edited.

const crypto = require('crypto');

/** Signs and verifies QR payloads of the form ticketId.matchId.signature (HMAC-SHA256). */
class TicketSigner {
  constructor(secret) {
    if (!secret) throw new Error('Signing secret is required');
    this.secret = secret;
  }

  // The signature covers both ids, so changing either one invalidates the code.
  _mac(ticketId, matchId) {
    return crypto.createHmac('sha256', this.secret).update(`${ticketId}.${matchId}`).digest('base64url');
  }

  sign(ticketId, matchId) {
    return `${ticketId}.${matchId}.${this._mac(ticketId, matchId)}`;
  }

  /** Returns { ticketId, matchId } or null if malformed or tampered. */
  verify(payload) {
    if (typeof payload !== 'string') return null;
    const first = payload.indexOf('.');
    const last = payload.lastIndexOf('.');
    if (first <= 0 || last <= first + 1 || last === payload.length - 1) return null;

    const ticketId = payload.slice(0, first);
    const matchId = payload.slice(first + 1, last);
    // Constant-time comparison, so response timing does not leak the signature.
    const given = Buffer.from(payload.slice(last + 1));
    const expected = Buffer.from(this._mac(ticketId, matchId));
    if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
    return { ticketId, matchId };
  }
}

module.exports = { TicketSigner };
