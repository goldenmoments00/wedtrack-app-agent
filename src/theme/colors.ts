export interface ColorPalette {
  background: string;
  surface: string;
  surfaceSubtle: string;
  surfaceRaised: string;
  border: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primarySubtle: string;
  primaryText: string;
  success: string;
  successSubtle: string;
  successText: string;
  warning: string;
  warningSubtle: string;
  warningText: string;
  danger: string;
  dangerSubtle: string;
  dangerText: string;
  info: string;
  infoSubtle: string;
  infoText: string;
  gold: string;
  goldSubtle: string;
  accent: string;
  card: string;
  tabBar: string;
  tabBarBorder: string;
}

export const lightColors: ColorPalette = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSubtle: '#F1F5F9',
  surfaceRaised: '#FFFFFF',
  border: '#E2E8F0',
  borderSubtle: '#F1F5F9',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  primary: '#0F172A',
  primarySubtle: '#E2E8F0',
  primaryText: '#FFFFFF',
  success: '#10B981',
  successSubtle: '#ECFDF5',
  successText: '#065F46',
  warning: '#F59E0B',
  warningSubtle: '#FFFBEB',
  warningText: '#92400E',
  danger: '#EF4444',
  dangerSubtle: '#FEF2F2',
  dangerText: '#991B1B',
  info: '#3B82F6',
  infoSubtle: '#EFF6FF',
  infoText: '#1E40AF',
  gold: '#D97706',
  goldSubtle: '#FEF3C7',
  accent: '#6366F1',
  card: '#FFFFFF',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
};

export const darkColors: ColorPalette = {
  background: '#0B1120',
  surface: '#151F32',
  surfaceSubtle: '#1E293B',
  surfaceRaised: '#24334C',
  border: '#28364F',
  borderSubtle: '#1E293B',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  primary: '#F8FAFC',
  primarySubtle: '#1E293B',
  primaryText: '#0F172A',
  success: '#10B981',
  successSubtle: 'rgba(16, 185, 129, 0.15)',
  successText: '#34D399',
  warning: '#F59E0B',
  warningSubtle: 'rgba(245, 158, 11, 0.15)',
  warningText: '#FBBF24',
  danger: '#EF4444',
  dangerSubtle: 'rgba(239, 68, 68, 0.15)',
  dangerText: '#F87171',
  info: '#38BDF8',
  infoSubtle: 'rgba(56, 189, 248, 0.15)',
  infoText: '#7DD3FC',
  gold: '#F59E0B',
  goldSubtle: 'rgba(245, 158, 11, 0.15)',
  accent: '#818CF8',
  card: '#151F32',
  tabBar: '#0F172A',
  tabBarBorder: '#1E293B',
};
