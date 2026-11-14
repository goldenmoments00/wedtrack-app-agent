# WedTrack mobile app: backend capabilities and user flows

**Audience:** mobile product designer, React Native developer, and backend developer.  
**Scope:** studio admin/owner, manager, agent, and editor. No client-facing app.  
**Source snapshot:** 14 November 2026; local WedTrack Next.js repository at `e1aa669`, including the working-tree changes present when this document was written.  
**Companion:** [Expo app-building prompt](02-build-expo-app-prompt.md).

## 1. How to use this document

Use this as the functional brief for the mobile app: what each person needs to see, what they can do, and what happens when an action cannot proceed. It is not a database redesign or an exact request/response specification.

The existing Next.js backend already contains most studio operations. Start by reusing those business capabilities. A separate backend is not required to design the app or to begin its UI; native authentication and several integration contracts still need work before a production mobile client can use them reliably.

| Label | Meaning for the app team |
|---|---|
| **Existing** | A corresponding route/service exists in the inspected source. This does not mean it has been exercised from a native app or verified in production during this documentation task. |
| **Conditional** | Existing capability depends on permissions, assignment, tenant entitlement, state, or the particular route used. |
| **Gap** | Additional backend contract or native integration is needed. Design the state, but do not represent it as a working live feature. |
| **Excluded** | Deliberately outside this staff app. |

Capability IDs such as `ORD-01` let the app team track coverage without copying the entire brief. The core flows come first; setup and occasional administration follow. All money, permissions, assignments, and completion decisions remain authoritative on the server.

### Scope boundary

| Include | Exclude |
|---|---|
| Running a studio: bookings, crew, editing, review feedback, payments, payroll, setup | Client sign-in, client booking journey, client PIN entry, client comments or approval screens |
| Staff sharing booking/contract/receipt links and helping clients regain access | Impersonating a client or approving a review on their behalf |
| Staff reading feedback that clients submitted through the existing web portal | A new client mobile app |
| Tenant-specific business administration | Platform-wide tenant management, feature grants, provider credentials, cron jobs, webhook tools |
| Existing capabilities plus clearly identified mobile gaps | Invented CRM leads, chat, attendance, GPS tracking, leave management, raw-media storage, or bank-transfer automation |

## 2. Roles and permissions

“Admin” in this document means a studio administrator, not a WedTrack platform operator. `OWNER` and `ADMIN` share most studio functionality, but some billing routes distinguish them. Preserve that distinction internally.

| Persona | Default experience | Important boundary |
|---|---|---|
| Admin / owner | Studio overview, all orders, staffing, editing oversight, payments, payroll, team and settings | Limited to their studio. Subscription verification currently requires `OWNER`; do not promise all billing actions to every admin. |
| Manager | Dashboard and Orders | Other destinations are configurable. Money and order segments are broadly enabled in the default template, but individual API routes can still refuse an action. |
| Editor | Orders and My Work | Can see the studio order book by default, with redacted information. Can claim eligible unassigned work, update/release their own tasks, and manage reviews for their assigned reviewable tasks. |
| Agent | Own shoots and submissions | Photographer, videographer, or both. Own assignments and own event pay; no studio order-management or payroll administration. |
| Person with several roles | Combined authorized capabilities | One identity can shoot and edit. Switching workspace changes navigation, not identity or authorization. |

### Three independent permission axes

| Axis | Values | Effect on the app |
|---|---|---|
| Destinations | Dashboard, Orders, Teams, Assignments, Payroll, Work, Packages, Payments, Activity, Settings | Determines which app destinations are offered. Profile remains available to signed-in users. |
| Money | Revenue, cost, margin; each `none`, `view`, or `edit` | Hide, show read-only, or allow editing of the relevant amounts. Margin is unavailable unless revenue and cost are both visible. |
| Order sections | Client, crew, editing, payments; each `none`, `view`, or `edit` | Determines which parts of an order can be shown or changed. Crew assignment and crew pay are separate permissions. |

Only manager and editor templates are configurable. Owner, admin, and agent templates are fixed. Multiple roles use the union of permissions, with the margin constraint reapplied. A visible destination is **not** proof that every action within it is allowed: route-level role checks, self-assignment restrictions, and feature entitlements also apply.

Hidden values are often **omitted** from responses. Never render an omitted amount as ₹0, compute margin from incomplete data, or submit a hidden field with a zero/null replacement. Own-task or own-shoot pay can be returned as a self-access exception even when studio-wide cost access is absent.

### Role matrix: daily work

`Conditional` means apply the detailed flow rules below, not “show the button to everyone.”

| Capability | Admin / owner | Manager | Editor | Agent |
|---|---|---|---|---|
| Studio dashboard | Yes | Default | Only if granted and supported by the data route | No; own-shoot summary instead |
| Order book and permitted details | Yes | Default | Default; can be removed | No; assigned-shoot context only |
| Edit booking details / status | Yes | Conditional | No as editor-only | No |
| Create booking | Existing booking flow; mobile staff contract needed | Same, subject to staff authorization | Not a staff entitlement | Not a staff entitlement |
| Pin or delete an order | Yes | No | No | No |
| Manage events and crew | Yes | Conditional; route differences exist | Read permitted context only | View own assignments |
| Submit shoot counts | If also assigned as an agent | If also assigned as an agent | If also an agent | Own assignment only |
| Assign editors / set task details | Yes | Conditional | Claim/release self only; cannot edit task metadata | No |
| Change editing status | Yes | Conditional | Own tasks only | No, unless also an editor |
| Upload / send / reopen media review | Yes, with Pro | No for manager-only | Assigned reviewable task, with Pro | No, unless also assigned editor |
| Maintain order activities | Yes | Yes within accessible orders | Own activity status only | Not supported for agent-only |

