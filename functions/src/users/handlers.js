// Admin-only user management: change a role, enable or disable an account, list accounts.
// Roles are stored as custom claims in the login token. Every change is written to the audit log.

const { getAuth } = require('firebase-admin/auth');
const { callable } = require('../shared/callable');
const { auditEntry } = require('../shared/audit');
const { DomainError } = require('../shared/errors');
const { requireString } = require('../shared/validation');
const { validateRoleChange } = require('./roleLogic');

// Changes a user's role. The new role takes effect the next time that user logs in.
exports.setUserRole = callable(['admin'], async ({ auth, data, db }) => {
  validateRoleChange(data, auth.uid);
  await getAuth().setCustomUserClaims(data.uid, { role: data.role });
  await db.collection('users').doc(data.uid).set({ role: data.role }, { merge: true });
  await db.collection('auditLogs').add(
    auditEntry({ actorId: auth.uid, action: 'ROLE_CHANGED', target: data.uid, meta: { role: data.role } }),
  );
  return { ok: true };
});

// Disables or re-enables an account. Disabling also revokes sessions, so the user is signed out.
exports.setUserDisabled = callable(['admin'], async ({ auth, data, db }) => {
  const uid = requireString(data.uid, 'uid', 128);
  if (uid === auth.uid) throw new DomainError('invalid-argument', 'You cannot disable your own account.');
  const disabled = data.disabled === true;

  await getAuth().updateUser(uid, { disabled });
  if (disabled) await getAuth().revokeRefreshTokens(uid);
  await db.collection('users').doc(uid).set({ active: !disabled }, { merge: true });
  await db.collection('auditLogs').add(auditEntry({
    actorId: auth.uid, action: disabled ? 'USER_DISABLED' : 'USER_ENABLED', target: uid,
  }));
  return { ok: true };
});

// Imported here (not at the top) because it was added with the admin portal change (CR-05).
const { toUserSummary } = require('./userSummary');

// Lists up to 200 accounts in a safe form (no password data).
exports.listUsers = callable(['admin'], async () => {
  const res = await getAuth().listUsers(200);
  return { users: res.users.map(toUserSummary) };
});
