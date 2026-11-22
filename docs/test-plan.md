# Test plan

## 1. Scope and approach
| Level | What | Tool | Status |
|---|---|---|---|
| Unit | Pure logic: signing, validation rules, seat logic, match and refund rules, rate limit, gateways | Jest | 48 tests passing |
| Integration | Real Firestore emulator: concurrency, payments, refunds, gate scans | Jest + emulator | Written (npm run test:int) |
| System | Full flows in the browser | Manual scripts below | Done for ST-01 to ST-04 |
| Security | Rules and role checks | Manual and code review | See security.md |

## 2. Risk-based priorities
Highest depth for: no double sale, payment handling, QR signing and gate validation, access control.

## 3. Entry and exit criteria
Entry: build runs, emulators start, seed works.
Exit: all Must test cases executed; no open severity 1 or 2 defects; unit tests pass; known gaps documented.

## 4. Key test cases
| ID | Requirement | Scenario | Level |
|---|---|---|---|
| UT-SIG-01..06 | FR-11 | Sign and verify; tampering, wrong secret, malformed input | Unit |
| UT-VAL-01..08 | FR-13/14 | Valid, used, wrong match, cancelled, unknown, logging | Unit |
| UT-RES-01..05 | FR-07/08 | Seat limits, availability, hold cap, totals | Unit |
| UT-MATCH | FR-03/05 | Match validation and price boundaries | Unit |
| UT-REF | FR-16 | Refund eligibility and 48-hour boundary | Unit |
| UT-PAY | FR-10 | Gateway factory, webhook signature, checkout payload | Unit |
| IT-RES-01 | FR-08 | Ten concurrent buyers, one winner | Integration |
| IT-PAY-01/02/05/06 | FR-10 | Idempotent payment, wrong amount, duplicate, late payment | Integration |
| IT-VAL-01/03 | FR-14 | One-time use, two gates at once, wrong match | Integration |
| IT-REF-01/02 | FR-17 | Approved refund cancels ticket and frees seat; foreign ticket refused | Integration |

## 5. System test results (record your own)
| ID | Steps | Expected | Result |
|---|---|---|---|
| ST-01 | Register, hold seats, pay (mock), open My tickets | QR ticket VALID | Pass (screenshot) |
| ST-02 | Admin scans the ticket | Green VALID | Pass (screenshots/scan-valid.png) |
| ST-03 | Scan the same ticket again | Red ALREADY USED with first scan time and gate | Pass (screenshots/scan-already-used.png) |
| ST-04 | My tickets after the scan | Status USED, no QR | Pass (screenshots/ticket-used.png) |
| ST-05 | Two browsers pick the same seat | One succeeds, one told it was taken | Run and record |
| ST-06 | Fan opens /manager | Redirected | Run and record |
| ST-07 | Request and approve a refund | Ticket cancelled; seat free | Run and record |

## 6. Coverage
Run `npm --prefix functions test -- --coverage` and paste the summary here. Handlers and screens are covered by system tests, not unit tests.

## 7. Test environment
| Item | Value |
|---|---|
| Tester | Akande Ebenmosi Treasure |
| Date | 22 November 2026 |
| Browser | Brave (Chromium based) |
| Operating system | Windows |
| Runtime | Node 26, Java 21 (Temurin) |
| Backend | Firebase Emulator Suite (Auth, Firestore, Functions), project id demo-mtses |
| Note | Camera scanning in Brave needs camera permission for localhost. Manual entry was used for the recorded scans |
