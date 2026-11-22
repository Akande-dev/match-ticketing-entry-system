const { checkTransferEligibility } = require('./transferLogic');

const HOUR = 3600000;
const NOW = 1000000000;
const match = (h, status = 'OnSale') => ({ status, kickoff: { toMillis: () => NOW + h * HOUR } });
const check = (over) => checkTransferEligibility({ ticket: { status: 'Valid' }, match: match(100), nowMs: NOW, ...over });

test('UT-TRF-01: a valid, untransferred ticket well before kick-off is allowed', () => {
  expect(check({}).ok).toBe(true);
});
test('UT-TRF-02: boundary: exactly 2 hours before kick-off is allowed, just under is refused', () => {
  expect(check({ match: match(2) }).ok).toBe(true);
  expect(check({ match: match(1.99) }).ok).toBe(false);
});
test('UT-TRF-03: used, cancelled and already-transferred tickets are refused', () => {
  expect(check({ ticket: { status: 'Used' } }).ok).toBe(false);
  expect(check({ ticket: { status: 'Cancelled' } }).ok).toBe(false);
  expect(check({ ticket: { status: 'Valid', transferCount: 1 } }).ok).toBe(false);
});
test('UT-TRF-04: an open refund blocks transfer; a rejected one does not', () => {
  expect(check({ openRefundStatus: 'Requested' }).ok).toBe(false);
  expect(check({ openRefundStatus: 'Approved' }).ok).toBe(false);
  expect(check({ openRefundStatus: 'Rejected' }).ok).toBe(true);
});
test('UT-TRF-05: a match that is not on sale blocks transfer', () => {
  expect(check({ match: match(100, 'Cancelled') }).ok).toBe(false);
});