### Role matrix: money and administration

| Capability | Admin / owner | Manager | Editor | Agent |
|---|---|---|---|---|
| View permitted order money | Yes | Permission-dependent | Hidden by default; own task pay exception | Own event pay only |
| Client payment administration | Yes | Existing routes restrict key actions; see `PAY-01` | No by default | No |
| Payroll summary and record payouts | Yes | Payroll page plus cost permission; supported payout routes | Own editor payment records only | Own payout-history API is a gap |
| Create/edit/deactivate team members | Yes | Not granted by Teams page alone | No | No |
| Configure manager/editor permissions | Yes | No | No | No |
| Maintain package/event-type catalogues | Yes | Browse where allowed; catalogue mutations restricted | Read where needed/allowed | No administration |
| Studio branding, terms, domains | Yes | Not granted by Settings page alone | No | No |
| Credits, subscriptions, gifts, referrals | Conditional admin/owner billing | No default management | No | No |
| Personal profile and password | Yes | Yes | Yes | Yes |

Sources: `lib/permissions/{defaults,types,resolve,presets}.ts`, `lib/rbac.ts`, `lib/permissions/editing-task.ts`, `lib/reviews/tasks.ts`, and the route groups in section 11.

## 3. Shared entry and account flows

| ID / capability | What the user can do and needs to see | State / boundary | Availability |
|---|---|---|---|
| AUTH-01 Find studio | Enter/select studio using its name/subdomain; see studio name and branding before sign-in | Unknown studio, ambiguous search, wrong studio, unavailable studio; never expose private staff data in discovery | Existing tenant search and tenant context; mobile discovery UX to implement |
| AUTH-02 Sign in | Use existing staff email/password; load identity, studio and authorized workspaces | Invalid credentials, deactivated account, expired session, password-change revocation, cross-studio session | Existing NextAuth credentials flow; native session handling is Gap G1 |
| AUTH-03 Recover access | Request password reset, open reset link, set password and sign in again | Generic response, invalid/expired token, rate limit; never reveal whether an email exists | Existing reset routes; native link routing needs integration |
| AUTH-04 Open correct workspace | Land in studio operations, editing work or shoots; allow eligible multi-role users to switch | No authorized workspace, role changed, one capability deactivated; retain one identity | Existing roles/portals; mobile bootstrap is Gap G2 |
| AUTH-05 Sign out / refresh access | End session and clear studio-specific cached data; return safely after reauthentication | Do not show previous tenant data after switching studio/account; do not automatically replay a money action after login | Existing web session; native lifecycle is Gap G1 |
| ACC-01 My profile | Read name, email, role, active state; update supported name/phone/password fields; avatar where supported | Profile fields differ between staff and agent records; email change is not universally self-service | Existing, conditional by field |
| ACC-02 Studio payment identity | Admin-tier users maintain the supported UPI fields; other roles see only fields intended for them | UPI editing is restricted in the profile service; do not offer every worker a payout-bank setup screen | Existing, restricted |

There is no evidence of a general staff account-deletion, biometric sign-in, SSO, multi-studio membership-switching, or device-session management contract. Treat those as separate product requests, not implied login features.

## 4. Admin and manager operational flows

### 4.1 Overview and order discovery

| ID | User functionality | Information needed / edge states |
|---|---|---|
| OPS-01 Overview | See booking counts, pending/confirmed/completed work, upcoming events, staffing gaps, and permitted money summaries; open the underlying records | Date period, count definitions, empty studio, partial API failure; never derive a studio total from one loaded page |
| ORD-01 Find orders | Search bookings; filter by status, month/year, missing package or missing assignments; sort by order number, event date, client or due amount when visible | Server pagination, search result count, timezone, no matches, invalid filter, reset filters; keep page position when returning from detail |
| ORD-02 Order overview | Read wedding/occasion, studio order number, client/couple names, event date/location, package, notes, status and priority | Show only allowed sections. An order can have several events and several editing deliverables |
| ORD-03 Priority | Admin/owner pins or unpins a booking to keep it prominent | Manager-only users cannot change priority; preserve server ordering |

**Identifier rule:** display `tenantOrderNumber`. Many `/api/orders/[id]` routes resolve that studio-local number, while other references still use the internal database ID. The mobile adapter must name them separately and map each endpoint deliberately. Never assume they are equal.

### 4.2 Booking creation and maintenance

| ID | User functionality | Rules / states |
|---|---|---|
| ORD-04 Create wedding booking | Capture bride/groom names, primary/secondary contact details and addresses, package/custom deliverables, event schedule, locations, notes and supported signatures | Each event can belong to bride, groom or both. At least one valid event, appropriate contact fields and booking consent are required. New public bookings start pending |
| ORD-05 Create occasion booking | Capture client, occasion/package, event date/location, contact details, notes and deliverables | Normal booking differs from wedding; do not require bride/groom fields |
| ORD-06 Edit booking | Update permitted client, package, event and delivery details; maintain related names/tasks through backend behavior | Preserve hidden financial fields and existing work. Package changes can conflict with existing assignments/reviews; show the returned explanation rather than silently removing work |
| ORD-07 Change order status | Confirm, progress, complete or cancel according to backend rules | Confirmation can require credits and initiate client access/notifications. Show insufficient credits, save failure and pending review constraints. A timeout does not prove failure |
| ORD-08 Reschedule | Change order date; choose whether related event dates should shift where supported; edit individual event details | Preview the dates affected. Reload all events after success. Respect studio timezone and the event type that drives the order date |
| ORD-09 Remove order | Admin/owner explicitly confirms removal of the selected order | Destructive; existing delete routes also coordinate review-media cleanup. Do not call it “archive” or promise undo; archival behavior is not an established contract |

