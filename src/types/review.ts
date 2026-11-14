export type ReviewStatus =
  | 'NOT_UPLOADED'
  | 'WAITING_FOR_CLIENT'
  | 'CHANGES_REQUESTED'
  | 'APPROVED';

export type ReviewVersionStatus =
  | 'UPLOADING'
  | 'PROCESSING'
  | 'READY'
  | 'FAILED';

export type ReviewCommentStatus = 'OPEN' | 'FIXED' | 'NOT_FIXED';

export interface PinPosition {
  x: number; // Percentage or pt
  y: number;
  pageNumber?: number; // For album spreads
}

export interface ReviewComment {
  id: string;
  roundNumber: number;
  authorType: 'CLIENT' | 'STAFF';
  authorName: string;
  text: string;
  timestampSeconds?: number; // For video/film/reel/highlight
  pinPosition?: PinPosition; // For album spread
  voiceNoteUrl?: string; // Client voice feedback
  voiceNoteDurationSeconds?: number;
  status: ReviewCommentStatus;
  staffResolutionNote?: string;
  resolvedAt?: string;
  resolvedByStaffId?: string;
  createdAt: string;
}

export interface ReviewVersion {
  id: string;
  versionNumber: number;
  roundNumber: number;
  status: ReviewVersionStatus;
  mediaUrl?: string;
  thumbnailUrl?: string;
  fileName: string;
  fileSizeBytes: number;
  pageCount?: number; // For album PDF
  durationSeconds?: number; // For video
  uploadedAt: string;
  isVerified: boolean;
}

export interface ReviewItem {
  id: string; // Review item ID
  taskId: string;
  orderId: string;
  tenantOrderNumber: string;
  orderTitle: string;
  reviewType: 'ALBUM' | 'FILM' | 'HIGHLIGHT' | 'REEL';
  title: string;
  status: ReviewStatus;
  currentRound: number;
  currentVersion?: ReviewVersion;
  versions: ReviewVersion[];
  comments: ReviewComment[];
  clientEmail?: string;
  clientAccessLinked: boolean;
  retentionDeadline?: string; // 30-day retention
  isProEnabled: boolean;
  assignedEditorId: string;
  assignedEditorName: string;
  lastSentAt?: string;
  approvedAt?: string;
}
