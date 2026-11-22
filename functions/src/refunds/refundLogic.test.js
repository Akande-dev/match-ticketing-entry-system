const { checkRefundEligibility } = require('./refundLogic');

const HOUR = 3600000;
const NOW = 1000000000;
const match = (h, status = 'OnSale') => ({ status, kickoff: { toMillis: () => NOW + h * HOUR } });
const check = (over) => checkRefundEligibility({ ticket: { status: 'Valid' }, match: match(100), nowMs: NOW, ...over });

test('allowed well before kick-off', () => expect(check({}).ok).toBe(true));
test('48-hour boundary', () => {
  expect(check({ match: match(48) }).ok).toBe(true);
  expect(check({ match: match(47.99) }).ok).toBe(false);
});
test('allowed in the window if the match was cancelled', () => expect(check({ match: match(1, 'Cancelled') }).ok).toBe(true));
test('refused for used or cancelled tickets', () => {
  expect(check({ ticket: { status: 'Used' } }).ok).toBe(false);
  expect(check({ ticket: { status: 'Cancelled' } }).ok).toBe(false);
});
test('open request blocks, rejected does not', () => {
  expect(check({ existingRefundStatus: 'Requested' }).ok).toBe(false);
  expect(check({ existingRefundStatus: 'Approved' }).ok).toBe(false);
  expect(check({ existingRefundStatus: 'Rejected' }).ok).toBe(true);
});
