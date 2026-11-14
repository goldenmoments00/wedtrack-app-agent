import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { ScreenWrapper } from '@/components/common/screen-wrapper';
import { Button } from '@/components/common/button';

export default function ProfileScreen() {
  const { session, updateProfile, updateStudioUpi } = useAuth();
  const { colors, typography, spacing, radii } = useTheme();

  const [name, setName] = useState(session?.name || '');
  const [phone, setPhone] = useState(session?.phone || '');
  const [upiId, setUpiId] = useState(session?.studio.adminUpiId || '');
  const [upiName, setUpiName] = useState(session?.studio.adminUpiName || '');

  const isOwnerOrAdmin = session?.roles.includes('OWNER') || session?.roles.includes('ADMIN');

  const handleSaveProfile = async () => {
    await updateProfile(name, phone);
    if (isOwnerOrAdmin && upiId) {
      await updateStudioUpi(upiId, upiName);
    }
    Alert.alert('Profile Updated', 'Your profile changes have been saved.');
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        <Text style={[typography.title1, { color: colors.textPrimary }]}>My Profile</Text>
        <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2, marginBottom: spacing.md }]}>
          Staff identity, contact details and studio payment settings
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md }]}>
          <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
            Staff Account (ACC-01)
          </Text>

          <Text style={[typography.subhead, { color: colors.textSecondary }]}>Full Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={[styles.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.sm }]}
          />

          <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.sm }]}>Email (Managed by Studio)</Text>
          <TextInput
            value={session?.email}
            editable={false}
            style={[styles.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textMuted, borderRadius: radii.sm }]}
          />

          <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.sm }]}>Contact Phone</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+91 98200 12345"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            style={[styles.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.sm }]}
          />

          <View style={[styles.roleRow, { borderTopColor: colors.borderSubtle, marginTop: spacing.md, paddingTop: spacing.sm }]}>
            <Text style={[typography.caption1, { color: colors.textSecondary }]}>Studio Role:</Text>
            <Text style={[typography.headline, { color: colors.primary }]}>{session?.primaryRole}</Text>
          </View>
        </View>

        {/* Studio Payment Identity UPI (ACC-02) - Admin tier only */}
        {isOwnerOrAdmin && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.md }]}>
            <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
              Studio Payment Identity (ACC-02)
            </Text>
            <Text style={[typography.caption1, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
              Admin-tier UPI configuration used for receiving client payments
            </Text>

            <Text style={[typography.subhead, { color: colors.textSecondary }]}>Admin UPI ID</Text>
            <TextInput
              value={upiId}
              onChangeText={setUpiId}
              placeholder="e.g. aurastudios@oksbi"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.sm }]}
            />

            <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.sm }]}>Registered Payee Name</Text>
            <TextInput
              value={upiName}
              onChangeText={setUpiName}
              placeholder="e.g. Aura Wedding Studios LLP"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.sm }]}
            />
          </View>
        )}

        <Button
          title="Save Profile Changes"
          onPress={handleSaveProfile}
          size="lg"
          variant="primary"
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
  card: {
    padding: 16,
    borderWidth: 1,
  },
  input: {
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 15,
    marginTop: 4,
  },
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
  },
});
