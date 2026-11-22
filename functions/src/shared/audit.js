const { FieldValue } = require('firebase-admin/firestore');

function auditEntry({ actorId, action, target, meta = {} }) {
  return { actorId, action, target, meta, at: FieldValue.serverTimestamp() };
}

/** `writer` is anything with set(ref, data): a Transaction or a WriteBatch. */
function writeAudit(writer, db, entry) {
  writer.set(db.collection('auditLogs').doc(), auditEntry(entry));
}

module.exports = { auditEntry, writeAudit };
