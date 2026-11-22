// Usage: npm run set-role -- <uid> <fan|steward|manager|admin>
const remote = process.argv.includes('--remote');
if (!remote) {
  process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
}
const admin = require('firebase-admin');
admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'demo-mtses' });

const [uid, role] = process.argv.slice(2);
if (!uid || !['fan', 'steward', 'manager', 'admin'].includes(role)) {
  console.error('Usage: npm run set-role -- <uid> <fan|steward|manager|admin>');
  process.exit(1);
}
(async () => {
  await admin.auth().setCustomUserClaims(uid, { role });
  await admin.firestore().collection('users').doc(uid).set({ role }, { merge: true });
  console.error(`${uid} is now ${role}. Sign out and in again to refresh the token.`);
})();
