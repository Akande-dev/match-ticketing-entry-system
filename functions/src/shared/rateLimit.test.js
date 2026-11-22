const { nextWindow } = require('./rateLimit');
const cfg = { limit: 3, windowMs: 60000 };

test('allows up to the limit, then refuses with a retry time', () => {
  let state;
  for (let i = 0; i < 3; i += 1) {
    const v = nextWindow(state, 1000 + i, cfg);
    expect(v.allowed).toBe(true);
    state = v.state;
  }
  const refused = nextWindow(state, 5000, cfg);
  expect(refused.allowed).toBe(false);
  expect(refused.retryAfterMs).toBe(56000);
});
test('a new window starts after the old one ends', () => {
  expect(nextWindow({ windowStartMs: 0, count: 3 }, 60000, cfg))
    .toEqual({ allowed: true, state: { windowStartMs: 60000, count: 1 } });
});
