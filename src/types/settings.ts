export interface StudioPackageDeliverable {
  category: 'PHOTO' | 'VIDEO' | 'ALBUM' | 'REEL' | 'HIGHLIGHT';
  title: string;
  countOrDuration?: string;
  notes?: string;
}

export interface StudioPackage {
  id: string;
  title: string;
  description?: string;
  price?: number;
  isPriceVisible: boolean;
  isActive: boolean;
  eventAssociation?: string;
  deliverables: StudioPackageDeliverable[];
  coverImageUrl?: string;
}

export interface PackageExtractionDraft {
  id: string;
  fileName: string;
  extractedTitle: string;
  extractedPrice?: number;
  extractedDeliverables: StudioPackageDeliverable[];
  status: 'PENDING_REVIEW' | 'SAVED' | 'DISCARDED';
  extractedAt: string;
}

export interface StudioEventType {
  id: string;
  name: string;
  side: 'BRIDE' | 'GROOM' | 'BOTH';
  sortOrder: number;
  isDefault: boolean;
  isDateDriver: boolean;
  isActive: boolean;
}

export interface ActivityTemplateItem {
  id: string;
  title: string;
  description?: string;
  defaultAssigneeRole?: 'MANAGER' | 'EDITOR' | 'ADMIN';
  defaultStatuses: string[];
  isArchived: boolean;
}

export interface CreditsLedgerEntry {
  id: string;
  transactionType: 'PURCHASE' | 'BOOKING_CONFIRMATION' | 'REFUND' | 'REFERRAL_BONUS';
  amount: number;
  balanceAfter: number;
  orderNumber?: string;
  couponCode?: string;
  createdAt: string;
}

export interface CreditsState {
  balance: number;
  autoTopUpEnabled: boolean;
  history: CreditsLedgerEntry[];
}

export interface SubscriptionState {
  currentPlanName: string;
  status: 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'EXPIRED';
  periodStart: string;
  periodEnd: string;
  isOwnerOnlyVerified: boolean;
}

export interface ReferralStats {
  referralCode: string;
  referredStudiosCount: number;
  earnedCreditsTotal: number;
}

export interface ActivityLogEntry {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  entityTitle: string;
  timestamp: string;
  details?: string;
}
