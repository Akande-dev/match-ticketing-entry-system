# Threat model (STRIDE) and OWASP check

## Assets
Ticket validity, payment integrity, seat inventory, personal data, role claims, availability on match day, audit trail, secrets.

## Trust boundaries
Browser (untrusted) -> Cloud Functions and Firestore rules (trusted) -> payment gateway (semi-trusted, signature checked).

## STRIDE
| ID | Type | Threat | Mitigation | Residual |
|---|---|---|---|---|
| TM-01 | Spoofing | Forged payment webhook gives free tickets | HMAC signature check; amount and order checks; mock gateway disabled unless explicitly allowed | Low |
| TM-02 | Spoofing | Forged or altered QR | HMAC-SHA256 signature verified before any database read | Key leak would need rotation |
| TM-03 | Spoofing | Stolen staff credentials | Firebase Auth; roles from server-set claims | No MFA (accepted) |
| TM-04 | Spoofing | Bots hoard seats | Hold cap (2 open holds, 6 seats), expiry job, per-user rate limits | Medium |
| TM-05 | Spoofing | A ticket screenshot is shared | First scan wins; one-time use | Accepted; transfer feature (CR-01) is the proper answer |
| TM-06 | Tampering | Client writes tickets, orders or seats | Rules deny all client writes to business data | Low |
| TM-07 | Tampering | User promotes own role | Rules whitelist user fields; roles set only by an admin function | Low |
| TM-08 | Tampering | Client chooses the price | Totals computed on the server from price documents | Low |
| TM-09 | Tampering | Replayed webhook or scan | Idempotent confirmation; one-time use transaction | Low |
| TM-10 | Tampering | Race: double sale or double entry | Firestore transactions; concurrency tests | Low |
| TM-12 | Repudiation | Staff deny an action | Server-written audit and scan logs | Owners can still alter data |
| TM-14 | Info disclosure | A fan reads another fan''s tickets | Owner-only rules | Low |
| TM-16 | Info disclosure | Secrets leak | .env files ignored by Git; secrets only server-side | Use Secret Manager when deployed |
| TM-19 | Denial of service | Request floods | Rate limits; maxInstances | Medium |
| TM-22 | Denial of service | Network failure at the gate | Manual fallback list (documented) | Offline mode not built |
| TM-23 | Elevation | Bypass route guards | Real checks are in rules and functions; guards are cosmetic | Low |
| TM-24 | Elevation | Mock payment endpoint reachable when deployed | Not exported unless ALLOW_MOCK_PAYMENTS=true | Low |

## OWASP Top 10 (2021 names) check
| Category | What was checked | Status |
|---|---|---|
| A01 Broken access control | Role checks on every function; owner checks; rules deny client writes | Pass |
| A02 Cryptographic failures | HMAC signatures; HTTPS on deployment; no card data stored | Pass (deployment pending) |
| A03 Injection | No SQL; validated inputs; React escaping | Pass |
| A04 Insecure design | Abuse cases: hoarding, double sale, late payment, price tampering | Partial: QR sharing accepted |
| A05 Security misconfiguration | Default-deny rules; mock gateway off by default | Pass; security headers not yet added |
| A06 Vulnerable components | npm audit shows moderate/high advisories in dev tooling | Partial: review before release |
| A07 Authentication failures | Firebase Auth | Partial: no MFA |
| A08 Software and data integrity | Signed QR and webhook; lockfiles | Pass |
| A09 Logging and monitoring | Audit log; scan log | Partial: no alerting |
| A10 SSRF | Server only calls the fixed gateway URL | N/A |

## CI pipeline
.github/workflows/ci.yml runs lint and unit tests, builds the web app, and runs the emulator-based integration tests on every push and pull request.
Deployment: not done. The system runs on the local emulators. A Firebase test project needs the paid Blaze plan for Cloud Functions; document this honestly in the final report.

## Additions from CR-01 (ticket transfer)
| ID | Type | Threat | Mitigation | Residual |
|---|---|---|---|---|
| TM-29 | Information disclosure | The transfer form reveals which emails have accounts | One generic message for unknown and disabled accounts; rate limit of 5 per minute; audit entry | Low |
| TM-30 | Tampering / fraud | Transfers used for touting or laundering tickets | One transfer per ticket; recipient must be registered; closes 2 hours before kick-off; audit trail | Private resale by selling an account is accepted |


## Demo role switcher (CR-06)
The demo bar stores the emulator demo password in front-end code. It renders only when VITE_USE_EMULATORS is true, so it is for local emulator data only. It must not be used in a deployed system.

