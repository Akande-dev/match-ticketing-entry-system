# Defect log

Severity: S1 critical, S2 major, S3 moderate, S4 minor. Only defects that really occurred are listed.

| ID | Title | Found by | Sev | Cause | Fix | Status |
|---|---|---|---|---|---|---|
| DEF-001 | 4 of 7 unit test suites failed to start under Node 26 | Running `npm test` | S3 | errors.js loaded the whole Firebase Functions library at import time, which Jest on Node 26 cannot parse | Load it lazily inside toHttpsError and the auth helpers | Closed (7 suites, 48 tests pass) |
| DEF-002 | Seed script crashed: admin.firestore is not a function | Running `npm run seed` | S3 | The installed firebase-admin version removed the old namespaced API | Use the modular imports (getFirestore) | Closed |
| DEF-003 | Mock payments could be enabled silently by a missing setting | Design review | S1 | Payment factory defaulted to the mock gateway | Factory fails loudly; mock needs ALLOW_MOCK_PAYMENTS=true | Closed (tests in payments.test.js) |
| DEF-004 | Match ids containing dots could not be verified | Test design | S3 | QR parsing split on every dot | Parse first and last dot only | Closed (UT-SIG-06) |
| DEF-005 | A payment arriving after a hold expired would take money without a ticket or refund record | Design review | S2 | No handling for late payments | Refund record created automatically | Closed (IT-PAY-06) |
| DEF-006 | Automatic refund records are not listed on the manager Refunds screen | Exploratory | S2 | Screen shows only requested refunds | Backlog item | Open |
| DEF-007 | A repeat scan of the same QR within 3 seconds is ignored, so the previous result stays on screen | Exploratory | S3 | Deliberate debounce | Show a "duplicate within 3 seconds" notice | Open |

Metrics to report: defects by severity, open versus closed, defect density (defects per KLOC, see reports/metrics.md).

| DEF-008 | Integration test IT-RES-01 failed with a 5-second timeout | Running `npm run test:int` on 22 Nov 2026 | S4 | Default Jest timeout too short for 10 concurrent transactions against a freshly started emulator; the other 18 integration tests passed, including all CR-01 transfer tests | Set testTimeout to 30000 in jest.int.config.js | Closed after re-run |
