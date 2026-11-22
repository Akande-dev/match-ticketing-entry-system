const { TicketSigner } = require('./TicketSigner');
const signer = new TicketSigner('unit-test-secret');

test('UT-SIG-01: signed payload verifies and returns its parts', () => {
  expect(signer.verify(signer.sign('t1', 'm1'))).toEqual({ ticketId: 't1', matchId: 'm1' });
});
test('UT-SIG-02: tampering invalidates the payload', () => {
  const [t, m, s] = signer.sign('t1', 'm1').split('.');
  expect(signer.verify(`t2.${m}.${s}`)).toBeNull();
  expect(signer.verify(`${t}.m2.${s}`)).toBeNull();
  expect(signer.verify(`${t}.${m}.${s}A`)).toBeNull();
});
test('UT-SIG-03: another secret is rejected', () => {
  expect(signer.verify(new TicketSigner('other').sign('t1', 'm1'))).toBeNull();
});
test.each(['', 'abc', 'a.b', 'a.b.', '.b.c', 'a..c', null, undefined, 42])(
  'UT-SIG-04: malformed payload %p is rejected', (p) => expect(signer.verify(p)).toBeNull());
test('UT-SIG-05: empty secret refused', () => {
  expect(() => new TicketSigner('')).toThrow();
});
test('UT-SIG-06: match ids containing dots still verify', () => {
  expect(signer.verify(signer.sign('t1', 'league.2026.m1'))).toEqual({ ticketId: 't1', matchId: 'league.2026.m1' });
});
