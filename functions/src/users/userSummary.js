// Converts an authentication account into the small, safe object shown on the admin Users page.

const { VALID_ROLES } = require('./roleLogic');

/** Safe view of an auth account: no password data, unknown roles shown as fan. */
function toUserSummary(u) {
  const claim = u.customClaims && u.customClaims.role;
  return {
    uid: u.uid,
    email: u.email || '',
    name: u.displayName || '',
    role: VALID_ROLES.includes(claim) ? claim : 'fan',
    disabled: u.disabled === true,
  };
}

module.exports = { toUserSummary };
