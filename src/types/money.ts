export type PaymentType = 'CLIENT_RECEIPT' | 'AGENT_PAYOUT' | 'EDITOR_PAYOUT';

export type PaymentMethod =
  | 'CASH'
  | 'CARD'
  | 'UPI'
  | 'BANK_TRANSFER'
  | 'CHEQUE'
  | 'OTHER';

export type PaymentRecordStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface PaymentRecord {
  id: string;
  type: PaymentType;
  orderId?: string;
  tenantOrderNumber?: string;
  orderTitle?: string;
  recipientOrPayerId?: string;
  recipientOrPayerName: string;
  amount: number;
  currency: string;
  paymentDate: string; // ISO string
  method: PaymentMethod;
  status: PaymentRecordStatus;
  notes?: string;
  category?: string;
  referenceNumber?: string;
  recordedByStaffId: string;
  recordedByStaffName: string;
  createdAt: string;
}

export interface WorkerPayrollSummary {
  workerId: string;
  workerName: string;
  role: 'AGENT' | 'EDITOR';
  professionOrCategory: string;
  monthYear: string; // "2026-11"
  payableCompletedWork: number;
  upcomingWorkEstimated: number;
  totalEarned: number;
  totalPaid: number;
  balanceDue: number;
  paymentCount: number;
}

export interface StudioPayrollSummary {
  monthYear: string;
  totalPayableCompleted: number;
  totalUpcomingEstimated: number;
  totalPaid: number;
  totalBalanceDue: number;
  agentWorkers: WorkerPayrollSummary[];
  editorWorkers: WorkerPayrollSummary[];
  currency: string;
}

export interface RecordStaffPayoutInput {
  type: 'AGENT_PAYOUT' | 'EDITOR_PAYOUT';
  workerId: string;
  workerName: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  status: PaymentRecordStatus;
  notes?: string;
  referenceNumber?: string;
}

export interface RecordClientReceiptInput {
  orderId: string;
  tenantOrderNumber: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  status: PaymentRecordStatus;
  category?: string;
  referenceNumber?: string;
  notes?: string;
}
