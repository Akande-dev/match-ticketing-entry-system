const {
  validateRequest, isSeatAvailable, findUnavailable, countActiveHolds, computeTotal,
} = require('./reservationLogic');
const ts = (ms) => ({ toMillis: () => ms });

test('UT-RES-01: rejects empty, oversized and duplicate selections', () => {
  expect(() => validateRequest({ matchId: 'm', seatIds: [] })).toThrow();
  expect(() => validateRequest({ matchId: 'm', seatIds: ['1','2','3','4','5','6','7'] })).toThrow();
  expect(() => validateRequest({ matchId: 'm', seatIds: ['a', 'a'] })).toThrow();
  expect(() => validateRequest({ matchId: 'm', seatIds: ['1','2','3','4','5','6'] })).not.toThrow();
});
test('UT-RES-02: seat availability', () => {
  expect(isSeatAvailable({ status: 'Available' }, 1000)).toBe(true);
  expect(isSeatAvailable({ status: 'Held', holdExpiresAt: ts(2000) }, 1000)).toBe(false);
  expect(isSeatAvailable({ status: 'Held', holdExpiresAt: ts(500) }, 1000)).toBe(true);
  expect(isSeatAvailable({ status: 'Sold' }, 1000)).toBe(false);
  expect(isSeatAvailable(undefined, 1000)).toBe(false);
});
test('UT-RES-03: findUnavailable lists blocked seats', () => {
  const docs = [{ id: 'a', data: { status: 'Available' } }, { id: 'b', data: { status: 'Sold' } }];
  expect(findUnavailable(docs, 0)).toEqual(['b']);
});
test('UT-RES-04: countActiveHolds counts only unexpired Pending orders', () => {
  expect(countActiveHolds([
    { status: 'Pending', holdExpiresAt: ts(2000) },
    { status: 'Pending', holdExpiresAt: ts(500) },
    { status: 'Paid', holdExpiresAt: ts(2000) },
  ], 1000)).toBe(1);
});
test('UT-RES-05: computeTotal sums a Map of prices and fails on a missing price', () => {
  const docs = [{ id: 'a', data: { category: 'VIP' } }, { id: 'b', data: { category: 'VIP' } }];
  expect(computeTotal(docs, new Map([['VIP', 100]]))).toBe(200);
  expect(() => computeTotal(docs, new Map())).toThrow();
});
