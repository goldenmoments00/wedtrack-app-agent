# Prompt: build the WedTrack staff app with React Native and Expo

Copy the prompt below into the AI coding agent working in the mobile repository. Keep this file and `01-backend-capabilities.md` together. The prompt works with either this folder inside the existing repository or the two documents copied into a new mobile repository.

---

Build the **WedTrack staff mobile app for Android and iOS using React Native, Expo and TypeScript**.

First read `01-backend-capabilities.md` in the same folder as this prompt. If you were given the folder rather than the exact file path, locate both documents before starting. That document is the functional scope and role-access reference. Read the target repository's `AGENTS.md`/`CLAUDE.md` as well.

The users are studio **admin/owner, manager, agent and editor**, including combined agent/editor accounts. **There is no client-facing app in this scope.** Staff can share existing client-portal links and act on feedback from that web portal; they cannot submit client approvals or impersonate clients.

## 1. Build a working app, with an honest integration boundary

The first deliverable is a usable native UI and UX for the documented staff workflows. Implement connected screens, forms, navigation, permissions and state transitions, not a collection of static mockups.

Reuse the existing Next.js backend wherever its API contract is available and verified. Do not create a separate backend, alter the production web app, or invent API endpoints as part of this request. The document explicitly identifies mobile integration gaps.

| Mode | Required behavior |
|---|---|
| Live | Use only verified endpoints and authentication. Show the server result. Never switch to fabricated data when an API fails. |
| Demo | Use realistic synthetic fixtures and stateful local interactions behind an explicit development/demo setting. Label this environment clearly. It must work without production credentials. |
| Backend/native gap | Implement an honest unavailable or handoff state, record the contract needed, and continue the rest of the app. Do not display a fake successful payment, message, upload or authentication result. |

If source/API access is unavailable, proceed with the demo implementation and a concise integration-gap register. Ask only for information that blocks work that cannot safely be isolated behind this boundary.

## 2. Establish scope and navigation, then implement

1. Inspect the target project and the capability document. Use the existing mobile app if one exists. In a new standalone mobile repository, scaffold at its root. In the existing Next.js repository, use an isolated `mobile/` directory and preserve the web app, its configuration and uncommitted work.
2. Create a compact capability coverage checklist using every capability ID from the document. For each, record destination/action, personas, integration status and any documented blocker. Present the proposed navigation and visual direction before extensive UI implementation, following repository approval rules where required.
3. Build the native app shell, authentication/demo entry, tenant/session state, permission-aware navigation and reusable form/list/detail states. Then implement the operational flows in the sequence below.
4. Connect verified APIs through a small typed boundary; use stateful demo fixtures for the remaining documented flows. Keep live and demo behavior explicit and separate.
5. Run the app on Android and iOS where tooling permits, verify the scenarios below, and deliver run instructions, evidence and remaining integration blockers. Do not claim a platform was tested if it was not.

Use the current stable Expo SDK compatible with the target environment. Check official documentation when selecting versions and native libraries; do not copy a stale version from this prompt. Use the repository package manager, install Expo-compatible native packages, and commit a lockfile when repository workflow calls for it.

## 3. Functional implementation sequence

### Foundation and operational users

| Stage | Implement |
|---|---|
| Entry and session | Studio discovery/selection, staff sign-in, reset-password journey, profile, sign-out, loading/expired/deactivated states, combined-role workspace switcher |
| Admin/manager daily work | Overview, order search/filter/pagination, order detail, booking forms, permitted booking edits/status changes, schedule and crew assignment, editing coordination, order activities |
| Agent workspace | Own shoots, next/today/upcoming/completed work, event detail, contact/map actions, pending submissions, role-specific photo/video count entry, submitted history, own assignment pay |
| Editor workspace | Own work, permitted order discovery and self-claiming, own status/release actions, review entry and feedback/revision flow, own payment history, own activity-status action where supported |
| Shared review and money | Staff album/video review, upload progress/failure/resume states, feedback resolution, send/reopen, client-review completion blocker, client payment records, payroll and payout recording under the documented access rules |

### Occasional administration

| Area | Implement |
|---|---|
| Team | Member directory, create/edit, active/inactive states, profession/categories, supported capability conversions/deactivation, open-work warnings and rate management |
| Permissions | Manager/editor presets and granular page/money/order permissions; preview affected access and handle revocation |
| Studio setup | Packages and extraction-draft review, event types, activity templates, branding/terms, domain and email-change states |
| Business account | Registration/onboarding, credits/history/coupons, plan/subscription state, referral state and Pro entitlement; gifts remain unavailable while the backend switch is disabled; actual checkout only after its native integration is verified |
| Supporting flows | Read-only activity log, order financial breakdown, payroll export and contract preview/export with honest native integration states, share existing booking/contract/receipt links, inspect client-access status and admin PIN reset with one-time PIN display |

Do not stop after the home screen or the easiest persona. Complete the documented UI coverage, marking real integration gaps accurately. Never silently invent functionality to make the feature list appear complete.

## 4. Native UI and UX requirements

Design professional business software for people checking schedules, coordinating work and entering records on a phone. Use a coherent visual system: refined typography, clear hierarchy, restrained status colors, generous touch targets and purposeful spacing. Avoid emoji UI icons; use a React Native-compatible SVG icon set.

Use native navigation, at most five primary destinations, focused detail screens and More for occasional tools. The suggested information architecture in the capability document is a starting point. Adapt it to actual permissions. Do not transplant the desktop sidebar or shrink dense web tables into a phone viewport.

Support safe areas, keyboard avoidance, Android back behavior, iOS navigation conventions, readable date/currency formatting, screen-reader labels, text scaling, reduced motion, and visible validation/focus/pressed/disabled states. Preserve list position and filters after returning from detail. Keep forms usable on small screens.

