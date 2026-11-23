const { SPORTS, SPORT_IDS, isSport } = require('./sports');

test('five sports in three categories', () => {
  expect(SPORT_IDS).toEqual(['football', 'basketball', 'volleyball', 'table-tennis', 'boxing']);
  expect(new Set(Object.values(SPORTS).map((s) => s.group)).size).toBe(3);
});

test('isSport accepts only known ids', () => {
  expect(isSport('boxing')).toBe(true);
  for (const bad of ['', 'cricket', 'toString', '__proto__', null, undefined, 5]) {
    expect(isSport(bad)).toBe(false);
  }
});
