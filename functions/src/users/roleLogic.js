const { DomainError } = require('../shared/errors');

const VALID_ROLES = ['fan', 'steward', 'manager', 'admin'];

function validateRoleChange({ uid, role }, callerUid) {
  if (typeof uid !== 'string' || !uid) throw new DomainError('invalid-argument', 'uid is required.');
  if (!VALID_ROLES.includes(role)) throw new DomainError('invalid-argument', 'Invalid role.');
  if (uid === callerUid) {
    throw new DomainError('invalid-argument', 'Admins cannot change their own role.');
  }
}

module.exports = { VALID_ROLES, validateRoleChange };
