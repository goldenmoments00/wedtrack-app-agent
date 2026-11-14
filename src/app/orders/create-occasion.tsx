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
import * as Crypto from 'expo-crypto';
import { useAuth } from '@/context/auth-context';
import { useDemoStore } from '@/context/demo-store-context';
import { useTheme } from '@/hooks/use-theme';
import { ScreenWrapper } from '@/components/common/screen-wrapper';
import { Button } from '@/components/common/button';

export default function CreateOccasionScreen() {
  const { session } = useAuth();
  const { createOccasionOrder, packages, eventTypes } = useDemoStore();
  const { colors, typography, spacing, radii } = useTheme();

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [occasionTitle, setOccasionTitle] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDate, setEventDate] = useState('2026-12-15');
  const [bookingConsent, setBookingConsent] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!clientName.trim() || !occasionTitle.trim() || !clientPhone.trim()) {
      Alert.alert('Required Fields', 'Please enter Client Name, Occasion Title and Contact Phone.');
      return;
    }

    setIsSubmitting(true);
    try {
      const idempotencyKey = Crypto.randomUUID();
      const newOrder = createOccasionOrder({
        clientName,
        clientPhone,
        clientEmail,
        occasionTitle,
        eventDate: `${eventDate}T19:00:00Z`,
        eventLocation: eventLocation || 'Main Banquet Hall',
        eventTypeId: eventTypes[eventTypes.length - 1]?.id || 'et-occasion-07',
        bookingConsent,
        notes,
        idempotencyKey,
      });

      Alert.alert(
        'Occasion Booking Created',
        `Booking ${newOrder.tenantOrderNumber} has been added.`,
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
          New Occasion Booking
        </Text>
        <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2, marginBottom: spacing.md }]}>
          Create anniversary, birthday, gala, or commercial event bookings
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md }]}>
          <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
            Occasion & Client Details
          </Text>

          <Text style={[typography.subhead, { color: colors.textSecondary }]}>Occasion / Event Title *</Text>
          <TextInput
            value={occasionTitle}
            onChangeText={setOccasionTitle}
            placeholder="e.g. 50th Golden Jubilee Gala"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.sm }]}
          />

          <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.sm }]}>Client / Host Name *</Text>
          <TextInput
            value={clientName}
            onChangeText={setClientName}
            placeholder="e.g. Rajesh Khurana"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.sm }]}
          />

          <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.sm }]}>Contact Phone *</Text>
          <TextInput
            value={clientPhone}
            onChangeText={setClientPhone}
            placeholder="+91 98222 55667"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            style={[styles.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.sm }]}
          />

          <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.sm }]}>Event Date (YYYY-MM-DD)</Text>
          <TextInput
            value={eventDate}
            onChangeText={setEventDate}
            placeholder="2026-12-15"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.sm }]}
          />

          <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.sm }]}>Venue Location</Text>
          <TextInput
            value={eventLocation}
            onChangeText={setEventLocation}
            placeholder="e.g. ITC Maratha, Andheri, Mumbai"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.sm }]}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.md }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={[typography.headline, { color: colors.textPrimary }]}>Client Booking Consent</Text>
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>
                Client has authorized media coverage and accepted studio policy
              </Text>
            </View>
            <Switch value={bookingConsent} onValueChange={setBookingConsent} />
          </View>

          <Button
            title="Create Occasion Booking"
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
