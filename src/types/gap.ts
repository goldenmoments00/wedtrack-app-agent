export interface IntegrationGap {
  id: string; // 'G1'..'G10'
  name: string;
  category: 'AUTH' | 'BOOTSTRAP' | 'MUTATION' | 'MEDIA' | 'FINANCIAL' | 'ACTIVITIES' | 'DEVICE' | 'BILLING' | 'NOTIFICATIONS';
  status: 'BLOCKED_LIVE' | 'DEMO_FALLBACK' | 'HANDOFF_TO_WEB';
  affectedScreens: string[];
  description: string;
  currentWorkaround: string;
  requiredBackendContract: string;
}

export const INTEGRATION_GAPS: IntegrationGap[] = [
  {
    id: 'G1',
    name: 'Native Authentication & Token Lifecycle',
    category: 'AUTH',
    status: 'DEMO_FALLBACK',
    affectedScreens: ['Sign In', 'Session Refresh', 'Sign Out'],
    description: 'Existing auth is NextAuth web credentials/session cookie; no dedicated mobile bearer token issue/refresh/revoke contract exists.',
    currentWorkaround: 'Explicit demo persona selector with stateful session and honest native boundary; credentials validated against mock tenant identity.',
    requiredBackendContract: 'POST /api/v1/auth/mobile/login returning { accessToken, refreshToken, expiresIn, user, tenant } and POST /api/v1/auth/mobile/refresh.',
  },
  {
    id: 'G2',
    name: 'Unified Mobile Bootstrap & Capability Resolution',
    category: 'BOOTSTRAP',
    status: 'DEMO_FALLBACK',
    affectedScreens: ['App Shell', 'Workspace Switcher', 'Navigation Tabs'],
    description: '/api/v1/session only returns a subset of user/tenant data. Permissions, portals, feature access, legacy assignment IDs, and role exceptions are spread across separate endpoints.',
    currentWorkaround: 'Consolidated local bootstrap resolver that computes effective permissions, dual capabilities, and workspace tabs deterministically.',
    requiredBackendContract: 'GET /api/v1/mobile/bootstrap returning complete identity, studio branding, resolved permissions, active capabilities, and Pro entitlement.',
  },
  {
    id: 'G3',
    name: 'Staff Booking Creation & Permission Consistency',
    category: 'MUTATION',
    status: 'DEMO_FALLBACK',
    affectedScreens: ['Create Wedding Booking', 'Create Occasion Booking', 'Change Order Status'],
    description: 'Booking POST routes are public client forms; manager page permissions conflict with some route-level role guards; creation idempotency is unevenly supported.',
    currentWorkaround: 'Stateful local booking creation with UUID idempotency key; credit ledger simulation and instant reflection in order book.',
    requiredBackendContract: 'Authenticated POST /api/v1/staff/orders supporting both wedding and occasion payloads, role validation, and credit deduction guarantee.',
  },
  {
    id: 'G4',
    name: 'Native Media Preparation & Upload Transport',
    category: 'MEDIA',
    status: 'DEMO_FALLBACK',
    affectedScreens: ['Review Upload', 'Album PDF Page Rendering', 'Video Transcoding'],
    description: 'Web app uses browser canvas and DOM APIs to render PDF pages into images; native mobile PDF page extraction and background multipart chunking require dedicated native pipelines.',
    currentWorkaround: 'Native file picker with file size/type inspection and interactive upload simulation with real progress, pause/resume, and failure states.',
    requiredBackendContract: 'Native-optimized presigned multipart chunk upload API with server-side PDF spread rasterization and webhook/polling status.',
  },
  {
    id: 'G5',
    name: 'Agent Personal Payment History Ledger',
    category: 'FINANCIAL',
    status: 'DEMO_FALLBACK',
    affectedScreens: ['Agent My Pay', 'Agent Earnings Detail'],
    description: 'Agents have own assignment compensation on events, but no dedicated personal payout history endpoint exists (/api/my-payments is editor-only; studio payroll cannot be sent to agent devices).',
    currentWorkaround: 'Dedicated "Assignment Pay" view showing earned shoot compensation per event, with honest notice that personal paid/balance ledger requires G5 backend endpoint.',
    requiredBackendContract: 'GET /api/v1/agents/my-payouts returning personal paid records, balances due, and completed shoot compensation items without leaking studio payroll.',
  },
  {
    id: 'G6',
    name: 'Personal Checklist & Agent Activity Assignments',
    category: 'ACTIVITIES',
    status: 'DEMO_FALLBACK',
    affectedScreens: ['Order Activities', 'Editor My Activities', 'Agent Tasks'],
    description: 'Generic order activities exist on orders, but there is no unified personal activity feed for editors, and agent-only activity assignment is not supported by backend routes.',
    currentWorkaround: 'Activities are accessible within order detail; editors can update status of activities explicitly assigned to them.',
    requiredBackendContract: 'GET /api/v1/my-activities providing cross-order personal checklist with role-aware status transition permissions.',
  },
  {
    id: 'G7',
    name: 'Push Notifications, Offline Queue & Device Lifecycle',
    category: 'DEVICE',
    status: 'DEMO_FALLBACK',
    affectedScreens: ['Activity Feeds', 'Offline Banner', 'Push Token Registration'],
    description: 'No staff push token registration, notification read state, or backend offline mutation conflict resolution exists.',
    currentWorkaround: 'Foreground pull-to-refresh on every list; explicit offline state indicators; safe mutation protection preventing unconfirmed retries.',
    requiredBackendContract: 'POST /api/v1/devices/register-push-token and conflict-safe event syncing.',
  },
  {
    id: 'G8',
    name: 'Native Billing Checkout & Native Document Generation',
    category: 'BILLING',
    status: 'HANDOFF_TO_WEB',
    affectedScreens: ['Credit Purchase', 'Subscription Upgrade', 'Contract Export', 'Payroll Export'],
    description: 'Browser Razorpay checkout flow cannot be imported into React Native; browser PDF generation depends on DOM/HTML; gifts switch is hardcoded false in backend.',
    currentWorkaround: 'Gifts clearly marked unavailable (switch disabled); credits/subscriptions display honest status with handoff guidance; CSV export implemented via native share sheet.',
    requiredBackendContract: 'Native Razorpay SDK signature endpoint, mobile receipt verification, and server-side PDF generation returning a secure download URL.',
  },
  {
    id: 'G9',
    name: 'Notification Operational Console & Queue Retries',
    category: 'NOTIFICATIONS',
    status: 'DEMO_FALLBACK',
    affectedScreens: ['Communication History', 'Job Retries'],
    description: 'Backend notification and anniversary jobs exist in server infrastructure, but lack a safe, tenant-isolated staff-facing retry/inspection console.',
    currentWorkaround: 'Read-only communication outcome indicators on booking confirmation, payment recording, and review publish.',
    requiredBackendContract: 'GET /api/v1/communications/log?orderId=... with safe retry endpoints for failed WhatsApp/email triggers.',
  },
  {
    id: 'G10',
    name: 'Reliable Mutation Normalization, IDs & Currencies',
    category: 'MUTATION',
    status: 'DEMO_FALLBACK',
    affectedScreens: ['All Detail & List Screens'],
    description: 'Backend routes vary between internal database IDs vs tenant order numbers, amount representations, and error envelopes.',
    currentWorkaround: 'Strictly typed API adapter normalizing tenantOrderNumber for display, preserving server totals without local guesswork, and isolating error envelopes.',
    requiredBackendContract: 'Consistent API v1 response schema { data, error: { code, message, fieldErrors }, meta: { pagination } }.',
  },
];