**Creation integration caveat:** `/api/orders` and `/api/orders/post` are also public booking handlers. The wedding path supports a booking idempotency key; a uniform authenticated staff-create contract is not established. Do not treat reachability of a public POST as an editor/agent permission, or assume all create paths share retry semantics. Staff mobile creation requires Gap G3 to be resolved.

**Credits:** order creation/confirmation interacts with a server credit ledger. The app displays the returned outcome and balance; it must not deduct credits locally or assume every status change spends another credit.

### 4.3 Event planning and crew

| ID | User functionality | Rules / states |
|---|---|---|
| EVT-01 Schedule | Browse events by date/month/status; open booking context, event type/side, time, venue/address, map link and contact | No events, cancelled event, rescheduled event, missing location/contact; some existing views filter locally, so confirm dataset completeness |
| EVT-02 Maintain events | Add/edit events, update venue/contact/date/type, and remove events with appropriate authorization | Manager support varies by endpoint; use the approved route, not a broad UI role assumption |
| EVT-03 Assign crew | Select active photographers/videographers; assign several people, choose primary crew and replace/remove assignments | Profession must match the slot. `BOTH` qualifies for either. Never offer inactive/ineligible users; handle a candidate becoming ineligible after selection |
| EVT-04 Maintain assignment | Read/update supported assignment state, own submission indicators and authorized compensation | Distinguish event status from assignment status. Assignment amount changes need cost-edit permission. Manual/custom crew fields exist on legacy events; they do not create an app login |
| EVT-05 Track material receipt | See photo/video submission counts and whether materials were received; follow up on missing submissions | “Submitted by agent” and “received by studio” are separate concepts; one must not silently toggle the other |

The assignment distribution view helps staff inspect workload by month across agents and editors. It does not establish a staff availability calendar, automatic conflict prevention, assignment acceptance/rejection flow, or leave system.

### 4.4 Editing coordination and order activities

| ID | User functionality | Rules / states |
|---|---|---|
| EDIT-01 Editing overview | See photo edits, films/video edits, reels, highlights and albums attached to each order; inspect assignee, status and permitted cost | Unassigned, in progress, on hold, cancelled, complete; identify the task type explicitly |
| EDIT-02 Allocate work | Assign/reassign eligible editors; maintain task title, description, notes, quantities/duration and authorized cost | Active editor and matching category required. Manager/admin privileges do not automatically make that person an eligible editor |
| EDIT-03 Workload | Inspect monthly assignment distribution and open workload; open a task/order to act | Empty month, inactive assignee still holding work, incomplete work, unavailable cost information |
| ACT-01 Order checklist | Add a saved or custom activity, assign an eligible staff member, set due date/notes, update status, remove activity | Activities have their own ordered status vocabulary; they are not all “Pending/Done.” Last status means completed; moving back clears completion |
| ACT-02 Activity templates | Browse templates/defaults; create reusable templates; admin/owner edits/archives/removes templates | Existing order activities retain their names/status snapshots when a template changes. Managers can create templates; template edit/delete is admin/owner-only |

Examples of activities include sending photos for shortlisting or following up on an album. Generic activities and editing tasks are separate resources. `/api/my-tasks` currently returns editing tasks, not a unified personal checklist of all order activities.

### 4.5 Client payment records and staff payroll

| ID | User functionality | Rules / states |
|---|---|---|
| PAY-01 Client collections | View authorized order payments and dues; admin/owner records a receipt against an order | Amount, payment date, method, status, notes, optional category/reference/received-by. Methods include cash, card, UPI, bank transfer, cheque and other. Recording payment is not processing a bank transfer |
| PAY-02 Payment ledger | Admin/owner searches/filters studio payment records and opens payment detail | Filter by type, method, status/date/month with pagination. Distinguish client receipts, agent payouts and editor payouts |
| PAY-03 Correct records | Admin/owner edits/removes a payment through supported routes with explicit confirmation | Existing update/delete behavior is not a complete immutable reversal/refund ledger. Do not label a status change as an actual gateway refund or promise recovery after deletion |
| PAY-04 Payroll | Admin/owner or authorized manager sees monthly earnings, paid totals, balances due and supporting work for agents/editors | Cost visibility required. Payroll distinguishes completed payable work from upcoming work. Editor payable month uses completion timing with a legacy fallback |
| PAY-05 Record staff payout | Admin/owner or authorized manager records an agent/editor payout, date, amount, method, status and notes | Cost-edit permission required; choose correct person and payout type. This is recordkeeping, not a transfer to a bank/UPI account |
| PAY-06 Order financial breakdown | Inspect permitted order price, crew/editor costs, extra costs, paid/due amounts and margin; update editable inputs | Revenue, cost, margin and payment-section permissions apply independently. Some web totals are calculated from related records; verify the authoritative aggregation contract before duplicating them in mobile |
| PAY-07 Payroll export | Export/share the permitted, filtered payroll view | The web app generates CSV locally from payroll data. Native file creation/sharing needs implementation; there is no implied server export job or export-download endpoint |

