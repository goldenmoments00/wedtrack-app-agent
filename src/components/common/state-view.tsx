import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Button } from './button';

interface StateViewProps {
  type: 'loading' | 'empty' | 'filtered-empty' | 'error' | 'permission-denied';
  title?: string;
  message?: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function StateView({
  type,
  title,
  message,
  actionTitle,
  onAction,
  style,
}: StateViewProps) {
  const { colors, typography, spacing } = useTheme();

  if (type === 'loading') {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.md }]}>
          {message || 'Loading...'}
        </Text>
      </View>
    );
  }

  const getDefaultCopy = () => {
    switch (type) {
      case 'empty':
        return {
          title: title || 'No Records Found',
          message: message || 'There are no items to display in this list.',
        };
      case 'filtered-empty':
        return {
          title: title || 'No Matching Results',
          message: message || 'Try adjusting your search criteria or clear active filters.',
          actionTitle: actionTitle || 'Reset Filters',
        };
      case 'error':
        return {
          title: title || 'Unable to Load Data',
          message: message || 'An error occurred while connecting to the studio server.',
          actionTitle: actionTitle || 'Retry',
        };
      case 'permission-denied':
        return {
          title: title || 'Access Restricted',
          message: message || 'Your current role or permissions do not allow viewing this section.',
        };
    }
  };

  const copy = getDefaultCopy();

  return (
    <View style={[styles.container, style]}>
      <Text style={[typography.title3, { color: colors.textPrimary, textAlign: 'center' }]}>
        {copy.title}
      </Text>
      <Text
        style={[
          typography.body,
          { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, maxWidth: 320 },
        ]}
      >
        {copy.message}
      </Text>

      {onAction && (actionTitle || copy.actionTitle) && (
        <Button
          title={actionTitle || copy.actionTitle || 'Continue'}
          onPress={onAction}
          variant="outline"
          size="sm"
          style={{ marginTop: spacing.lg }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
