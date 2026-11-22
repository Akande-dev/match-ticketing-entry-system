const { DomainError } = require('./errors');

function requireString(value, label, max = 200) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) {
    throw new DomainError('invalid-argument', `${label} is invalid.`);
  }
  return value.trim();
}

module.exports = { requireString };
