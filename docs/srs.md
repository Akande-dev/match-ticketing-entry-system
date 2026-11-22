# Software Requirements Specification (sections 1-3)

## 1. Introduction
1.1 Purpose: specify the Match Ticketing and Stadium Entry System (MTSES).
1.2 Scope: a React + Firebase web application for selling match tickets, issuing signed QR tickets and validating entry at gates.
1.3 Definitions: Hold = temporary seat reservation (10 minutes). Ticket = paid entitlement to one seat for one match. Validation = a gate scan that marks a ticket used.
1.4 References: IEEE 29148, Firebase documentation, OWASP Top 10.

## 2. Overall description
2.1 Perspective: React clients, Firestore, Cloud Functions, Firebase Auth, an external payment gateway (sandbox).
2.2 Functions: auth and roles; match management; seat holds; payment; QR tickets; gate validation; refunds; dashboards; audit log.
2.3 User classes: Fan, Steward, Manager, Admin.
2.4 Environment: modern browsers; a camera for scanning (manual entry is a fallback).
2.5 Constraints: Firebase quotas; sandbox payments; academic timeline.
2.6 Assumptions: fans have an email address; stewards have a smartphone.

## 3. Specific requirements

### 3.1 Functional requirements
| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-01 | Register and log in with email and password | Must | Done |
| FR-02 | Roles (fan, steward, manager, admin) restrict screens and data | Must | Done |
| FR-03 | Managers create, edit, publish and cancel matches | Must | Done |
| FR-04 | Stadium sections and seat categories exist (seeded) | Must | Done (seed script) |
| FR-05 | Price per category per match | Must | Done |
| FR-06 | Fans browse matches and see seat availability | Must | Done |
| FR-07 | Seat hold for 10 minutes with countdown | Must | Done |
| FR-08 | A seat can never be sold twice | Must | Done (transactions, tested) |
| FR-09 | Fans pay through the gateway | Must | Done (mock; Paystack code written, sandbox untested) |
| FR-10 | Payment is confirmed server-side only | Must | Done |
| FR-11 | One signed QR ticket per seat | Must | Done |
| FR-12 | Fans view their tickets | Must | Done |
| FR-13 | Stewards scan and see Valid / Invalid / Already used / Wrong match / Cancelled | Must | Done |
| FR-14 | A ticket is usable once, with first-use time and gate shown on a rescan | Must | Done |
| FR-15 | Offline scanning | Should | Not built (descoped) |
| FR-16 | Fans request refunds; managers decide | Should | Done |
| FR-17 | Approved refunds cancel the ticket and free the seat | Should | Done |
| FR-18 | Sales dashboard | Must | Done |
| FR-19 | Attendance by gate | Should | Done (on the dashboard) |
| FR-20 | Audit log of important actions | Must | Done |
| FR-21 | Email notifications | Should | Not built |
| FR-22 | User management screen | Should | Partial (role and disable functions, no screen) |
| FR-23 | Ticket transfer (change request CR-01): one transfer per ticket to a registered user, up to 2 hours before kick-off | Should | Done |

### 3.2 Non-functional requirements
| ID | Category | Requirement | Evidence |
|---|---|---|---|
| NFR-01 | Performance | Gate validation under 3 seconds | Measure on the deployed build |
| NFR-02 | Security | Server-side authorisation on every function; Firestore rules deny client writes to business data | firestore.rules, handlers |
| NFR-03 | Security | QR payloads signed with HMAC-SHA256; secrets never in client code | TicketSigner tests |
| NFR-04 | Reliability | No double sale under concurrent purchase | IT-RES-01 |
| NFR-05 | Reliability | Late or duplicate payments never lose money silently | IT-PAY tests |
| NFR-06 | Usability | A new fan can buy a ticket without instructions | Usability test |
| NFR-07 | Accessibility | Labels, keyboard use, readable contrast | Manual check |
| NFR-08 | Maintainability | Linted code, tests on core logic | 48 unit tests |
| NFR-09 | Scalability | 500 concurrent users | Not load tested; stated as a limitation |