**Manager limitation:** `/api/payments` list/create and `/api/orders/[id]/payments` creation are currently admin/owner-only, even though manager presets may include Payments and revenue-edit permission. Agent/editor payout routes and payroll summary do allow managers subject to permissions. Design manager client-payment controls as unavailable until the backend deliberately supports that combination.

**Personal pay is separate:** editor own payment history has an existing endpoint; agent own payment history is Gap G5. The administrative `/api/agents/earnings` and `/api/editors/earnings` endpoints are not substitutes for a worker's private payment history.

### 4.6 Staff support for clients

| ID | User functionality | Rules / states |
|---|---|---|
| CLIENT-01 Share booking entry | Copy/share the studio booking-page link so clients can book on the web | Public booking-page entitlement/branding may affect presentation; this does not add client screens to the mobile app |
| CLIENT-02 Share contract/receipt | Authorized staff obtains a server-generated link and uses the native share sheet | Pro required; pending bookings cannot be shared through these routes. Receipt sharing applies to client/order payments, not staff payouts |
| CLIENT-03 Inspect client access | Admin/owner/manager sees masked phone, PIN-issued time, lock state and first sign-in | No account yet, locked account, access not yet issued. Never expose an existing PIN or hash |
| CLIENT-04 Reset client PIN | Admin/owner resets access and sees the newly issued PIN once to pass to the client | Confirm intended booking/client; reset revokes existing client sessions. The backend returns the new PIN once and does not automatically send it. Do not persist/log it, expose an old PIN, or invent a resend endpoint |
| CLIENT-05 Contract preview / export | Preview the permitted booking, terms and signatures; export a contract when allowed | Web preview/PDF generation exists. Pending and cancelled bookings cannot download a contract under the current policy. Native rendering/export needs separate integration; preserve permission-based redaction |

The endpoints named `public-link` currently return **client portal links that require client sign-in**. Do not describe those as anonymous documents. Native contract/receipt PDF generation is a separate integration decision; a link endpoint is not a PDF-download endpoint.

## 5. Agent flow: assigned shoots to submitted counts

| ID | User functionality | Information and states |
|---|---|---|
| AGT-01 My day / schedule | See next shoot, today's/upcoming/completed shoots; search/filter and group by booking/month | Booking number/name, event, date, location, shoot role and status. Only assigned events. Cancelled/rescheduled/unassigned work must refresh correctly |
| AGT-02 Shoot detail | Read event contact, address/map link, relevant client/package/notes and crew context; launch phone/maps when present | Missing contact/location must disable the corresponding action. Other crew compensation is hidden |
| AGT-03 Deliverables to submit | See completed shoots awaiting their photo/video submission; enter count and submit for their assigned role | Photographer and videographer submissions are independent. A person assigned to both can have two outstanding obligations |
| AGT-04 Submission history | See submitted counts and status after refresh | Preserve entered count on recoverable failure; do not mark complete before server confirmation. No established “undo submission” contract |
| AGT-05 My shoot pay | Read the compensation returned for their assignments | Label it assignment earnings/pay, not money received. A dedicated paid/unpaid ledger and payment-detail view are Gap G5 |

**The submission endpoint records counts and flags; it does not upload RAW photos or camera footage.** Do not design a raw-media uploader, drive sync, delivery-link attachment or background backup as an existing feature.

The current web submission UI focuses on completed events. Agent-only users do not get buttons to change studio order state, reassign colleagues, set their own rate, or mark themselves paid. No clock-in, GPS attendance or accept/decline workflow is established.

## 6. Editor flow: assigned work and self-service claiming

| ID | User functionality | Rules / states |
|---|---|---|
| EDR-01 My Work | Read own tasks across all five editing categories; filter/group by status, type and booking where data supports it | Title, description/notes, booking number/client, date/location, own cost and review state. Empty queue is a valid state |
| EDR-02 Discover / claim | If Orders access is granted, open an order and claim an eligible unassigned task | Must claim self, have the task category and be active. Handle another editor claiming it first; refresh and explain rather than overwrite |
| EDR-03 Update / release | Move own editing task through supported statuses or release it | Editor-only users may send `editorId` and `status`; they cannot edit their own task rate, notes/title/description or quantities through this route |
| EDR-04 Own activities | Advance the status of a generic order activity assigned to them, if accessible | Cannot change its assignee, due date or notes. Work-only users do not yet have a standalone own-activities feed |
| EDR-05 Own payments | Read own recorded editor payouts with supported month/year filters | Own task cost is not the same as paid amount. Current payment-list filters and summary period differ: the summary is all-time completed payments; label it accordingly |

Three existing editor configurations need distinct app behavior: **Work queue only**, **Self-serve from the order book**, and **Self-serve plus own payouts**. Do not show an inaccessible order link as the only way to open assigned work. A task detail/review should remain usable in a work-only experience through its permitted APIs.

### Staff media review: shared by admin/owner and assigned editors

