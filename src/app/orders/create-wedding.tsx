import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import { useDemoStore } from '@/context/demo-store-context';
import { useTheme } from '@/hooks/use-theme';
import { ScreenWrapper } from '@/components/common/screen-wrapper';
import { Button } from '@/components/common/button';

export default function CreateWeddingScreen() {
  const { session } = useAuth();
  const { createWeddingOrder, packages, eventTypes } = useDemoStore();
  const { colors, typography, spacing, radii } = useTheme();

  const [brideName, setBrideName] = useState('');
  const [groomName, setGroomName] = useState('');
  const [primaryContactName, setPrimaryContactName] = useState('');
  const [primaryContactPhone, setPrimaryContactPhone] = useState('');
  const [primaryContactEmail, setPrimaryContactEmail] = useState('');
  const [venueLocation, setVenueLocation] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [eventDate, setEventDate] = useState('2026-12-24');
  const [selectedPackageId, setSelectedPackageId] = useState(packages[0]?.id || '');
  const [bookingConsent, setBookingConsent] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!brideName.trim() || !groomName.trim() || !primaryContactPhone.trim()) {
      Alert.alert('Required Fields', 'Please enter Bride & Groom names and a primary contact phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const idempotencyKey = 'ord-wed-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
      const newOrder = createWeddingOrder({
        brideName,
        groomName,
        primaryContactName: primaryContactName || `${brideName} / ${groomName}`,
        primaryContactPhone,
        primaryContactEmail,
        firstEventDate: `${eventDate}T18:00:00Z`,
        firstEventLocation: venueLocation || 'Grand Hotel Ballroom',
        firstEventTypeId: eventTypes[0]?.id || 'et-wedding-03',
        clientAddress,
        packageId: selectedPackageId,
        bookingConsent,
        notes,
        idempotencyKey,
      });

      Alert.alert(
        'Booking Created',
        `Wedding order ${newOrder.tenantOrderNumber} has been added.`,
        [{ text: 'View Order', onPress: () => router.replace(`/orders/${newOrder.id}` as any) }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]} keyboardShouldPersistTaps="handled">
        <Text style={[typography.title1, { color: colors.textPrimary }]}>
          New Wedding Booking
        </Text>
        <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2, marginBottom: spacing.md }]}>
          Capture bride & groom names, schedule and contracted deliverables
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md }]}>
          <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
            Couple Information
          </Text>

          <Text style={[typography.subhead, { color: colors.textSecondary }]}>Bride Name *</Text>
          <TextInput
            value={brideName}
            onChangeText={setBrideName}
            placeholder="e.g. Meera Singhania"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.sm }]}
          />

          <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.sm }]}>Groom Name *</Text>
          <TextInput
            value={groomName}
            onChangeText={setGroomName}
            placeholder="e.g. Advait Kapoor"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.sm }]}
          />

          <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.sm }]}>Primary Contact Phone *</Text>
          <TextInput
            value={primaryContactPhone}
            onChangeText={setPrimaryContactPhone}
            placeholder="+91 98200 12345"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            style={[styles.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.sm }]}
          />

          <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.sm }]}>Primary Contact Email</Text>
          <TextInput
            value={primaryContactEmail}
            onChangeText={setPrimaryContactEmail}
            placeholder="couple@example.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.sm }]}
          />
        </View>

        {/* Schedule & Venue */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.md }]}>
          <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
            Schedule & Venue
          </Text>

          <Text style={[typography.subhead, { color: colors.textSecondary }]}>First Event Date (YYYY-MM-DD)</Text>
          <TextInput
            value={eventDate}
            onChangeText={setEventDate}
            placeholder="2026-12-24"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.sm }]}
          />

          <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.sm }]}>Venue Name & City</Text>
          <TextInput
            value={venueLocation}
            onChangeText={setVenueLocation}
            placeholder="e.g. Taj West End, Bangalore"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.sm }]}
          />
        </View>

        {/* Booking Consent & Submit */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.md }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={[typography.headline, { color: colors.textPrimary }]}>Client Booking Consent</Text>
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>
                Client has agreed to studio terms and cancellation policy
              </Text>
            </View>
            <Switch value={bookingConsent} onValueChange={setBookingConsent} />
          </View>

          <Button
            title="Create Wedding Booking"
            onPress={handleSubmit}
            isLoading={isSubmitting}
            variant="primary"
            size="lg"
            style={{ marginTop: spacing.lg }}
          />
        </View>
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
});
