// Usage: npm run set-role -- <uid> <fan|steward|manager|admin>
const remote = process.argv.includes('--remote');
if (!remote) {
  process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
}
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'demo-mtses' });

const [uid, role] = process.argv.slice(2);
if (!uid || !['fan', 'steward', 'manager', 'admin'].includes(role)) {
  console.error('Usage: npm run set-role -- <uid> <fan|steward|manager|admin>');
  process.exit(1);
}
(async () => {
  await getAuth().setCustomUserClaims(uid, { role });
  await getFirestore().collection('users').doc(uid).set({ role }, { merge: true });
  console.error(`${uid} is now ${role}. Log out and back in to refresh the token.`);
})();