| ID | User functionality | Rules / states |
|---|---|---|
| REV-01 Open review | Open album, film, highlight or reel review; read current round/state and available media/history metadata | Pro required. Admin/owner or currently assigned editor only. Manager-only access is not supported. Photo-edit tasks have no equivalent review workflow |
| REV-02 Prepare / upload | Create or resume a review upload, select source, see progress, cancel an upload, retry recoverable failures | Existing browser album flow prepares PDF pages as images; video flow expects compatible MP4. Native file preparation and multipart handling require Gap G4 |
| REV-03 Send to client | Publish a verified version and send it for client review | All assets must be verified; a linked client account and recipient email are needed. Server may refuse due to stale round, unsent client drafts or unresolved comments |
| REV-04 Address feedback | Read sent text feedback, album spread/pin positions or video timestamps; play attached client voice feedback where present; mark each comment Fixed/Not fixed against replacement media | Staff resolves feedback; this is not a general chat composer. Replacement media must still represent the referenced positions/time |
| REV-05 Revise / reopen | Upload revision and resend; inspect approval; reopen an approved review when allowed | Reopen returns task to in progress. Pending client review blocks direct task completion. Expired/deleted media requires recovery through a new upload |

The staff app **does not contain Approve as client or Submit client comments**. Those actions remain in the web client portal. The staff app reflects their result.

Review metadata and media availability are separate. Show the server's deletion/expiry date, missing media, upload failure and processing state. Old revision files can be deleted after replacement; the workflow uses a 30-day retention deadline in several transitions. Do not promise an indefinite media archive or assume a reopened item has the same expiry behavior as an approved item.

## 7. Admin setup and occasional administration

### Team and permission administration

| ID | User functionality | Rules / states |
|---|---|---|
| TEAM-01 Team directory | Browse agents, editors and managers; inspect profession/categories, active state and combined capabilities | Active and inactive roster views differ from assignment pickers; inactive people must not become selectable for new work |
| TEAM-02 Maintain member | Add/edit supported staff records; set initial/reset credentials, profession or editing categories; deactivate/reactivate/remove where supported | Duplicate email, existing counterpart, protected owner/admin record and retained work must be handled. Do not expose password hashes or existing passwords |
| TEAM-03 Add second capability | Give an agent editing capability or an editor shooting capability through the dedicated conversion routes | Reuse the same person. Do not create a duplicate account just to give them another workspace |
| TEAM-04 Disable one capability | Disable/re-enable shooting or editing for a dual-role person | Open tasks/upcoming shoots can remain assigned and are returned as warnings. Last active capability cannot be disabled through this shortcut; use the supported member-deactivation flow |
| TEAM-05 Rates and permissions | Maintain agent rates by event type; edit/reset manager/editor permission templates or apply presets | Preview effect on pages, money and order sections. Never allow owner/admin lockout or imply an editor may set their own rate |

Member removal can release assignments; deactivation and removal are not interchangeable. Show the precise supported action and its consequences. Do not promise all historical relationships survive a delete unless the chosen route guarantees it.

### Studio catalogue and presentation

| ID | User functionality | Rules / states |
|---|---|---|
| SET-01 Studio profile / branding | Update supported studio contact/business information, logo, booking-page content/covers and signature assets | Show field validation, upload failure and feature entitlement; non-admin staff only consume branding |
| SET-02 Packages | Browse/create/edit/activate/deactivate/remove packages; set price visibility, deliverables, hours/counts, album/video/reel details, event association and covers | Existing orders can carry customized snapshots; editing a catalogue entry is not permission to silently rewrite booked work |
| SET-03 Import package drafts | Upload supported package documents/images, extract draft packages, review/correct them and save selected entries | Extraction failure/timeout, invalid file, duplicate or incomplete draft; extraction is not an automatic trusted publish |
| SET-04 Event types | Configure wedding/occasion event types, side, active/default/public presentation, order and date-driving priority | Existing schedule impact must be explained; use supported archive/remove behavior and reference guards |
| SET-05 Terms and domain | Maintain booking terms; connect/check/remove a supported custom domain; change admin email through the supported flow | Domain verification pending/failure, DNS instructions, entitlement/ownership errors and email-verification state |

### Onboarding and business billing

| ID | User functionality | Rules / states |
|---|---|---|
| BILL-01 Register / set up studio | Owner registration, subdomain availability, verification/resend, setup progress and onboarding checklist/tour state | This is a new studio flow, not public self-signup for workers. Worker accounts are provisioned by studio admins |
| BILL-02 Credits | Read available credits/history; validate coupon, initiate purchase and verify outcome | Insufficient credits, invalid coupon, checkout cancelled, pending/failed verification; never count checkout UI success as credited balance |
| BILL-03 Subscription | Read current plan/period/status and available plans; initiate supported plan checkout and verify server outcome | Owner/admin differences exist. Native checkout is Gap G8. Do not use deprecated direct subscription creation as a purchase shortcut |
| BILL-04 Gifts / referrals | Read/share the referral code and see referred studios/earned credits; gift inbox, mark-seen and gift-purchase flows exist behind a disabled switch | `GIFTS_ENABLED` is currently false in `lib/gifts/milestones.ts`; keep gift actions unavailable in live mode. No separate manual reward claim, cash-out or withdraw-rewards screen |
| BILL-05 Pro / feature status | Read feature entitlement and trial/expiry state; explain locked features and supported upgrade/contact path | Pro is a separate entitlement, currently granted by the platform after off-app payment; do not equate a subscription with automatic Pro access |

### Audit and communication outcomes

`AUD-01`: read authorized studio activity history; filter by actor, action, entity, date and text, then open an accessible related record. The activity log is read-only and is not a notification inbox.

