import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export type GearBrand =
  | 'SONY'
  | 'NIKON'
  | 'CANON'
  | 'FUJIFILM'
  | 'LUMIX'
  | 'SIGMA'
  | 'TAMRON'
  | 'LEICA'
  | 'BLACKMAGIC'
  | 'GODOX'
  | 'APUTURE'
  | 'NANLITE'
  | 'PROFOTO'
  | 'DJI'
  | 'OTHER';

export interface GearItem {
  id: string;
  brand: GearBrand;
  model: string;
}

export interface GearKitData {
  cameras: GearItem[];
  lenses: GearItem[];
  lights: GearItem[];
  audio: GearItem[];
}

export const GEAR_BRANDS: { id: GearBrand; name: string; tag: string }[] = [
  { id: 'NIKON', name: 'Nikon', tag: 'Camera / Lens' },
  { id: 'SONY', name: 'Sony Alpha / FX', tag: 'Camera / Lens' },
  { id: 'CANON', name: 'Canon EOS / RF', tag: 'Camera / Lens' },
  { id: 'FUJIFILM', name: 'Fujifilm X / GFX', tag: 'Camera / Lens' },
  { id: 'LUMIX', name: 'Panasonic Lumix', tag: 'Camera / Lens' },
  { id: 'SIGMA', name: 'Sigma Art / Prime', tag: 'Lens / Optics' },
  { id: 'TAMRON', name: 'Tamron Di III', tag: 'Lens / Optics' },
  { id: 'LEICA', name: 'Leica SL / M', tag: 'Camera / Lens' },
  { id: 'BLACKMAGIC', name: 'Blackmagic Pocket', tag: 'Cinema Body' },
  { id: 'GODOX', name: 'Godox Speedlite & Flash', tag: 'Lighting' },
  { id: 'APUTURE', name: 'Aputure / Amaran LED', tag: 'Lighting' },
  { id: 'NANLITE', name: 'Nanlite Forza', tag: 'Lighting' },
  { id: 'PROFOTO', name: 'Profoto B10 / A10', tag: 'Lighting' },
  { id: 'DJI', name: 'DJI Mic / Gimbal / Drone', tag: 'Audio / Support' },
  { id: 'OTHER', name: 'Other Custom Gear', tag: 'Universal' },
];

/**
 * Authentic brand badges for Nikon, Sony, Canon, Sigma, Godox, etc.
 * Uses 100% pure React Native <View> and <Text> to prevent Fabric reconciliation issues.
 */
