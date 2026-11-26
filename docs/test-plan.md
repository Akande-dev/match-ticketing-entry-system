# Test plan

## 1. Scope and approach
| Level | What | Tool | Status |
|---|---|---|---|
| Unit | Pure logic: signing, validation rules, seat logic, match and refund rules, rate limit, gateways | Jest | 67 tests passing (11 suites) |
| Integration | Real Firestore emulator: concurrency, payments, refunds, gate scans | Jest + emulator | 26 tests passing (4 suites), repeatable on one emulator |
| System | Full flows in the browser | Manual scripts below | Done for ST-01 to ST-09 (CR-13 Cancel hold not verified) |
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
| ST-05 | Fan holds a seat; admin opens the same event in a second window | Seat shown as held and cannot be selected | Pass, 26 Nov 2026 (screenshots/st05-seat-held.png). Admin saw the held seat (yellow, half-filled circle) and clicking it did nothing |
| ST-06 | Fan types /manager in the address bar | Redirected | Pass, 26 Nov 2026. The fan was sent back to the fan area. This checks the screen guard only; server enforcement is covered by the integration tests |
| ST-07 | Fan requests a refund; admin approves it in Manager, Refunds | Ticket cancelled; seat free | Pass, 26 Nov 2026. Ticket showed CANCELLED and the seat became available again. Done as admin because the demo manager account was removed (CR-06) |
| ST-08 | Fan transfers a ticket to a second account; old and new QR checked at the scanner | Old QR refused, new QR valid | Pass, 26 Nov 2026. New QR showed valid and the old QR was refused |
| ST-09 | Filter the home page by sport | Counts add up to All (17) | Pass, 26 Nov 2026 (screenshots/st09-football-filter.png). Football 5 (screenshot); basketball, volleyball, table tennis and boxing 3 each (reported) |

## 6. Coverage
Run `npm --prefix functions test -- --coverage` and paste the summary here. Handlers and screens are covered by system tests, not unit tests.

## 7. Test environment
| Item | Value |
|---|---|
| Tester | Akande Ebenmosi Treasure |
| Date | 22 to 26 November 2026 |
| Browser | Brave (Chromium based) |
| Operating system | Windows |
| Runtime | Node 26, Java 21 (Temurin) |
| Backend | Firebase Emulator Suite (Auth, Firestore, Functions), project id demo-mtses |
| Note | Camera scanning in Brave needs camera permission for localhost. Manual entry was used for the recorded scans |

## 8. CR-01 tests
| ID | Scenario | Level |
|---|---|---|
| UT-TRF-01..05 | Eligibility: valid ticket, 2-hour boundary, used/cancelled/already transferred, open refund, match not on sale | Unit |
| IT-TRF-01 | Transfer issues a new valid ticket with a verifiable QR and retires the old one | Integration |
| IT-TRF-02 | Old QR refused at the gate; new QR admitted once | Integration |
| IT-TRF-03 | Only the owner can transfer; not to themselves | Integration |
| IT-TRF-04 | Unknown and disabled recipients get the same generic message | Integration |
| IT-TRF-05 | A ticket cannot be transferred twice | Integration |
| IT-TRF-06 | Open refund or the 2-hour cutoff blocks transfer | Integration |
| IT-TRF-07 | New owner can be refunded and the seat is freed | Integration |
| ST-08 | In the browser: transfer to a second account, old QR refused, new QR valid | System (manual) |

## 9. Recorded run: integration tests (22 November 2026)
Command: `npm run test:int` (Firestore emulator, Node 26). First run: 18 passed, 1 failed (IT-RES-01 timeout, see DEF-008). After raising the timeout: 19 passed, 19 total, covering concurrent buying, payments (idempotent, wrong amount, duplicate, late), the gate (one-time use, two gates at once, wrong match), refunds and ticket transfer.


## 10. CR-02 tests
| ID | Scenario | Level |
|---|---|---|
| UT-SPORT-01 | Five sports in three categories | Unit |
| UT-SPORT-02 | Only known sports accepted (including inherited keys such as toString) | Unit |
| UT-MATCH | Every sport accepted; missing or unknown sport refused | Unit |
| ST-09 | Filter the home page by each sport; create a basketball event; check a boxing venue is not offered for football; check sales by sport | System (manual) |

## 11. Later changes and recorded runs (26 November 2026)
Everything below ran on local emulators only. Nothing is deployed, and the Paystack sandbox was not tested (the mock gateway was used).

### 11.1 Automated tests
| Item | Result |
|---|---|
| Unit tests | 67 passed, 11 suites (after CR-09) |
| Integration tests | 26 passed, 4 suites, run twice on the same emulator (core, transfer, ticket numbers, sample scans) |
| DEF-009 | Integration tests used fixed user ids and payment references, so repeat runs failed (4 of 19). Fixed with unique ids per run; 4 consecutive runs passed 19 of 19 |
| New tests | UT: ticket numbers and the user summary. IT-TKN-01..03: unique ticket numbers, staff search, transfer gets a new number. IT-SCN-01..04: sample scans through the real validator |

### 11.2 Change requests and how they were checked
| CR | Change | Checked by |
|---|---|---|
| CR-04 | Real club names, 17 seeded events | Browser: All (17), football 5 |
| CR-05 | Admin console: overview, users (role, disable and enable), audit log | Browser (manual) |
| CR-06 | Role switcher bar, manager and friend demo accounts removed | Browser (manual); the bar was later removed by CR-07 |
| CR-07 | Login page first; each role lands on its own area | Browser (manual) |
| CR-08 | Responsive layout, mobile menu, role colours, animated hero | Browser (manual) |
| CR-09 | Searchable ticket numbers for stewards and admins | Integration tests and browser |
| CR-10, CR-11, CR-14 | Login card and sport backgrounds on fan and staff pages | Browser (manual) |
| CR-12, CR-15 | Redesigned scanner with sample scans, light colours | Integration tests (IT-SCN) and browser |
| CR-13 | Pending payment card to resume or cancel a hold | Browser: resume payment within 10 minutes worked. Cancel hold and automatic expiry of the card: not verified |

### 11.3 Limits to state in the report
- Browser checks were manual and not repeated by a second person.
- The scanner samples simulate wrong match, tampered QR, already used and cancelled. Wrong gate and expired QR are not implemented because the system has no gate assignment and QR codes do not expire.
- Camera scanning was not recorded; manual entry was used.
- No load testing, so 500 concurrent users is unproven.
