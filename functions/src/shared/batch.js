// Helper for large Firestore jobs that exceed the 500-write batch limit.

/** Firestore batches hold at most 500 writes, so large jobs are committed in chunks. */
async function commitInChunks(db, ops, size = 450) {
  for (let i = 0; i < ops.length; i += size) {
    const batch = db.batch();
    ops.slice(i, i + size).forEach((op) => op(batch));
    await batch.commit();
  }
}

module.exports = { commitInChunks };
