// Keep in step with functions/src/shared/sports.js. Emoji are written as escapes so they survive any editor.
export const SPORTS = {
  football: { label: 'Football', group: 'Team ball sports', emoji: '\u26BD', sides: ['Home team', 'Away team'] },
  basketball: { label: 'Basketball', group: 'Team ball sports', emoji: '\u{1F3C0}', sides: ['Home team', 'Away team'] },
  volleyball: { label: 'Volleyball', group: 'Team ball sports', emoji: '\u{1F3D0}', sides: ['Home team', 'Away team'] },
  'table-tennis': { label: 'Table tennis', group: 'Racket sports', emoji: '\u{1F3D3}', sides: ['Player 1', 'Player 2'] },
  boxing: { label: 'Boxing', group: 'Combat sports', emoji: '\u{1F94A}', sides: ['Fighter 1', 'Fighter 2'] },
};

export const SPORT_IDS = Object.keys(SPORTS);
export const GROUPS = [...new Set(Object.values(SPORTS).map((s) => s.group))];
export const sportsInGroup = (group) => SPORT_IDS.filter((id) => SPORTS[id].group === group);

// Matches created before sports existed have no sport field; treat them as football.
const norm = (id) => (Object.prototype.hasOwnProperty.call(SPORTS, id) ? id : 'football');
export const sportOf = (match) => norm(match?.sport);
export const sportLabel = (id) => SPORTS[norm(id)].label;
export const sportEmoji = (id) => SPORTS[norm(id)].emoji;
