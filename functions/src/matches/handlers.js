const { callable } = require('../shared/callable');
const { saveMatchCore, publishMatchCore, cancelMatchCore } = require('./matchService');

const MANAGERS = ['manager', 'admin'];

exports.saveMatch = callable(MANAGERS, ({ auth, data, db }) =>
  saveMatchCore(db, { uid: auth.uid, matchId: data.matchId, input: data.input }));

exports.publishMatch = callable(MANAGERS, ({ auth, data, db }) =>
  publishMatchCore(db, { uid: auth.uid, matchId: data.matchId }));

exports.cancelMatch = callable(MANAGERS, ({ auth, data, db }) =>
  cancelMatchCore(db, { uid: auth.uid, matchId: data.matchId }));
