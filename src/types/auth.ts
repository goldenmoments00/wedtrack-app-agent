export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'EDITOR' | 'AGENT';

export type Profession = 'PHOTOGRAPHER' | 'VIDEOGRAPHER' | 'BOTH';

export type EditingCategory = 'PHOTO_EDIT' | 'VIDEO_EDIT' | 'REEL' | 'HIGHLIGHT' | 'ALBUM';

export type WorkspaceMode = 'OPERATIONS' | 'EDITING' | 'SHOOTS';

export type AppEnvironmentMode = 'live' | 'demo';

export interface StudioBranding {
  id: string;
  name: string;
  subdomain: string;
  logoUrl?: string;
  primaryColor: string;
  currency: string;
  currencySymbol: string;
  proEnabled: boolean;
  termsText: string;
  customDomain?: string;
  domainStatus?: 'pending' | 'verified' | 'failed';
  adminUpiId?: string;
  adminUpiName?: string;
}

export interface UserSession {
  id: string;
  canonicalId: string;
  legacyEditorId?: string;
  legacyAgentId?: string;
  email: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  roles: UserRole[];
  primaryRole: UserRole;
  activeWorkspace: WorkspaceMode;
  availableWorkspaces: WorkspaceMode[];
  studio: StudioBranding;
  isOwner: boolean;
  agentProfession?: Profession;
  editorCategories?: EditingCategory[];
  hasDualCapability: boolean;
  capabilityStatus: {
    shootingActive: boolean;
    editingActive: boolean;
  };
  isActive: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  mode: AppEnvironmentMode;
  session: UserSession | null;
  error: string | null;
  isExpired: boolean;
  isDeactivated: boolean;
}