export function BrandBadge({ brand, size = 'md' }: { brand: GearBrand; size?: 'sm' | 'md' }) {
  const isSm = size === 'sm';

  switch (brand) {
    case 'NIKON':
      return (
        <View style={[styles.badgeBase, { backgroundColor: '#FFE600' }]}>
          <Text style={{ color: '#000000', fontWeight: '900', fontStyle: 'italic', fontSize: isSm ? 10 : 12, letterSpacing: -0.3 }}>
            Nikon
          </Text>
        </View>
      );

    case 'SONY':
      return (
        <View style={[styles.badgeBase, { backgroundColor: '#000000', borderWidth: 1, borderColor: '#374151' }]}>
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: isSm ? 8.5 : 10, letterSpacing: 1.8 }}>
            SONY
          </Text>
        </View>
      );

    case 'CANON':
      return (
        <View style={[styles.badgeBase, { backgroundColor: '#CC0000' }]}>
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: isSm ? 9.5 : 11.5, letterSpacing: 0.2 }}>
            Canon
          </Text>
        </View>
      );

    case 'FUJIFILM':
      return (
        <View style={[styles.badgeBase, { backgroundColor: '#0B1320', flexDirection: 'row', alignItems: 'center', gap: 3 }]}>
          <View style={{ width: 3.5, height: 7, borderRadius: 1.5, backgroundColor: '#00A859' }} />
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: isSm ? 8 : 9, letterSpacing: 0.5 }}>
            FUJIFILM
          </Text>
        </View>
      );

    case 'LUMIX':
      return (
        <View style={[styles.badgeBase, { backgroundColor: '#B91C1C' }]}>
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontStyle: 'italic', fontSize: isSm ? 8.5 : 10, letterSpacing: 0.4 }}>
            LUMIX
          </Text>
        </View>
      );

    case 'SIGMA':
      return (
        <View style={[styles.badgeBase, { backgroundColor: '#18181B', borderWidth: 1, borderColor: '#3F3F46' }]}>
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: isSm ? 8 : 9.5, letterSpacing: 0.6 }}>
            Σ SIGMA
          </Text>
        </View>
      );

    case 'TAMRON':
      return (
        <View style={[styles.badgeBase, { backgroundColor: '#0055A5' }]}>
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: isSm ? 8 : 9.5, letterSpacing: 0.6 }}>
            TAMRON
          </Text>
        </View>
      );

    case 'GODOX':
      return (
        <View style={[styles.badgeBase, { backgroundColor: '#EA580C' }]}>
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: isSm ? 9.5 : 11 }}>
            Godox
          </Text>
        </View>
      );

    case 'APUTURE':
      return (
        <View style={[styles.badgeBase, { backgroundColor: '#18181B', borderWidth: 1, borderColor: '#DC2626', flexDirection: 'row', alignItems: 'center', gap: 3 }]}>
          <Text style={{ color: '#DC2626', fontSize: isSm ? 7 : 8, fontWeight: '900' }}>▲</Text>
          <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: isSm ? 8 : 9.5 }}>
            Aputure
          </Text>
        </View>
      );

    case 'DJI':
      return (
        <View style={[styles.badgeBase, { backgroundColor: '#27272A' }]}>
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: isSm ? 9.5 : 11, letterSpacing: 0.8 }}>
            DJI
          </Text>
        </View>
      );

    case 'NANLITE':
      return (
        <View style={[styles.badgeBase, { backgroundColor: '#0284C7' }]}>
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: isSm ? 8 : 9, letterSpacing: 0.5 }}>
            NANLITE
          </Text>
        </View>
      );

    case 'PROFOTO':
      return (
        <View style={[styles.badgeBase, { backgroundColor: '#09090B', borderWidth: 1, borderColor: '#52525B' }]}>
          <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: isSm ? 8 : 9.5 }}>
            Profoto
          </Text>
        </View>
      );

    case 'LEICA':
      return (
        <View style={[styles.badgeBase, { backgroundColor: '#DC2626' }]}>
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontStyle: 'italic', fontSize: isSm ? 9.5 : 11 }}>
            Leica
          </Text>
        </View>
      );

    case 'BLACKMAGIC':
      return (
        <View style={[styles.badgeBase, { backgroundColor: '#18181B', borderWidth: 1, borderColor: '#475569' }]}>
          <Text style={{ color: '#F59E0B', fontWeight: '900', fontSize: isSm ? 8.5 : 10, letterSpacing: 0.5 }}>
            BMD
          </Text>
        </View>
      );

    default:
      return (
        <View style={[styles.badgeBase, { backgroundColor: '#4B5563' }]}>
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: isSm ? 8.5 : 9.5 }}>
            GEAR
          </Text>
        </View>
      );
  }
}

/**
 * Intelligent Brand Detector: Automatically detect brand from text input.
 */
export function detectBrandFromText(text: string): GearBrand | null {
  const lower = text.toLowerCase();
  if (lower.includes('nikon')) return 'NIKON';
  if (lower.includes('sony')) return 'SONY';
  if (lower.includes('canon')) return 'CANON';
  if (lower.includes('sigma')) return 'SIGMA';
  if (lower.includes('tamron')) return 'TAMRON';
  if (lower.includes('fuji') || lower.includes('fujifilm') || lower.includes('gfx')) return 'FUJIFILM';
  if (lower.includes('lumix') || lower.includes('panasonic')) return 'LUMIX';
  if (lower.includes('godox')) return 'GODOX';
  if (lower.includes('aputure') || lower.includes('amaran')) return 'APUTURE';
  if (lower.includes('nanlite')) return 'NANLITE';
  if (lower.includes('profoto')) return 'PROFOTO';
  if (lower.includes('dji') || lower.includes('ronin')) return 'DJI';
  if (lower.includes('leica')) return 'LEICA';
  if (lower.includes('blackmagic') || lower.includes('bmd') || lower.includes('pocket 6k')) return 'BLACKMAGIC';
  return null;
}

interface GearLockerModalProps {
  visible: boolean;
  onClose: () => void;
  initialKit?: GearKitData;
  onSave: (kit: GearKitData, summary: string) => void;
  isDark?: boolean;
}

