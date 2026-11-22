class FirestoreScanLogRepository {
  constructor(db) { this.db = db; }
  async record(entry) {
    await this.db.collection('scanLogs').add(entry);
  }
}

module.exports = { FirestoreScanLogRepository };
