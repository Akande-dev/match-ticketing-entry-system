// Firestore storage for tickets, behind a small interface so the validator can be unit tested
// with a fake repository.

class FirestoreTicketRepository {
  constructor(db) { this.db = db; }

  async findById(id) {
    const snap = await this.db.collection('tickets').doc(id).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  }

  /** Atomically marks a ticket Used if, and only if, it is still Valid. */
  async markUsedIfValid(id, { gate, stewardId, at }) {
    const ref = this.db.collection('tickets').doc(id);
    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const ticket = { id: snap.id, ...snap.data() };
      if (ticket.status !== 'Valid') return { marked: false, ticket };
      tx.update(ref, { status: 'Used', usedAt: at, usedGate: gate, usedBy: stewardId });
      return { marked: true, ticket };
    });
  }
}

module.exports = { FirestoreTicketRepository };
