// Human-readable ticket numbers such as TKT-7K4M9Q2X, so a ticket can be found without scanning its QR code.
// The alphabet leaves out 0, O, 1, I and L, which are easy to confuse when read aloud or typed.
const crypto = require('crypto');

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const LENGTH = 8;
const PREFIX = 'TKT-';

// Random number from a cryptographic source. Uniqueness is enforced separately by the ticketNumbers registry.
function generateTicketNumber() {
  let body = '';
  for (let i = 0; i < LENGTH; i += 1) body += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return PREFIX + body;
}

// Tidies what a person typed (case, spaces, optional prefix). Returns null if it cannot be a ticket number.
function normaliseTicketNumber(input) {
  if (typeof input !== 'string') return null;
  const cleaned = input.replace(/\s+/g, '').toUpperCase();
  const body = cleaned.startsWith(PREFIX) ? cleaned.slice(PREFIX.length) : cleaned;
  if (body.length !== LENGTH || [...body].some((c) => !ALPHABET.includes(c))) return null;
  return PREFIX + body;
}

module.exports = { ALPHABET, generateTicketNumber, normaliseTicketNumber };
