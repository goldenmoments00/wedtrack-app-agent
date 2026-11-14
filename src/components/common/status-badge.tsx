import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

interface StatusBadgeProps {
  label: string;
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'gold';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function StatusBadge({ label, variant = 'neutral', size = 'md', style }: StatusBadgeProps) {
  const { colors, typography, radii } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          bg: colors.successSubtle,
          text: colors.successText,
          border: colors.success,
        };
      case 'warning':
        return {
          bg: colors.warningSubtle,
          text: colors.warningText,
          border: colors.warning,
        };
      case 'danger':
        return {
          bg: colors.dangerSubtle,
          text: colors.dangerText,
          border: colors.danger,
        };
      case 'info':
        return {
          bg: colors.infoSubtle,
          text: colors.infoText,
          border: colors.info,
        };
      case 'gold':
        return {
          bg: colors.goldSubtle,
          text: colors.gold,
          border: colors.gold,
        };
      default:
        return {
          bg: colors.surfaceSubtle,
          text: colors.textSecondary,
          border: colors.border,
        };
    }
  };

  const v = getVariantStyles();
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          borderRadius: radii.sm,
          paddingHorizontal: isSm ? 6 : 8,
          paddingVertical: isSm ? 2 : 4,
        },
        style,
      ]}
    >
      <Text
        style={[
          isSm ? typography.caption2 : typography.caption1,
          { color: v.text, fontWeight: '600' },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export function mapOrderStatusToVariant(status: string): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'CONFIRMED':
    case 'COMPLETED':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'IN_PROGRESS':
    case 'ASSIGNED':
      return 'info';
    case 'CANCELLED':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function mapReviewStatusToVariant(status: string): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'WAITING_FOR_CLIENT':
      return 'warning';
    case 'CHANGES_REQUESTED':
      return 'danger';
    case 'NOT_UPLOADED':
      return 'neutral';
    default:
      return 'info';
  }
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
