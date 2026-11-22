const { Timestamp, FieldValue } = require('firebase-admin/firestore');
const { DomainError } = require('../shared/errors');
const { requireString } = require('../shared/validation');
const { writeAudit } = require('../shared/audit');
const { commitInChunks } = require('../shared/batch');
const { validateMatchInput } = require('./matchLogic');

async function loadSections(db, stadiumId) {
  const snap = await db.collection('stadiums').doc(stadiumId).collection('sections').get();
  if (snap.empty) throw new DomainError('failed-precondition', 'That stadium has no sections.');
  return snap.docs;
}

/** Creates or updates a DRAFT match and its prices. */
async function saveMatchCore(db, { uid, matchId, input, now = new Date() }) {
  const stadiumId = requireString(input?.stadiumId, 'Stadium', 100);
  const sections = await loadSections(db, stadiumId);
  const categories = [...new Set(sections.map((s) => s.data().category))];
  const data = validateMatchInput({ ...input, stadiumId }, { categories, nowMs: now.getTime() });

  const matchRef = matchId
    ? db.collection('matches').doc(requireString(matchId, 'matchId', 100))
    : db.collection('matches').doc();
  if (matchId) {
    const existing = await matchRef.get();
    if (!existing.exists) throw new DomainError('not-found', 'Match not found.');
    if (existing.data().status !== 'Draft') {
      throw new DomainError('failed-precondition', 'Only draft matches can be edited.');
    }
  }

  const batch = db.batch();
  const oldPrices = await matchRef.collection('prices').get();
  oldPrices.docs.forEach((d) => batch.delete(d.ref));
  data.prices.forEach((amountMinor, category) =>
    batch.set(matchRef.collection('prices').doc(category), { amountMinor, currency: 'NGN' }));

  batch.set(matchRef, {
    stadiumId: data.stadiumId, homeTeam: data.homeTeam, awayTeam: data.awayTeam,
    kickoff: Timestamp.fromMillis(data.kickoffMs), status: 'Draft',
    minPrice: Math.min(...data.prices.values()), updatedAt: FieldValue.serverTimestamp(),
    ...(matchId ? {} : { createdBy: uid, createdAt: FieldValue.serverTimestamp() }),
  }, { merge: true });
  writeAudit(batch, db, { actorId: uid, action: matchId ? 'MATCH_UPDATED' : 'MATCH_CREATED', target: matchRef.id });

  await batch.commit();
  return { matchId: matchRef.id };
}

/** Seeds seat inventory from the stadium layout, then opens sales. Safe to retry. */
async function publishMatchCore(db, { uid, matchId }) {
  const matchRef = db.collection('matches').doc(requireString(matchId, 'matchId', 100));
  const snap = await matchRef.get();
  if (!snap.exists) throw new DomainError('not-found', 'Match not found.');
  const match = snap.data();
  if (match.status !== 'Draft') throw new DomainError('failed-precondition', 'Only draft matches can be published.');
  if (match.kickoff.toMillis() <= Date.now()) throw new DomainError('failed-precondition', 'Kick-off has passed.');

  const priceSnap = await matchRef.collection('prices').get();
  const priced = new Set(priceSnap.docs.map((d) => d.id));
  const sections = await loadSections(db, match.stadiumId);
  if (sections.some((s) => !priced.has(s.data().category))) {
    throw new DomainError('failed-precondition', 'Every seat category needs a price.');
  }

  const ops = [];
  for (const section of sections) {
    const { name, category } = section.data();
    const seats = await section.ref.collection('seats').get();
    seats.forEach((seat) => {
      const { row, number } = seat.data();
      ops.push((b) => b.set(matchRef.collection('inventory').doc(seat.id), {
        sectionId: section.id, category, label: `${name} Row ${row} Seat ${number}`,
        status: 'Available', heldByOrderId: null, holdExpiresAt: null,
      }));
    });
  }
  ops.push((b) => b.set(db.collection('stats').doc(matchRef.id), {
    soldCount: 0, revenueMinor: 0, refundedCount: 0, attendance: 0,
  }, { merge: true }));
  await commitInChunks(db, ops);

  // The status flips last, so a failed run leaves a Draft that can be published again.
  const batch = db.batch();
  batch.update(matchRef, { status: 'OnSale', publishedAt: FieldValue.serverTimestamp() });
  writeAudit(batch, db, { actorId: uid, action: 'MATCH_PUBLISHED', target: matchRef.id });
  await batch.commit();
  return { status: 'OnSale', seats: ops.length - 1 };
}

async function cancelMatchCore(db, { uid, matchId }) {
  const matchRef = db.collection('matches').doc(requireString(matchId, 'matchId', 100));
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(matchRef);
    if (!snap.exists) throw new DomainError('not-found', 'Match not found.');
    if (!['Draft', 'OnSale'].includes(snap.data().status)) {
      throw new DomainError('failed-precondition', 'This match cannot be cancelled.');
    }
    tx.update(matchRef, { status: 'Cancelled', cancelledAt: FieldValue.serverTimestamp() });
    writeAudit(tx, db, { actorId: uid, action: 'MATCH_CANCELLED', target: matchRef.id });
  });
  return { status: 'Cancelled' }; // fans then request refunds
}

module.exports = { saveMatchCore, publishMatchCore, cancelMatchCore };
