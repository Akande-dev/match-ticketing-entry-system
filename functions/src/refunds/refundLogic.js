const REFUND_CUTOFF_MS = 48 * 60 * 60 * 1000; // refunds close 48 hours before kick-off

/** @returns {{ok: boolean, reason: string}} */
function checkRefundEligibility({ ticket, match, existingRefundStatus, nowMs }) {
  if (!ticket) return { ok: false, reason: 'Ticket not found.' };
  if (ticket.status !== 'Valid') return { ok: false, reason: `This ticket is ${ticket.status}.` };
  if (['Requested', 'Approved'].includes(existingRefundStatus)) {
    return { ok: false, reason: 'A refund is already in progress for this ticket.' };
  }
  if (match.status === 'Cancelled') return { ok: true, reason: 'Match cancelled.' };
  if (match.kickoff.toMillis() - nowMs >= REFUND_CUTOFF_MS) return { ok: true, reason: 'Before cut-off.' };
  return { ok: false, reason: 'Refunds close 48 hours before kick-off.' };
}

module.exports = { REFUND_CUTOFF_MS, checkRefundEligibility };
