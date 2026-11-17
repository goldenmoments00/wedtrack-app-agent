import {
  StudioPackage,
  PackageExtractionDraft,
  StudioEventType,
  ActivityTemplateItem,
  CreditsState,
  SubscriptionState,
  ReferralStats,
  ActivityLogEntry,
} from '@/types/settings';

export const INITIAL_PACKAGES: StudioPackage[] = [
  {
    id: 'pkg-imperial-01',
    title: 'Imperial Royal Wedding & Cinema',
    description: '3-Day comprehensive coverage with traditional stills, cinema film, 4 reels, and 1 royal album.',
    price: 250000,
    isPriceVisible: true,
    isActive: true,
    eventAssociation: 'Wedding',
    deliverables: [
      { category: 'PHOTO', title: 'Candid & Traditional Photography', countOrDuration: '600 edited images' },
      { category: 'VIDEO', title: '4K Cinematic Feature Film', countOrDuration: '30-40 mins' },
      { category: 'ALBUM', title: 'Luxury Leather Royal Album', countOrDuration: '40 Spreads' },
      { category: 'REEL', title: 'Social Media Reels', countOrDuration: '4 Reels' },
      { category: 'HIGHLIGHT', title: 'Cinematic Highlights Teaser', countOrDuration: '4-5 mins' },
    ],
  },
  {
    id: 'pkg-destination-02',
    title: 'Signature Destination Luxe',
    description: 'Complete multi-day destination wedding package including pre-wedding shoot and 2 flush-mount albums.',
    price: 400000,
    isPriceVisible: true,
    isActive: true,
    eventAssociation: 'Destination Wedding',
    deliverables: [
      { category: 'PHOTO', title: 'Pre-Wedding & 3-Day Wedding Stills', countOrDuration: '1000 edited images' },
      { category: 'VIDEO', title: 'Feature Film + Drone Master Cuts', countOrDuration: '45 mins' },
      { category: 'ALBUM', title: 'Bride & Groom Handcrafted Albums', countOrDuration: '2 Albums' },
    ],
  },
  {
    id: 'pkg-occasion-03',
    title: 'Occasion Premium Evening',
    description: 'Single day celebration photography, 4K highlight film, and coffee table album.',
    price: 95000,
    isPriceVisible: true,
    isActive: true,
    eventAssociation: 'Anniversary / Birthday',
    deliverables: [
      { category: 'PHOTO', title: 'Event Candid Photography', countOrDuration: '250 images' },
      { category: 'HIGHLIGHT', title: 'Evening Highlight Film', countOrDuration: '5 mins' },
    ],
  },
];

export const INITIAL_PACKAGE_DRAFTS: PackageExtractionDraft[] = [
  {
    id: 'draft-pkg-01',
    fileName: 'Delhi_Summer_RateCard_2026.pdf',
    extractedTitle: 'Delhi Intimate Wedding Package (Draft)',
    extractedPrice: 150000,
    extractedDeliverables: [
      { category: 'PHOTO', title: '2-Day Photo Coverage', countOrDuration: '400 photos' },
      { category: 'VIDEO', title: 'Traditional Video Edit', countOrDuration: '60 mins' },
      { category: 'ALBUM', title: 'Standard Matte Album', countOrDuration: '30 spreads' },
    ],
    status: 'PENDING_REVIEW',
    extractedAt: '2026-11-12T14:00:00Z',
  },
];

export const INITIAL_EVENT_TYPES: StudioEventType[] = [
  { id: 'et-wedding-03', name: 'Wedding Ceremony / Pheras', side: 'BOTH', sortOrder: 1, isDefault: true, isDateDriver: true, isActive: true },
  { id: 'et-sangeet-01', name: 'Sangeet & Cocktail', side: 'BOTH', sortOrder: 2, isDefault: false, isDateDriver: false, isActive: true },
  { id: 'et-haldi-02', name: 'Haldi Ceremony', side: 'BRIDE', sortOrder: 3, isDefault: false, isDateDriver: false, isActive: true },
  { id: 'et-mehendi-04', name: 'Mehendi Ceremony', side: 'BRIDE', sortOrder: 4, isDefault: false, isDateDriver: false, isActive: true },
  { id: 'et-reception-05', name: 'Wedding Reception', side: 'BOTH', sortOrder: 5, isDefault: false, isDateDriver: false, isActive: true },
  { id: 'et-prewedding-00', name: 'Pre-Wedding Shoot', side: 'BOTH', sortOrder: 6, isDefault: false, isDateDriver: false, isActive: true },
  { id: 'et-occasion-07', name: 'General Celebration / Occasion', side: 'BOTH', sortOrder: 7, isDefault: false, isDateDriver: true, isActive: true },
];

