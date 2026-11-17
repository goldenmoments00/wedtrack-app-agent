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
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceSubtle: '#F3F4F6',
  surfaceRaised: '#FFFFFF',
  border: '#E5E7EB',
  borderSubtle: '#F3F4F6',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  primary: '#FF5500',
  primarySubtle: '#FFF7ED',
  primaryText: '#FFFFFF',
  success: '#10B981',
  successSubtle: '#ECFDF5',
  successText: '#047857',
  warning: '#F59E0B',
  warningSubtle: '#FFFBEB',
  warningText: '#B45309',
  danger: '#EF4444',
  dangerSubtle: '#FEF2F2',
  dangerText: '#B91C1C',
  info: '#3B82F6',
  infoSubtle: '#EFF6FF',
  infoText: '#1D4ED8',
  gold: '#D97706',
  goldSubtle: '#FEF3C7',
  accent: '#FF5500',
  card: '#FFFFFF',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E5E7EB',
};

export const darkColors: ColorPalette = {
  ...lightColors,
};
