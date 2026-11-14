# WedTrack Staff Mobile App

A production-grade native mobile application for wedding photography studio operations, crew management, editing coordination, and client review feedback. Built with **React Native, Expo SDK 58, and TypeScript**.

Designed according to **Apple Human Interface Guidelines (HIG)**, **Material Design 3**, and senior mobile engineering standards.

---

## 📱 Supported Personas & Workspaces

The app enforces strict role-based access control (RBAC) across three specialized workspaces:

1. **Operations Workspace** (Studio Admin, Owner, Manager):
   * Studio overview, financial ledger, order book with multi-field search and status filters.
   * Booking creation (Wedding & Occasion), schedule management, and crew assignment.
   * Deliverables coordination, order activities checklist, staff payroll, and client portal support.
2. **Shoots Workspace** (Photographers, Videographers, Dual-Role Crew):
   * Assigned shoot schedule with event timing, venue map triggers, and client contact dialer.
   * Deliverables count submissions (photo & video counts) and studio receipt tracking.
   * Assignment pay breakdown with self-access exception handling.
3. **Editing Workspace** (Editors across Photo, Film, Reel, Highlight, and Album categories):
   * My Work queue, unassigned task self-claiming from the order book.
   * Staff media review: album spread pin markers, timecode comments, client voice notes playback, and revision uploads.
   * Editor payout history and personal earnings.
4. **Combined Dual-Role Workspace Switcher**:
   * Users with both shooting and editing capabilities (e.g. *Ananya Roy*) switch between Shoots and Editing instantly via the top banner without logging out.

---

## 🚀 Quick Start & Run Commands

### 1. Prerequisites
* Node.js v20+ (developed and tested on Node.js v24)
* npm v10+

### 2. Installation
```bash
# Install dependencies
npm install

# Verify setup with Expo Doctor (20/20 checks passing)
npx expo-doctor

# Type check the TypeScript codebase
npm run typecheck
```

### 3. Run the App
```bash
# Start Metro bundler with Expo Go / Dev Build
npm start

# Run on Android (Emulator or Connected Device)
npm run android

# Run on iOS (macOS Simulator)
npm run ios

# Run in Web Browser
npm run web
```

---

## 🧪 Stateful Demo Mode & Scenarios

The app starts in a **Stateful Demo Mode** populated with realistic synthetic Indian wedding studio data (no production PII). A persistent top banner allows instant switching between all 9 documented role scenarios:

1. **Aarav Mehta (Owner / Admin)**: Full billing, subscription verification, team directory, and payroll.
2. **Rohan Verma (Admin - Non-Owner)**: Full operations; subscription plan upgrades are gated to the studio owner.
3. **Priya Sharma (Manager - Default)**: Operations and crew assignment; client payments restricted.
4. **Neha Gupta (Manager - Restricted)**: Orders view-only; zero financial visibility (no fabricated ₹0 values).
5. **Vikram Das (Editor - Default)**: My Work queue, unassigned task self-claiming, own payouts.
6. **Arjun Nair (Editor - Work-Only)**: Strict assigned task queue only; no order book or payment tabs.
7. **Karan Malhotra (Agent / Crew)**: Photography & videography schedule, deliverables count submissions, and own shoot compensation.
8. **Ananya Roy (Combined Agent + Editor)**: Dual-role identity with instant workspace switcher.
9. **Dev Patel (Revoked Editing)**: Shooting schedule active; editing workspace disabled with open task warnings.

---

## 📑 Deliverables & Documentation

* [01-backend-capabilities.md](file:///d:/wedtrack%20app/01-backend-capabilities.md) — Source functional capability brief and role-access specification.
* [CAPABILITY-COVERAGE.md](file:///d:/wedtrack%20app/CAPABILITY-COVERAGE.md) — Comprehensive checklist mapping every capability ID (`AUTH-01` through `MSG-01`) to screens and integration states.
* [INTEGRATION-GAPS.md](file:///d:/wedtrack%20app/INTEGRATION-GAPS.md) — Technical register documenting gaps G1 through G10, affected screens, mobile workarounds, and required backend contracts.
* [VERIFICATION-REPORT.md](file:///d:/wedtrack%20app/VERIFICATION-REPORT.md) — Test execution report with commands, results, and scenario verification evidence.
* [AGENTS.md](file:///d:/wedtrack%20app/AGENTS.md) — Project-level senior mobile UI/UX and engineering instructions.
