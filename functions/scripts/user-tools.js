// Usage:
//   node functions/scripts/user-tools.js admin   you@example.com   -> makes that account an admin
//   node functions/scripts/user-tools.js ticket  you@example.com   -> copies the newest ticket's QR text
process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';

const { execSync } = require('child_process');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({ projectId: 'demo-mtses' });
const [mode, email] = process.argv.slice(2);

(async () => {
  if (!['admin', 'ticket'].includes(mode) || !email) {
    console.error('Usage: node functions/scripts/user-tools.js <admin|ticket> <email>');
    process.exit(1);
  }
  let user;
  try {
    user = await getAuth().getUserByEmail(email);
  } catch {
    console.error(`No account found for ${email}. Check the spelling, and that the emulators are running.`);
    process.exit(1);
  }

  if (mode === 'admin') {
    await getAuth().setCustomUserClaims(user.uid, { role: 'admin' });
    await getFirestore().collection('users').doc(user.uid).set({ role: 'admin' }, { merge: true });
    console.error(`DONE: ${email} is now an admin.`);
    console.error('Now LOG OUT and LOG BACK IN on the website so it picks up the new role.');
    return;
  }

  const snap = await getFirestore().collection('tickets').where('userId', '==', user.uid).get();
  if (snap.empty) {
    console.error('That account has no tickets yet. Buy one on the website first.');
    process.exit(1);
  }
  const tickets = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  tickets.forEach((t, i) => console.error(`${i + 1}. ${t.matchLabel} - ${t.seatLabel} - status: ${t.status}`));
  const pick = tickets.find((t) => t.status === 'Valid') ?? tickets[0];
  execSync('clip', { input: pick.qrPayload });
  console.error(`\nCOPIED to clipboard: ${pick.seatLabel} (${pick.status}).`);
  console.error('Now click into the "Manual entry" box on the Scanner page and press Ctrl+V.');
})();
