const { TicketValidator } = require('./TicketValidator');
const { TicketSigner } = require('./TicketSigner');
const { MatchRule, StatusRule, ScanResult } = require('./rules');

function setup(over = {}) {
  const signer = new TicketSigner('test-secret');
  const store = { t1: { id: 't1', matchId: 'm1', status: 'Valid', seatLabel: 'North R3 S4', ...over } };
  const tickets = {
    findById: async (id) => store[id] ?? null,
    markUsedIfValid: async (id, info) => {
      if (store[id].status !== 'Valid') return { marked: false, ticket: store[id] };
      store[id] = { ...store[id], status: 'Used', usedAt: info.at, usedGate: info.gate };
      return { marked: true, ticket: store[id] };
    },
  };
  const logs = [];
  const validator = new TicketValidator({
    signer, tickets, scanLogs: { record: async (e) => { logs.push(e); } },
    rules: [new MatchRule(), new StatusRule()], clock: { now: () => new Date('2026-11-21T15:00:00Z') },
  });
  return { validator, signer, logs, store };
}
const ctx = { matchId: 'm1', gate: 'B', stewardId: 's1' };

test('UT-VAL-01: valid ticket accepted and marked used', async () => {
  const { validator, signer, store } = setup();
  expect((await validator.validate(signer.sign('t1', 'm1'), ctx)).result).toBe(ScanResult.VALID);
  expect(store.t1.status).toBe('Used');
});
test('UT-VAL-02: second scan is AlreadyUsed with first gate', async () => {
  const { validator, signer } = setup();
  const p = signer.sign('t1', 'm1');
  await validator.validate(p, ctx);
  const res = await validator.validate(p, { ...ctx, gate: 'A' });
  expect(res.result).toBe(ScanResult.ALREADY_USED);
  expect(res.firstGate).toBe('B');
});
test('UT-VAL-04: tampered payload is invalid', async () => {
  const { validator, signer } = setup();
  expect((await validator.validate(signer.sign('t1', 'm1').replace('t1', 't2'), ctx)).result).toBe(ScanResult.INVALID);
});
test('UT-VAL-05: other match is rejected', async () => {
  const { validator, signer } = setup({ matchId: 'm2' });
  expect((await validator.validate(signer.sign('t1', 'm2'), ctx)).result).toBe(ScanResult.WRONG_MATCH);
});
test('UT-VAL-06: cancelled, transferred and unknown statuses are refused', async () => {
  for (const status of ['Cancelled', 'Transferred', 'SomethingNew']) {
    const { validator, signer, store } = setup({ status });
    expect((await validator.validate(signer.sign('t1', 'm1'), ctx)).result).toBe(ScanResult.CANCELLED);
    expect(store.t1.status).toBe(status);
  }
});
test('UT-VAL-07: unknown ticket is invalid', async () => {
  const { validator, signer } = setup();
  expect((await validator.validate(signer.sign('ghost', 'm1'), ctx)).result).toBe(ScanResult.INVALID);
});
test('UT-VAL-08: every scan is logged', async () => {
  const { validator, logs } = setup();
  await validator.validate('garbage', ctx);
  expect(logs).toHaveLength(1);
  expect(logs[0].result).toBe(ScanResult.INVALID);
});