`MSG-01`: display relevant consequences of booking confirmation, client payment recording and media-review publishing. The backend has queued email/WhatsApp work and anniversary jobs. An accepted save is not proof of message delivery. WhatsApp depends on tenant configuration/entitlement, supported templates and booking consent. This app does not expose provider credentials or arbitrary message sending.

Job-statistics/retry routes exist, but their legacy role checks and tenant handling need validation before offering a mobile “retry failed notifications” tool. Treat that operational console as Gap G9, not a promised admin screen.

## 8. State vocabulary and cross-flow rules

### Distinct states the UI must preserve

| Resource | Current vocabulary | Do not confuse with |
|---|---|---|
| Order | Pending, confirmed, assigned, in progress, completed, cancelled | Payment settled or all media approved |
| Event | Pending, unassigned, assigned, completed, cancelled | A crew member submitting photo/video counts |
| Crew assignment | Assigned, confirmed, completed, cancelled, no-show | An established agent accept/decline feature; enum presence alone does not create an action |
| Editing task | Pending, in progress, completed, cancelled, on hold | Media upload finished or client approval |
| Review | Not uploaded, waiting for client, changes requested, approved | Upload transport state |
| Review version | Uploading, processing, ready, failed | Review approval |
| Review comment | Open, fixed, not fixed | Client draft vs sent visibility |
| Payment | Pending, completed, failed, refunded | A verified external transfer/refund |
| Order activity | Activity's own status list | Hard-coded editing statuses |

These are known values, **not permission to offer every transition from every state**. Use route rules and returned errors. Unsupported transitions should not appear simply because a value exists in the schema.

### End-to-end journeys to design

1. **Studio operations:** find/create booking → confirm → schedule events → allocate crew → track submissions/receipt → allocate editing → manage review/delivery → inspect client collections and payroll. Payment collection can happen at several stages, not only at the end.
2. **Agent:** sign in → own schedule → shoot detail → contact/map if needed → completed shoot awaiting submission → submit role-specific counts → read recorded outcome and own assignment pay.
3. **Editor:** sign in → own work or permitted order book → claim/open task → in progress → upload/send review when applicable → resolve feedback/revise → client approves → completed; inspect own payouts separately.
4. **Manager:** sign in → permitted overview/orders → coordinate crew/editing/activities → read only authorized money → record staff payouts when granted → escalate unsupported client-payment or admin actions.
5. **Combined agent/editor:** sign in once → switch between Shoots and Editing → operate with the corresponding assignment identity → retain correct personal task/pay boundaries when one capability is disabled.

### Required UI states for every data screen

| Situation | App behavior |
|---|---|
| Initial load / pull-to-refresh / next page | Distinguish loading from empty; preserve already loaded content during refresh; prevent duplicate page items |
| No records / no search results | Explain whether the user has no work or the filters hide it; offer one valid next action |
| Read-only / hidden field | Show read-only values when permitted; omit forbidden values and actions entirely; never fabricate zeros |
| Session expired / permission changed | Stop dependent writes, reload session/capabilities, remove newly forbidden cached content, route to an accessible screen |
| Record deleted or reassigned | Explain it is no longer available; return to the relevant list; do not keep a working edit form for stale ownership |
| Network failure / app backgrounded | Keep safe form input, show retry; do not report a successful save. Re-fetch before retrying an uncertain non-idempotent mutation |
| Validation / duplicate / conflict | Show actionable field or business errors; preserve input; refresh stale records or rounds |
| Missing feature / insufficient credits | Explain the business blocker; admin gets supported billing/contact action, worker gets an appropriate contact-admin message |
| External app unavailable | Handle missing phone/maps/share target; do not treat it as a backend write failure |
| Upload interruption / expired URL | Resume only with the same supported file/session, refresh signed access, expose cancel/retry; no assumption that transfers continue while terminated |

Offline access is a design state, not an existing sync engine. Read-only cached content may be considered with clear “last updated” labeling and tenant/user isolation. Offline financial writes, assignment changes, confirmation and review publishing must not be silently queued as if the backend already supports them.

## 9. Suggested mobile information architecture

This is a starting point for UI design, not a mandated screen layout. Show at most five primary destinations; place occasional administration in More. Hide unavailable destinations rather than leaving dead tabs.

| Workspace | Suggested primary destinations | Secondary destinations |
|---|---|---|
| Admin / owner | Overview, Orders, Schedule, Work, More | Teams, payments, payroll, packages, activity history, billing, settings, profile |
| Manager | Overview, Orders, Schedule when permitted, Work allocation when permitted, More | Only the granted and API-supported team/payroll/catalogue destinations |
| Editor | My Work, Orders if granted, My Payments if granted, Profile | Task detail, review, assigned activity reached from an accessible order |
| Agent | My Shoots, Submissions, Profile | Shoot detail and own assignment pay; do not add a working payout-history tab until G5 is resolved |
| Combined agent/editor | Workspace switcher plus destinations for the selected workspace | No logout/login round trip; no duplicated person record |

Order detail should group **Overview / Events & crew / Editing & review / Activities / Payments & billing**, with actions and sections filtered by actual access. Client-access support and sharing belong with the relevant booking/payment context. The existing web dashboard and order layout remain unchanged; this document proposes native navigation only.

## 10. Mobile integration gaps and decisions

These gaps do not block designing the screens. They block claiming the corresponding live behavior is complete. No new endpoint names or payload contracts are asserted here.