Every async screen needs loading, populated, empty, filtered-empty, error/retry and refresh states. Relevant actions also need submitting, success, validation, permission-denied, stale/conflict, session-expired and offline states. Sensitive/destructive actions require clear confirmation; ordinary saves should not require redundant confirmation dialogs.

Display no hidden financial data. Missing money fields are not zero. Separate “assignment pay,” “earned,” “paid,” “balance due,” and “studio revenue.” Use server totals and the correct period label. Distinguish event state, agent submission, editing state, review approval and payment state.

## 5. Access and data rules

1. Drive navigation/actions from the authenticated roles, effective permissions, active capabilities, assignment ownership and feature entitlements. Fail closed while these load. A role label or page permission alone does not authorize an operation.
2. Preserve documented exceptions: manager client-payment restrictions; owner-only subscription verification; editor-only fields limited to claim/status; review access for admin/owner or assigned editor; agent-only count submissions; separate personal payout capabilities.
3. Keep studio order number, internal order ID, canonical user ID, legacy editor ID and agent ID distinct in the API adapter. For each endpoint, verify the identifier, currency unit, date/month convention, response envelope and error shape it actually uses.
4. Refresh after writes, assignment changes and permission changes. Scope caches by tenant and identity. Clear private data on logout/account change. Do not fetch a studio-wide dataset to simulate self-only access on-device.
5. Do not auto-retry uncertain payments, booking confirmations or other non-idempotent mutations. Reuse supported request keys for retries of the same operation; re-fetch state after conflicts. Review operations require correct round/version handling.

The server enforces access. UI hiding is not a security boundary. No secrets, provider keys, admin credentials or database access belong in the app. Public Expo configuration is not secret storage. Do not log passwords, tokens, phone/email values or sensitive payment details.

## 6. Expo and integration guidance

Use Expo Router for native routing unless the existing mobile app already has a well-supported navigation setup that should be preserved. React Native screens should not import DOM components, Next.js server modules, Prisma or the web app's browser-only UI.

Use a small typed API client and the project's established server-state/query solution, or choose one mainstream solution if none exists. Validate external responses where ambiguity matters. Do not build a generic plugin framework or duplicate business calculations already owned by the backend.

Resolve native authentication explicitly. The existing `/api/v1/session` is not a mobile token-login endpoint, and its response is not the full permissions/bootstrap contract. Do not fabricate `/login`, `/refresh` or bearer-token support. Store any agreed long-lived credentials in secure native storage, never ordinary persisted state. Session expiry, revocation, tenant-host routing and password reset links must be exercised end to end before live auth is called complete.

For media, use native file/document selection and supported playback components. The web PDF preparation code depends on browser APIs and cannot simply be imported into React Native. Keep large files out of base64 JSON and whole-file JS-memory copies. Respect server file validation, signed URLs, multipart state, current review round and expiry. Do not promise uploads continue after the OS suspends or terminates the app unless implemented and tested. Staff consumes client voice feedback; client voice recording is outside this app.

Use native share, phone and maps capabilities for existing authorized data. Handle platform permission denial and missing target apps. Actual PDF generation, native checkout, push notifications and offline writes require the integrations identified in the capability document; do not infer them from a share link, webhook, enum or background-job route.

Use development builds when native dependencies require them; Expo Go alone is not evidence that all production integrations work. Do not submit to app stores, publish an OTA update, charge a payment, message a real client or deploy backend changes as part of building this app.

Official references, checked when this prompt was prepared; recheck at implementation time:

- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)

## 7. Realistic demo scenarios and verification

Use synthetic people and bookings, not production PII. Include multiple events in a wedding, a normal occasion, partly staffed shoots, different editor categories, pending and completed payouts, a Pro-enabled studio and a studio without Pro. The fixture adapter must actually change demo state when actions succeed, and preserve state across screen navigation. A development persona selector must never be an authorization control in live mode.

| Scenario group | Verify |
|---|---|
| Access | Admin vs owner billing; default vs restricted manager; default vs work-only editor; agent; combined agent/editor; revoked capability; wrong tenant and expired session |
| Operations | Search/filter/pagination; booking with several events; no credits; hidden money; reschedule; ineligible crew/editor; concurrent claim/reassignment; stale record; destructive confirmation |
| Personal work | Agent assigned as photographer/video/both; one submission still pending; submission failure/retry; own pay only; editor claim/release/status; activity status vs editing status |
| Review and money | Pro unavailable; interrupted upload; invalid media; stale review round; open comments; missing client account; pending client approval; expired media; uncertain payment result; correct earnings/paid period labels |
| Native experience | Small-screen forms, keyboard, safe areas, back/deep-link behavior, foreground refresh, offline/reconnect, accessibility/text scaling, share/maps/phone, and actual media playback on each tested platform |

Use meaningful tests for authorization rendering, adapter mappings and stateful workflows. Run type checking, relevant tests and Expo project diagnostics. Exercise real API paths with approved test accounts when available. Unit tests and mock/demo interactions do not prove live backend integration.

## 8. Deliverables

1. Runnable Expo app source with environment example, dependency lockfile and concise Android/iOS setup commands.
2. Implemented native screens and interactions for the capability inventory, with realistic demo mode and verified live integrations clearly identified.
3. A capability coverage matrix referencing the IDs in `01-backend-capabilities.md`, including the location and integration state of every capability.
4. A concise backend/native integration-gap register: required behavior, affected screens, current workaround or blocked state, and evidence needed to connect it.
5. Verification report with actual commands/results, tested devices/platforms, screenshots where available, and exact remaining blockers. Never mark an untested platform or mocked external action as working live.

Start by reading the capability document and inspecting the target repository. Proceed through the implementation, not just a proposed plan, within the applicable repository workflow.
