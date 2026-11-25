const { ALPHABET, generateTicketNumber, normaliseTicketNumber } = require('./ticketNumber');

describe('ticket numbers', () => {
  test('have the TKT- format and no look-alike characters', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generateTicketNumber()).toMatch(/^TKT-[A-HJKMNP-Z2-9]{8}$/);
    }
    ['0', 'O', '1', 'I', 'L'].forEach((c) => expect(ALPHABET).not.toContain(c));
  });
  test('2000 generated numbers are all different', () => {
    const set = new Set(Array.from({ length: 2000 }, generateTicketNumber));
    expect(set.size).toBe(2000);
  });
  test('normalise tidies case and spaces', () => {
    expect(normaliseTicketNumber('  tkt-7k4m9q2x ')).toBe('TKT-7K4M9Q2X');
  });
  test('normalise accepts a number typed without the prefix', () => {
    expect(normaliseTicketNumber('7k4m9q2x')).toBe('TKT-7K4M9Q2X');
  });
  test('normalise rejects bad input', () => {
    [null, undefined, 42, '', 'hello', 'TKT-123', 'TKT-0000000O'].forEach((v) => expect(normaliseTicketNumber(v)).toBeNull());
  });
});
