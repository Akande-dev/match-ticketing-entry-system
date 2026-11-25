// Backend list of supported sports. Used to validate sport values on events.

// The sports the system supports, grouped into categories. Add a sport here and in web/src/utils/sports.js.
const SPORTS = Object.freeze({
  football: { label: 'Football', group: 'Team ball sports' },
  basketball: { label: 'Basketball', group: 'Team ball sports' },
  volleyball: { label: 'Volleyball', group: 'Team ball sports' },
  'table-tennis': { label: 'Table tennis', group: 'Racket sports' },
  boxing: { label: 'Boxing', group: 'Combat sports' },
});

const SPORT_IDS = Object.keys(SPORTS);
const isSport = (id) => typeof id === 'string' && Object.prototype.hasOwnProperty.call(SPORTS, id);

module.exports = { SPORTS, SPORT_IDS, isSport };
