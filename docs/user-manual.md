# User manual

Start the system: run the emulators, load sample data, start the website (see the README). Open http://localhost:5173.

## Fans
1. Register with your name, email and a password of at least 6 characters, then log in.
2. Open Matches, choose a match and click seats (○ free, ✓ yours, ◐ held by someone else, × sold). You can pick up to 6.
3. Press "Hold seats & continue". You have 10 minutes.
4. Press "Pay now". In the test environment, press "Simulate successful payment".
5. Open My tickets to see your QR codes. After a ticket is used its status shows USED.
6. To get a refund, press "Request refund" on a valid ticket (until 48 hours before kick-off).
Common messages: "Some seats were just taken" means choose other seats; "You already have open seat holds" means finish or cancel your open orders.

## Stewards
1. Log in with a steward or admin account and open Scanner.
2. Choose the match and your gate, then press Start camera, or paste the QR text into Manual entry and press Check.
3. Green VALID means let them in. Red means do not admit: ALREADY USED (shows first scan time and gate), INVALID, WRONG MATCH, or CANCELLED.
4. If the camera does not work, use Manual entry. If the network is down, use the manager''s printed sold-seat list (offline scanning is not available).

## Managers
1. Open Manager. Sales shows tickets sold, revenue, refunds and entries for a match.
2. Matches: create a draft (stadium, teams, kick-off in the future, a price for every seat category), save it, then Publish. Published matches cannot be edited. Cancel a match to let fans claim refunds.
3. Refunds: approve or reject requests. Approving cancels the ticket and frees the seat. Paying the money back is currently done manually.

## Administrators
Audit log lists recent actions. Roles are assigned with `node functions/scripts/user-tools.js admin <email>` on the emulator; users must log out and in again to see the change.

## Troubleshooting
| Problem | Fix |
|---|---|
| No Scanner or Manager menu | Log out and back in so the new role loads |
| Page shows no matches | Run `npm run seed` while the emulators are running |
| Emulators stopped | Restart them; data resets, so seed again and register again |
