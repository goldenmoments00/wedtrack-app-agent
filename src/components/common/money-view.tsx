import React from 'react';
import { Text, TextStyle, StyleProp, StyleSheet } from 'react-native';
import { PermissionLevel } from '@/types/permissions';
import { useTheme } from '@/hooks/use-theme';

interface MoneyViewProps {
  amount?: number | null;
  permission?: PermissionLevel;
  currencySymbol?: string;
  style?: StyleProp<TextStyle>;
  placeholder?: string;
  isSelfPayException?: boolean; // When worker views their own shoot or editing pay
}

export function formatCurrency(amount: number, symbol: string = '₹'): string {
  // Indian number formatting: ₹2,50,000
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-IN');
  return `${amount < 0 ? '-' : ''}${symbol}${formatted}`;
}

export function MoneyView({
  amount,
  permission = 'view',
  currencySymbol = '₹',
  style,
  placeholder = '—',
  isSelfPayException = false,
}: MoneyViewProps) {
  const { colors, typography } = useTheme();

  // If permission is 'none' and no self exception, hide or show omitted placeholder
  if (permission === 'none' && !isSelfPayException) {
    return (
      <Text style={[typography.callout, { color: colors.textMuted, fontStyle: 'italic' }, style]}>
        Hidden
      </Text>
    );
  }

  // Critical rule: Missing amount is not zero!
  if (amount === undefined || amount === null) {
    return (
      <Text style={[typography.callout, { color: colors.textMuted }, style]}>
        {placeholder}
      </Text>
    );
  }

  return (
    <Text style={[typography.headline, { color: colors.textPrimary }, style]}>
      {formatCurrency(amount, currencySymbol)}
    </Text>
  );
}