| Gap | What is missing or inconsistent | What the first mobile build should do |
|---|---|---|
| G1 Native authentication | Existing auth is NextAuth web credentials/session; no dedicated mobile token issue/refresh/revoke contract was found | Validate a supported native authentication/session approach with the backend. Never invent bearer-token endpoints, embed session secrets or assume browser cookies automatically work in React Native |
| G2 Unified bootstrap / capabilities | `/api/v1/session` only returns a subset of user/tenant data. Permissions, portals, feature access, legacy assignment IDs and role exceptions are spread across mechanisms | Define the mobile session adapter and agreed bootstrap contract. Until connected, use explicit demo fixtures for each permission profile; never default to admin on an error |
| G3 Staff create and permission consistency | Booking POSTs are public flows; manager page permissions conflict with some hard role guards; routes use overlapping `/api`, `/api/v1`, `/api/d` families | Select/test one route per app operation. Confirm staff-create authorization, money redaction and idempotency. Do not call another endpoint to bypass a denial |
| G4 Native media preparation / transfer | Browser PDF-to-image and media-inspection code depends on browser APIs; multipart review contracts exist but a native uploader is not established | Implement/test native preparation/transfer separately or clearly hand off unsupported upload preparation to the web. Keep feedback/viewing UX available where integration allows |
| G5 Agent personal payment history | Own event compensation exists, but no dedicated agent-scoped paid-history endpoint was found; `/api/my-payments` is editor-only | Design a separate blocked/demo personal ledger only if needed. Never fetch the whole studio payroll and filter it on-device |
| G6 Personal activities | Generic activities exist; own editing-task feed does not include them; agent-only activity update is not supported | Keep existing activities in accessible orders. A unified inbox or agent activity assignment experience needs its own scoped contract |
| G7 Push / offline / device lifecycle | No staff push-token registration, notification inbox/read state or general offline mutation queue contract was found | Start with foreground refresh and explicit offline states. Treat native push and offline sync as future integrations, not existing functionality |
| G8 Billing and document integration | Browser Razorpay flow does not prove native checkout; some admin/owner guards differ; browser contract-PDF and payroll-CSV generation do not provide native export endpoints | Validate native checkout and server verification before enabling purchases. Use existing browser handoff only when approved/tested; label it. Implement native document/CSV creation and sharing separately |
| G9 Notification operations | Background job tools exist but are not a verified staff-facing delivery/retry contract | Show only confirmed business outcomes. Do not build a working notification inbox or retry console from those tools without a verified tenant-safe contract |
| G10 Reliable mutations / amounts / dates | Error envelopes, IDs, date/month conventions, currency units, pagination and retry guarantees vary by route | Normalize in a small typed adapter. Record endpoint-specific units and retry policy; verify ambiguous saves before retrying; preserve tenant-local dates and returned totals |

The present source has both role templates and route-specific enforcement. This document is a capability map, not a security certification. Before connecting a feature, verify that its chosen endpoint enforces tenant ownership, identity, field permissions and state rules independently of hidden UI controls.

### Minimum server information needed to implement a screen

| Screen family | Minimum useful information |
|---|---|
| App entry | Current person, tenant identity/branding, roles/portals, effective permissions, active capabilities, entitlements, supported session behavior |
| List / search | Display fields, stable identifiers, supported filters/sort, pagination metadata and aggregate scope |
| Detail / form | Allowed fields, related choices, current status, read-only restrictions, validation and mutation result |
| Personal work / pay | Server-scoped own assignments/payments, correct legacy-to-canonical identity mapping, periods and amount definitions |
| Review / external action | Current round/version, media availability, expiry, upload state, action prerequisites, server verification result |

These describe data needs; they are not a claim that the backend already returns an `allowedActions` field or a single mobile bootstrap response.

## 11. Source map for backend integration

Paths below are repository-relative. API paths are grouped for discovery; read the handler and its middleware before binding a control. This is deliberately smaller than a full API reference.

### Identity and permissions

