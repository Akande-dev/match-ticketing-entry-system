const { DomainError } = require('../shared/errors');

const MAX_TEAM_LENGTH = 60;
const MAX_PRICE_MINOR = 100_000_000; // 1,000,000 naira sanity cap

const bad = (msg) => new DomainError('invalid-argument', msg);

function validateMatchInput(input, { categories, nowMs }) {
  const { homeTeam, awayTeam, kickoffMs, stadiumId, prices } = input ?? {};
  const home = typeof homeTeam === 'string' ? homeTeam.trim() : '';
  const away = typeof awayTeam === 'string' ? awayTeam.trim() : '';

  if (!home || !away || home.length > MAX_TEAM_LENGTH || away.length > MAX_TEAM_LENGTH) {
    throw bad('Both team names are required (max 60 characters).');
  }
  if (home.toLowerCase() === away.toLowerCase()) throw bad('A team cannot play itself.');
  if (!Number.isFinite(kickoffMs) || kickoffMs <= nowMs) throw bad('Kick-off must be in the future.');
  if (!prices || typeof prices !== 'object') throw bad('Prices are required.');

  const priceMap = new Map(Object.entries(prices));
  for (const key of priceMap.keys()) {
    if (!categories.includes(key)) throw bad(`Unknown seat category: ${key}.`);
  }
  const clean = new Map();
  for (const category of categories) {
    const amount = priceMap.get(category);
    if (!Number.isInteger(amount) || amount <= 0 || amount > MAX_PRICE_MINOR) {
      throw bad(`Set a valid price for ${category}.`);
    }
    clean.set(category, amount);
  }
  return { homeTeam: home, awayTeam: away, kickoffMs, stadiumId, prices: clean };
}

module.exports = { validateMatchInput };
