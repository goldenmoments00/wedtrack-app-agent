# WedTrack Staff App: Backend & Native Integration Gap Register

This document tracks the technical boundaries and integration gaps between the existing Next.js web backend and the React Native / Expo native mobile app (as documented in Section 10 of `01-backend-capabilities.md`).

---

### Gap G1: Native Authentication & Token Lifecycle
* **Category**: Identity / Auth
* **Current Backend State**: Existing web app uses NextAuth credentials provider with HTTP-only cookies and web session tokens (`/api/auth/[...nextauth]`). No dedicated mobile OAuth / JWT token issue, refresh, or revoke endpoint exists.
* **Affected Screens**: `src/app/(auth)/sign-in.tsx`, `src/context/auth-context.tsx`, `src/app/(tabs)/more.tsx`.
* **Mobile Workaround**:
  * An explicit Demo Mode with stateful persona switcher allows testing all 9 documented role profiles without production credentials.
  * In Live Mode, an honest error boundary refuses to fake success if `/api/v1/auth/mobile/login` is unreachable or unconfigured.
  * Tokens are securely stored in `expo-secure-store`.
* **Required Backend Contract**:
  ```http
  POST /api/v1/auth/mobile/login
  Content-Type: application/json
  { "email": "...", "password": "...", "subdomain": "..." }

  Response (200 OK):
  {
    "accessToken": "jwt_token...",
    "refreshToken": "refresh_token...",
    "expiresIn": 86400,
    "user": { "id": "...", "name": "...", "email": "...", "roles": ["..."] },
    "tenant": { "id": "...", "name": "...", "subdomain": "..." }
  }
  ```

---

### Gap G2: Unified Mobile Bootstrap & Capability Resolution
* **Category**: Session / RBAC
* **Current Backend State**: `/api/v1/session` returns only basic identity. Permission presets, destination visibility, money redactions, legacy agent/editor IDs, and feature entitlements are scattered across separate database tables and utility modules.
* **Affected Screens**: App Shell, Navigation Tabs (`src/app/(tabs)/_layout.tsx`), Persona Selector.
* **Mobile Workaround**:
  * Local capability resolver computes effective permissions (`resolveEffectivePermissions`), preserving the hard rule: *margin is unavailable unless both revenue and cost are at least 'view'*.
  * Combined agent/editor accounts maintain distinct assignment pointers without account duplication.
* **Required Backend Contract**:
  ```http
  GET /api/v1/mobile/bootstrap
  Authorization: Bearer <accessToken>
  x-tenant-subdomain: <subdomain>

  Response (200 OK):
  {
    "user": { "id": "...", "canonicalId": "...", "roles": [...], "capabilities": { "shooting": true, "editing": true } },
    "studio": { "id": "...", "name": "...", "currency": "INR", "proEnabled": true },
    "permissions": {
      "destinations": ["Dashboard", "Orders", "Assignments", "Work", "Payments", "Payroll"],
      "money": { "revenue": "view", "cost": "view", "margin": "view" },
      "orderSections": { "client": "edit", "crew": "edit", "editing": "edit", "payments": "view" }
    }
  }
  ```

---

### Gap G3: Staff Booking Creation & Permission Consistency
* **Category**: Mutations / Credits
* **Current Backend State**: Existing `/api/orders` and `/api/orders/post` are public booking endpoints with reCAPTCHA; uniform authenticated staff-creation semantics with idempotency keys and credit deductions are not unified.
* **Affected Screens**: `src/app/orders/create-wedding.tsx`, `src/app/orders/create-occasion.tsx`, `src/app/orders/[id]/index.tsx`.
* **Mobile Workaround**:
  * Client generates standard UUID v4 `Idempotency-Key` headers using `expo-crypto`.
  * Stateful demo store simulates server credit deduction (3 credits per confirmation) and updates booking status immediately.
* **Required Backend Contract**:
  ```http
  POST /api/v1/staff/orders
  Authorization: Bearer <token>
  Idempotency-Key: <uuid>
  Content-Type: application/json
  {
    "type": "WEDDING",
    "brideName": "...",
    "groomName": "...",
    "primaryContactPhone": "...",
    "events": [...]
  }
  ```

---

### Gap G4: Native Media Preparation & Upload Transport
* **Category**: Media / Reviews
* **Current Backend State**: Web album review preparation uses browser DOM and Canvas APIs to render PDF pages into images; native mobile PDF page rasterization and multipart chunking require platform-specific native pipelines.
* **Affected Screens**: `src/app/review/[itemId].tsx`.
* **Mobile Workaround**:
  * Native file selection with `expo-document-picker` supporting PDF and MP4 inspection.
  * Interactive upload simulation featuring granular progress (0-100%), cancel, and retry states.
  * Native feedback player handles client voice feedback and spatial pin coordinates.
