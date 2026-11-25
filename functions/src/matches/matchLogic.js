// Pure validation of event input (sport, teams, kick-off, prices). No database access, so unit tested.

const { DomainError } = require('../shared/errors');
const { isSport } = require('../shared/sports');

const MAX_TEAM_LENGTH = 60;
const MAX_PRICE_MINOR = 100_000_000; // 1,000,000 naira sanity cap

// Shortcut for building a validation error.
const bad = (msg) => new DomainError('invalid-argument', msg);

// Returns cleaned values, or throws a DomainError describing the first problem found.
// 'categories' are the seat categories of the chosen venue; every one needs a price.
function validateMatchInput(input, { categories, nowMs }) {
  const { sport, homeTeam, awayTeam, kickoffMs, stadiumId, prices } = input ?? {};
  if (!isSport(sport)) throw bad('Choose a sport.');

  const home = typeof homeTeam === 'string' ? homeTeam.trim() : '';
  const away = typeof awayTeam === 'string' ? awayTeam.trim() : '';
  if (!home || !away || home.length > MAX_TEAM_LENGTH || away.length > MAX_TEAM_LENGTH) {
    throw bad('Both sides are required (max 60 characters each).');
  }
  if (home.toLowerCase() === away.toLowerCase()) throw bad('Both sides cannot be the same.');
  if (!Number.isFinite(kickoffMs) || kickoffMs <= nowMs) throw bad('Start time must be in the future.');
  if (!prices || typeof prices !== 'object') throw bad('Prices are required.');

  // Reject price keys that are not seat categories of this venue.
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
  return { sport, homeTeam: home, awayTeam: away, kickoffMs, stadiumId, prices: clean };
}

module.exports = { validateMatchInput };