export const INITIAL_ACTIVITY_TEMPLATES: ActivityTemplateItem[] = [
  {
    id: 'tmpl-qa-01',
    title: 'Backup to Drive',
    description: 'Cloud and physical disk redundancy of RAW shoot footage.',
    defaultAssigneeRole: 'EDITOR',
    defaultStatuses: ['Pending', 'In Progress', 'Done'],
    isArchived: false,
  },
  {
    id: 'tmpl-qa-02',
    title: 'Sending Photo for Shortlisting',
    description: 'Watermarked web gallery link dispatched to client.',
    defaultAssigneeRole: 'EDITOR',
    defaultStatuses: ['Pending', 'Sent', 'Received'],
    isArchived: false,
  },
  {
    id: 'tmpl-qa-03',
    title: 'comossion paid 24K',
    description: 'Lead commission payout verification and settlement.',
    defaultAssigneeRole: 'MANAGER',
    defaultStatuses: ['Pending', 'Done'],
    isArchived: false,
  },
  {
    id: 'tmpl-qa-04',
    title: 'Album Layout Approval',
    description: 'Digital flipbook layout shared for couple corrections.',
    defaultAssigneeRole: 'EDITOR',
    defaultStatuses: ['Pending', 'Sent', 'Revision Requested', 'Approved'],
    isArchived: false,
  },
  {
    id: 'tmpl-qa-05',
    title: 'Final Edit Review',
    description: 'Full teaser, highlight, and master cut client review.',
    defaultAssigneeRole: 'EDITOR',
    defaultStatuses: ['Pending', 'Shared', 'Changes Requested', 'Approved'],
    isArchived: false,
  },
  {
    id: 'tmpl-qa-06',
    title: 'Pendrive / HDD Delivery',
    description: 'Branded crystal drive or high-speed drive dispatched.',
    defaultAssigneeRole: 'MANAGER',
    defaultStatuses: ['Pending', 'Packed', 'Dispatched', 'Delivered'],
    isArchived: false,
  },
  {
    id: 'tmpl-qa-07',
    title: 'Online Gallery Link Shared',
    description: 'Full resolution final download link delivered to client.',
    defaultAssigneeRole: 'EDITOR',
    defaultStatuses: ['Pending', 'Uploaded', 'Shared'],
    isArchived: false,
  },
  {
    id: 'tmpl-qa-08',
    title: 'Album Printing',
    description: 'NTR glossy printing press processing and QC check.',
    defaultAssigneeRole: 'MANAGER',
    defaultStatuses: ['Pending', 'Sent to Press', 'Received', 'Delivered'],
    isArchived: false,
  },
  {
    id: 'tmpl-qa-09',
    title: 'Raw Data Collection from Team',
    description: 'Physical SD card ingest and footage consolidation.',
    defaultAssigneeRole: 'MANAGER',
    defaultStatuses: ['Pending', 'Partially Received', 'Received'],
    isArchived: false,
  },
  {
    id: 'tmpl-qa-10',
    title: 'Contract Signed',
    description: 'Client agreement and terms signed off on portal.',
    defaultAssigneeRole: 'MANAGER',
    defaultStatuses: ['Pending', 'Sent', 'Signed'],
    isArchived: false,
  },
  {
    id: 'tmpl-qa-11',
    title: 'Final Payment Reminder',
    description: 'Pre-delivery balance payment notice sent to client.',
    defaultAssigneeRole: 'MANAGER',
    defaultStatuses: ['Pending', 'Reminded', 'Paid'],
    isArchived: false,
  },
];

export interface QuickActionItem {
  id: string;
  title: string;
  statuses: string[];
}

