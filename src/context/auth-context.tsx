import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserSession,
  AppEnvironmentMode,
  WorkspaceMode,
  StudioBranding,
  UserRole,
} from '@/types/auth';
import {
  RolePermissions,
  OWNER_ADMIN_PERMISSIONS,
  resolveEffectivePermissions,
} from '@/types/permissions';
import { DEMO_PERSONAS, DemoPersona } from '@/fixtures/personas';
import { DEMO_STUDIOS } from '@/fixtures/studios';
import { SecureStorage } from '@/services/secure-storage';
import { apiClient } from '@/services/api-client';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  mode: AppEnvironmentMode;
  session: UserSession | null;
  permissions: RolePermissions;
  currentPersona: DemoPersona | null;
  selectedStudio: StudioBranding | null;
  isExpired: boolean;
  isDeactivated: boolean;

  // Actions
  findStudio: (subdomainOrName: string) => Promise<StudioBranding | null>;
  selectStudio: (studio: StudioBranding) => void;
  signIn: (email: string, password?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  switchWorkspace: (workspace: WorkspaceMode) => void;
  switchDemoPersona: (personaId: string) => void;
  setMode: (mode: AppEnvironmentMode) => void;
  refreshSession: () => Promise<void>;
  updateProfile: (name: string, phone?: string) => Promise<void>;
  updateStudioUpi: (upiId: string, upiName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setModeState] = useState<AppEnvironmentMode>('demo'); // Default to demo for safety & immediate usability
  const [currentPersona, setCurrentPersona] = useState<DemoPersona>(DEMO_PERSONAS[0]); // Aarav Mehta (Owner)
  const [session, setSession] = useState<UserSession | null>(DEMO_PERSONAS[0].session);
  const [permissions, setPermissions] = useState<RolePermissions>(
    resolveEffectivePermissions(DEMO_PERSONAS[0].permissions)
  );
  const [selectedStudio, setSelectedStudio] = useState<StudioBranding | null>(DEMO_STUDIOS.aura);
  const [isExpired, setIsExpired] = useState(false);
  const [isDeactivated, setIsDeactivated] = useState(false);

  // Initialize from storage
  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const storedMode = (await SecureStorage.getItem('app_mode')) as AppEnvironmentMode | null;
        const storedSubdomain = await SecureStorage.getItem('studio_subdomain');

        if (storedSubdomain && DEMO_STUDIOS[storedSubdomain]) {
          setSelectedStudio(DEMO_STUDIOS[storedSubdomain]);
        }

        if (storedMode === 'live') {
          setModeState('live');
          const token = await SecureStorage.getItem('auth_token');
          if (!token) {
            setSession(null);
          }
        } else {
          setModeState('demo');
          const storedPersonaId = await SecureStorage.getItem('demo_persona_id');
          const persona = DEMO_PERSONAS.find(p => p.id === storedPersonaId) || DEMO_PERSONAS[0];
          setCurrentPersona(persona);
          setSession(persona.session);
          setPermissions(resolveEffectivePermissions(persona.permissions));
        }
      } catch (e) {
        console.warn('[AuthProvider] Init error:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadStoredAuth();
  }, []);

  const setMode = async (newMode: AppEnvironmentMode) => {
    setModeState(newMode);
    await SecureStorage.setItem('app_mode', newMode);
    if (newMode === 'demo') {
      setSession(currentPersona.session);
      setPermissions(resolveEffectivePermissions(currentPersona.permissions));
      setIsExpired(false);
      setIsDeactivated(false);
    } else {
      // In live mode, verify real token
      const token = await SecureStorage.getItem('auth_token');
      if (!token) {
        setSession(null);
      }
    }
  };

  const findStudio = async (query: string): Promise<StudioBranding | null> => {
    const clean = query.trim().toLowerCase();
    // In live mode: would call /api/tenant/search?query=...
    // In demo mode: resolve known demo studios
    const match = Object.values(DEMO_STUDIOS).find(
      s => s.subdomain.toLowerCase() === clean || s.name.toLowerCase().includes(clean)
    );
    if (match) {
      setSelectedStudio(match);
      await SecureStorage.setItem('studio_subdomain', match.subdomain);
      return match;
    }
    return null;
  };

  const selectStudio = async (studio: StudioBranding) => {
    setSelectedStudio(studio);
    await SecureStorage.setItem('studio_subdomain', studio.subdomain);
  };

  const switchDemoPersona = async (personaId: string) => {
    const found = DEMO_PERSONAS.find(p => p.id === personaId);
    if (!found) return;
    setCurrentPersona(found);
    setSession(found.session);
    setPermissions(resolveEffectivePermissions(found.permissions));
    setSelectedStudio(found.session.studio);
    setIsExpired(false);
    setIsDeactivated(!found.session.isActive);
    await SecureStorage.setItem('demo_persona_id', personaId);
    await SecureStorage.setItem('studio_subdomain', found.session.studio.subdomain);
  };

  // Workspace Switcher (AUTH-04)
  const switchWorkspace = (newWorkspace: WorkspaceMode) => {
    if (!session) return;
    if (!session.availableWorkspaces.includes(newWorkspace)) {
      console.warn(`Workspace ${newWorkspace} not available for user.`);
      return;
    }
    setSession({
      ...session,
      activeWorkspace: newWorkspace,
    });
  };

  const signIn = async (email: string, password?: string): Promise<boolean> => {
    if (mode === 'demo') {
      // Match persona by email or default to Aarav Mehta
      const persona = DEMO_PERSONAS.find(p => p.session.email.toLowerCase() === email.toLowerCase()) || DEMO_PERSONAS[0];
      await switchDemoPersona(persona.id);
      return true;
    }

    // Live mode: requires backend native auth route (Gap G1)
    try {
      setIsLoading(true);
      // Calls verified live endpoint if configured
      const response = await apiClient.post<{ token: string; user: any }>('/api/v1/auth/mobile/login', {
        email,
        password,
        subdomain: selectedStudio?.subdomain,
      });

      if (response && response.token) {
        await SecureStorage.setItem('auth_token', response.token);
        // Build session
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[signIn live error]', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await SecureStorage.removeItem('auth_token');
    if (mode === 'live') {
      setSession(null);
    } else {
      // In demo mode, keep session or route to sign-in screen
      setSession(null);
    }
  };

  const refreshSession = async () => {
    if (mode === 'demo') {
      setIsExpired(false);
      return;
    }
    // Live refresh
  };

  const updateProfile = async (name: string, phone?: string) => {
    if (session) {
      setSession({
        ...session,
        name,
        phone,
      });
    }
  };

  const updateStudioUpi = async (adminUpiId: string, adminUpiName: string) => {
    if (selectedStudio) {
      const updated = { ...selectedStudio, adminUpiId, adminUpiName };
      setSelectedStudio(updated);
      if (session) {
        setSession({ ...session, studio: updated });
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!session && !isExpired && !isDeactivated,
        isLoading,
        mode,
        session,
        permissions,
        currentPersona,
        selectedStudio,
        isExpired,
        isDeactivated,

        findStudio,
        selectStudio,
        signIn,
        signOut,
        switchWorkspace,
        switchDemoPersona,
        setMode,
        refreshSession,
        updateProfile,
        updateStudioUpi,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
