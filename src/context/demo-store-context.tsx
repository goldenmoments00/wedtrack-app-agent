import React, { createContext, useContext, useState, useEffect } from 'react';
import { OrderDetail, CreateWeddingBookingInput, CreateOccasionBookingInput, OrderStatus } from '@/types/orders';
import { EventScheduleItem, SubmitShootCountsInput, CrewRole } from '@/types/events';
import { EditingTask, OrderActivity, EditingTaskStatus } from '@/types/editing';
import { ReviewItem, ReviewCommentStatus, ReviewVersion } from '@/types/review';
import { PaymentRecord, StudioPayrollSummary, RecordClientReceiptInput, RecordStaffPayoutInput } from '@/types/money';
import { TeamMember, CreateTeamMemberInput, UpdateCapabilityInput } from '@/types/team';
import { AgentAchievement } from '@/types/achievements';
import {
  StudioPackage,
  PackageExtractionDraft,
  StudioEventType,
  ActivityTemplateItem,
  CreditsState,
  SubscriptionState,
  ActivityLogEntry,
} from '@/types/settings';
import { StudioBranding } from '@/types/auth';

import { INITIAL_ORDERS } from '@/fixtures/orders-data';
import { INITIAL_EVENTS } from '@/fixtures/events-data';
import { INITIAL_EDITING_TASKS, INITIAL_ORDER_ACTIVITIES } from '@/fixtures/editing-data';
import { INITIAL_REVIEWS } from '@/fixtures/reviews-data';
import { INITIAL_PAYMENTS, INITIAL_STUDIO_PAYROLL } from '@/fixtures/money-data';
import { INITIAL_TEAM_MEMBERS } from '@/fixtures/team-data';
import {
  INITIAL_PACKAGES,
  INITIAL_PACKAGE_DRAFTS,
  INITIAL_EVENT_TYPES,
  INITIAL_ACTIVITY_TEMPLATES,
  INITIAL_CREDITS_STATE,
  INITIAL_SUBSCRIPTION,
  INITIAL_ACTIVITY_LOGS,
} from '@/fixtures/settings-data';
import { DEMO_STUDIOS } from '@/fixtures/studios';

interface DemoStoreContextType {
  orders: OrderDetail[];
  events: EventScheduleItem[];
  editingTasks: EditingTask[];
  activities: OrderActivity[];
  reviews: ReviewItem[];
  payments: PaymentRecord[];
  payroll: StudioPayrollSummary;
  team: TeamMember[];
  packages: StudioPackage[];
  packageDrafts: PackageExtractionDraft[];
  eventTypes: StudioEventType[];
  activityTemplates: ActivityTemplateItem[];
  credits: CreditsState;
  subscription: SubscriptionState;
  activityLogs: ActivityLogEntry[];
  studio: StudioBranding;

  // Order Actions
  createWeddingOrder: (input: CreateWeddingBookingInput) => OrderDetail;
  createOccasionOrder: (input: CreateOccasionBookingInput) => OrderDetail;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  rescheduleOrder: (orderId: string, newDate: string, shiftEvents: boolean) => void;
  deleteOrder: (orderId: string) => void;
  togglePinOrder: (orderId: string) => void;

  // Event & Crew Actions
  assignCrew: (eventId: string, agentId: string, role: CrewRole, isPrimary: boolean, pay: number) => void;
  removeCrew: (eventId: string, assignmentId: string) => void;
  updateMaterialReceipt: (eventId: string, assignmentId: string, received: boolean) => void;
  submitShootCounts: (input: SubmitShootCountsInput) => void;
  updateAssignmentStatus: (eventId: string, assignmentId: string, status: any) => void;
  updateAssignmentPay: (eventId: string, assignmentId: string, pay: number) => void;
  updateAssignmentCount: (eventId: string, assignmentId: string, count: number) => void;
  addEvent: (event: Omit<EventScheduleItem, 'id'>) => EventScheduleItem;

  // Editing Actions
  claimTask: (taskId: string, editorId: string, editorName: string) => boolean;
  releaseTask: (taskId: string) => void;
  updateTaskStatus: (taskId: string, status: EditingTaskStatus) => void;
  updateActivityStatus: (activityId: string, newIndex: number) => void;
  addOrderActivity: (input: Omit<OrderActivity, 'id' | 'createdAt'>) => OrderActivity;
  deleteOrderActivity: (activityId: string) => void;
  addEditingTask: (input: Omit<EditingTask, 'id' | 'createdAt' | 'updatedAt'>) => EditingTask;
  assignEditorToTask: (taskId: string, editorId: string, editorName: string) => void;
  deleteEditingTask: (taskId: string) => void;
  autoGenerateEditingPipeline: (order: OrderDetail) => EditingTask[];

  // Review Actions
  uploadReviewVersion: (reviewItemId: string, versionData: Partial<ReviewVersion>) => void;
  sendToClient: (reviewItemId: string) => { success: boolean; error?: string };
  resolveComment: (reviewItemId: string, commentId: string, note?: string, status?: ReviewCommentStatus) => void;
  reopenReview: (reviewItemId: string) => void;

  // Money Actions
  recordClientReceipt: (input: RecordClientReceiptInput, staffId: string, staffName: string) => PaymentRecord;
  recordStaffPayout: (input: RecordStaffPayoutInput, staffId: string, staffName: string) => PaymentRecord;
  deletePaymentRecord: (paymentId: string) => void;

  // Team Actions
  createTeamMember: (input: CreateTeamMemberInput) => TeamMember;
  toggleMemberActive: (memberId: string) => void;
  updateCapability: (input: UpdateCapabilityInput) => { success: boolean; warning?: string };
  awardAchievement: (memberId: string, achievement: AgentAchievement) => void;
  revokeAchievement: (memberId: string, achievementId: string) => void;

