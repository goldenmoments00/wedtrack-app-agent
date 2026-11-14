import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/common/screen-wrapper';
import { Button } from '@/components/common/button';
import { useTheme } from '@/hooks/use-theme';

export default function ForgotPasswordScreen() {
  const { colors, typography, spacing, radii } = useTheme();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = () => {
    if (!email.trim()) return;
    setIsSubmitting(true);
    // Generic response: never reveal whether email exists
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
    }, 600);
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <Text style={[typography.largeTitle, { color: colors.textPrimary }]}>
          Recover Access
        </Text>
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
          Enter your registered staff email. If an active account matches, we will send a password reset link.
        </Text>

        {isSent ? (
          <View
            style={[
              styles.successCard,
              {
                backgroundColor: colors.successSubtle,
                borderColor: colors.success,
                borderRadius: radii.md,
                marginTop: spacing.xl,
              },
            ]}
          >
            <Text style={[typography.headline, { color: colors.successText }]}>
              Check Your Inbox
            </Text>
            <Text style={[typography.body, { color: colors.textPrimary, marginTop: spacing.xs }]}>
              If an account exists for {email}, a reset link has been dispatched. For security reasons, this link expires in 60 minutes.
            </Text>
            <Button
              title="Return to Sign In"
              onPress={() => router.replace('/(auth)/sign-in')}
              variant="outline"
              size="md"
              style={{ marginTop: spacing.lg }}
            />
          </View>
        ) : (
          <View style={{ marginTop: spacing.xl }}>
            <Text style={[typography.subhead, { color: colors.textSecondary }]}>Staff Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="name@studio.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                  borderRadius: radii.md,
                  marginTop: 6,
                },
              ]}
            />
            <Button
              title="Send Reset Link"
              onPress={handleSubmit}
              isLoading={isSubmitting}
              variant="primary"
              size="lg"
              style={{ marginTop: spacing.xl }}
            />
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  input: {
    height: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    fontSize: 16,
  },
  successCard: {
    padding: 16,
    borderWidth: 1,
  },
});
