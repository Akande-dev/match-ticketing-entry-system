const admin = require('firebase-admin');
const { setGlobalOptions } = require('firebase-functions/v2');

admin.initializeApp();
setGlobalOptions({ maxInstances: 10 }); // bounds cost and blast radius of a request flood

module.exports = {
  ...require('./src/users/handlers'),
  ...require('./src/reservations/handlers'),
  ...require('./src/payments/handlers'),
  ...require('./src/tickets/handlers'),
  ...require('./src/matches/handlers'),
  ...require('./src/refunds/handlers'),
};
