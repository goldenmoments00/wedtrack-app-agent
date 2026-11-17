import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AgentAchievement, BadgeShape } from '@/types/achievements';

interface AchievementBadgeProps {
  achievement: AgentAchievement | {
    shape: BadgeShape;
    iconName: string;
    badgeText?: string;
    gradient: [string, string];
    accentColor: string;
    ribbonColor?: string;
  };
  size?: 'mini' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export function AchievementBadge({ achievement, size = 'md', style }: AchievementBadgeProps) {
  const { shape, iconName, badgeText, gradient, accentColor, ribbonColor } = achievement;

  // Dimension scaling
  const dim = {
    mini: { outer: 24, icon: 11, font: 8.5, ribbonH: 6, ribbonW: 8 },
    sm: { outer: 36, icon: 16, font: 10, ribbonH: 8, ribbonW: 10 },
    md: { outer: 54, icon: 24, font: 14, ribbonH: 12, ribbonW: 14 },
    lg: { outer: 72, icon: 32, font: 18, ribbonH: 16, ribbonW: 18 },
  }[size];

  // 1. Pentagon Style (Level 1, 2, 3 - Blue / Cosmic)
  if (shape === 'PENTAGON') {
    return (
      <View style={[styles.container, { width: dim.outer, height: dim.outer }, style]}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[
            styles.pentagonBase,
            {
              width: dim.outer,
              height: dim.outer,
              borderRadius: dim.outer * 0.28,
              borderColor: 'rgba(255, 255, 255, 0.45)',
              borderWidth: size === 'mini' ? 1 : 1.5,
            },
          ]}
        >
          {badgeText && size !== 'mini' && (
            <Text style={[styles.badgeSuperText, { fontSize: dim.font * 0.7, color: accentColor }]}>
              {badgeText}
            </Text>
          )}
          <Ionicons
            name={iconName as any}
            size={dim.icon}
            color="#FFFFFF"
            style={styles.iconGlow}
          />
        </LinearGradient>
      </View>
    );
  }

  // 2. Diamond with Ribbon Style (10+, 25+, 50+ Shoots - Gold)
  if (shape === 'DIAMOND_RIBBON') {
    const diamondSide = dim.outer * 0.74;

    return (
      <View style={[styles.container, { width: dim.outer, height: dim.outer + (size === 'mini' ? 4 : 8) }, style]}>
        {/* Ribbon tails at bottom */}
        <View style={[styles.ribbonRow, { bottom: size === 'mini' ? 0 : 2 }]}>
          <View
            style={[
              styles.ribbonTailLeft,
              {
                width: dim.ribbonW,
                height: dim.ribbonH,
                backgroundColor: ribbonColor || '#DC2626',
              },
            ]}
          />
          <View
            style={[
              styles.ribbonTailRight,
              {
                width: dim.ribbonW,
                height: dim.ribbonH,
                backgroundColor: ribbonColor || '#DC2626',
              },
            ]}
          />
        </View>

        {/* Diamond Rotated Body */}
        <View style={styles.diamondRotator}>
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.diamondBase,
              {
                width: diamondSide,
                height: diamondSide,
                borderRadius: diamondSide * 0.24,
                borderColor: '#FEF08A',
                borderWidth: size === 'mini' ? 1 : 1.5,
              },
            ]}
          />
        </View>

        {/* Center Content (Text / Icon) */}
        <View style={styles.diamondContent}>
          {badgeText ? (
            <Text
              style={[
                styles.diamondBoldText,
                {
                  fontSize: dim.font,
                  color: '#FFFFFF',
                  textShadowColor: 'rgba(0,0,0,0.5)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                },
              ]}
            >
              {badgeText}
            </Text>
          ) : (
            <Ionicons name={iconName as any} size={dim.icon} color="#FFFFFF" />
          )}
        </View>
      </View>
    );
  }

  // 3. Coral Rounded Diamond (Specialty - Wordsmith, Remixer, Explorer)
  const coralSide = dim.outer * 0.82;
  return (
    <View style={[styles.container, { width: dim.outer, height: dim.outer }, style]}>
      <View style={styles.diamondRotator}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.coralBase,
            {
              width: coralSide,
              height: coralSide,
              borderRadius: coralSide * 0.32,
              borderColor: 'rgba(255, 255, 255, 0.5)',
              borderWidth: size === 'mini' ? 1 : 1.5,
            },
          ]}
        />
      </View>

      <View style={styles.diamondContent}>
        <Ionicons name={iconName as any} size={dim.icon} color="#FFFFFF" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pentagonBase: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeSuperText: {
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  iconGlow: {
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.6,
    shadowRadius: 3,
  },
  diamondRotator: {
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
  },
  diamondBase: {
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  diamondContent: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diamondBoldText: {
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  ribbonRow: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 2,
    zIndex: -1,
  },
  ribbonTailLeft: {
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 1,
    transform: [{ rotate: '-18deg' }],
  },
  ribbonTailRight: {
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 3,
    transform: [{ rotate: '18deg' }],
  },
  coralBase: {
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
});
