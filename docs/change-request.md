# Change request CR-01: ticket transfer

| Field | Content |
|---|---|
| ID | CR-01 |
| Raised by | Fan feedback: a buyer who cannot attend wants to pass the ticket to a friend |
| Date | 22 November 2026 |
| Description | A ticket holder can transfer a valid, unused ticket once to another registered user by email. The recipient gets a new ticket with a new QR code. The old QR stops working |
| New requirement | FR-23 |
| Priority | Should |
| Decision | Approved, implementation pending |

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
