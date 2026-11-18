import React from 'react';
import {
  View,
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/use-theme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const { colors, typography, radii, spacing } = useTheme();

  const handlePress = () => {
    if (disabled || isLoading) return;
    try {
      if (variant === 'destructive') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {
      // Haptics not available on web/sim
    }
    onPress();
  };

  const getVariantStyles = (pressed: boolean) => {
    switch (variant) {
      case 'primary':
        return {
          bg: pressed ? colors.textSecondary : colors.primary,
          border: 'transparent',
          text: colors.primaryText,
        };
      case 'secondary':
        return {
          bg: pressed ? colors.border : colors.surfaceSubtle,
          border: colors.border,
          text: colors.textPrimary,
        };
      case 'outline':
        return {
          bg: pressed ? colors.surfaceSubtle : 'transparent',
          border: colors.border,
          text: colors.textPrimary,
        };
      case 'destructive':
        return {
          bg: pressed ? '#DC2626' : colors.danger,
          border: 'transparent',
          text: '#FFFFFF',
        };
      case 'ghost':
        return {
          bg: pressed ? colors.surfaceSubtle : 'transparent',
          border: 'transparent',
          text: colors.primary,
        };
    }
  };

  const minHeight = size === 'sm' ? 36 : size === 'lg' ? 52 : 44; // Floor touch target minimum 44pt

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || isLoading}
      style={({ pressed }) => {
        const v = getVariantStyles(pressed);
        return [
          styles.base,
          {
            backgroundColor: v.bg,
            borderColor: v.border,
            borderRadius: radii.md,
            minHeight,
            paddingHorizontal: size === 'sm' ? spacing.md : spacing.lg,
            opacity: disabled ? 0.5 : 1,
          },
          style,
        ];
      }}
    >
      {({ pressed }) => {
        const v = getVariantStyles(pressed);
        if (isLoading) {
          return <ActivityIndicator color={v.text} size="small" />;
        }
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            {icon ? icon : null}
            <Text
              style={[
                size === 'sm' ? typography.footnote : typography.headline,
                { color: v.text, marginLeft: icon ? spacing.xs : 0 },
                textStyle,
              ]}
            >
              {title}
            </Text>
          </View>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
