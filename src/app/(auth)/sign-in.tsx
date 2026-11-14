import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { ScreenWrapper } from '@/components/common/screen-wrapper';
import { Button } from '@/components/common/button';
import { DEMO_PERSONAS } from '@/fixtures/personas';
import { DEMO_STUDIOS } from '@/fixtures/studios';

export default function SignInScreen() {
  const {
    mode,
    setMode,
    signIn,
    findStudio,
    selectedStudio,
    selectStudio,
    switchDemoPersona,
    currentPersona,
  } = useAuth();
  const { colors, typography, spacing, radii } = useTheme();

  const [subdomainInput, setSubdomainInput] = useState(selectedStudio?.subdomain || 'aura');
  const [emailInput, setEmailInput] = useState(currentPersona?.session.email || 'aarav@aurastudios.in');
  const [passwordInput, setPasswordInput] = useState('demo1234');
  const [isSearchingStudio, setIsSearchingStudio] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLookupStudio = async () => {
    setIsSearchingStudio(true);
    setErrorMsg(null);
    try {
      const found = await findStudio(subdomainInput);
      if (!found) {
        setErrorMsg(`No studio found with identifier "${subdomainInput}". Try "aura" or "pixelcraft".`);
      }
    } finally {
      setIsSearchingStudio(false);
    }
  };

  const handleSignIn = async () => {
    if (!emailInput.trim()) {
      setErrorMsg('Please enter your staff email address');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const ok = await signIn(emailInput, passwordInput);
      if (ok) {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickPersona = async (personaId: string) => {
    await switchDemoPersona(personaId);
    router.replace('/(tabs)');
  };

  return (
    <ScreenWrapper>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header / Brand */}
        <View style={styles.header}>
          <View
            style={[
              styles.logoCircle,
              { backgroundColor: selectedStudio?.primaryColor || colors.primary },
            ]}
          >
            <Text style={[typography.title1, { color: '#FFFFFF', fontWeight: '800' }]}>W</Text>
          </View>
          <Text style={[typography.largeTitle, { color: colors.textPrimary, marginTop: spacing.md }]}>
            WedTrack Staff
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: 4, textAlign: 'center' }]}>
            Professional mobile workspace for studio crew, editors and managers
          </Text>
        </View>

        {/* Mode Toggle Banner */}
        <View
          style={[
            styles.modeCard,
            {
              backgroundColor: colors.surfaceSubtle,
              borderColor: colors.border,
              borderRadius: radii.md,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <View style={styles.modeRow}>
            <View>
              <Text style={[typography.headline, { color: colors.textPrimary }]}>
                Environment: {mode === 'demo' ? 'Stateful Demo' : 'Live Production'}
              </Text>
              <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: 2 }]}>
                {mode === 'demo'
                  ? 'Works immediately with synthetic wedding data & all 9 staff personas'
                  : 'Connects strictly to verified backend endpoints (Gap G1)'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setMode(mode === 'demo' ? 'live' : 'demo')}
              style={[
                styles.modeToggleBtn,
                {
                  backgroundColor: mode === 'demo' ? colors.goldSubtle : colors.primary,
                  borderColor: mode === 'demo' ? colors.gold : colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption2,
                  { color: mode === 'demo' ? colors.gold : colors.primaryText, fontWeight: '700' },
                ]}
              >
                {mode === 'demo' ? 'GO LIVE' : 'USE DEMO'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Studio Discovery (AUTH-01) */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg },
          ]}
        >
          <Text style={[typography.title3, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
            1. Select Studio
          </Text>
          <Text style={[typography.footnote, { color: colors.textSecondary, marginBottom: spacing.md }]}>
            Enter studio subdomain or slug to verify tenant branding
          </Text>

          <View style={styles.inputWithAction}>
            <TextInput
              value={subdomainInput}
              onChangeText={setSubdomainInput}
              placeholder="e.g. aura or pixelcraft"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                  borderRadius: radii.md,
                },
              ]}
            />
            <Button
              title="Lookup"
              onPress={handleLookupStudio}
              isLoading={isSearchingStudio}
              size="sm"
              variant="secondary"
              style={{ marginLeft: spacing.sm }}
            />
          </View>

          {selectedStudio && (
            <View
              style={[
                styles.studioPreview,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.borderSubtle,
                  borderRadius: radii.sm,
                },
              ]}
            >
              <View
                style={[styles.studioDot, { backgroundColor: selectedStudio.primaryColor }]}
              />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={[typography.headline, { color: colors.textPrimary }]}>
                  {selectedStudio.name}
                </Text>
                <Text style={[typography.caption1, { color: colors.textSecondary }]}>
                  {selectedStudio.subdomain}.wedtrack.com · {selectedStudio.proEnabled ? 'Pro Active' : 'Standard'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Staff Sign In (AUTH-02) */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radii.lg,
              marginTop: spacing.md,
            },
          ]}
        >
          <Text style={[typography.title3, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
            2. Staff Sign In
          </Text>

          {errorMsg && (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerSubtle, borderColor: colors.danger }]}>
              <Text style={[typography.footnote, { color: colors.dangerText }]}>{errorMsg}</Text>
            </View>
          )}

          <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.sm }]}>
            Staff Email
          </Text>
          <TextInput
            value={emailInput}
            onChangeText={setEmailInput}
            placeholder="name@studio.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[
              styles.textInput,
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: colors.border,
                color: colors.textPrimary,
                borderRadius: radii.md,
                marginTop: 4,
              },
            ]}
          />

          <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.md }]}>
            Password
          </Text>
          <TextInput
            value={passwordInput}
            onChangeText={setPasswordInput}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            style={[
              styles.textInput,
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: colors.border,
                color: colors.textPrimary,
                borderRadius: radii.md,
                marginTop: 4,
              },
            ]}
          />

          <View style={styles.forgotRow}>
            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={[typography.footnote, { color: colors.primary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Sign In to Studio Workspace"
            onPress={handleSignIn}
            isLoading={isSubmitting}
            variant="primary"
            size="lg"
            style={{ marginTop: spacing.lg }}
          />
        </View>

        {/* Demo Persona Quick Select */}
        {mode === 'demo' && (
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radii.lg,
                marginTop: spacing.md,
              },
            ]}
          >
            <Text style={[typography.title3, { color: colors.textPrimary }]}>
              Quick Demo Persona Launch
            </Text>
            <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2, marginBottom: spacing.md }]}>
              Instantly enter the app as any documented role:
            </Text>

            {DEMO_PERSONAS.map(p => (
              <TouchableOpacity
                key={p.id}
                onPress={() => handleQuickPersona(p.id)}
                style={[
                  styles.quickPersonaBtn,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.border,
                    borderRadius: radii.md,
                    marginBottom: spacing.xs,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[typography.headline, { color: colors.textPrimary }]}>
                    {p.label}
                  </Text>
                  <Text style={[typography.caption1, { color: colors.textSecondary }]} numberOfLines={1}>
                    {p.description}
                  </Text>
                </View>
                <Text style={[typography.title3, { color: colors.textMuted, marginLeft: 8 }]}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeCard: {
    padding: 12,
    borderWidth: 1,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  sectionCard: {
    padding: 16,
    borderWidth: 1,
  },
  inputWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 15,
  },
  studioPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
  },
  studioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  errorBox: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 8,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  quickPersonaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
  },
});
