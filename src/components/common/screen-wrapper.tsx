import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  disableTopInset?: boolean;
  disableBottomInset?: boolean;
  withKeyboardAvoidance?: boolean;
  withTabBar?: boolean;
}

export function ScreenWrapper({
  children,
  style,
  disableTopInset = false,
  disableBottomInset = false,
  withKeyboardAvoidance = true,
  withTabBar = false,
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: disableTopInset ? 0 : insets.top,
    paddingBottom: disableBottomInset
      ? (withTabBar ? 84 : 0)
      : insets.bottom + (withTabBar ? 84 : 0),
  };

  const content = (
    <View style={[styles.inner, style]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </View>
  );

  if (withKeyboardAvoidance && Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView
        style={containerStyle}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return <View style={containerStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
  },
});
