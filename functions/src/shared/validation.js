// Small input validators. Server code never trusts values sent by the browser.

const { DomainError } = require('./errors');

// Returns the trimmed string, or throws if it is missing, empty or longer than 'max'.
function requireString(value, label, max = 200) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) {
    throw new DomainError('invalid-argument', `${label} is invalid.`);
  }
  return value.trim();
}

module.exports = { requireString };
