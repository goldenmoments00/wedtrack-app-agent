import { Profession } from './auth';

export type EventStatus =
  | 'PENDING'
  | 'UNASSIGNED'
  | 'ASSIGNED'
  | 'COMPLETED'
  | 'CANCELLED';

export type CrewRole = 'PHOTOGRAPHER' | 'VIDEOGRAPHER';

export type AssignmentStatus =
  | 'ASSIGNED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface CrewAssignment {
  id: string; // assignment ID
  eventId: string;
  agentId: string;
  agentName: string;
  agentPhone?: string;
  agentAvatar?: string;
  role: CrewRole;
  isPrimary: boolean;
  status: AssignmentStatus;
  assignmentPay?: number; // Only visible if cost permission is allowed, or self-access exception for the agent
  submissionCount?: number;
  materialReceived: boolean;
  submittedAt?: string;
}

export interface EventScheduleItem {
  id: string;
  orderId: string;
  tenantOrderNumber: string;
  orderTitle: string;
  eventTypeId: string;
  eventTypeName: string;
  side: 'BRIDE' | 'GROOM' | 'BOTH';
  startTime: string; // ISO string
  endTime?: string;
  venueName: string;
  venueAddress: string;
  venueMapUrl?: string;
  contactName?: string;
  contactPhone?: string;
  status: EventStatus;
  photographersNeeded: number;
  videographersNeeded: number;
  assignments: CrewAssignment[];
  notes?: string;
}

export interface SubmitShootCountsInput {
  eventId: string;
  assignmentId: string;
  role: CrewRole;
  photoCount?: number;
  videoCount?: number;
  notes?: string;
}
