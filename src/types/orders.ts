export type OrderType = 'WEDDING' | 'OCCASION';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type OrderPriority = 'NORMAL' | 'PINNED';

export interface ClientAccessInfo {
  hasAccount: boolean;
  maskedPhone?: string;
  pinIssuedAt?: string;
  isLocked: boolean;
  firstSignInAt?: string;
}

export interface OrderDeliverable {
  id: string;
  title: string;
  category: 'PHOTO' | 'VIDEO' | 'ALBUM' | 'REEL' | 'HIGHLIGHT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface OrderFinancials {
  totalAmount?: number;
  paidAmount?: number;
  balanceDue?: number;
  crewCost?: number;
  editorCost?: number;
  extraCost?: number;
  margin?: number;
  currency: string;
}

export interface OrderSummary {
  id: string; // Internal database ID
  tenantOrderNumber: string; // Studio-facing order number (e.g. WT-2026-042)
  type: OrderType;
  title: string;
  clientName: string;
  brideName?: string;
  groomName?: string;
  clientPhone?: string;
  clientEmail?: string;
  status: OrderStatus;
  priority: OrderPriority;
  eventDate: string; // ISO string
  eventCount: number;
  packageName?: string;
  packageId?: string;
  deliverablesSummary?: string;
  financials?: OrderFinancials;
  clientAccess: ClientAccessInfo;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDetail extends OrderSummary {
  venueLocation?: string;
  primaryContactName?: string;
  primaryContactPhone?: string;
  secondaryContactName?: string;
  secondaryContactPhone?: string;
  clientAddress?: string;
  bookingConsentRecorded: boolean;
  deliverables: OrderDeliverable[];
  canDownloadContract: boolean;
  canSharePublicLink: boolean;
}

export interface CreateWeddingBookingInput {
  tenantOrderNumber?: string;
  brideName: string;
  groomName: string;
  primaryContactName: string;
  primaryContactPhone: string;
  primaryContactEmail?: string;
  secondaryContactName?: string;
  secondaryContactPhone?: string;
  clientAddress?: string;
  packageId?: string;
  customDeliverables?: string[];
  firstEventDate: string;
  firstEventLocation: string;
  firstEventTypeId: string;
  notes?: string;
  bookingConsent: boolean;
  idempotencyKey: string;
}

export interface CreateOccasionBookingInput {
  tenantOrderNumber?: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  occasionTitle: string;
  eventDate: string;
  eventLocation: string;
  eventTypeId: string;
  packageId?: string;
  notes?: string;
  bookingConsent: boolean;
  idempotencyKey: string;
}
