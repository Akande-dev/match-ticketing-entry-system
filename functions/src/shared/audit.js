// Audit trail helpers. Every sensitive action (role change, refund, ticket transfer)
// records who did what, to which target, and when. The timestamp is set by the server,
// so a client cannot forge it.

const { FieldValue } = require('firebase-admin/firestore');

// Builds one audit record. 'meta' holds extra detail such as the new role.
function auditEntry({ actorId, action, target, meta = {} }) {
  return { actorId, action, target, meta, at: FieldValue.serverTimestamp() };
}

/** `writer` is anything with set(ref, data): a Transaction or a WriteBatch. */
function writeAudit(writer, db, entry) {
  writer.set(db.collection('auditLogs').doc(), auditEntry(entry));
}

module.exports = { auditEntry, writeAudit };
