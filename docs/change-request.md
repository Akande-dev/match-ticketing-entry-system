# Change request CR-01: ticket transfer

| Field | Content |
|---|---|
| ID | CR-01 |
| Raised by | Fan feedback: a buyer who cannot attend wants to pass the ticket to a friend |
| Date | 22 November 2026 |
| Description | A ticket holder can transfer a valid, unused ticket once to another registered user by email. The recipient gets a new ticket with a new QR code. The old QR stops working |
| New requirement | FR-23 |
| Priority | Should |
| Decision | Approved and implemented |

## Impact analysis
| Area | Impact |
|---|---|
| Requirements | New FR-23 and a user story; SRS version 1.1 |
| Design | New ticket status Transferred; new fields transferCount, transferredFrom; one new sequence diagram |
| Code | New transfer logic, service and function; change to MyTicketsPage |
| Gate validation | StatusRule already refuses any status except Valid and Used, so a transferred ticket is refused (fail closed) |
| Security | Risk of account enumeration (use one generic error), touting (one transfer per ticket, cutoff 2 hours before kick-off), abuse (rate limit); new threats TM-29, TM-30 |
| Refunds | A refund by the new owner is allowed; money goes to the original payer |
| Data | Existing tickets treat a missing transferCount as 0; no migration |
| Tests | About 6 unit and 7 integration tests |
| Effort | About 14 story points |
| Schedule | Fits week 12 if email notifications are deferred |
| Alternatives | Do nothing (more refunds); transfer by link (higher fraud risk); chosen: transfer to a registered account |

Closure note (fill in after implementation): actual effort, defects found, documents updated.

## Closure note (22 November 2026)
Implemented on branch feature/CR-01-ticket-transfer and merged with tag v0.3.0.
- Code: functions/src/tickets/transferLogic.js, transferService.js, transferTicket function; My tickets screen.
- Tests: 5 unit tests (UT-TRF-01..05) and 7 integration tests (IT-TRF-01..07), including that the old QR is refused at the gate and that the new owner can be refunded.
- Existing behaviour: the gate validation rules already refuse any status except Valid, so no change to validation code was needed (confirmed by IT-TRF-02).
- Documents updated: SRS (FR-23 done), planning, user manual, security (TM-29, TM-30).
- Actual effort: [FILL IN hours] against an estimate of about 14 story points (about 28 hours).
- Defects found: [FILL IN, or none].


---

# Change request CR-02: multiple sports

| Field | Content |
|---|---|
| ID | CR-02 |
| Raised by | Product owner and fan feedback: the system should sell tickets for more than football |
| Date | 22 November 2026 |
| Description | Every event belongs to a sport (football, basketball, volleyball, table tennis, boxing). Sports are grouped into categories (team ball sports, racket sports, combat sports). Each sport has its own venue with its own seat types and prices. Fans can filter by sport and managers pick a sport when creating an event |
| New requirement | FR-24 |
| Priority | Should |
| Decision | Approved and implemented (tag v0.4.0) |

## Impact analysis
| Area | Impact |
|---|---|
| Requirements | New FR-24; SRS section 3.1 extended |
| Data | New field sport on matches, stadiums and tickets. Existing data without a sport is treated as football, so no migration is needed |
| Code | New shared sports list (backend and web); match validation requires a valid sport; saveMatch stores it and refuses a venue that belongs to another sport; seed data rebuilt with five venues and ten events |
| Screens | Event list gets category and sport filters; manager form gets a sport picker with side labels that change per sport (home/away, player 1/2, fighter 1/2); dashboard gets a sales by sport table |
| Security | No new trust boundary. The sport is validated on the server against a fixed list, so a client cannot invent one |
| Tests | Validation tests extended (every sport accepted, missing or unknown sport refused); new tests for the sports list |
| Risk | Low: existing flows (seat hold, payment, scan, refund, transfer) do not depend on the sport |
| Alternatives | One sport with a free-text field (rejected: no filtering, typos); separate system per sport (rejected: duplicated code) |

## Closure note (CR-02)
Implemented on branch feature/CR-02-multi-sport and merged with tag v0.4.0.
- Tests: validation tests extended and new sports-list tests (UT-SPORT-01, 02); system test ST-09 (sport filters) passed on 26 November 2026.
- Actual effort: [FILL IN hours].
- Defects found: [FILL IN, or none].


---

# Change request CR-03: customer-facing home page redesign

