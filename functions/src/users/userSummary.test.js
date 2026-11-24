const { toUserSummary } = require('./userSummary');

describe('toUserSummary', () => {
  test('maps a staff account', () => {
    expect(toUserSummary({ uid: 'a', email: 'a@x.com', displayName: 'Ann', customClaims: { role: 'manager' }, disabled: false }))
      .toEqual({ uid: 'a', email: 'a@x.com', name: 'Ann', role: 'manager', disabled: false });
  });
  test('missing or unknown role becomes fan', () => {
    expect(toUserSummary({ uid: 'b' }).role).toBe('fan');
    expect(toUserSummary({ uid: 'c', customClaims: { role: 'superuser' } }).role).toBe('fan');
  });
  test('never exposes password fields', () => {
    const s = toUserSummary({ uid: 'd', passwordHash: 'x', passwordSalt: 'y' });
    expect(Object.keys(s).sort()).toEqual(['disabled', 'email', 'name', 'role', 'uid']);
  });
  test('only disabled === true counts as disabled', () => {
    expect(toUserSummary({ uid: 'e', disabled: true }).disabled).toBe(true);
    expect(toUserSummary({ uid: 'f' }).disabled).toBe(false);
  });
});
