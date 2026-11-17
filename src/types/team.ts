import { UserRole, Profession, EditingCategory } from './auth';
import { RolePermissions } from './permissions';
import { AgentAchievement } from './achievements';

export interface AgentRate {
  id: string;
  eventTypeId: string;
  eventTypeName: string;
  rate: number;
  currency: string;
}

export interface TeamMember {
  id: string;
  canonicalId: string;
  legacyAgentId?: string;
  legacyEditorId?: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  roles: UserRole[];
  isActive: boolean;
  hasDualCapability: boolean;
  capabilities: {
    shooting: boolean;
    editing: boolean;
  };
  profession?: Profession; // If has shooting capability
  editingCategories?: EditingCategory[]; // If has editing capability
  rates?: AgentRate[];
  achievements?: AgentAchievement[];
  customPermissions?: RolePermissions; // For managers or custom editors
  openAssignmentsCount: number;
  openTasksCount: number;
  createdAt: string;
}

export interface CreateTeamMemberInput {
  name: string;
  email: string;
  phone?: string;
  initialPassword?: string;
  primaryRole: 'MANAGER' | 'EDITOR' | 'AGENT';
  profession?: Profession;
  editingCategories?: EditingCategory[];
  rates?: { eventTypeId: string; rate: number }[];
}

export interface UpdateCapabilityInput {
  memberId: string;
  action: 'ENABLE_SHOOTING' | 'DISABLE_SHOOTING' | 'ENABLE_EDITING' | 'DISABLE_EDITING';
  profession?: Profession;
  editingCategories?: EditingCategory[];
}
