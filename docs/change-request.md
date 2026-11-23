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
