const { onSchedule } = require('firebase-functions/v2/scheduler');
const { logger } = require('firebase-functions');
const { getFirestore } = require('firebase-admin/firestore');
const { releaseExpiredHoldsCore } = require('./expiryService');

exports.releaseExpiredHolds = onSchedule('every 5 minutes', async () => {
  logger.info('releaseExpiredHolds', await releaseExpiredHoldsCore(getFirestore()));
});
