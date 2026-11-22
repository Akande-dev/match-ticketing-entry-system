const { ScanResult } = require('./rules');

/** Orchestrates a gate scan. Depends only on injected collaborators (SOLID: D, I, O). */
class TicketValidator {
  constructor({ signer, tickets, scanLogs, rules, clock }) {
    this.signer = signer;
    this.tickets = tickets;
    this.scanLogs = scanLogs;
    this.rules = rules;
    this.clock = clock;
  }

  async validate(payload, ctx) {
    const outcome = await this._decide(payload, ctx);
    await this.scanLogs.record({
      ticketId: outcome.ticketId ?? null,
      matchId: ctx.matchId,
      gate: ctx.gate,
      stewardId: ctx.stewardId,
      result: outcome.result,
      scannedAt: this.clock.now(),
    });
    return outcome;
  }

  async _decide(payload, ctx) {
    const parsed = this.signer.verify(payload);
    if (!parsed) return { result: ScanResult.INVALID };

    const ticket = await this.tickets.findById(parsed.ticketId);
    if (!ticket) return { result: ScanResult.INVALID };

    for (const rule of this.rules) {
      const failure = rule.check(ticket, ctx);
      if (failure) return { ...failure, ticketId: ticket.id };
    }

    // Atomic step: protects against two gates scanning the same ticket at once.
    const mark = await this.tickets.markUsedIfValid(ticket.id, {
      gate: ctx.gate, stewardId: ctx.stewardId, at: this.clock.now(),
    });
    if (!mark.marked) {
      return {
        result: ScanResult.ALREADY_USED, ticketId: ticket.id,
        firstUsedAt: mark.ticket.usedAt, firstGate: mark.ticket.usedGate,
      };
    }
    return { result: ScanResult.VALID, ticketId: ticket.id, seatLabel: ticket.seatLabel };
  }
}

module.exports = { TicketValidator };
