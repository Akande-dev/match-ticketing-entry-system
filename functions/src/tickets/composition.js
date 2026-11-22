const { TicketSigner } = require('./TicketSigner');
const { TicketValidator } = require('./TicketValidator');
const { MatchRule, StatusRule } = require('./rules');
const { FirestoreTicketRepository } = require('./FirestoreTicketRepository');
const { FirestoreScanLogRepository } = require('./FirestoreScanLogRepository');

/** The only place where concrete classes meet. */
function buildTicketValidator({ db, secret }) {
  return new TicketValidator({
    signer: new TicketSigner(secret),
    tickets: new FirestoreTicketRepository(db),
    scanLogs: new FirestoreScanLogRepository(db),
    rules: [new MatchRule(), new StatusRule()],
    clock: { now: () => new Date() },
  });
}

module.exports = { buildTicketValidator };