export function GearLockerModal({
  visible,
  onClose,
  initialKit,
  onSave,
  isDark = false,
}: GearLockerModalProps) {
  const [kit, setKit] = useState<GearKitData>(() => initialKit || {
    cameras: [
      { id: 'cam-1', brand: 'SONY', model: 'FX3 Cinema Line' },
      { id: 'cam-2', brand: 'SONY', model: 'A7 IV' },
    ],
    lenses: [
      { id: 'len-1', brand: 'SONY', model: '24-70mm f/2.8 GM II' },
      { id: 'len-2', brand: 'SONY', model: '70-200mm f/2.8 GM' },
    ],
    lights: [
      { id: 'lit-1', brand: 'GODOX', model: 'V1S Speedlite + Softbox' },
    ],
    audio: [
      { id: 'aud-1', brand: 'DJI', model: 'Mic 2 Wireless Transmitters' },
    ],
  });

  // Target for brand picker dropdown: { section: 'cameras'|'lenses'|'lights'|'audio', index: number }
  const [pickerTarget, setPickerTarget] = useState<{
    section: 'cameras' | 'lenses' | 'lights' | 'audio';
    index: number;
  } | null>(null);

  const colors = {
    bgModal: isDark ? '#1C222B' : '#FFFFFF',
    bgCard: isDark ? '#252D3A' : '#F8FAFC',
    bgInput: isDark ? '#151B22' : '#FFFFFF',
    border: isDark ? '#374151' : '#E2E8F0',
    borderFocus: '#FF5500',
    textPrimary: isDark ? '#FFFFFF' : '#111827',
    textSecondary: isDark ? '#9CA3AF' : '#6B7280',
    accent: '#FF5500',
  };

  const handleUpdateItem = (
    section: 'cameras' | 'lenses' | 'lights' | 'audio',
    index: number,
    field: 'brand' | 'model',
    value: string
  ) => {
    setKit(prev => {
      const list = [...prev[section]];
      const target = { ...list[index] };

      if (field === 'model') {
        target.model = value;
        // Auto-detect brand if user types Nikon, Canon, Sony, etc.
        const detected = detectBrandFromText(value);
        if (detected && detected !== target.brand) {
          target.brand = detected;
        }
      } else if (field === 'brand') {
        target.brand = value as GearBrand;
      }

      list[index] = target;
      return { ...prev, [section]: list };
    });
  };

  const handleAddItem = (section: 'cameras' | 'lenses' | 'lights' | 'audio') => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}

    const defaultBrand: GearBrand =
      section === 'cameras' ? 'SONY' :
      section === 'lenses' ? 'SONY' :
      section === 'lights' ? 'GODOX' : 'DJI';

    const newItem: GearItem = {
      id: `${section.slice(0, 3)}-${Date.now()}`,
      brand: defaultBrand,
      model: '',
    };

    setKit(prev => ({
      ...prev,
      [section]: [...prev[section], newItem],
    }));
  };

  const handleRemoveItem = (
    section: 'cameras' | 'lenses' | 'lights' | 'audio',
    index: number
  ) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch {}

    setKit(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {}

    // Generate concise summary for profile card
    const cameraNames = kit.cameras.map(c => c.model.trim()).filter(Boolean);
    const lensNames = kit.lenses.map(l => l.model.trim()).filter(Boolean);
    const lightNames = kit.lights.map(lt => lt.model.trim()).filter(Boolean);

    const parts = [
      ...cameraNames.slice(0, 2),
      ...lensNames.slice(0, 2),
      ...lightNames.slice(0, 1),
    ];

    const summary = parts.length > 0 ? parts.join(' · ') : 'Custom Studio Kit';

    onSave(kit, summary);
    onClose();
  };

  const renderGearSection = (
    title: string,
    icon: keyof typeof Ionicons.glyphMap,
    section: 'cameras' | 'lenses' | 'lights' | 'audio',
    addLabel: string,
    placeholder: string
  ) => {
    const items = kit[section];

    return (
      <View style={styles.sectionContainer}>
        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleGroup}>
            <View style={[styles.sectionIconBox, { backgroundColor: 'rgba(255, 85, 0, 0.12)' }]}>
              <Ionicons name={icon} size={16} color="#FF5500" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{items.length}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => handleAddItem(section)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={16} color="#FF5500" />
            <Text style={styles.addBtnText}>{addLabel}</Text>
          </TouchableOpacity>
        </View>

        {/* Section Items */}
        {items.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No {title.toLowerCase()} added yet. Tap {addLabel} to add one.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {items.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.gearRowCard,
                  {
                    backgroundColor: colors.bgCard,
                    borderColor: colors.border,
                  },
                ]}
              >
                {/* Brand Logo Dropdown Button */}
                <TouchableOpacity
                  style={[styles.brandSelectorBtn, { backgroundColor: colors.bgInput, borderColor: colors.border }]}
                  onPress={() => setPickerTarget({ section, index })}
                  activeOpacity={0.7}
                >
                  <BrandBadge brand={item.brand} size="sm" />
                  <Ionicons name="chevron-down" size={14} color={colors.textSecondary} style={{ marginLeft: 3 }} />
                </TouchableOpacity>

                {/* Model Text Input */}
                <TextInput
                  value={item.model}
                  onChangeText={val => handleUpdateItem(section, index, 'model', val)}
                  placeholder={placeholder}
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.gearInput,
                    {
                      backgroundColor: colors.bgInput,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                />

                {/* Remove Button */}
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemoveItem(section, index)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View
          style={[
            styles.modalSheet,
            {
              backgroundColor: colors.bgModal,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Sheet Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                Camera Kit & Gear Locker
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Add 2 or more cameras, lenses & lights with official brand logos
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Gear Sections */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. Cameras */}
            {renderGearSection(
              'Cameras & Bodies',
              'camera',
              'cameras',
              'Add Camera',
              'e.g. FX3 Cinema Line, A7 IV, Z8'
            )}

            {/* 2. Lenses */}
            {renderGearSection(
              'Lenses & Optics',
              'aperture',
              'lenses',
              'Add Lens',
              'e.g. 24-70mm f/2.8 GM II, 70-200mm'
            )}

            {/* 3. Lighting */}
            {renderGearSection(
              'Lighting & Strobes',
              'flash',
              'lights',
              'Add Light',
              'e.g. V1S Speedlite + Softbox, AD200'
            )}

            {/* 4. Audio & Support */}
            {renderGearSection(
              'Audio & Support',
              'mic',
              'audio',
              'Add Audio',
              'e.g. DJI Mic 2 Wireless, Ronin RS4'
            )}
          </ScrollView>

          {/* Bottom Save Capsule Button */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.accent }]}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.saveBtnText}>Save Gear Locker</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Brand Dropdown / Selection Modal */}
        {pickerTarget && (
          <Modal
            visible={true}
            transparent
            animationType="fade"
            onRequestClose={() => setPickerTarget(null)}
          >
            <View style={styles.pickerBackdrop}>
              <Pressable style={StyleSheet.absoluteFill} onPress={() => setPickerTarget(null)} />
              <View
                style={[
                  styles.pickerCard,
                  { backgroundColor: colors.bgModal, borderColor: colors.border },
                ]}
              >
                <View style={styles.pickerHeader}>
                  <Text style={[styles.pickerTitle, { color: colors.textPrimary }]}>
                    Select Brand
                  </Text>
                  <TouchableOpacity onPress={() => setPickerTarget(null)}>
                    <Ionicons name="close" size={22} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                  {GEAR_BRANDS.map(brand => {
                    const currentItem = kit[pickerTarget.section][pickerTarget.index];
                    const isSelected = currentItem?.brand === brand.id;

                    return (
                      <TouchableOpacity
                        key={brand.id}
                        style={[
                          styles.brandOptionRow,
                          {
                            backgroundColor: isSelected
                              ? (isDark ? '#2D3748' : '#FFF7ED')
                              : 'transparent',
                            borderColor: isSelected ? '#FF5500' : 'transparent',
                          },
                        ]}
                        onPress={() => {
                          try {
                            Haptics.selectionAsync().catch(() => {});
                          } catch {}
                          handleUpdateItem(pickerTarget.section, pickerTarget.index, 'brand', brand.id);
                          setPickerTarget(null);
                        }}
                        activeOpacity={0.7}
                      >
                        <BrandBadge brand={brand.id} size="md" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={[styles.brandOptionName, { color: colors.textPrimary }]}>
                            {brand.name}
                          </Text>
                          <Text style={[styles.brandOptionTag, { color: colors.textSecondary }]}>
                            {brand.tag}
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={20} color="#FF5500" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  badgeBase: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 46,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 18,
    paddingBottom: 24,
    borderWidth: 1,
    maxHeight: '90%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12.5,
    marginTop: 3,
    lineHeight: 17,
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingTop: 14,
    paddingBottom: 20,
    gap: 18,
  },
  sectionContainer: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: 'rgba(255, 85, 0, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  countBadgeText: {
    color: '#FF5500',
    fontSize: 11,
    fontWeight: '800',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 85, 0, 0.08)',
    gap: 4,
  },
  addBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FF5500',
  },
  emptyBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12.5,
  },
  gearRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 8,
    gap: 8,
  },
  brandSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  gearInput: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13.5,
    fontWeight: '500',
  },
  removeBtn: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    paddingTop: 12,
  },
  saveBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF5500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  /* Brand Picker Sub-Modal */
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerCard: {
    width: '100%',
    maxHeight: '75%',
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CBD5E1',
    marginBottom: 8,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  brandOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 3,
  },
  brandOptionName: {
    fontSize: 14,
    fontWeight: '700',
  },
  brandOptionTag: {
    fontSize: 11.5,
    marginTop: 1,
  },
});
