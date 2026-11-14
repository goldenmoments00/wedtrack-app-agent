export type EditingTaskType =
  | 'order-photo'
  | 'order-video'
  | 'reel'
  | 'highlight'
  | 'album';

export type EditingCategory =
  | 'PHOTO_EDIT'
  | 'VIDEO_EDIT'
  | 'REEL'
  | 'HIGHLIGHT'
  | 'ALBUM';

export type EditingTaskStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CANCELLED';

export interface EditingTask {
  id: string; // Task ID
  orderId: string;
  tenantOrderNumber: string;
  orderTitle: string;
  taskType: EditingTaskType;
  category: EditingCategory;
  title: string;
  description?: string;
  status: EditingTaskStatus;
  editorId?: string; // Assigned editor ID
  editorName?: string;
  editorAvatar?: string;
  cost?: number; // Only visible with cost permissions or self-access exception for assigned editor
  quantity?: number;
  durationMinutes?: number;
  dueDate?: string;
  isReviewable: boolean; // Album, Film (video), Highlight, Reel are reviewable; photo-edit is not
  reviewItemId?: string;
  reviewStatus?: 'NOT_UPLOADED' | 'WAITING_FOR_CLIENT' | 'CHANGES_REQUESTED' | 'APPROVED';
  createdAt: string;
  updatedAt: string;
}

export interface OrderActivity {
  id: string;
  orderId: string;
  tenantOrderNumber: string;
  templateId?: string;
  title: string;
  description?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  dueDate?: string;
  statuses: string[]; // Ordered vocabulary e.g. ["Not Started", "Draft Sent", "Client Review", "Completed"]
  currentStatusIndex: number;
  currentStatus: string;
  isCompleted: boolean;
  notes?: string;
  createdAt: string;
}