* **Required Backend Contract**:
  ```http
  POST /api/v1/reviews/{itemId}/uploads/presigned-part
  { "partNumber": 1, "fileName": "...", "fileSize": 148897792 }
  ```

---

### Gap G5: Agent Personal Payment History Ledger
* **Category**: Financial RBAC
* **Current Backend State**: Agents have shoot compensation on individual assignments, but no dedicated personal payout history endpoint exists (`/api/my-payments` is hard-coded for editors only; studio payroll cannot be exposed to agent devices).
* **Affected Screens**: `src/app/(tabs)/schedule.tsx` (Shoots workspace).
* **Mobile Workaround**:
  * Dedicated "Assignment Pay" screen computes earned compensation from the agent's verified assigned events.
  * Displays honest notice stating that the personal paid/unpaid settlement ledger requires the G5 backend endpoint.
* **Required Backend Contract**:
  ```http
  GET /api/v1/agents/my-payouts
  Authorization: Bearer <token>
  Response (200 OK):
  {
    "totalEarned": 52000,
    "totalPaid": 25000,
    "balanceDue": 27000,
    "payouts": [...]
  }
  ```

---

### Gap G6: Personal Checklist & Agent Activity Assignments
* **Category**: Workflow
* **Current Backend State**: Generic order activities exist on orders, but there is no cross-order personal activity checklist for editors or agents (`/api/my-tasks` only returns editing tasks).
* **Affected Screens**: `src/app/orders/[id]/index.tsx`, `src/app/settings/activities.tsx`.
* **Mobile Workaround**:
  * Activities remain scoped within order details, where assigned staff can advance status stages.
* **Required Backend Contract**:
  ```http
  GET /api/v1/my-activities
  ```

---

### Gap G7: Push Notifications, Offline Queue & Device Lifecycle
* **Category**: Device / Network
* **Current Backend State**: No staff push-token registration, notification inbox, or server-side offline write conflict resolution exists.
* **Affected Screens**: All operational list screens.
* **Mobile Workaround**:
  * Pull-to-refresh on all list views; explicit offline indicators; no silent queuing of non-idempotent financial writes.
* **Required Backend Contract**:
  ```http
  POST /api/v1/devices/register-push-token
  { "pushToken": "ExponentPushToken[...]", "platform": "android" }
  ```

---

### Gap G8: Native Billing Checkout & Native Document Generation
* **Category**: Billing & Documents
* **Current Backend State**: Web Razorpay checkout relies on browser JavaScript SDK (`razorpay.js`); PDF contract generation relies on DOM/HTML rendering. The gifts switch (`GIFTS_ENABLED`) is hard-coded to `false` in `lib/gifts/milestones.ts`.
* **Affected Screens**: `src/app/billing/index.tsx`, `src/app/payroll/index.tsx`, `src/app/orders/[id]/index.tsx`.
* **Mobile Workaround**:
  * Gifts module explicitly labeled as disabled.
  * Plan upgrades and credits display current status with handoff guidance.
  * CSV payroll export is implemented via native OS share sheet (`expo-sharing`).
* **Required Backend Contract**:
  * Server-side PDF generation returning signed download URLs (`/api/v1/orders/{id}/contract.pdf`).
  * Native Razorpay mobile checkout SDK credentials.

---

### Gap G9: Notification Operations Console
* **Category**: Communications
* **Current Backend State**: Background email and WhatsApp jobs run in server infrastructure, but lack a safe, tenant-isolated staff-facing delivery/retry console.
* **Affected Screens**: `src/app/audit/index.tsx`, Order Details.
* **Mobile Workaround**:
  * Shows confirmed business outcomes on booking confirmation, client receipts, and review publishing.
* **Required Backend Contract**:
  ```http
  GET /api/v1/communications/log?orderId=...
  ```

---

### Gap G10: Reliable Mutation Normalization, IDs & Currencies
* **Category**: Data Normalization
* **Current Backend State**: Backend routes alternate between internal database IDs and tenant-local order numbers (`tenantOrderNumber`), and error shapes vary across routes.
* **Affected Screens**: All detail and list screens.
* **Mobile Workaround**:
  * Normalized data contracts in `src/types/orders.ts` and `src/services/api-client.ts` consistently expose `tenantOrderNumber` for UI display while preserving internal IDs for API calls.
* **Required Backend Contract**:
  * Unified JSON error envelope `{ "code": "...", "message": "...", "fieldErrors": {...} }`.
