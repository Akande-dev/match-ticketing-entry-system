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
| friend@demo.com | fan | Receives a transferred ticket |
| steward@demo.com | steward | Scans tickets at the gate |
| manager@demo.com | manager | Matches, refunds, sales dashboard |
| admin@demo.com | admin | All screens and the audit log |

## Demo script (about 8 minutes)
1. **Browse and buy (fan).** Log in as fan@demo.com. Open a match, pick two seats, Hold seats, Pay now, Simulate successful payment. Open My tickets and show the QR codes.
2. **No double sale.** Open a private window, log in as friend@demo.com, open the same match and try to hold a seat the fan has already held. Show the "just taken" message.
3. **Gate scan (steward).** Log in as steward@demo.com, open Scanner, choose Home FC vs Away United. In a separate PowerShell window run `node functions/scripts/user-tools.js ticket fan@demo.com`, then click the Manual entry box, press Ctrl+V and press Check: green VALID. Wait 4 seconds and press Check again: red ALREADY USED with the first scan time and gate.
4. **Ticket transfer (CR-01).** As fan@demo.com open My tickets, press Transfer to a friend, enter friend@demo.com. Show that the old ticket is TRANSFERRED. Copy the old QR again with the same command is not possible (it is no longer valid), so show instead that friend@demo.com now has the new ticket.
5. **Refund (manager).** As fan@demo.com request a refund on a ticket. Log in as manager@demo.com, open Manager, then Refunds, and approve. Show that the seat is free again.
6. **Sales and audit.** As manager@demo.com show the Sales dashboard (tickets sold, revenue, entered). As admin@demo.com show the Audit log.
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
