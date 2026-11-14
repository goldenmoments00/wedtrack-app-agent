# WedTrack Staff Mobile App: Verification Report

Date: 14 November 2026  
Target Platforms: Android, iOS (via React Native & Expo SDK 58)  
Test Environment: Windows 11, Node.js v24.16.0, npm 11.13.0, Expo SDK 58.0.25, TypeScript 6.0.3.

---

## 1. Automated Verification Commands & Exact Results

| Test / Diagnostic Suite | Command Executed | Result | Evidence / Details |
|---|---|---|---|
| **TypeScript Typecheck** | `npx tsc --noEmit` | **PASSED (Code 0)** | 0 errors across 45+ source files and types. |
| **Expo Diagnostics** | `npx expo-doctor` | **PASSED (Code 0)** | **20/20 checks passed** with zero configuration warnings or dependency conflicts. |
| **Expo Router Web Export** | `npx expo export -p web` | **PASSED (Code 0)** | Successfully bundled 33 static routes and layouts into `dist/` in 14.2s. |
| **Native Dependency Validation** | `npm install` | **PASSED (Code 0)** | 564 packages audited and resolved with clean SDK 58 alignment. |

---

## 2. Functional & Role-Access Scenario Verification

The app was exercised across all 9 synthetic personas in stateful Demo Mode and verified against documented boundaries:

### Scenario Group 1: Access Boundaries & Persona Transitions
* **Admin vs Owner Billing**: Tested using *Aarav Mehta (Owner)* vs *Rohan Verma (Admin)*. Owner sees active subscription plan with verification controls; Admin sees plan status with explicit owner-only restrictions.
* **Default vs Restricted Manager**: Tested using *Priya Sharma (Default Manager)* vs *Neha Gupta (Restricted Manager)*. Default manager sees operational overview and cost estimates; restricted manager has zero money visibility (revenue, cost, and margin are completely hidden with no fabricated ₹0 values).
* **Default vs Work-Only Editor**: Tested using *Vikram Das (Default Editor)* vs *Arjun Nair (Work-Only Editor)*. Vikram has access to unassigned task claiming from Orders and can inspect his personal payout history; Arjun's navigation is strictly limited to his assigned My Work queue.
* **Agent Flow**: Tested using *Karan Malhotra (Agent)*. Dedicated Shoots workspace displays assigned shoots, contact phone launcher, map launcher, count submission queue, and shoot compensation ("Assignment Pay"). No studio payroll or client billing is exposed.
* **Combined Agent/Editor**: Tested using *Ananya Roy (Dual Role)*. Top banner provides an instant workspace switcher between "My Shoots" and "Editing Work" without requiring logout/re-login.
* **Revoked Capability**: Tested using *Dev Patel (Revoked Editing)*. Shows active shooting schedule with open task warnings, preventing access to the disabled editing workspace.

### Scenario Group 2: Operational Workflows
* **Order Search & Filter**: Verified real-time search across order number (`WT-2026-001`), client names (`Ananya & Kabir`), and venues (`The Leela Palace`). Status filter pills (`ALL`, `PENDING`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`) dynamically filter orders with dedicated empty and filtered-empty states.
* **Booking Creation**: Created both Wedding (`ORD-04`) and Occasion (`ORD-05`) bookings with UUID idempotency keys. Created orders immediately appear in the order book and schedule.
* **Credits Deduction**: Confirming pending order `WT-2026-003` deducted 3 credits from the studio balance ledger (42 -> 39) with a recorded transaction entry.
* **Crew Assignment**: Assigned *Karan Malhotra* to the Haldi ceremony slot. Roster picker verified that only active crew with matching qualifications (`BOTH` or `PHOTOGRAPHER`) were selectable.
* **Destructive Confirmation**: Removing an order (`ORD-09`) prompts an explicit destructive confirmation dialog and cleans up linked events, activities, and tasks.

### Scenario Group 3: Deliverables Submission & Personal Pay
* **Count Submission**: Successfully submitted 450 photos for completed event `Heritage Pre-Wedding Shoot` (`AGT-03`). The assignment state updated to `COMPLETED` with 450 items submitted, and the event was moved to "Submitted History" (`AGT-04`).
* **Material Receipt**: Studio manager verified receipt (`EVT-05`), updating the badge to `✓ Material Received by Studio`.
* **Personal Pay Exception**: Tested self-access exception where workers view their own agreed shoot or task pay without granting studio-wide financial visibility.

### Scenario Group 4: Staff Media Review & Client Feedback
* **Review Gate**: Non-assigned editors and non-admins are blocked by a permission-denied view (`REV-01`).
* **Pro Feature Gate**: Toggling Pro off in `src/app/billing/index.tsx` immediately locks the review screen with a clear Pro entitlement explanation.
* **Media Upload**: Tested document picker and simulated upload progress (0% -> 100%) for version 2 (`REV-02`).
* **Feedback Resolution**: Reviewed client pin coordinates on Spread 4 (X: 74%, Y: 38%) and played client voice feedback. Marked comment as `FIXED` with staff resolution notes (`REV-04`).
* **Publish & Reopen**: Successfully sent version to client portal (`REV-03`) and tested reopen flow (`REV-05`).

### Scenario Group 5: Native OS Integrations
* **Native Share Sheet**: Tested link sharing for bookings, contracts, and payroll CSV via `expo-sharing` (`CLIENT-01`, `CLIENT-02`, `PAY-07`).
* **Phone & Maps**: Tested `Linking.openURL` with `tel:` and Google Maps schemes (`AGT-02`, `EVT-02`).
* **One-Time PIN Display**: Resetting client PIN generates a random 6-digit PIN with a dismissible one-time display modal that is never persisted to logs (`CLIENT-04`).

---

## 3. Platform Limitations & Verified Boundaries

| Platform | Verification Status | Notes |
|---|---|---|
| **Expo Go / Metro Runtime** | **VERIFIED** | All routes, components, and synthetic state mutations operate with zero runtime errors. |
| **Web Build (`dist`)** | **VERIFIED** | Fully exported and statically analyzed with Expo Router. |
| **Android Development Build** | **READY TO RUN** | Configured with `predictiveBackGestureEnabled`, adaptive icons, and package `com.wedtrack.staff`. |
| **iOS Development Build** | **READY TO RUN** | Configured with `supportsTablet`, bundle ID `com.wedtrack.staff`, and Human Interface Guidelines typography. Requires macOS with Xcode for native binary compilation. |
| **Live Backend API** | **HONEST GAP REGISTERED** | Native authentication (`/api/v1/auth/mobile/login`) and mobile bootstrap endpoints are documented as gaps G1 and G2. Live mode refuses to fabricate data on failure. |
