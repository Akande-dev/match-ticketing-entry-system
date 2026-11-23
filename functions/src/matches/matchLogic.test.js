const { validateMatchInput } = require('./matchLogic');

const ctx = { categories: ['VIP', 'Regular'], nowMs: 1000 };
const good = {
  sport: 'football', stadiumId: 's1', homeTeam: ' Home FC ', awayTeam: 'Away', kickoffMs: 2000,
  prices: { VIP: 1500000, Regular: 200000 },
};

test('accepts valid input, trims names and keeps the sport', () => {
  const out = validateMatchInput(good, ctx);
  expect(out.homeTeam).toBe('Home FC');
  expect(out.sport).toBe('football');
  expect(out.prices.get('VIP')).toBe(1500000);
});
test('every supported sport is accepted', () => {
  for (const sport of ['football', 'basketball', 'volleyball', 'table-tennis', 'boxing']) {
    expect(validateMatchInput({ ...good, sport }, ctx).sport).toBe(sport);
  }
});
test.each([
  ['missing sport', { sport: undefined }],
  ['unknown sport', { sport: 'cricket' }],
  ['same side twice', { awayTeam: 'home fc' }],
  ['start in the past', { kickoffMs: 500 }],
  ['missing price', { prices: { VIP: 1500000 } }],
  ['unknown category', { prices: { ...good.prices, Gold: 100 } }],
  ['fractional price', { prices: { VIP: 10.5, Regular: 200000 } }],
  ['negative price', { prices: { VIP: -1, Regular: 200000 } }],
  ['absurd price', { prices: { VIP: 100000001, Regular: 200000 } }],
])('rejects %s', (_n, over) => {
  expect(() => validateMatchInput({ ...good, ...over }, ctx)).toThrow();
});
test('maximum price accepted', () => {
  expect(() => validateMatchInput({ ...good, prices: { VIP: 100000000, Regular: 1 } }, ctx)).not.toThrow();
});