| Field | Content |
|---|---|
| ID | CR-03 |
| Raised by | Product owner: the home page should look like a modern ticket-selling site |
| Date | 22 November 2026 |
| Description | New home page with a hero banner, a featured next event, browse-by-sport tiles, event cards with a from-price, a why-buy strip and a footer. The event page shows ticket types with price and seats left. Navigation and footer restyled |
| Requirement | NFR-06 usability (first impression and findability) |
| Decision | Approved and implemented (tag v0.5.0) |

## Impact analysis
| Area | Impact |
|---|---|
| Screens | Home page, event page, navigation bar and footer; global stylesheet |
| Data | Events store venueName so that public pages can show the venue (venues are only readable after sign-in under the security rules) |
| Security | No new access. The public page reads only on-sale events, as before |
| Assets | No third-party photos or logos. Sport colours and emoji are used, so the design works offline and avoids copyright and image-rights issues |
| Tests | No logic changed, so existing unit tests still apply; checked by a production build and a visual walkthrough |
| Risk | Low |
| Out of scope | Member priority sale windows and membership tiers (seen in the reference design), newsletter sign-up, travel packages |

## Closure note (CR-03)
Implemented on branch feature/CR-03-home-redesign and merged with tag v0.5.0.
- Checked by: production build and a visual walkthrough with screenshots. No logic changed.
- Actual effort: [FILL IN hours].
- Defects found: [FILL IN, or none].


---

# Change requests CR-04 to CR-15 (25 to 26 November 2026)
These later changes were requested by the project owner (the student) during demo preparation. All ran on local emulators only. Effort and defect figures are left for the author to fill in.

| ID | Change | Tag | Checked by | Effort | Defects |
|---|---|---|---|---|---|
| CR-04 | Real international club names and 17 seeded events (names only, no logos). Table tennis and boxing keep fictional names | v0.6.0 | Unit tests, build, browser (All 17, football 5) | [FILL IN] | [FILL IN] |
| CR-05 | Admin console: overview, users page (change role, disable and enable), audit log. New admin-only listUsers function. Admins cannot change or disable their own account | v0.7.0 | 4 new unit tests (62 total), browser | [FILL IN] | [FILL IN] |
| CR-06 | Demo role switcher bar. Manager and friend demo accounts removed (admin does manager tasks in the demo; the transfer test needs a second account you register) | v0.7.0 | Build, browser. The bar was later removed by CR-07 | [FILL IN] | [FILL IN] |
| CR-07 | Login page first; every page except Log in and Register needs login; each role lands on its own area; demo account buttons on the login page (emulator mode only) | v0.7.0 | Browser: logins worked for fan, steward and admin | [FILL IN] | [FILL IN] |
| CR-08 | Responsive layout, mobile menu, role colour bar, animated hero background | v0.7.0 | Browser (manual) | [FILL IN] | [FILL IN] |
| CR-09 | Searchable ticket numbers (TKT-XXXXXXXX). Stewards and admins can look a ticket up by number; the lookup never admits a ticket and never returns the QR or the owner. A transferred ticket gets a new number | v0.7.0 | 5 unit tests, IT-TKN-01..03 (22 integration tests passing), browser | [FILL IN] | [FILL IN] |
| CR-10 | Centred, rounded login card with a moving sport background | v0.7.0 | Browser (manual) | [FILL IN] | [FILL IN] |
| CR-11 | Moving blurred sport background on checkout, mock payment and My tickets; coloured transfer and refund buttons | v0.7.0 | Browser (manual) | [FILL IN] | [FILL IN] |
| CR-12 | Redesigned gate scanner with demo sample scans (valid, already used, wrong match, tampered QR, cancelled). Samples run through the real validator and are disabled unless ALLOW_MOCK_PAYMENTS is true. Wrong gate and expired QR were not built: the system has no gate assignment and QR codes do not expire | v0.8.0 | IT-SCN-01..04 (26 integration tests passing, run twice), browser | [FILL IN] | [FILL IN] |
| CR-13 | Pending payment card on My tickets: resume payment or cancel a hold, with a live countdown | v0.9.0 | Browser: resume payment within 10 minutes worked. Cancel hold also worked. Automatic card expiry after 10 minutes not verified | [FILL IN] | [FILL IN] |
| CR-14 | Sport background and a readable panel on scanner, admin and manager pages | v0.10.0 | Browser (manual) | [FILL IN] | [FILL IN] |
| CR-15 | Light scanner colours that match the background | v0.11.0 | Browser (manual) | [FILL IN] | [FILL IN] |

Known limits: browser checks were manual, by one person. Camera scanning was not recorded. Nothing is deployed and the Paystack sandbox was not tested.