| Capability | Existing source / API family |
|---|---|
| Session / sign-in / reset | `lib/auth.ts`, `lib/api-auth.ts`, `middleware.ts`; `/api/auth/[...nextauth]`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/v1/session` |
| Studio lookup / profile | `/api/tenant/search`, `/api/tenant`, `/api/profile`, `/api/agents/change-password`, `/api/upload/avatar` |
| Roles / combined identities | `lib/identity/team.ts`, `lib/identity/roles.ts`, `lib/auth/legacy-identity.ts`, `lib/auth/portal-preference.ts` |
| Permission templates / fields | `lib/permissions/{defaults,types,resolve,presets,redact,editing-task,write-guard}.ts`; `/api/admin/role-permissions` |
| Feature gating | `lib/features/{catalog,entitlements,pro-links}.ts`; `/api/tenant/features` |

### Daily studio operations

| Capability | Existing API family / supporting source |
|---|---|
| Orders / discovery / booking | `/api/orders`, `/api/orders/post`, `/api/orders/[id]`; `lib/orders/{list,numbering,reconcile-editing-tasks,confirmation}.ts` |
| Event schedule / dashboard | `/api/events`, `/api/events/search`, `/api/events/[id]`, `/api/events/order/[orderId]`, `/api/v1/events`, `/api/v1/events/[id]`, `/api/v1/stats`; `/api/d/events`, `/api/d/months`, `/api/d/dashboard-stats` |
| Crew assignment | `/api/events/[id]/assignments`, `/api/events/[id]/photographers`, `/api/events/[id]/photographers/[photographerId]`, corresponding videographer routes, `/api/events/assign`, `/api/v1/events/[id]/assign`, `/api/d/events/[id]/assign`, `/api/d/assignments/[eventId]/[agentId]` |
| Agent own work | `/api/agents/events`, `/api/agents/events/[eventId]/submit`; `app/agent/dashboard/page.tsx` |
| Editing / workload | `/api/my-tasks`, `/api/assignments/distribution`, `/api/assignments/[taskType]/[taskId]`, `/api/users/editors`; `lib/assignments/{task-types,eligibility,check-assignees}.ts` |
| Order activities | `/api/orders/[id]/activities`, `/api/orders/[id]/activities/[activityId]`, `/api/activity-templates`, `/api/activity-templates/[id]`, `/api/users/assignable` |
| Client records / payroll | `/api/payments`, `/api/payments/[paymentId]`, `/api/orders/[id]/payments`, `/api/payments/agents`, `/api/payments/editors`, `/api/payroll/summary`, `/api/agents/earnings`, `/api/editors/earnings`, `/api/my-payments` |
| Sharing / client support | `/api/orders/[id]/public-link`, `/api/payments/[paymentId]/public-link`, `/api/orders/[id]/client-access`, `/api/orders/[id]/client-access/reset-pin` |
| Document / export policy | `lib/contract-access.ts`, `lib/contract-pdf.ts`, `components/orders/ContractPreviewModal.tsx`, `app/payroll/page.tsx` |

Task route values are `order-photo`, `order-video`, `reel`, `highlight`, `album`. API task labels include `PHOTO_EDIT` and `VIDEO_EDIT`; the review label for video editing is `FILM`. Keep the mapping explicit.

### Review and administration

| Capability | Existing API family / supporting source |
|---|---|
| Review creation / detail / feedback | `/api/review/items`, `/api/review/[itemId]`, `/api/review/[itemId]/comments`, `/api/review/[itemId]/send`, `/api/review/[itemId]/reopen` |
| Upload lifecycle | `/api/review/[itemId]/uploads`, `/api/review/[itemId]/uploads/[versionId]`, `/api/review/[itemId]/uploads/[versionId]/assets`, `/api/review/[itemId]/uploads/[versionId]/assets/[assetId]`; `lib/reviews/{uploads,workflow,manifest,task-completion}.ts`, `lib/media/review-upload-client.ts` |
| Team / capabilities / rates | `/api/v1/agents`, `/api/v1/agents/[id]`, `/api/agents`, `/api/agents/[id]`, `/api/admin/editors`, `/api/admin/editors/[id]`, `/api/v1/agents/[id]/editor-capability`, `/api/admin/editors/[id]/agent-capability`, `/api/teams/capabilities`, `/api/agents/[id]/rates`, `/api/agents/[id]/rates/[eventTypeId]` |
| Catalogues / assets | `/api/packages`, `/api/packages/stats`, `/api/packages/extract`, `/api/packages/bulk`, `/api/packages/[id]/cover`, `/api/event-types`, `/api/event-types/[id]`, `/api/event-types/reorder`; `/api/upload/{avatar,booking-cover,logo,package-cover,signature}` |
| Studio settings | `/api/tenant`, `/api/tenant/terms`, `/api/settings/change-email`, `/api/settings/domain`, `/api/settings/domain/status`, `/api/admin/upi-details` |
| Registration / setup | `/api/register`, `/api/register/check-subdomain`, `/api/register/verify-email`, `/api/register/resend-verification`, `/api/onboarding`, `/api/onboarding/status` |
| Billing / rewards | `/api/credits/{balance,history,purchase,verify}`, `/api/credits/coupon/validate`, `/api/plans`, `/api/subscriptions`, `/api/subscriptions/{initiate,verify}`, `/api/gifts`, `/api/gifts/{purchase,verify}`, `/api/referrals` |
| Audit / background outcomes | `/api/activity-logs`; `lib/jobs/`, `lib/notifications/`; job-admin routes are G9 |

Not mobile screens: `/api/client/*`, legacy public contract/invoice readers, `/api/platform/*`, `/api/cron/*`, `/api/webhooks/*`, diagnostic routes and provider configuration. Client routes explain external review/approval results but must not become staff actions.

## 12. Coverage checklist for the app handoff

1. Each capability ID has a destination or contextual action, an eligible persona, and a status of **live**, **demo**, **blocked by gap**, or **excluded with reason**. Do not silently drop occasional administration from the inventory.
2. Demonstrate admin, owner billing exception, default manager, restricted manager, default editor, work-only editor, agent and combined agent/editor. Include disabled capability and changed-permission states.
3. Exercise normal and failed journeys: no credits, wrong tenant, assignment removed, task claimed elsewhere, hidden money, payment uncertainty, review pending, upload interruption, expired media and Pro unavailable.
4. Verify IDs, amount units, date/timezone semantics, filter scope, error shape and retry behavior against the actual API selected for each live action. Source inspection and demo fixtures are not live integration verification.
5. Keep clients on the existing web portal. Deliver the staff experience without inventing client screens, payment execution, raw-media upload or push services.

**Documentation validation:** this brief was prepared from routes, permission/default/preset logic, identity helpers, schema states and selected web consumers. No backend behavior was changed, and no live API, device, payment or messaging workflow was executed to produce it. Reconcile the snapshot with the backend revision used when mobile implementation starts.
