// Confirms a payment and issues tickets. This is the most safety-critical code in the system:
// it is idempotent, runs in one transaction, and turns every odd payment (late, duplicate,
// wrong amount) into a refund record instead of losing money.

const { FieldValue } = require('firebase-admin/firestore');
const { DomainError } = require('../shared/errors');
const { writeAudit } = require('../shared/audit');

/** Records that money is owed back. The id comes from the gateway reference, so replays are harmless. */
function recordRefundDue(tx, db, { providerRef, orderId, order, amountMinor, reason }) {
  tx.set(db.collection('refunds').doc(`pay_${providerRef}`), {
    ticketId: null, orderId, userId: order.userId, matchId: order.matchId,
    amountMinor, reason, status: 'Approved', auto: true, payoutStatus: 'ManualPending',
    createdAt: FieldValue.serverTimestamp(),
  });
  tx.set(db.collection('payments').doc(), {
    orderId, providerRef, status: 'success', amountMinor, createdAt: FieldValue.serverTimestamp(),
  });
  writeAudit(tx, db, { actorId: 'system', action: 'REFUND_DUE', target: orderId, meta: { reason, providerRef } });
}

/** Idempotent. Only ever called from the server (webhook, verify, mock), never from the client. */
async function confirmPaymentCore(db, signer, { orderId, providerRef, amountMinor }) {
  const orderRef = db.collection('orders').doc(orderId);
  const handledRef = db.collection('refunds').doc(`pay_${providerRef}`);

  return db.runTransaction(async (tx) => {
    const [orderSnap, handledSnap] = await Promise.all([tx.get(orderRef), tx.get(handledRef)]);
    if (!orderSnap.exists) throw new DomainError('not-found', 'Order not found.');
    // A payment reference that was already processed (a retry or replay) does nothing the second time.
    if (handledSnap.exists) return { alreadyHandled: true };

    const order = orderSnap.data();
    const refundCtx = { providerRef, orderId, order, amountMinor };

    if (order.status === 'Paid') {
      if ((order.paidProviderRef ?? order.providerRef) === providerRef) return { alreadyPaid: true };
      recordRefundDue(tx, db, { ...refundCtx, reason: 'Duplicate payment for an order that is already paid' });
      return { refundDue: true };
    }
    if (['Expired', 'Cancelled', 'Failed'].includes(order.status)) {
      recordRefundDue(tx, db, { ...refundCtx, reason: `Payment received for an order that is ${order.status}` });
      return { refundDue: true };
    }
    if (order.status !== 'Pending') {
      throw new DomainError('failed-precondition', `Order is ${order.status}.`);
    }
    // The amount actually paid must equal the order total; otherwise refund, never issue tickets.
    if (amountMinor !== order.totalMinor) {
      recordRefundDue(tx, db, { ...refundCtx, reason: 'Amount paid does not match the order total' });
      return { refundDue: true, mismatch: true };
    }

    const matchRef = db.collection('matches').doc(order.matchId);
    const matchSnap = await tx.get(matchRef);
    const seatRefs = order.seatIds.map((id) => matchRef.collection('inventory').doc(id));
    const seatSnaps = await tx.getAll(...seatRefs);
    const matchData = matchSnap.data();

    // The seats must still be held by this order and the match still on sale.
    const holdIntact = matchData.status === 'OnSale' &&
      seatSnaps.every((s) => s.exists && s.data().heldByOrderId === orderId);

    if (!holdIntact) {
      seatSnaps.forEach((s, i) => {
        if (s.exists && s.data().heldByOrderId === orderId) {
          tx.update(seatRefs[i], { status: 'Available', heldByOrderId: null, holdExpiresAt: null });
        }
      });
      tx.update(orderRef, { status: 'Failed', failureReason: 'Could not fulfil after payment' });
      recordRefundDue(tx, db, { ...refundCtx, reason: 'Could not fulfil after payment' });
      return { failed: true, refundDue: true };
    }

    // From here everything is written in this one transaction: seats sold, tickets issued,
    // order paid and sales stats updated together, or not at all.
    const matchLabel = `${matchData.homeTeam} vs ${matchData.awayTeam}`;
    const priceBySeat = new Map(Object.entries(order.seatPrices ?? {}));
    const counts = new Map();

    seatSnaps.forEach((s, i) => {
      tx.update(seatRefs[i], { status: 'Sold', holdExpiresAt: null });
      const { category, label } = s.data();
      counts.set(category, (counts.get(category) ?? 0) + 1);

      // One ticket per seat. The QR payload is HMAC-signed so it cannot be forged.
      const ticketRef = db.collection('tickets').doc();
      tx.set(ticketRef, {
        orderId, userId: order.userId, matchId: order.matchId, matchLabel,
        kickoff: matchData.kickoff, sport: matchData.sport ?? null, seatId: s.id, seatLabel: label, category,
        priceMinor: priceBySeat.get(s.id) ?? null,
        status: 'Valid', qrPayload: signer.sign(ticketRef.id, order.matchId),
        usedAt: null, usedGate: null, createdAt: FieldValue.serverTimestamp(),
      });
    });

    tx.update(orderRef, {
      status: 'Paid', providerRef, paidProviderRef: providerRef, paidAt: FieldValue.serverTimestamp(),
    });
    tx.set(db.collection('payments').doc(), {
      orderId, providerRef, status: 'success', amountMinor, createdAt: FieldValue.serverTimestamp(),
    });
    tx.set(db.collection('stats').doc(order.matchId), {
      soldCount: FieldValue.increment(order.seatIds.length),
      revenueMinor: FieldValue.increment(order.totalMinor),
      soldByCategory: Object.fromEntries([...counts].map(([c, n]) => [c, FieldValue.increment(n)])),
    }, { merge: true });
    writeAudit(tx, db, {
      actorId: order.userId, action: 'ORDER_PAID', target: orderId, meta: { tickets: order.seatIds.length },
    });

    return { tickets: order.seatIds.length };
  });
}

module.exports = { confirmPaymentCore };
