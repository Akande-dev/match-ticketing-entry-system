const TRANSFER_CUTOFF_MS = 2 * 60 * 60 * 1000; // transfers close 2 hours before kick-off
const MAX_TRANSFERS = 1; // one transfer per ticket limits resale

/** @returns {{ok: boolean, reason: string}} */
function checkTransferEligibility({ ticket, match, openRefundStatus, nowMs }) {
  if (!ticket) return { ok: false, reason: 'Ticket not found.' };
  if (ticket.status !== 'Valid') return { ok: false, reason: `This ticket is ${ticket.status}.` };
  if ((ticket.transferCount ?? 0) >= MAX_TRANSFERS) {
    return { ok: false, reason: 'This ticket has already been transferred once.' };
  }
  if (['Requested', 'Approved'].includes(openRefundStatus)) {
    return { ok: false, reason: 'Cancel or finish the refund request before transferring.' };
  }
  if (match.status !== 'OnSale') return { ok: false, reason: 'This match is no longer on sale.' };
  if (match.kickoff.toMillis() - nowMs < TRANSFER_CUTOFF_MS) {
    return { ok: false, reason: 'Transfers close 2 hours before kick-off.' };
  }
  return { ok: true, reason: '' };
}

module.exports = { TRANSFER_CUTOFF_MS, MAX_TRANSFERS, checkTransferEligibility };
