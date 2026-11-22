const { Timestamp, FieldValue } = require('firebase-admin/firestore');
const { DomainError } = require('../shared/errors');
const {
  HOLD_MINUTES, MAX_ACTIVE_HOLDS, validateRequest, findUnavailable, countActiveHolds, computeTotal,
} = require('./reservationLogic');

async function holdSeatsCore(db, { uid, matchId, seatIds, now = new Date() }) {
  validateRequest({ matchId, seatIds });
  const matchRef = db.collection('matches').doc(matchId);
  const orderRef = db.collection('orders').doc();

  return db.runTransaction(async (tx) => {
    // All reads first, then all writes (Firestore transaction rule).
    const matchSnap = await tx.get(matchRef);
    if (!matchSnap.exists || matchSnap.data().status !== 'OnSale') {
      throw new DomainError('failed-precondition', 'This match is not on sale.');
    }

    const pendingSnap = await tx.get(
      db.collection('orders').where('userId', '==', uid).where('status', '==', 'Pending'),
    );
    if (countActiveHolds(pendingSnap.docs.map((d) => d.data()), now.getTime()) >= MAX_ACTIVE_HOLDS) {
      throw new DomainError('resource-exhausted',
        'You already have open seat holds. Complete or cancel them first.');
    }

    const seatRefs = seatIds.map((id) => matchRef.collection('inventory').doc(id));
    const seatSnaps = await tx.getAll(...seatRefs);
    const seatDocs = seatSnaps.map((s) => ({ id: s.id, data: s.exists ? s.data() : undefined }));

    if (findUnavailable(seatDocs, now.getTime()).length) {
      throw new DomainError('failed-precondition', 'Some seats were just taken. Please choose others.');
    }

    const categories = [...new Set(seatDocs.map((s) => s.data.category))];
    const priceSnaps = await tx.getAll(...categories.map((c) => matchRef.collection('prices').doc(c)));
    const prices = new Map(priceSnaps.filter((p) => p.exists).map((p) => [p.id, p.data().amountMinor]));
    const totalMinor = computeTotal(seatDocs, prices);

    const holdExpiresAt = Timestamp.fromMillis(now.getTime() + HOLD_MINUTES * 60 * 1000);
    seatRefs.forEach((ref) =>
      tx.update(ref, { status: 'Held', heldByOrderId: orderRef.id, holdExpiresAt }));
    tx.set(orderRef, {
      userId: uid,
      matchId,
      seatIds,
      seatLabels: seatDocs.map((s) => s.data.label),
      seatPrices: Object.fromEntries(seatDocs.map((s) => [s.id, prices.get(s.data.category)])),
      status: 'Pending',
      totalMinor,
      holdExpiresAt,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { orderId: orderRef.id, totalMinor, holdExpiresAt: holdExpiresAt.toMillis() };
  });
}

/** Cancels a Pending order owned by uid and frees its seats. */
async function cancelOrderCore(db, { uid, orderId }) {
  const orderRef = db.collection('orders').doc(orderId);
  return db.runTransaction(async (tx) => {
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists || orderSnap.data().userId !== uid) {
      throw new DomainError('not-found', 'Order not found.');
    }
    const order = orderSnap.data();
    if (order.status !== 'Pending') return { status: order.status };

    const seatRefs = order.seatIds.map((id) =>
      db.collection('matches').doc(order.matchId).collection('inventory').doc(id));
    const seatSnaps = await tx.getAll(...seatRefs);
    seatSnaps.forEach((s, i) => {
      if (s.exists && s.data().heldByOrderId === orderId) {
        tx.update(seatRefs[i], { status: 'Available', heldByOrderId: null, holdExpiresAt: null });
      }
    });
    tx.update(orderRef, { status: 'Cancelled' });
    return { status: 'Cancelled' };
  });
}

module.exports = { holdSeatsCore, cancelOrderCore };
