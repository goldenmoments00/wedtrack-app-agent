# WedTrack Staff App: Capability Coverage Matrix

Reference: `01-backend-capabilities.md` and `02-build-expo-app-prompt.md`.
Date: 14 November 2026.
Environment: React Native, Expo SDK 58, TypeScript, Expo Router.

| Capability ID | Capability Name | Target Persona(s) | Destination & Action | Integration State | Notes / Documented Boundary |
|---|---|---|---|---|---|
| **AUTH-01** | Find studio | All staff | `src/app/(auth)/sign-in.tsx` | Implemented (Live + Demo) | Searches tenant by subdomain/slug; previews studio branding without exposing private data. |
| **AUTH-02** | Sign in | All staff | `src/app/(auth)/sign-in.tsx` | Implemented (Live + Demo Gap G1) | Validates credentials; loads identity, roles, and authorized workspaces. Demo persona quick-select provided. |
| **AUTH-03** | Recover access | All staff | `src/app/(auth)/forgot-password.tsx` | Implemented (Live + Demo) | Generic security response without leaking email presence; dispatches token link. |
| **AUTH-04** | Open correct workspace | All staff | `src/context/auth-context.tsx`, `src/components/common/demo-banner.tsx` | Implemented (Live + Demo Gap G2) | Direct landing in Operations, Editing, or Shoots. Dual-role users switch workspaces instantly without re-logging. |
| **AUTH-05** | Sign out / refresh access | All staff | `src/app/(tabs)/more.tsx` | Implemented (Live + Demo) | Ends session, purges studio-specific cached credentials and state. |
| **ACC-01** | My profile | All staff | `src/app/profile/index.tsx` | Implemented (Live + Demo) | Updates supported personal fields (name, phone); email remains studio-managed. |
| **ACC-02** | Studio payment identity | Admin / Owner | `src/app/profile/index.tsx` | Implemented (Restricted) | Admin-only UPI ID and Payee Name configuration for client payments. |
| **OPS-01** | Overview | Admin, Manager | `src/app/(tabs)/index.tsx` | Implemented (Live + Demo) | Booking status counts, staffing gaps alert, financial totals obeying RBAC. |
| **ORD-01** | Find orders | Admin, Manager, Editor (if granted) | `src/app/(tabs)/orders.tsx` | Implemented (Live + Demo) | Search by #/client/venue, filter by status, horizontal category pills. |
| **ORD-02** | Order overview / detail | Admin, Manager, Editor (if granted) | `src/app/orders/[id]/index.tsx` | Implemented (Live + Demo) | Displays `tenantOrderNumber`, couple info, deliverables, tabs for Events, Editing, Activities, Money, Client Support. |
| **ORD-03** | Priority | Admin / Owner | `src/app/orders/[id]/index.tsx` | Implemented (Admin Only) | Pin/unpin priority toggle; managers cannot pin/unpin. |
| **ORD-04** | Create wedding booking | Admin, Manager | `src/app/orders/create-wedding.tsx` | Implemented (Demo Gap G3) | Captures bride/groom, contact, schedule, consent; includes idempotency key. |
| **ORD-05** | Create occasion booking | Admin, Manager | `src/app/orders/create-occasion.tsx` | Implemented (Demo Gap G3) | Captures client, occasion title, event date/location, consent; idempotency key. |
| **ORD-06** | Edit booking | Admin, Manager (permitted) | `src/app/orders/[id]/index.tsx` | Implemented (Conditional) | Updates client details, package deliverables, notes; preserves hidden financial inputs. |
| **ORD-07** | Change order status | Admin, Manager | `src/app/orders/[id]/index.tsx` | Implemented (Conditional) | Confirm (deducts 3 credits), In Progress, Completed, Cancelled; credit check enforced. |
| **ORD-08** | Reschedule | Admin, Manager | `src/app/orders/[id]/index.tsx` | Implemented (Conditional) | Modifies booking date and shifts related event schedules with confirmation. |
| **ORD-09** | Remove order | Admin / Owner | `src/app/orders/[id]/index.tsx` | Implemented (Admin Only) | Destructive deletion with explicit confirmation; coordinates review media cleanup. |
| **EVT-01** | Schedule | Admin, Manager | `src/app/(tabs)/schedule.tsx` | Implemented (Live + Demo) | Calendar schedule of all events; side indicators (Bride/Groom/Both), staffing gap flags. |
| **EVT-02** | Maintain events | Admin, Manager | `src/app/events/[id].tsx` | Implemented (Conditional) | Venue address, timing, contact phone call trigger, Google Maps deep link trigger. |
| **EVT-03** | Assign crew | Admin, Manager | `src/app/events/[id].tsx` | Implemented (Conditional) | Role-matched assignment (Photographer/Videographer/Both); filters out inactive/ineligible staff. |
| **EVT-04** | Maintain assignment | Admin, Manager | `src/app/events/[id].tsx` | Implemented (Conditional) | Sets primary crew flag, sets authorized assignment pay (if cost permission allowed). |
| **EVT-05** | Track material receipt | Admin, Manager | `src/app/events/[id].tsx`, `src/app/(tabs)/schedule.tsx` | Implemented (Live + Demo) | Tracks agent submission counts and studio material receipt verification independently. |
| **EDIT-01** | Editing overview | Admin, Manager | `src/app/(tabs)/work.tsx` | Implemented (Live + Demo) | Task queue across albums, films, reels, highlights, photo edits; category filtering. |
| **EDIT-02** | Allocate work | Admin, Manager | `src/app/(tabs)/work.tsx`, `src/app/orders/[id]/index.tsx` | Implemented (Conditional) | Assigns active category-eligible editors; preserves cost privacy. |
| **EDIT-03** | Workload | Admin, Manager | `src/app/(tabs)/work.tsx` | Implemented (Live + Demo) | Monthly workload distribution across active editors to identify bottlenecks. |
| **ACT-01** | Order checklist | Admin, Manager, Editor | `src/app/orders/[id]/index.tsx` | Implemented (Conditional) | Multi-stage ordered checklist (e.g. Sent to Client, Selection Received, Completed). |
| **ACT-02** | Activity templates | Admin / Owner | `src/app/settings/activities.tsx` | Implemented (Admin Only) | Reusable checklist templates with ordered status pipelines. |
| **PAY-01** | Client collections | Admin / Owner | `src/app/payments/index.tsx`, `src/app/orders/[id]/index.tsx` | Implemented (Admin Only) | Record client receipt (Cash, Card, UPI, Bank Transfer, Cheque); updates order balance due. |
| **PAY-02** | Payment ledger | Admin / Owner | `src/app/payments/index.tsx` | Implemented (Admin Only) | Search/filter payments by client receipts, agent payouts, editor payouts. |
| **PAY-03** | Correct records | Admin / Owner | `src/app/payments/index.tsx` | Implemented (Admin Only) | Delete/adjust record with explicit confirmation (does not pretend to be a gateway refund). |
| **PAY-04** | Payroll | Admin, Manager (cost permitted) | `src/app/payroll/index.tsx` | Implemented (Conditional) | Monthly earnings, paid totals, and balances due for agents and editors. |
| **PAY-05** | Record staff payout | Admin, Manager (cost permitted) | `src/app/payroll/index.tsx` | Implemented (Conditional) | Records staff payout with method, notes, and instant ledger balance update. |
| **PAY-06** | Order financial breakdown | Admin, Manager (permitted) | `src/app/orders/[id]/index.tsx` | Implemented (Strict RBAC) | Revenue, costs (crew/editor/extra), balance due, margin (margin hidden if cost/revenue missing). |
| **PAY-07** | Payroll export | Admin, Manager (cost permitted) | `src/app/payroll/index.tsx` | Implemented (Live Native Share) | Exports filtered payroll as formatted CSV via native OS share sheet. |
| **CLIENT-01** | Share booking entry | Admin, Manager, Editor | `src/app/orders/[id]/index.tsx` | Implemented (Native Share) | Copies/shares branded studio web booking page link. |
| **CLIENT-02** | Share contract/receipt | Admin, Manager | `src/app/orders/[id]/index.tsx` | Implemented (Pro Required) | Generates and shares secure client portal contract link via native share sheet. |
| **CLIENT-03** | Inspect client access | Admin, Manager | `src/app/orders/[id]/index.tsx` | Implemented (Live + Demo) | Masked phone, pin issued timestamp, lock state, first sign-in status. Never leaks plain PIN. |
| **CLIENT-04** | Reset client PIN | Admin / Owner | `src/app/orders/[id]/index.tsx` | Implemented (Admin Only) | Generates new 6-digit PIN with one-time display modal; never logged or permanently shown. |
| **CLIENT-05** | Contract preview / export | Admin, Manager | `src/app/orders/[id]/index.tsx` | Implemented (Gap G8) | Contract link sharing; native PDF export documented in Gap G8. |
| **AGT-01** | My day / schedule | Agent | `src/app/(tabs)/index.tsx` (Shoots) | Implemented (Agent Workspace) | Assigned shoots, event timing, venue details, client contact. |
| **AGT-02** | Shoot detail | Agent | `src/app/(tabs)/index.tsx`, `src/app/events/[id].tsx` | Implemented (Agent Workspace) | Direct native phone call and Google Maps launch buttons; crew pay is hidden. |
| **AGT-03** | Deliverables to submit | Agent | `src/app/(tabs)/orders.tsx` (Shoots) | Implemented (Agent Workspace) | Photo/video count input for completed shoots. |
| **AGT-04** | Submission history | Agent | `src/app/(tabs)/orders.tsx` (Shoots) | Implemented (Agent Workspace) | Verified submitted counts and studio receipt status. |
| **AGT-05** | My shoot pay | Agent | `src/app/(tabs)/schedule.tsx` (Shoots) | Implemented (Demo Gap G5) | Displays assignment pay per shoot; explains personal payout ledger is Gap G5. |
| **EDR-01** | My Work | Editor | `src/app/(tabs)/index.tsx` (Editing) | Implemented (Editor Workspace) | Assigned queue across all 5 editing categories; review status and task pay exception. |
| **EDR-02** | Discover / claim | Editor | `src/app/(tabs)/orders.tsx` (Editing) | Implemented (Editor Workspace) | Permitted order book browsing; self-claim eligible unassigned tasks. |
| **EDR-03** | Update / release | Editor | `src/app/(tabs)/index.tsx`, `src/app/orders/[id]/index.tsx` | Implemented (Editor Workspace) | Update task status or release task back to open pool. Cannot alter rates or metadata. |
| **EDR-04** | Own activities | Editor | `src/app/orders/[id]/index.tsx` | Implemented (Editor Workspace) | Advance status of assigned checklist activities. |
| **EDR-05** | Own payments | Editor | `src/app/(tabs)/schedule.tsx` (Editing) | Implemented (Editor Workspace) | Verified payout records with all-time total received summary. |
| **REV-01** | Open review | Admin, Assigned Editor | `src/app/review/[itemId].tsx` | Implemented (Pro Required) | Album, film, highlight, reel reviews. Displays current round, version metadata, and client comments. |
| **REV-02** | Prepare / upload | Admin, Assigned Editor | `src/app/review/[itemId].tsx` | Implemented (Demo Gap G4) | File picker (PDF/MP4), progress simulation, retry/cancel states. |
| **REV-03** | Send to client | Admin, Assigned Editor | `src/app/review/[itemId].tsx` | Implemented (Conditional) | Verifies current version assets and sends to linked client account. |
| **REV-04** | Address feedback | Admin, Assigned Editor | `src/app/review/[itemId].tsx` | Implemented (Live + Demo) | Pin markers (spread #, X/Y coords), video timestamps, voice note audio player, mark Fixed/Not Fixed. |
| **REV-05** | Revise / reopen | Admin, Assigned Editor | `src/app/review/[itemId].tsx` | Implemented (Conditional) | Upload revision round; reopen approved review for additional feedback. |
| **TEAM-01** | Team directory | Admin / Owner | `src/app/team/index.tsx` | Implemented (Admin Only) | Directory of agents, editors, managers; active/inactive filters; dual capability badges. |
| **TEAM-02** | Maintain member | Admin / Owner | `src/app/team/index.tsx`, `src/app/team/[id].tsx` | Implemented (Admin Only) | Add new staff member, edit credentials, deactivate/reactivate toggle. |
| **TEAM-03** | Add second capability | Admin / Owner | `src/app/team/[id].tsx` | Implemented (Admin Only) | Grants shooting or editing capability without duplicating accounts. |
| **TEAM-04** | Disable one capability | Admin / Owner | `src/app/team/[id].tsx` | Implemented (Admin Only) | Disables capability with open work warnings. |
| **TEAM-05** | Rates and permissions | Admin / Owner | `src/app/team/[id].tsx` | Implemented (Admin Only) | Maintains agent rates by event type; role permission enforcement. |
| **SET-01** | Studio profile / branding | Admin / Owner | `src/app/settings/studio.tsx` | Implemented (Admin Only) | Contact info, branding colors, currency, subdomain presentation. |
| **SET-02** | Packages | Admin / Owner | `src/app/settings/packages.tsx` | Implemented (Admin Only) | Catalogue of deliverables, counts, prices, and event associations. |
| **SET-03** | Import package drafts | Admin / Owner | `src/app/settings/packages.tsx` | Implemented (Live + Demo) | Rate card document extraction draft review, item editing, and publish. |
| **SET-04** | Event types | Admin / Owner | `src/app/settings/event-types.tsx` | Implemented (Admin Only) | Wedding/occasion event types, side (Bride/Groom/Both), date driver priority. |
| **SET-05** | Terms and domain | Admin / Owner | `src/app/settings/studio.tsx` | Implemented (Admin Only) | Booking terms editing; custom domain CNAME status verification. |
| **BILL-01** | Register / onboarding | Studio Owner | `src/app/billing/index.tsx`, `src/app/(auth)/sign-in.tsx` | Implemented (Demo Boundary) | Subdomain check, onboarding status. |
| **BILL-02** | Credits | Admin / Owner | `src/app/billing/index.tsx` | Implemented (Live + Demo) | Credits ledger, transaction history, top-up simulation, coupon validation. |
| **BILL-03** | Subscription | Admin / Owner | `src/app/billing/index.tsx` | Implemented (Owner Verified Gap G8) | Current plan name, period, renewal date; native checkout handoff. |
| **BILL-04** | Gifts / referrals | Admin / Owner | `src/app/billing/index.tsx` | Implemented (Gifts Disabled) | Referral code & stats; gifts explicitly marked disabled per backend switch. |
| **BILL-05** | Pro / feature status | Admin / Owner | `src/app/billing/index.tsx` | Implemented (Live + Demo) | Pro entitlement status; unlocks interactive review and client contract sharing. |
| **AUD-01** | Activity history | Admin / Owner | `src/app/audit/index.tsx` | Implemented (Read-Only) | Audit log of mutations, uploads, assignments, receipts; actor and timestamp. |
| **MSG-01** | Communication outcomes | All staff | Multiple screens | Implemented (Outcomes Display) | Confirms queued communication results on booking confirm, payments, and review publish. |
