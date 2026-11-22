# User stories and acceptance criteria

**US-01 Register and log in.** As a fan I want an account so that I can buy and keep tickets.
- Given valid details, when I register, then an account with the fan role is created.
- Given a wrong password, when I log in, then I see an error and nothing is exposed.
- Given I am a fan, when I open a manager page, then I am redirected.

**US-02 Browse matches.** As a fan I want to see upcoming matches so that I can choose one.
- Given matches are on sale, when I open the home page, then I see them by date with a from-price.

**US-03 Hold seats.** As a fan I want my seats held while I pay so that nobody else takes them.
- Given available seats, when I select up to 6, then they are held for 10 minutes with a countdown.
- Given two fans pick the same seat at once, then only one succeeds and the other sees a clear message.
- Given the hold expires, then the seats become available again.

**US-04 Pay.** As a fan I want to pay online so that I do not queue at an outlet.
- Given a successful payment, then the order becomes Paid and tickets are issued.
- Given a failed payment, then no ticket is issued and the seats are released.

**US-05 QR ticket.** As a fan I want a QR ticket so that I can enter.
- Given a paid order, when I open My tickets, then each seat shows a unique QR code.

**US-06 Gate validation.** As a steward I want to scan tickets so that only valid fans enter.
- Given a valid unused ticket, when scanned, then I see green VALID and the ticket becomes used.
- Given a used ticket, when scanned again, then I see red ALREADY USED with the first scan time and gate.
- Given a ticket for another match or a forged code, then I see a red refusal.

**US-07 Manage matches.** As a manager I want to create matches and prices so that tickets can go on sale.
- Given valid details, when I save, then a draft is created; when I publish, then seats appear for fans.
- Given a past kick-off, then the save is refused.

**US-08 Refunds.** As a fan I want to request a refund so that I get money back when I cannot attend.
- Given a valid ticket before the cut-off, when I request, then the manager sees it.
- Given approval, then the ticket is cancelled and the seat is freed.

**US-09 Dashboard.** As a manager I want live sales and attendance so that I can monitor the match.
- Given tickets are sold or scanned, then the numbers update without refreshing.

**US-10 Audit.** As an admin I want a log of actions so that I can investigate disputes.
- Given any purchase, scan, refund or role change, then an audit entry exists.

**US-11 Roles.** As an admin I want to set roles so that only staff can scan.
- Given I set a role, then that user gets the matching menu and permissions after signing in again.
