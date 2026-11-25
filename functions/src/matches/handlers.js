// Cloud Function entry points for managing events. Only managers and admins may call them.

const { callable } = require('../shared/callable');
const { saveMatchCore, publishMatchCore, cancelMatchCore } = require('./matchService');

const MANAGERS = ['manager', 'admin'];

// Create or edit a draft event.
exports.saveMatch = callable(MANAGERS, ({ auth, data, db }) =>
  saveMatchCore(db, { uid: auth.uid, matchId: data.matchId, input: data.input }));

// Open a draft event for sale (creates its seat inventory).
exports.publishMatch = callable(MANAGERS, ({ auth, data, db }) =>
  publishMatchCore(db, { uid: auth.uid, matchId: data.matchId }));

// Cancel an event; fans can then request refunds.
exports.cancelMatch = callable(MANAGERS, ({ auth, data, db }) =>
  cancelMatchCore(db, { uid: auth.uid, matchId: data.matchId }));
