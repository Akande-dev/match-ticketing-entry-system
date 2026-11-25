// Validation rules applied at the gate (Open/Closed principle: add a rule without changing the validator).

// Each rule has one job: return a failing outcome, or null if the ticket passes.
const ScanResult = Object.freeze({
  VALID: 'Valid',
  ALREADY_USED: 'AlreadyUsed',
  INVALID: 'Invalid',
  WRONG_MATCH: 'WrongMatch',
  CANCELLED: 'Cancelled',
});

// Rejects a ticket that belongs to a different match.
class MatchRule {
  check(ticket, ctx) {
    return ticket.matchId === ctx.matchId ? null : { result: ScanResult.WRONG_MATCH };
  }
}

// Admits only tickets whose status is Valid.
class StatusRule {
  check(ticket) {
    if (ticket.status === 'Valid') return null;
    if (ticket.status === 'Used') {
      return { result: ScanResult.ALREADY_USED, firstUsedAt: ticket.usedAt, firstGate: ticket.usedGate };
    }
    // Cancelled, or any status added in future: refuse. Fail closed, never admit by default.
    return { result: ScanResult.CANCELLED };
  }
}

module.exports = { ScanResult, MatchRule, StatusRule };
