// Releases seats whose 10-minute hold ran out without payment.

const { Timestamp } = require('firebase-admin/firestore');

/**
 * Expires one Pending order whose hold has run out and frees its seats.
 * Re-reads the order in a transaction, so a payment landing at the same moment wins the race.
 */
async function expireOrderCore(db, { orderId, now = new Date() }) {
  const orderRef = db.collection('orders').doc(orderId);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(orderRef);
    const order = snap.data();
    if (!snap.exists || order.status !== 'Pending' || order.holdExpiresAt.toMillis() > now.getTime()) {
      return { expired: false };
    }
    const matchRef = db.collection('matches').doc(order.matchId);
    const seatRefs = order.seatIds.map((id) => matchRef.collection('inventory').doc(id));
    const seatSnaps = await tx.getAll(...seatRefs);
    seatSnaps.forEach((s, i) => {
      if (s.exists && s.data().status === 'Held' && s.data().heldByOrderId === orderId) {
        tx.update(seatRefs[i], { status: 'Available', heldByOrderId: null, holdExpiresAt: null });
      }
    });
    tx.update(orderRef, { status: 'Expired' });
    return { expired: true };
  });
}

// Sweep used by the scheduled job: finds overdue Pending orders and expires each one safely.
async function releaseExpiredHoldsCore(db, { now = new Date(), limit = 200 } = {}) {
  const snap = await db.collection('orders')
    .where('status', '==', 'Pending')
    .where('holdExpiresAt', '<=', Timestamp.fromDate(now))
    .limit(limit)
    .get();
  let expired = 0;
  for (const doc of snap.docs) {
    const result = await expireOrderCore(db, { orderId: doc.id, now });
    if (result.expired) expired += 1;
  }
  return { scanned: snap.size, expired };
}

module.exports = { expireOrderCore, releaseExpiredHoldsCore };