export const QUICK_ACTION_ACTIVITIES: QuickActionItem[] = INITIAL_ACTIVITY_TEMPLATES.map(t => ({
  id: t.id,
  title: t.title,
  statuses: t.defaultStatuses,
}));

export const INITIAL_CREDITS_STATE: CreditsState = {
  balance: 42,
  autoTopUpEnabled: false,
  history: [
    {
      id: 'crd-01',
      transactionType: 'PURCHASE',
      amount: 50,
      balanceAfter: 50,
      couponCode: 'DIWALI2026',
      createdAt: '2026-10-01T10:00:00Z',
    },
    {
      id: 'crd-02',
      transactionType: 'BOOKING_CONFIRMATION',
      amount: -5,
      balanceAfter: 45,
      orderNumber: 'WT-2026-001',
      createdAt: '2026-10-15T11:00:00Z',
    },
    {
      id: 'crd-03',
      transactionType: 'BOOKING_CONFIRMATION',
      amount: -3,
      balanceAfter: 42,
      orderNumber: 'WT-2026-002',
      createdAt: '2026-10-28T09:30:00Z',
    },
  ],
};

export const INITIAL_SUBSCRIPTION: SubscriptionState = {
  currentPlanName: 'Studio Studio Pro Plus (Annual)',
  status: 'ACTIVE',
  periodStart: '2026-01-01T00:00:00Z',
  periodEnd: '2026-12-31T23:59:59Z',
  isOwnerOnlyVerified: true,
};

export const INITIAL_REFERRALS: ReferralStats = {
  referralCode: 'AURA-WED-88',
  referredStudiosCount: 4,
  earnedCreditsTotal: 40,
};

export const INITIAL_ACTIVITY_LOGS: ActivityLogEntry[] = [
  {
    id: 'log-01',
    actorName: 'Aarav Mehta',
    actorRole: 'OWNER',
    action: 'CONFIRM_BOOKING',
    entityType: 'ORDER',
    entityId: 'ord-sharma-verma-01',
    entityTitle: 'Sharma & Verma Grand Wedding (WT-2026-001)',
    timestamp: '2026-10-15T10:00:00Z',
    details: 'Status moved to CONFIRMED. 5 credits deducted from studio ledger.',
  },
  {
    id: 'log-02',
    actorName: 'Priya Sharma',
    actorRole: 'MANAGER',
    action: 'ASSIGN_CREW',
    entityType: 'EVENT',
    entityId: 'evt-sharma-sangeet-01',
    entityTitle: 'Sangeet & Cocktail Night',
    timestamp: '2026-10-20T14:30:00Z',
    details: 'Assigned Karan Malhotra (Primary Photographer) and Rahul Joshi (Videographer).',
  },
  {
    id: 'log-03',
    actorName: 'Vikram Das',
    actorRole: 'EDITOR',
    action: 'UPLOAD_REVIEW_VERSION',
    entityType: 'REVIEW',
    entityId: 'rev-album-sharma-01',
    entityTitle: 'Luxury Leather Royal Album (Round 2)',
    timestamp: '2026-11-08T12:30:00Z',
    details: 'Uploaded version 2 (40 spreads, 142 MB PDF).',
  },
  {
    id: 'log-04',
    actorName: 'Ananya Sharma',
    actorRole: 'CLIENT (PORTAL)',
    action: 'CLIENT_FEEDBACK_SUBMITTED',
    entityType: 'REVIEW',
    entityId: 'rev-album-sharma-01',
    entityTitle: 'Luxury Leather Royal Album (Round 2)',
    timestamp: '2026-11-09T14:20:00Z',
    details: 'Submitted 3 comments (2 pin notes, 1 voice note). Status changed to CHANGES_REQUESTED.',
  },
  {
    id: 'log-05',
    actorName: 'Aarav Mehta',
    actorRole: 'OWNER',
    action: 'RECORD_CLIENT_RECEIPT',
    entityType: 'PAYMENT',
    entityId: 'pay-rec-02',
    entityTitle: 'Client Receipt ₹50,000 for WT-2026-001',
    timestamp: '2026-10-15T16:15:00Z',
    details: 'Recorded ₹50,000 UPI receipt from Dr. Ramesh Sharma.',
  },
];
