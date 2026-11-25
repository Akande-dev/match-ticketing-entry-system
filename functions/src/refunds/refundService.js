// Refund workflow. A fan requests a refund, then a manager approves or rejects it.
// Approval cancels the ticket, frees the seat if it can be resold and updates the sales stats.
// Paying the money back is a manual step: the system only records that it is owed.

const { FieldValue } = require('firebase-admin/firestore');
const { DomainError } = require('../shared/errors');
const { requireString } = require('../shared/validation');
const { writeAudit } = require('../shared/audit');
const { checkRefundEligibility } = require('./refundLogic');

// The refund document id is the ticket id, so a ticket has at most one live refund record.
async function requestRefundCore(db, { uid, ticketId, reason, now = new Date() }) {
  const id = requireString(ticketId, 'ticketId', 100);
  const cleanReason = typeof reason === 'string' ? reason.trim().slice(0, 200) : '';

  return db.runTransaction(async (tx) => {
    const ticketSnap = await tx.get(db.collection('tickets').doc(id));
    if (!ticketSnap.exists || ticketSnap.data().userId !== uid) {
      throw new DomainError('not-found', 'Ticket not found.');
    }
    const ticket = ticketSnap.data();
    const refundRef = db.collection('refunds').doc(id);
    const [matchSnap, refundSnap] = await Promise.all([
      tx.get(db.collection('matches').doc(ticket.matchId)), tx.get(refundRef),
    ]);

    const verdict = checkRefundEligibility({
      ticket, match: matchSnap.data(), existingRefundStatus: refundSnap.data()?.status, nowMs: now.getTime(),
    });
    if (!verdict.ok) throw new DomainError('failed-precondition', verdict.reason);

    tx.set(refundRef, {
      ticketId: id, orderId: ticket.orderId, userId: uid, matchId: ticket.matchId,
      amountMinor: ticket.priceMinor ?? null, reason: cleanReason,
      status: 'Requested', createdAt: FieldValue.serverTimestamp(),
    });
    writeAudit(tx, db, { actorId: uid, action: 'REFUND_REQUESTED', target: id });
    return { status: 'Requested' };
  });
}

// Manager decision on a requested refund. Runs in one transaction so ticket, seat, stats and
// refund record always change together.
async function decideRefundCore(db, { uid, ticketId, decision, note, now = new Date() }) {
  const id = requireString(ticketId, 'ticketId', 100);
  if (!['approve', 'reject'].includes(decision)) {
    throw new DomainError('invalid-argument', 'Decision must be approve or reject.');
  }
  const cleanNote = typeof note === 'string' ? note.trim().slice(0, 200) : '';

  return db.runTransaction(async (tx) => {
    const refundRef = db.collection('refunds').doc(id);
    const ticketRef = db.collection('tickets').doc(id);
    const [refundSnap, ticketSnap] = await Promise.all([tx.get(refundRef), tx.get(ticketRef)]);
    if (!refundSnap.exists || refundSnap.data().status !== 'Requested' || !ticketSnap.exists) {
      throw new DomainError('failed-precondition', 'No pending refund request for this ticket.');
    }
    const ticket = ticketSnap.data();
    const matchRef = db.collection('matches').doc(ticket.matchId);
    const seatRef = matchRef.collection('inventory').doc(ticket.seatId);
    const [matchSnap, seatSnap] = await Promise.all([tx.get(matchRef), tx.get(seatRef)]);

    const decided = { decidedBy: uid, decidedAt: FieldValue.serverTimestamp(), note: cleanNote };

    if (decision === 'reject') {
      tx.update(refundRef, { status: 'Rejected', ...decided });
      writeAudit(tx, db, { actorId: uid, action: 'REFUND_REJECTED', target: id });
      return { status: 'Rejected' };
    }

    if (ticket.status !== 'Valid') {
      throw new DomainError('failed-precondition', `Ticket is ${ticket.status}; reject this request instead.`);
    }
    tx.update(ticketRef, { status: 'Cancelled', cancelledAt: FieldValue.serverTimestamp() });

    const match = matchSnap.data();
    const seat = seatSnap.data();
    // The seat goes back on sale only if the event is still on sale, in the future, and the seat was sold by this order.
    const reusable = match.status === 'OnSale' && match.kickoff.toMillis() > now.getTime() &&
      seat?.status === 'Sold' && seat.heldByOrderId === ticket.orderId;
    if (reusable) {
      tx.update(seatRef, { status: 'Available', heldByOrderId: null, holdExpiresAt: null });
    }

    tx.set(db.collection('stats').doc(ticket.matchId), {
      soldCount: FieldValue.increment(-1),
      revenueMinor: FieldValue.increment(-(ticket.priceMinor ?? 0)),
      refundedCount: FieldValue.increment(1),
      ...(ticket.category ? { soldByCategory: { [ticket.category]: FieldValue.increment(-1) } } : {}),
    }, { merge: true });

    // Returning the money is a manual step for now; we record that it is owed.
    tx.update(refundRef, { status: 'Approved', payoutStatus: 'ManualPending', ...decided });
    writeAudit(tx, db, { actorId: uid, action: 'REFUND_APPROVED', target: id });
    return { status: 'Approved' };
  });
}

module.exports = { requestRefundCore, decideRefundCore };
