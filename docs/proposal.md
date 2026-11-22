# Project proposal: Match Ticketing and Stadium Entry System

## 1. Problem
Stadium tickets are often sold from physical outlets and by touts, and fans are checked in by hand. This causes counterfeit and duplicated tickets, long gate queues, no reliable attendance data and revenue that is hard to audit.

## 2. Target users
| User | Needs |
|---|---|
| Fan | Browse matches, pick seats, pay, get a QR ticket, request refunds |
| Gate steward | Scan QR codes, see valid / invalid / already used |
| Box-office manager | Create matches, set prices, see sales, decide refunds |
| Administrator | Manage roles, view the audit log |

## 3. Objectives
1. A fan can pick seats and pay in a few minutes.
2. Each ticket has a unique, tamper-resistant QR code.
3. A ticket can be used only once, even if two gates scan it at the same time.
4. The same seat can never be sold twice.
5. Managers see live sales and attendance figures.
6. Security basics: role-based access, server-side checks, audit log.

## 4. Scope
In scope: authentication and roles; match and pricing management; seat holds; payment (sandbox or mock); signed QR tickets; gate validation; refunds; sales dashboard; audit log.
Out of scope: real-money settlement, native mobile apps, turnstile hardware, biometrics, resale marketplace.

## 5. Process model: Scrum
One-week sprints with a prioritised backlog, a weekly review and a retrospective.
- Requirements change as users react to prototypes, so Waterfall would be too rigid.
- The brief needs working software early (week 7-8), which iterations give naturally.
- The riskiest parts (seat concurrency, QR validation, payment) can be built and tested first.
- MoSCoW lets low-priority items be dropped without missing the deadline.
- Branches, pull requests and CI fit a sprint workflow.
Adaptations: the supervisor acts as product owner; the Scrum master role rotates; stand-ups are asynchronous.

## 6. Technology
React (Vite), Firebase Authentication, Cloud Firestore, Cloud Functions, Firebase Emulator Suite, Jest, GitHub Actions.

## 7. Repository
[REPO URL] with branches main, develop and feature/*; Conventional Commits; pull-request review.
