// Saves every gate scan (valid or rejected) to the scanLogs collection as an audit record.

class FirestoreScanLogRepository {
  constructor(db) { this.db = db; }
  async record(entry) {
    await this.db.collection('scanLogs').add(entry);
  }
}

module.exports = { FirestoreScanLogRepository };
