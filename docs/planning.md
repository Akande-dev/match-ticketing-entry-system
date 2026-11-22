# Planning: MoSCoW, backlog, schedule, risks

## MoSCoW
- **Must:** FR-01 to FR-14, FR-18, FR-20 (the complete buy-to-entry flow).
- **Should:** FR-15 offline scanning, FR-16/17 refunds, FR-19, FR-21 email, FR-22 user screen.
- **Could:** Google sign-in, PDF tickets, CSV export, dark mode.
- **Won'"'"'t (this release):** real-money payments, native apps, resale marketplace, biometrics.

## Backlog and estimates (story points; 1 SP is about 2 hours)
| ID | Item | SP | Priority | Status |
|---|---|---|---|---|
| B-01 | Scaffold, lint, tests, emulators | 3 | Must | Done |
| B-02 | Register and login | 5 | Must | Done |
| B-03 | Roles and route guards | 5 | Must | Done |
| B-04 | Stadium and seats (seed) | 5 | Must | Done |
| B-05 | Match management | 5 | Must | Done |
| B-06 | Pricing | 3 | Must | Done |
| B-07 | Browse matches | 5 | Must | Done |
| B-08 | Seat grid | 8 | Must | Done |
| B-09 | Seat hold transaction | 13 | Must | Done |
| B-10 | Hold expiry job | 5 | Must | Done |
| B-11 | Checkout and payment gateway | 8 | Must | Done (mock) |
| B-12 | Payment confirmation, late and duplicate handling | 8 | Must | Done |
| B-13 | QR signing | 5 | Must | Done |
| B-14 | My tickets | 5 | Must | Done |
| B-16 | Scanner screen | 8 | Must | Done |
| B-17 | Validation function | 8 | Must | Done |
| B-19/20 | Refunds | 13 | Should | Done |
| B-21 | Sales dashboard | 8 | Must | Done |
| B-24 | Audit log | 5 | Must | Done |
| B-26 | Unit tests | 8 | Must | Done (48 tests) |
| B-27 | Integration tests (emulator) | 8 | Must | Written, run `npm run test:int` |
| B-18 | Offline scanning | 8 | Should | Descoped |
| B-15 | Email | 5 | Should | Not built |
| B-22 | User management screen | 5 | Should | Not built |
| CR-01 | Ticket transfer | 14 | Should | Specified |
Update the Status column with your real dates.

## 13-week plan
| Week | Work |
|---|---|
| 1 | Proposal, process model, repository |
| 2 | Stakeholders, requirements, SRS 1-3, user stories |
| 3 | MoSCoW, estimates, backlog, risk register |
| 4 | UML models |
| 5 | Architecture, ERD, schema |
| 6 | Design patterns, wireframes, SOLID module, project setup |
| 7 | Module 1 (auth and roles) with pull requests |
| 8 | Working prototype demo, progress report |
| 9 | Remaining modules, peer review, refactor, static analysis |
| 10 | Test plan, unit and integration tests, coverage, defects |
| 11 | Threat model, OWASP check, CI, deployment |
| 12 | Change request, documentation, metrics |
| 13 | Final demo, report, peer assessment, reflection |

## Risk register (P and I scored 1-5)
| ID | Risk | P | I | Score | Mitigation |
|---|---|---|---|---|---|
| R1 | Double booking under concurrency | 3 | 5 | 15 | Firestore transactions; concurrency test |
| R2 | Team unfamiliar with Firebase | 4 | 4 | 16 | Spike early; use emulators |
| R3 | Scope creep | 4 | 3 | 12 | MoSCoW; change requests |
| R4 | Payment sandbox delays | 3 | 4 | 12 | Gateway interface plus mock |
| R5 | Forged or shared QR codes | 3 | 5 | 15 | HMAC signature; one-time use |
| R6 | Wrong Firestore rules expose data | 3 | 5 | 15 | Default deny; rules reviewed |
| R7 | Late payment charges a customer with no ticket | 2 | 5 | 10 | Refund record created automatically |
| R8 | New tool versions break the build | 3 | 3 | 9 | Lockfiles; fix and log defects (see defect log) |
| R9 | Slow internet blocks installs | 4 | 3 | 12 | npm retry settings |
| R10 | Demo failure | 3 | 4 | 12 | Backup recording; manual QR entry |