  // Client Access Actions
  resetClientPin: (orderId: string) => string; // Returns one-time PIN

  // Credits & Studio
  purchaseCredits: (amount: number, coupon?: string) => void;
  savePackageDraft: (draftId: string) => void;
  setStudioPro: (enabled: boolean) => void;
  resetAllDemoData: () => void;

  // Mascot Companion Settings
  mascotEnabled: boolean;
  toggleMascotEnabled: () => void;
}

const DemoStoreContext = createContext<DemoStoreContextType | null>(null);

export function DemoStoreProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<OrderDetail[]>(INITIAL_ORDERS);
  const [events, setEvents] = useState<EventScheduleItem[]>(INITIAL_EVENTS);
  const [editingTasks, setEditingTasks] = useState<EditingTask[]>(INITIAL_EDITING_TASKS);
  const [activities, setActivities] = useState<OrderActivity[]>(INITIAL_ORDER_ACTIVITIES);
  const [reviews, setReviews] = useState<ReviewItem[]>(INITIAL_REVIEWS);
  const [payments, setPayments] = useState<PaymentRecord[]>(INITIAL_PAYMENTS);
  const [payroll, setPayroll] = useState<StudioPayrollSummary>(INITIAL_STUDIO_PAYROLL);
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM_MEMBERS);
  const [packages, setPackages] = useState<StudioPackage[]>(INITIAL_PACKAGES);
  const [packageDrafts, setPackageDrafts] = useState<PackageExtractionDraft[]>(INITIAL_PACKAGE_DRAFTS);
  const [eventTypes, setEventTypes] = useState<StudioEventType[]>(INITIAL_EVENT_TYPES);
  const [activityTemplates, setActivityTemplates] = useState<ActivityTemplateItem[]>(INITIAL_ACTIVITY_TEMPLATES);
  const [credits, setCredits] = useState<CreditsState>(INITIAL_CREDITS_STATE);
  const [subscription, setSubscription] = useState<SubscriptionState>(INITIAL_SUBSCRIPTION);
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>(INITIAL_ACTIVITY_LOGS);
  const [studio, setStudio] = useState<StudioBranding>(DEMO_STUDIOS.aura);
  const [mascotEnabled, setMascotEnabled] = useState<boolean>(true);

  const toggleMascotEnabled = () => {
    setMascotEnabled(prev => !prev);
  };

  const logActivity = (action: string, entityType: string, entityId: string, title: string, details: string) => {
    const entry: ActivityLogEntry = {
      id: `log-${Date.now()}`,
      actorName: 'Staff User',
      actorRole: 'STAFF',
      action,
      entityType,
      entityId,
      entityTitle: title,
      timestamp: new Date().toISOString(),
      details,
    };
    setActivityLogs(prev => [entry, ...prev]);
  };

  // Create Wedding Order (ORD-04)
  const createWeddingOrder = (input: CreateWeddingBookingInput): OrderDetail => {
    const nextNum = `WT-2026-${String(orders.length + 1).padStart(3, '0')}`;
    const newOrder: OrderDetail = {
      id: `ord-${Date.now()}`,
      tenantOrderNumber: input.tenantOrderNumber || nextNum,
      type: 'WEDDING',
      title: `${input.brideName} & ${input.groomName} Wedding`,
      clientName: `${input.brideName} & ${input.groomName}`,
      brideName: input.brideName,
      groomName: input.groomName,
      clientPhone: input.primaryContactPhone,
      clientEmail: input.primaryContactEmail,
      status: 'PENDING',
      priority: 'NORMAL',
      eventDate: input.firstEventDate,
      eventCount: 1,
      packageName: 'Custom Wedding Package',
      packageId: input.packageId,
      deliverablesSummary: input.customDeliverables?.join(', ') || 'Standard Photo & Video Deliverables',
      venueLocation: input.firstEventLocation,
      primaryContactName: input.primaryContactName,
      primaryContactPhone: input.primaryContactPhone,
      secondaryContactName: input.secondaryContactName,
      secondaryContactPhone: input.secondaryContactPhone,
      clientAddress: input.clientAddress,
      bookingConsentRecorded: input.bookingConsent,
      deliverables: [
        { id: `del-${Date.now()}-1`, title: 'Candid Photos', category: 'PHOTO', status: 'PENDING' },
        { id: `del-${Date.now()}-2`, title: 'Wedding Film', category: 'VIDEO', status: 'PENDING' },
      ],
      financials: {
        totalAmount: 150000,
        paidAmount: 0,
        balanceDue: 150000,
        crewCost: 40000,
        editorCost: 25000,
        extraCost: 0,
        margin: 85000,
        currency: 'INR',
      },
      clientAccess: {
        hasAccount: false,
        isLocked: false,
      },
      canDownloadContract: false,
      canSharePublicLink: true,
      notes: input.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setOrders(prev => [newOrder, ...prev]);

    // Create corresponding first event
    const newEvent: EventScheduleItem = {
      id: `evt-${Date.now()}`,
      orderId: newOrder.id,
      tenantOrderNumber: newOrder.tenantOrderNumber,
      orderTitle: newOrder.title,
      eventTypeId: input.firstEventTypeId || 'et-wedding-03',
      eventTypeName: 'Wedding Ceremony',
      side: 'BOTH',
      startTime: input.firstEventDate,
      venueName: input.firstEventLocation,
      venueAddress: input.firstEventLocation,
      status: 'UNASSIGNED',
      photographersNeeded: 2,
      videographersNeeded: 1,
      assignments: [],
    };
    setEvents(prev => [newEvent, ...prev]);

    logActivity('CREATE_WEDDING', 'ORDER', newOrder.id, newOrder.title, `Created booking ${newOrder.tenantOrderNumber}`);
    return newOrder;
  };

  // Create Occasion Order (ORD-05)
  const createOccasionOrder = (input: CreateOccasionBookingInput): OrderDetail => {
    const nextNum = `WT-2026-${String(orders.length + 1).padStart(3, '0')}`;
    const newOrder: OrderDetail = {
      id: `ord-${Date.now()}`,
      tenantOrderNumber: input.tenantOrderNumber || nextNum,
      type: 'OCCASION',
      title: input.occasionTitle,
      clientName: input.clientName,
      clientPhone: input.clientPhone,
      clientEmail: input.clientEmail,
      status: 'PENDING',
      priority: 'NORMAL',
      eventDate: input.eventDate,
      eventCount: 1,
      packageName: 'Occasion Package',
      packageId: input.packageId,
      deliverablesSummary: 'Photography & Cinema Highlights',
      venueLocation: input.eventLocation,
      primaryContactName: input.clientName,
      primaryContactPhone: input.clientPhone,
      bookingConsentRecorded: input.bookingConsent,
      deliverables: [
        { id: `del-${Date.now()}-1`, title: 'Event Photos', category: 'PHOTO', status: 'PENDING' },
        { id: `del-${Date.now()}-2`, title: 'Highlight Video', category: 'HIGHLIGHT', status: 'PENDING' },
      ],
      financials: {
        totalAmount: 80000,
        paidAmount: 0,
        balanceDue: 80000,
        crewCost: 20000,
        editorCost: 15000,
        extraCost: 0,
        margin: 45000,
        currency: 'INR',
      },
      clientAccess: {
        hasAccount: false,
        isLocked: false,
      },
      canDownloadContract: false,
      canSharePublicLink: true,
      notes: input.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setOrders(prev => [newOrder, ...prev]);

    const newEvent: EventScheduleItem = {
      id: `evt-${Date.now()}`,
      orderId: newOrder.id,
      tenantOrderNumber: newOrder.tenantOrderNumber,
      orderTitle: newOrder.title,
      eventTypeId: input.eventTypeId,
      eventTypeName: input.occasionTitle,
      side: 'BOTH',
      startTime: input.eventDate,
      venueName: input.eventLocation,
      venueAddress: input.eventLocation,
      status: 'UNASSIGNED',
      photographersNeeded: 1,
      videographersNeeded: 1,
      assignments: [],
    };
    setEvents(prev => [newEvent, ...prev]);

    logActivity('CREATE_OCCASION', 'ORDER', newOrder.id, newOrder.title, `Created occasion booking ${newOrder.tenantOrderNumber}`);
    return newOrder;
  };

  // Change Order Status (ORD-07)
  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev =>
      prev.map(ord => {
        if (ord.id !== orderId) return ord;
        let canDownloadContract = ord.canDownloadContract;
        if (status === 'CONFIRMED' || status === 'IN_PROGRESS' || status === 'COMPLETED') {
          canDownloadContract = true;
        } else if (status === 'PENDING' || status === 'CANCELLED') {
          canDownloadContract = false;
        }

        // If confirming, deduct 3 credits
        if (ord.status === 'PENDING' && status === 'CONFIRMED') {
          setCredits(c => ({
            ...c,
            balance: Math.max(0, c.balance - 3),
            history: [
              {
                id: `crd-${Date.now()}`,
                transactionType: 'BOOKING_CONFIRMATION',
                amount: -3,
                balanceAfter: Math.max(0, c.balance - 3),
                orderNumber: ord.tenantOrderNumber,
                createdAt: new Date().toISOString(),
              },
              ...c.history,
            ],
          }));
        }

        return { ...ord, status, canDownloadContract, updatedAt: new Date().toISOString() };
      })
    );
    logActivity('STATUS_CHANGE', 'ORDER', orderId, orderId, `Moved status to ${status}`);
  };

  // Reschedule Order (ORD-08)
  const rescheduleOrder = (orderId: string, newDate: string, shiftEvents: boolean) => {
    setOrders(prev =>
      prev.map(ord => {
        if (ord.id !== orderId) return ord;
        return { ...ord, eventDate: newDate, updatedAt: new Date().toISOString() };
      })
    );

    if (shiftEvents) {
      setEvents(prev =>
        prev.map(evt => {
          if (evt.orderId !== orderId) return evt;
          return { ...evt, startTime: newDate };
        })
      );
    }
    logActivity('RESCHEDULE', 'ORDER', orderId, orderId, `Rescheduled to ${newDate}`);
  };

  // Delete Order (ORD-09)
  const deleteOrder = (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    setEvents(prev => prev.filter(e => e.orderId !== orderId));
    setEditingTasks(prev => prev.filter(t => t.orderId !== orderId));
    setActivities(prev => prev.filter(a => a.orderId !== orderId));
    setReviews(prev => prev.filter(r => r.orderId !== orderId));
    logActivity('DELETE_ORDER', 'ORDER', orderId, orderId, 'Admin removed order and cleaned up media');
  };

  // Toggle Pin (ORD-03)
  const togglePinOrder = (orderId: string) => {
    setOrders(prev =>
      prev.map(ord => {
        if (ord.id !== orderId) return ord;
        const newPriority = ord.priority === 'PINNED' ? 'NORMAL' : 'PINNED';
        return { ...ord, priority: newPriority };
      })
    );
  };

  // Assign Crew (EVT-03)
  const assignCrew = (eventId: string, agentId: string, role: CrewRole, isPrimary: boolean, pay: number) => {
    const member = team.find(t => t.id === agentId);
    if (!member) return;

    setEvents(prev =>
      prev.map(evt => {
        if (evt.id !== eventId) return evt;
        const newAssignment = {
          id: `asg-${Date.now()}`,
          eventId,
          agentId,
          agentName: member.name,
          agentPhone: member.phone,
          role,
          isPrimary,
          status: 'ASSIGNED' as const,
          assignmentPay: pay,
          materialReceived: false,
        };
        const updated = [...evt.assignments, newAssignment];
        return {
          ...evt,
          assignments: updated,
          status: 'ASSIGNED' as const,
        };
      })
    );
    logActivity('ASSIGN_CREW', 'EVENT', eventId, eventId, `Assigned ${member.name} as ${role}`);
  };

  // Remove Crew
  const removeCrew = (eventId: string, assignmentId: string) => {
    setEvents(prev =>
      prev.map(evt => {
        if (evt.id !== eventId) return evt;
        const filtered = evt.assignments.filter(a => a.id !== assignmentId);
        return {
          ...evt,
          assignments: filtered,
          status: filtered.length === 0 ? 'UNASSIGNED' : evt.status,
        };
      })
    );
  };

  // Track Material Receipt (EVT-05)
  const updateMaterialReceipt = (eventId: string, assignmentId: string, received: boolean) => {
    setEvents(prev =>
      prev.map(evt => {
        if (evt.id !== eventId) return evt;
        return {
          ...evt,
          assignments: evt.assignments.map(a => (a.id === assignmentId ? { ...a, materialReceived: received } : a)),
        };
      })
    );
  };

  // Agent Submit Shoot Counts (AGT-03, AGT-04)
  const submitShootCounts = (input: SubmitShootCountsInput) => {
    setEvents(prev =>
      prev.map(evt => {
        if (evt.id !== input.eventId) return evt;
        return {
          ...evt,
          assignments: evt.assignments.map(a => {
            if (a.id === input.assignmentId) {
              const count = input.role === 'PHOTOGRAPHER' ? input.photoCount : input.videoCount;
              return {
                ...a,
                submissionCount: count,
                submittedAt: new Date().toISOString(),
                status: 'COMPLETED' as const,
              };
            }
            return a;
          }),
        };
      })
    );
    logActivity('SUBMIT_COUNTS', 'EVENT', input.eventId, input.eventId, `Submitted ${input.role} count`);
  };

  // Update Assignment Status
  const updateAssignmentStatus = (eventId: string, assignmentId: string, status: any) => {
    setEvents(prev =>
      prev.map(evt => {
        if (evt.id !== eventId) return evt;
        return {
          ...evt,
          assignments: evt.assignments.map(a => (a.id === assignmentId ? { ...a, status } : a)),
        };
      })
    );
    logActivity('UPDATE_ASSIGNMENT_STATUS', 'EVENT', eventId, eventId, `Updated assignment status to ${status}`);
  };

  // Update Assignment Pay / Rate
  const updateAssignmentPay = (eventId: string, assignmentId: string, pay: number) => {
    setEvents(prev =>
      prev.map(evt => {
        if (evt.id !== eventId) return evt;
        return {
          ...evt,
          assignments: evt.assignments.map(a => (a.id === assignmentId ? { ...a, assignmentPay: pay } : a)),
        };
      })
    );
    logActivity('UPDATE_ASSIGNMENT_PAY', 'EVENT', eventId, eventId, `Updated assignment rate to ₹${pay}`);
  };

  // Update Assignment Count
  const updateAssignmentCount = (eventId: string, assignmentId: string, count: number) => {
    setEvents(prev =>
      prev.map(evt => {
        if (evt.id !== eventId) return evt;
        return {
          ...evt,
          assignments: evt.assignments.map(a => (a.id === assignmentId ? { ...a, submissionCount: count } : a)),
        };
      })
    );
    logActivity('UPDATE_ASSIGNMENT_COUNT', 'EVENT', eventId, eventId, `Updated media count to ${count}`);
  };

  // Add Event
  const addEvent = (eventInput: Omit<EventScheduleItem, 'id'>): EventScheduleItem => {
    const newEvent: EventScheduleItem = {
      ...eventInput,
      id: `evt-custom-${Date.now()}`,
    };
    setEvents(prev => [newEvent, ...prev]);
    logActivity('CREATE_EVENT', 'EVENT', newEvent.id, newEvent.id, `Created event: ${newEvent.eventTypeName}`);
    return newEvent;
  };

  // Editor Claim Task (EDR-02)
  const claimTask = (taskId: string, editorId: string, editorName: string): boolean => {
    let success = false;
    setEditingTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          if (t.editorId && t.editorId !== editorId) {
            // Concurrently claimed!
            return t;
          }
          success = true;
          return {
            ...t,
            editorId,
            editorName,
            status: 'IN_PROGRESS' as const,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );
    if (success) {
      logActivity('CLAIM_TASK', 'TASK', taskId, taskId, `${editorName} claimed editing task`);
    }
    return success;
  };

  // Editor Release Task (EDR-03)
  const releaseTask = (taskId: string) => {
    setEditingTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            editorId: undefined,
            editorName: undefined,
            status: 'PENDING' as const,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );
    logActivity('RELEASE_TASK', 'TASK', taskId, taskId, 'Released editing task back to unassigned queue');
  };

  // Update Editing Status (EDIT-01, EDR-03)
  const updateTaskStatus = (taskId: string, status: EditingTaskStatus) => {
    setEditingTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          return { ...t, status, updatedAt: new Date().toISOString() };
        }
        return t;
      })
    );
  };

  // Add Custom Editing Task
  const addEditingTask = (input: Omit<EditingTask, 'id' | 'createdAt' | 'updatedAt'>): EditingTask => {
    const newTask: EditingTask = {
      ...input,
      id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingTasks(prev => [newTask, ...prev]);
    logActivity('CREATE_TASK', 'TASK', newTask.id, newTask.id, `Created editing task: ${newTask.title}`);
    return newTask;
  };

  // Assign or Reassign Editor to Task
  const assignEditorToTask = (taskId: string, editorId: string, editorName: string) => {
    setEditingTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            editorId,
            editorName,
            status: t.status === 'PENDING' ? 'IN_PROGRESS' : t.status,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );
    logActivity('ASSIGN_EDITOR', 'TASK', taskId, taskId, `Assigned ${editorName} to ${taskId}`);
  };

  // Delete Editing Task
  const deleteEditingTask = (taskId: string) => {
    setEditingTasks(prev => prev.filter(t => t.id !== taskId));
    logActivity('DELETE_TASK', 'TASK', taskId, taskId, `Deleted editing task ${taskId}`);
  };

  // Auto-Generate Default Editing Pipeline for a Booking
  const autoGenerateEditingPipeline = (order: OrderDetail): EditingTask[] => {
    const isWedding = order.type === 'WEDDING';
    const now = new Date();
    const eventD = new Date(order.eventDate);

    // Set realistic due dates based on event date
    const d1 = new Date(eventD.getTime() + 7 * 86400000).toISOString();
    const d2 = new Date(eventD.getTime() + 14 * 86400000).toISOString();
    const d3 = new Date(eventD.getTime() + 25 * 86400000).toISOString();

    const templates: Omit<EditingTask, 'id' | 'createdAt' | 'updatedAt'>[] = isWedding
      ? [
          {
            orderId: order.id,
            tenantOrderNumber: order.tenantOrderNumber,
            orderTitle: order.title,
            clientNames: order.clientName,
            taskType: 'reel',
            category: 'REEL',
            title: 'Social Media Teaser Reel (60s)',
            description: 'Vertical 9:16 high-energy reel for Instagram and WhatsApp status.',
            status: 'PENDING',
            cost: 6000,
            durationMinutes: 1,
            dueDate: d1,
            venueLocation: order.venueLocation,
            isReviewable: true,
            reviewStatus: 'NOT_UPLOADED',
          },
          {
            orderId: order.id,
            tenantOrderNumber: order.tenantOrderNumber,
            orderTitle: order.title,
            clientNames: order.clientName,
            taskType: 'highlight',
            category: 'HIGHLIGHT',
            title: 'Cinematic Highlights Film (4-5 mins)',
            description: 'Emotional narrative highlight film with dialogue audio sync and color grading.',
            status: 'PENDING',
            cost: 14000,
            durationMinutes: 5,
            dueDate: d2,
            venueLocation: order.venueLocation,
            isReviewable: true,
            reviewStatus: 'NOT_UPLOADED',
          },
          {
            orderId: order.id,
            tenantOrderNumber: order.tenantOrderNumber,
            orderTitle: order.title,
            clientNames: order.clientName,
            taskType: 'order-photo',
            category: 'PHOTO_EDIT',
            title: 'Master Stills Selection & Color Grading',
            description: 'Professional color correction, skin smoothing, and print preparation for 400 stills.',
            status: 'PENDING',
            cost: 10000,
            quantity: 400,
            dueDate: d2,
            venueLocation: order.venueLocation,
            isReviewable: false,
          },
          {
            orderId: order.id,
            tenantOrderNumber: order.tenantOrderNumber,
            orderTitle: order.title,
            clientNames: order.clientName,
            taskType: 'album',
            category: 'ALBUM',
            title: 'Flush Mount Royal Album Design (35 Spreads)',
            description: '12x36 spread layout design for client digital proofing and leather-bound printing.',
            status: 'PENDING',
            cost: 15000,
            quantity: 1,
            dueDate: d3,
            venueLocation: order.venueLocation,
            isReviewable: true,
            reviewStatus: 'NOT_UPLOADED',
          },
        ]
      : [
          {
            orderId: order.id,
            tenantOrderNumber: order.tenantOrderNumber,
            orderTitle: order.title,
            clientNames: order.clientName,
            taskType: 'highlight',
            category: 'HIGHLIGHT',
            title: 'Event Highlights & Recap Film (3-4 mins)',
            description: 'Key moments recap with speaker soundbites and ambient event audio.',
            status: 'PENDING',
            cost: 12000,
            durationMinutes: 4,
            dueDate: d1,
            venueLocation: order.venueLocation,
            isReviewable: true,
            reviewStatus: 'NOT_UPLOADED',
          },
          {
            orderId: order.id,
            tenantOrderNumber: order.tenantOrderNumber,
            orderTitle: order.title,
            clientNames: order.clientName,
            taskType: 'order-photo',
            category: 'PHOTO_EDIT',
            title: 'Event Stills Color Grading & Delivery',
            description: 'Selected ceremony and candid photos color corrected and exported for press/web.',
            status: 'PENDING',
            cost: 8000,
            quantity: 200,
            dueDate: d1,
            venueLocation: order.venueLocation,
            isReviewable: false,
          },
          {
            orderId: order.id,
            tenantOrderNumber: order.tenantOrderNumber,
            orderTitle: order.title,
            clientNames: order.clientName,
            taskType: 'order-video',
            category: 'VIDEO_EDIT',
            title: 'Full Event Video Archive Edit',
            description: 'Multi-camera sequence cut with synced audio tracks and title cards.',
            status: 'PENDING',
            cost: 15000,
            durationMinutes: 60,
            dueDate: d2,
            venueLocation: order.venueLocation,
            isReviewable: true,
            reviewStatus: 'NOT_UPLOADED',
          },
        ];

    const created: EditingTask[] = templates.map((tmpl, index) => ({
      ...tmpl,
      id: `task-auto-${Date.now()}-${index}`,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }));

    setEditingTasks(prev => [...created, ...prev]);
    logActivity('CREATE_PIPELINE', 'ORDER', order.id, order.title, `Generated ${created.length} default editing deliverables`);
    return created;
  };

  // Update Activity Status (ACT-01, EDR-04)
  const updateActivityStatus = (activityId: string, newIndex: number) => {
    setActivities(prev =>
      prev.map(act => {
        if (act.id !== activityId) return act;
        const validIndex = Math.max(0, Math.min(newIndex, act.statuses.length - 1));
        const isCompleted = validIndex === act.statuses.length - 1;
        return {
          ...act,
          currentStatusIndex: validIndex,
          currentStatus: act.statuses[validIndex],
          isCompleted,
        };
      })
    );
  };

  // Add Order Activity (ACT-02)
  const addOrderActivity = (input: Omit<OrderActivity, 'id' | 'createdAt'>): OrderActivity => {
    const newActivity: OrderActivity = {
      ...input,
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    setActivities(prev => [newActivity, ...prev]);
    logActivity('CREATE_ACTIVITY', 'TASK', newActivity.id, newActivity.title, `Added activity "${newActivity.title}" for ${input.tenantOrderNumber}`);
    return newActivity;
  };

  // Delete Order Activity
  const deleteOrderActivity = (activityId: string) => {
    setActivities(prev => prev.filter(a => a.id !== activityId));
    logActivity('DELETE_ACTIVITY', 'TASK', activityId, activityId, `Deleted activity ${activityId}`);
  };

  // Review Version Upload (REV-02)
  const uploadReviewVersion = (reviewItemId: string, versionData: Partial<ReviewVersion>) => {
    setReviews(prev =>
      prev.map(rev => {
        if (rev.id !== reviewItemId) return rev;
        const newVersionNum = rev.versions.length + 1;
        const newVersion: ReviewVersion = {
          id: `ver-${Date.now()}`,
          versionNumber: newVersionNum,
          roundNumber: rev.currentRound,
          status: 'READY',
          fileName: versionData.fileName || `Version_${newVersionNum}.pdf`,
          fileSizeBytes: versionData.fileSizeBytes || 50000000,
          uploadedAt: new Date().toISOString(),
          isVerified: true,
          mediaUrl: versionData.mediaUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80',
          pageCount: versionData.pageCount || 40,
          durationSeconds: versionData.durationSeconds,
        };
        return {
          ...rev,
          currentVersion: newVersion,
          versions: [...rev.versions, newVersion],
          status: 'NOT_UPLOADED' as const, // Ready to send to client
        };
      })
    );
    logActivity('UPLOAD_REVIEW', 'REVIEW', reviewItemId, reviewItemId, 'Uploaded new review version');
  };

  // Send to Client (REV-03)
  const sendToClient = (reviewItemId: string): { success: boolean; error?: string } => {
    const rev = reviews.find(r => r.id === reviewItemId);
    if (!rev) return { success: false, error: 'Review item not found' };
    if (!rev.clientAccessLinked) return { success: false, error: 'Client account is not linked to this booking' };
    if (!rev.currentVersion || !rev.currentVersion.isVerified) {
      return { success: false, error: 'Current version assets must be verified before sending' };
    }

    setReviews(prev =>
      prev.map(r => {
        if (r.id !== reviewItemId) return r;
        return {
          ...r,
          status: 'WAITING_FOR_CLIENT' as const,
          lastSentAt: new Date().toISOString(),
        };
      })
    );
    logActivity('SEND_REVIEW', 'REVIEW', reviewItemId, rev.title, 'Published review version to client portal');
    return { success: true };
  };

  // Address Feedback / Resolve Comment (REV-04)
  const resolveComment = (reviewItemId: string, commentId: string, note?: string, status: ReviewCommentStatus = 'FIXED') => {
    setReviews(prev =>
      prev.map(rev => {
        if (rev.id !== reviewItemId) return rev;
        const updatedComments = rev.comments.map(c => {
          if (c.id === commentId) {
            return {
              ...c,
              status,
              staffResolutionNote: note || c.staffResolutionNote,
              resolvedAt: new Date().toISOString(),
            };
          }
          return c;
        });

        // If all comments are fixed, status can move towards revision
        return {
          ...rev,
          comments: updatedComments,
        };
      })
    );
    logActivity('RESOLVE_COMMENT', 'REVIEW', reviewItemId, reviewItemId, `Marked comment ${status}`);
  };

  // Revise / Reopen (REV-05)
  const reopenReview = (reviewItemId: string) => {
    setReviews(prev =>
      prev.map(rev => {
        if (rev.id !== reviewItemId) return rev;
        return {
          ...rev,
          status: 'CHANGES_REQUESTED' as const,
          currentRound: rev.currentRound + 1,
        };
      })
    );
    logActivity('REOPEN_REVIEW', 'REVIEW', reviewItemId, reviewItemId, 'Reopened review for additional revision');
  };

  // Record Client Receipt (PAY-01)
  const recordClientReceipt = (input: RecordClientReceiptInput, staffId: string, staffName: string): PaymentRecord => {
    const newRecord: PaymentRecord = {
      id: `pay-rec-${Date.now()}`,
      type: 'CLIENT_RECEIPT',
      orderId: input.orderId,
      tenantOrderNumber: input.tenantOrderNumber,
      orderTitle: input.tenantOrderNumber,
      recipientOrPayerName: 'Client',
      amount: input.amount,
      currency: 'INR',
      paymentDate: input.paymentDate,
      method: input.method,
      status: input.status,
      category: input.category || 'Receipt',
      referenceNumber: input.referenceNumber,
      notes: input.notes,
      recordedByStaffId: staffId,
      recordedByStaffName: staffName,
      createdAt: new Date().toISOString(),
    };

    setPayments(prev => [newRecord, ...prev]);

    // Update order financials
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== input.orderId) return o;
        const prevPaid = o.financials?.paidAmount || 0;
        const total = o.financials?.totalAmount || 0;
        const newPaid = prevPaid + input.amount;
        const newBalance = Math.max(0, total - newPaid);
        return {
          ...o,
          financials: {
            ...o.financials,
            paidAmount: newPaid,
            balanceDue: newBalance,
            currency: 'INR',
          },
        };
      })
    );

    logActivity('RECORD_RECEIPT', 'PAYMENT', newRecord.id, input.tenantOrderNumber, `Recorded receipt of ₹${input.amount}`);
    return newRecord;
  };

  // Record Staff Payout (PAY-05)
  const recordStaffPayout = (input: RecordStaffPayoutInput, staffId: string, staffName: string): PaymentRecord => {
    const newRecord: PaymentRecord = {
      id: `pay-payout-${Date.now()}`,
      type: input.type,
      recipientOrPayerId: input.workerId,
      recipientOrPayerName: input.workerName,
      amount: input.amount,
      currency: 'INR',
      paymentDate: input.paymentDate,
      method: input.method,
      status: input.status,
      category: 'Staff Payout',
      referenceNumber: input.referenceNumber,
      notes: input.notes,
      recordedByStaffId: staffId,
      recordedByStaffName: staffName,
      createdAt: new Date().toISOString(),
    };

    setPayments(prev => [newRecord, ...prev]);

    // Update payroll summary
    setPayroll(prev => {
      const updateWorker = (w: any) => {
        if (w.workerId !== input.workerId) return w;
        const paid = w.totalPaid + input.amount;
        const balance = Math.max(0, w.totalEarned - paid);
        return {
          ...w,
          totalPaid: paid,
          balanceDue: balance,
          paymentCount: w.paymentCount + 1,
        };
      };

      return {
        ...prev,
        totalPaid: prev.totalPaid + input.amount,
        totalBalanceDue: Math.max(0, prev.totalBalanceDue - input.amount),
        agentWorkers: input.type === 'AGENT_PAYOUT' ? prev.agentWorkers.map(updateWorker) : prev.agentWorkers,
        editorWorkers: input.type === 'EDITOR_PAYOUT' ? prev.editorWorkers.map(updateWorker) : prev.editorWorkers,
      };
    });

    logActivity('RECORD_PAYOUT', 'PAYMENT', newRecord.id, input.workerName, `Recorded payout of ₹${input.amount}`);
    return newRecord;
  };

  // Delete Payment Record (PAY-03)
  const deletePaymentRecord = (paymentId: string) => {
    setPayments(prev => prev.filter(p => p.id !== paymentId));
    logActivity('DELETE_PAYMENT', 'PAYMENT', paymentId, paymentId, 'Admin deleted payment record');
  };

  // Create Team Member (TEAM-02)
  const createTeamMember = (input: CreateTeamMemberInput): TeamMember => {
    const newMember: TeamMember = {
      id: `usr-team-${Date.now()}`,
      canonicalId: `canonical-${input.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: input.name,
      email: input.email,
      phone: input.phone,
      roles: [input.primaryRole],
      isActive: true,
      hasDualCapability: false,
      capabilities: {
        shooting: input.primaryRole === 'AGENT',
        editing: input.primaryRole === 'EDITOR',
      },
      profession: input.profession,
      editingCategories: input.editingCategories,
      rates: input.rates?.map((r, i) => ({
        id: `rate-${Date.now()}-${i}`,
        eventTypeId: r.eventTypeId,
        eventTypeName: eventTypes.find(e => e.id === r.eventTypeId)?.name || 'Event',
        rate: r.rate,
        currency: 'INR',
      })),
      openAssignmentsCount: 0,
      openTasksCount: 0,
      createdAt: new Date().toISOString(),
    };

    setTeam(prev => [newMember, ...prev]);
    logActivity('CREATE_MEMBER', 'TEAM', newMember.id, newMember.name, `Added new staff member as ${input.primaryRole}`);
    return newMember;
  };

  // Toggle Member Active (TEAM-02)
  const toggleMemberActive = (memberId: string) => {
    setTeam(prev =>
      prev.map(m => {
        if (m.id !== memberId) return m;
        return { ...m, isActive: !m.isActive };
      })
    );
  };

  // Update Capability (TEAM-03, TEAM-04)
  const updateCapability = (input: UpdateCapabilityInput): { success: boolean; warning?: string } => {
    let warning: string | undefined;

    setTeam(prev =>
      prev.map(m => {
        if (m.id !== input.memberId) return m;

        let shooting = m.capabilities.shooting;
        let editing = m.capabilities.editing;
        let roles = [...m.roles];

        if (input.action === 'ENABLE_SHOOTING') {
          shooting = true;
          if (!roles.includes('AGENT')) roles.push('AGENT');
        } else if (input.action === 'DISABLE_SHOOTING') {
          shooting = false;
          roles = roles.filter(r => r !== 'AGENT');
          if (m.openAssignmentsCount > 0) {
            warning = `Warning: ${m.name} still has ${m.openAssignmentsCount} open shoots assigned.`;
          }
        } else if (input.action === 'ENABLE_EDITING') {
          editing = true;
          if (!roles.includes('EDITOR')) roles.push('EDITOR');
        } else if (input.action === 'DISABLE_EDITING') {
          editing = false;
          roles = roles.filter(r => r !== 'EDITOR');
          if (m.openTasksCount > 0) {
            warning = `Warning: ${m.name} still has ${m.openTasksCount} open editing tasks assigned.`;
          }
        }

        const hasDual = shooting && editing;

        return {
          ...m,
          capabilities: { shooting, editing },
          roles,
          hasDualCapability: hasDual,
          profession: input.profession || m.profession,
          editingCategories: input.editingCategories || m.editingCategories,
        };
      })
    );

    return { success: true, warning };
  };

  // Award Achievement to Staff Member (Admin Action)
  const awardAchievement = (memberId: string, achievement: AgentAchievement) => {
    setTeam(prev =>
      prev.map(m => {
        if (m.id !== memberId) return m;
        const existing = m.achievements || [];
        const filtered = existing.filter(a => a.code !== achievement.code);
        return {
          ...m,
          achievements: [achievement, ...filtered],
        };
      })
    );
    logActivity('AWARD_ACHIEVEMENT', 'TEAM', memberId, achievement.title, `Awarded ${achievement.title} to staff member.`);
  };

  // Revoke Achievement from Staff Member (Admin Action)
  const revokeAchievement = (memberId: string, achievementId: string) => {
    setTeam(prev =>
      prev.map(m => {
        if (m.id !== memberId) return m;
        return {
          ...m,
          achievements: (m.achievements || []).filter(a => a.id !== achievementId),
        };
      })
    );
    logActivity('REVOKE_ACHIEVEMENT', 'TEAM', memberId, achievementId, `Revoked achievement from staff member.`);
  };

  // Reset Client PIN (CLIENT-04)
  const resetClientPin = (orderId: string): string => {
    const newPin = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit PIN

    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          clientAccess: {
            ...o.clientAccess,
            hasAccount: true,
            pinIssuedAt: new Date().toISOString(),
            isLocked: false,
          },
        };
      })
    );

    // Note: Never log the actual PIN!
    logActivity('RESET_CLIENT_PIN', 'CLIENT_ACCESS', orderId, orderId, 'Reset client portal access PIN (one-time issued)');
    return newPin;
  };

  // Purchase Credits (BILL-02)
  const purchaseCredits = (amount: number, coupon?: string) => {
    setCredits(prev => ({
      ...prev,
      balance: prev.balance + amount,
      history: [
        {
          id: `crd-${Date.now()}`,
          transactionType: 'PURCHASE',
          amount,
          balanceAfter: prev.balance + amount,
          couponCode: coupon,
          createdAt: new Date().toISOString(),
        },
        ...prev.history,
      ],
    }));
  };

  // Save Package Draft (SET-03)
  const savePackageDraft = (draftId: string) => {
    const draft = packageDrafts.find(d => d.id === draftId);
    if (!draft) return;

    const newPkg: StudioPackage = {
      id: `pkg-${Date.now()}`,
      title: draft.extractedTitle.replace(' (Draft)', ''),
      price: draft.extractedPrice,
      isPriceVisible: true,
      isActive: true,
      deliverables: draft.extractedDeliverables,
    };

    setPackages(prev => [newPkg, ...prev]);
    setPackageDrafts(prev => prev.map(d => (d.id === draftId ? { ...d, status: 'SAVED' } : d)));
    logActivity('SAVE_PACKAGE', 'PACKAGE', newPkg.id, newPkg.title, 'Converted extracted package draft into active catalog package');
  };

  const setStudioPro = (enabled: boolean) => {
    setStudio(prev => ({ ...prev, proEnabled: enabled }));
    setReviews(prev => prev.map(r => ({ ...r, isProEnabled: enabled })));
  };

  const resetAllDemoData = () => {
    setOrders(INITIAL_ORDERS);
    setEvents(INITIAL_EVENTS);
    setEditingTasks(INITIAL_EDITING_TASKS);
    setActivities(INITIAL_ORDER_ACTIVITIES);
    setReviews(INITIAL_REVIEWS);
    setPayments(INITIAL_PAYMENTS);
    setPayroll(INITIAL_STUDIO_PAYROLL);
    setTeam(INITIAL_TEAM_MEMBERS);
    setPackages(INITIAL_PACKAGES);
    setPackageDrafts(INITIAL_PACKAGE_DRAFTS);
    setEventTypes(INITIAL_EVENT_TYPES);
    setActivityTemplates(INITIAL_ACTIVITY_TEMPLATES);
    setCredits(INITIAL_CREDITS_STATE);
    setSubscription(INITIAL_SUBSCRIPTION);
    setActivityLogs(INITIAL_ACTIVITY_LOGS);
    setStudio(DEMO_STUDIOS.aura);
  };

  return (
    <DemoStoreContext.Provider
      value={{
        orders,
        events,
        editingTasks,
        activities,
        reviews,
        payments,
        payroll,
        team,
        packages,
        packageDrafts,
        eventTypes,
        activityTemplates,
        credits,
        subscription,
        activityLogs,
        studio,

        createWeddingOrder,
        createOccasionOrder,
        updateOrderStatus,
        rescheduleOrder,
        deleteOrder,
        togglePinOrder,

        assignCrew,
        removeCrew,
        updateMaterialReceipt,
        submitShootCounts,
        updateAssignmentStatus,
        updateAssignmentPay,
        updateAssignmentCount,
        addEvent,

        claimTask,
        releaseTask,
        updateTaskStatus,
        updateActivityStatus,
        addOrderActivity,
        deleteOrderActivity,
        addEditingTask,
        assignEditorToTask,
        deleteEditingTask,
        autoGenerateEditingPipeline,

        uploadReviewVersion,
        sendToClient,
        resolveComment,
        reopenReview,

        recordClientReceipt,
        recordStaffPayout,
        deletePaymentRecord,

        createTeamMember,
        toggleMemberActive,
        updateCapability,
        awardAchievement,
        revokeAchievement,

        resetClientPin,

        purchaseCredits,
        savePackageDraft,
        setStudioPro,
        resetAllDemoData,

        mascotEnabled,
        toggleMascotEnabled,
      }}
    >
      {children}
    </DemoStoreContext.Provider>
  );
}

export function useDemoStore() {
  const ctx = useContext(DemoStoreContext);
  if (!ctx) throw new Error('useDemoStore must be used within DemoStoreProvider');
  return ctx;
}
