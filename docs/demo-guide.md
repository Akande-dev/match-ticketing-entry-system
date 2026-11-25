# Running and presenting the demo

## Start (any time, no internet needed)
Double-click **Start MTSES Demo** on the desktop (or `start-demo.bat` in the project folder).
Wait about one to two minutes. The browser opens at http://localhost:5173 and the launcher window shows the accounts.
Every start rebuilds clean data, so a practice run never affects the real demo.

## Stop
Press Enter in the launcher window, or run `stop-demo.bat`.

## Accounts (password for all: Demo1234!)
| Account | Role | Use |
|---|---|---|
| fan@demo.com | fan | Buys tickets; already owns 2 tickets |
| steward@demo.com | steward | Scans tickets at the gate |
| admin@demo.com | admin | All screens and the audit log |

The login page is the first page. In demo mode it lists these accounts as buttons that fill the form, and each role lands on its own area after login. For the transfer and no-double-sale steps, first register a second fan with the Register page using the email fan2@demo.com.

## Demo script (about 8 minutes)
1. **Browse and buy (fan).** Log in as fan@demo.com. Open a match, pick two seats, Hold seats, Pay now, Simulate successful payment. Open My tickets and show the QR codes.
2. **No double sale.** Open a private window, log in as fan2@demo.com, open the same match and try to hold a seat the fan has already held. Show the "just taken" message.
3. **Gate scan (steward).** Log in as steward@demo.com, open Scanner, choose Arsenal vs Chelsea. In a separate PowerShell window run `node functions/scripts/user-tools.js ticket fan@demo.com`, then click the Manual entry box, press Ctrl+V and press Check: green VALID. Wait 4 seconds and press Check again: red ALREADY USED with the first scan time and gate.
4. **Ticket transfer (CR-01).** Before transferring, open a PowerShell window and run `node functions/scripts/user-tools.js ticket fan@demo.com`, which copies the QR text of the fan's ticket. Do not copy anything else. As fan@demo.com open My tickets, press Transfer to a friend, and enter fan2@demo.com: the ticket shows TRANSFERRED. Now log in as steward@demo.com in a private window, open Scanner, paste the copied QR and press Check: red CANCELLED OR TRANSFERRED. Finally run `node functions/scripts/user-tools.js ticket fan2@demo.com`, paste and check again: green VALID. This shows the old QR dies and the new one works.
5. **Refund (manager).** As fan@demo.com request a refund on a ticket. Log in as admin@demo.com, open Manager, then Refunds, and approve. Show that the seat is free again.
6. **Sales and audit.** As admin@demo.com show the Sales dashboard (tickets sold, revenue, entered). As admin@demo.com show the Audit log.
7. **Evidence.** Show the GitHub repository, the passing tests (`npm test`), and docs/screenshots.md.

## Before presenting (checklist)
- Laptop charged and plugged in; close heavy programs; turn off notifications.
- Run the demo once an hour before, then press Enter to stop, then start it again for the real thing.
- Record a backup video (Windows key + Alt + R) of a full run, and keep a copy on a USB stick or phone.
- If the camera scanner is requested: Scanner, Start camera, allow camera access for localhost in the browser. Manual entry always works.

## If something goes wrong
| Problem | Fix |
|---|---|
| Launcher says a port is busy | Run `stop-demo.bat`, then start again |
| Browser shows no matches | Wait 10 seconds and refresh; if still empty, stop and start again |
| Menu lacks Scanner or Manager | Log out and back in so the role loads |
| Launcher window closed by mistake | Run `stop-demo.bat`, then start again |


## Multi-sport part of the demo (CR-02)
1. On the home page show the sport buttons grouped by category, then click Boxing and Table tennis.
2. Buy a ticket for a boxing event as fan@demo.com. Show that the seat types and prices differ from football (Ringside, Floor, Balcony).
3. As admin@demo.com open Manager: the Sales page shows sales by sport. Open Matches, New match, change the sport and show that the venue list and the side labels change.

## Ticket numbers (CR-09)
Every ticket has a number such as TKT-7K4M9Q2X, shown on My tickets. As steward (Scanner page) or admin (Admin > Tickets) type it into Find a ticket by number to see its status, seat and first scan. The lookup never admits a ticket.

