import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { DEMO_PERSONAS } from '@/fixtures/personas';
import { DEMO_STUDIOS } from '@/fixtures/studios';

// WedTrack App Icon Logo
const WT_LOGO = require('../../../assets/images/wt-app-icon.png');

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
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
  const { colors, typography } = useTheme();

  const [emailInput, setEmailInput] = useState(currentPersona?.session.email || 'aarav@aurastudios.in');
  const [passwordInput, setPasswordInput] = useState('demo1234');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Studio Selector State
  const [isStudioModalOpen, setIsStudioModalOpen] = useState(false);
  const [customSubdomain, setCustomSubdomain] = useState('');
  const [isSearchingStudio, setIsSearchingStudio] = useState(false);

  // Staff Personas Drawer State
  const [isPersonaDrawerExpanded, setIsPersonaDrawerExpanded] = useState(false);

  const handleSignIn = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch {}

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
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}
    await switchDemoPersona(personaId);
    router.replace('/(tabs)');
  };

  const handleLookupCustomStudio = async () => {
    if (!customSubdomain.trim()) return;
    setIsSearchingStudio(true);
    setErrorMsg(null);
    try {
      const found = await findStudio(customSubdomain.trim());
      if (found) {
        setIsStudioModalOpen(false);
        setCustomSubdomain('');
      } else {
        setErrorMsg(`Studio "${customSubdomain}" not found. Try "goldenmoment" or "aura".`);
      }
    } finally {
      setIsSearchingStudio(false);
    }
  };

  const studioList = Object.values(DEMO_STUDIOS);

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top, 24) + 16,
              paddingBottom: Math.max(insets.bottom, 20) + 30,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* BACKGROUND LAYER: WedTrack Logo (Half-Frosted Effect) */}
          <View style={styles.bgLogoContainer} pointerEvents="none">
            {/* Ambient Warm Halo Glow */}
            <View style={styles.bgLogoHalo} />
            <Image
              source={WT_LOGO}
              style={styles.bgLogoImage}
              resizeMode="contain"
            />
          </View>

          {/* MAIN FROSTED GLASS LOGIN CARD (Matching Reference Design) */}
          <View style={styles.glassCardWrapper}>
            <BlurView intensity={Platform.OS === 'ios' ? 45 : 30} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.glassCardInner}>
              {/* Card Header: Brand Name (Left) & Mode Switch (Right) */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.brandTitleGroup}>
                  <Text style={styles.brandTitleText}>WedTrack Studio</Text>
                  <View style={styles.brandDot} />
                </View>

                {/* Mode Pill Toggle (Demo / Live) */}
                <TouchableOpacity
                  style={[
                    styles.modePill,
                    mode === 'demo' ? styles.modePillDemo : styles.modePillLive,
                  ]}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync().catch(() => {});
                    } catch {}
                    setMode(mode === 'demo' ? 'live' : 'demo');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modePillText, mode === 'live' && styles.modePillTextLive]}>
                    {mode === 'demo' ? 'Demo Mode' : 'Live Sync'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Title Row: "Log in" + Studio Selector Pill (Matching reference Facebook pill) */}
              <View style={styles.titleRow}>
                <Text style={styles.loginTitle}>Log in</Text>

                <TouchableOpacity
                  style={styles.studioPillBtn}
                  onPress={() => setIsStudioModalOpen(true)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.studioPillDot,
                      { backgroundColor: selectedStudio?.primaryColor || '#FF5500' },
                    ]}
                  />
                  <Text style={styles.studioPillText} numberOfLines={1}>
                    {selectedStudio?.name || 'Golden Moment'}
                  </Text>
                  <Ionicons name="chevron-down" size={11} color="#6B7280" style={{ marginLeft: 3 }} />
                </TouchableOpacity>
              </View>

              {/* Error Message if present */}
              {errorMsg && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={14} color="#EF4444" style={{ marginRight: 6 }} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {/* INPUT 1: E-Mail Address Capsule */}
              <View style={styles.inputCapsule}>
                <View style={styles.inputBadgeCircle}>
                  <Text style={styles.atBadgeText}>@</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  value={emailInput}
                  onChangeText={setEmailInput}
                  placeholder="e-mail address"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
              </View>

              {/* INPUT 2: Password Capsule with "I forgot" button inside */}
              <View style={styles.inputCapsule}>
                <View style={styles.inputBadgeCircle}>
                  <Ionicons name="key-outline" size={16} color="#1F2937" />
                </View>
                <TextInput
                  style={styles.textInput}
                  value={passwordInput}
                  onChangeText={setPasswordInput}
                  placeholder="password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.forgotPillBtn}
                  onPress={() => router.push('/(auth)/forgot-password')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotPillText}>I forgot</Text>
                </TouchableOpacity>
              </View>

              {/* Bottom Card Area: Microcopy on Left + Organic Black Pill Submit on Right */}
              <View style={styles.cardBottomRow}>
                <View style={styles.disclaimerCol}>
                  <Text style={styles.disclaimerText}>
                    For use by studio staff & crew only.{'\n'}Keep credentials secure. Contact studio admin for access.
                  </Text>
                  <Text style={styles.disclaimerSubtext}>
                    Please sign in responsibly!
                  </Text>
                </View>

                {/* Sleek Black Organic Pill Button with arrow */}
                <TouchableOpacity
                  style={styles.organicSubmitBtn}
                  onPress={handleSignIn}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <View style={styles.submitBtnInner}>
                      <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* BOTTOM DARK CARD: "New in / Staff Personas" (Matching Reference Bottom Card) */}
          <View style={styles.darkCard}>
            <TouchableOpacity
              style={styles.darkCardHeader}
              onPress={() => {
                try {
                  Haptics.selectionAsync().catch(() => {});
                } catch {}
                setIsPersonaDrawerExpanded(!isPersonaDrawerExpanded);
              }}
              activeOpacity={0.8}
            >
              <View>
                <Text style={styles.darkCardTitle}>New in</Text>
                <Text style={styles.darkCardSubtitle}>Quick Staff Personas</Text>
              </View>

              <View style={styles.discoverBtn}>
                <Text style={styles.discoverText}>
                  {isPersonaDrawerExpanded ? 'Close' : 'Discover'}
                </Text>
                <Ionicons
                  name={isPersonaDrawerExpanded ? 'chevron-up' : 'chevron-forward'}
                  size={14}
                  color="#FFFFFF"
                  style={{ marginLeft: 3 }}
                />
              </View>
            </TouchableOpacity>

            {/* Expanded Persona List */}
            {isPersonaDrawerExpanded && (
              <View style={styles.personaListWrapper}>
                <Text style={styles.personaListIntro}>
                  Tap any staff persona for immediate 1-tap authenticated entrance:
                </Text>

                {DEMO_PERSONAS.slice(0, 5).map(persona => {
                  const isCurrent = currentPersona?.id === persona.id;
                  const roleEmoji =
                    persona.id === 'owner-admin'
                      ? '👑'
                      : persona.id === 'admin-regular'
                      ? '👤'
                      : persona.id.startsWith('manager')
                      ? '📋'
                      : persona.id.startsWith('editor')
                      ? '🎬'
                      : '📸';

                  return (
                    <TouchableOpacity
                      key={persona.id}
                      style={[
                        styles.personaRowBtn,
                        isCurrent && styles.personaRowBtnActive,
                      ]}
                      onPress={() => handleQuickPersona(persona.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.personaEmoji}>{roleEmoji}</Text>
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.personaRowName} numberOfLines={1}>
                          {persona.label}
                        </Text>
                        <Text style={styles.personaRowDesc} numberOfLines={1}>
                          {persona.description}
                        </Text>
                      </View>
                      <Ionicons name="arrow-forward" size={14} color="#9CA3AF" />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* STUDIO LOOKUP MODAL SHEET */}
      <Modal
        visible={isStudioModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsStudioModalOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsStudioModalOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={e => e.stopPropagation()}>
            <View style={styles.modalSheetHeader}>
              <View>
                <Text style={styles.modalSheetTitle}>Select Studio Workspace</Text>
                <Text style={styles.modalSheetSub}>Choose active studio brand or enter subdomain</Text>
              </View>
              <TouchableOpacity onPress={() => setIsStudioModalOpen(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Quick Studios */}
            <View style={{ gap: 8, marginVertical: 12 }}>
              {studioList.map(s => {
                const isSelected = selectedStudio?.subdomain === s.subdomain;
                return (
                  <TouchableOpacity
                    key={s.subdomain}
                    style={[
                      styles.studioSelectCard,
                      isSelected && styles.studioSelectCardActive,
                    ]}
                    onPress={() => {
                      selectStudio(s);
                      setIsStudioModalOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.studioSelectDot, { backgroundColor: s.primaryColor }]} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.studioSelectName}>{s.name}</Text>
                      <Text style={styles.studioSelectSub}>{s.subdomain}.wedtrack.com</Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color="#FF5500" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Subdomain Input */}
            <View style={styles.customLookupRow}>
              <TextInput
                style={styles.customLookupInput}
                placeholder="or enter studio slug (e.g. aura)"
                placeholderTextColor="#9CA3AF"
                value={customSubdomain}
                onChangeText={setCustomSubdomain}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.customLookupBtn}
                onPress={handleLookupCustomStudio}
                disabled={isSearchingStudio}
              >
                {isSearchingStudio ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.customLookupBtnText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F2EB', // Refined warm ivory / ecru canvas
  },
  scrollContent: {
    paddingHorizontal: 18,
    minHeight: '100%',
    justifyContent: 'center',
  },

  // BACKGROUND LOGO LAYER (The "Half-Frosted" WedTrack Logo)
  bgLogoContainer: {
    position: 'absolute',
    top: 130,
    right: -75,
    width: 360,
    height: 360,
    zIndex: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgLogoHalo: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(255, 90, 0, 0.16)',
  },
  bgLogoImage: {
    width: 340,
    height: 340,
    opacity: 0.95,
    transform: [{ rotate: '-6deg' }],
  },

  // MAIN FROSTED GLASS CARD (Matching Reference Design)
  glassCardWrapper: {
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.62)',
    borderColor: 'rgba(255, 255, 255, 0.90)',
    borderWidth: 1.5,
    shadowColor: '#8C7A6B',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
    zIndex: 1,
  },
  glassCardInner: {
    padding: 24,
  },

  // Card Header: Brand Title & Mode Pill
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  brandTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: 0.2,
  },
  brandDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FF5500',
    marginLeft: 6,
  },
  modePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  modePillDemo: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  modePillLive: {
    backgroundColor: '#FF5500',
    borderColor: '#FF5500',
  },
  modePillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#374151',
  },
  modePillTextLive: {
    color: '#FFFFFF',
  },

  // Title Row: "Log in" & Studio Selector Pill
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  loginTitle: {
    fontSize: 34,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.6,
  },
  studioPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 160,
  },
  studioPillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  studioPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },

  // Error Alert Box
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },

  // Capsule Inputs (Matching Reference)
  inputCapsule: {
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  inputBadgeCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  atBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 14.5,
    color: '#111827',
  },
  forgotPillBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  forgotPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },

  // Card Bottom Row
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  disclaimerCol: {
    flex: 1,
    marginRight: 14,
  },
  disclaimerText: {
    fontSize: 9.5,
    color: '#6B7280',
    lineHeight: 14,
    fontWeight: '400',
  },
  disclaimerSubtext: {
    fontSize: 10,
    color: '#4B5563',
    fontWeight: '600',
    marginTop: 4,
  },

  // Organic Black Pill Submit Button
  organicSubmitBtn: {
    backgroundColor: '#111827',
    height: 44,
    width: 68,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // BOTTOM DARK CARD ("New in...")
  darkCard: {
    backgroundColor: '#18181B',
    borderRadius: 28,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 6,
    zIndex: 1,
  },
  darkCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  darkCardTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  darkCardSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
  },
  discoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  discoverText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Expanded Persona List inside Dark Card
  personaListWrapper: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.10)',
    paddingTop: 14,
    gap: 8,
  },
  personaListIntro: {
    color: '#9CA3AF',
    fontSize: 11.5,
    marginBottom: 6,
  },
  personaRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272A',
    borderColor: '#3F3F46',
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
  },
  personaRowBtnActive: {
    borderColor: '#FF5500',
    backgroundColor: 'rgba(255, 85, 0, 0.12)',
  },
  personaEmoji: {
    fontSize: 18,
  },
  personaRowName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  personaRowDesc: {
    color: '#A1A1AA',
    fontSize: 11,
    marginTop: 1,
  },

  // STUDIO MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    maxHeight: '80%',
  },
  modalSheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalSheetSub: {
    fontSize: 12.5,
    color: '#6B7280',
    marginTop: 2,
  },
  studioSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  studioSelectCardActive: {
    borderColor: '#FF5500',
    backgroundColor: '#FFF7ED',
  },
  studioSelectDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  studioSelectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  studioSelectSub: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 1,
  },
  customLookupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  customLookupInput: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#111827',
  },
  customLookupBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customLookupBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
