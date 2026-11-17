import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { getRandomRobotMessage, MessageCategory, RobotMessage } from '@/services/robot-personality';

export type BotExpression =
  | 'happy'
  | 'love'
  | 'angry'
  | 'cool'
  | 'sleepy'
  | 'sparkle'
  | 'blink'
  | 'thinking';

interface InteractiveBotProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  category?: MessageCategory;
  onPress?: (message: string) => void;
  showBubbleByDefault?: boolean;
  initialMessage?: string;
  bubbleAlign?: 'center' | 'left' | 'right';
  style?: any;
}

export const InteractiveBot: React.FC<InteractiveBotProps> = ({
  size = 'md',
  category,
  onPress,
  showBubbleByDefault = false,
  initialMessage,
  bubbleAlign = 'center',
  style,
}) => {
  const [expression, setExpression] = useState<BotExpression>('happy');
  const [isBlinking, setIsBlinking] = useState(false);
  const [bubbleText, setBubbleText] = useState(initialMessage || 'Hello! Ready for today?');
  const [bubbleVisible, setBubbleVisible] = useState(showBubbleByDefault);

  const historyRef = useRef<string[]>([]);
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pokeCountRef = useRef(0);

  // Floating animation
  const floatAnim = useRef(new Animated.Value(0)).current;
  const bubbleAnim = useRef(new Animated.Value(showBubbleByDefault ? 1 : 0)).current;

  // Scale mapping
  const scale = size === 'xs' ? 0.38 : size === 'sm' ? 0.52 : size === 'lg' ? 1.1 : 0.8;
  const baseWidth = 100 * scale;
  const baseHeight = 110 * scale;

  // Floating loop
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -6,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim]);

  // Natural blinking engine
  useEffect(() => {
    let blinkTimeout: ReturnType<typeof setTimeout>;
    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 140);
      blinkTimeout = setTimeout(triggerBlink, 3500 + Math.random() * 3500);
    };
    blinkTimeout = setTimeout(triggerBlink, 2000);
    return () => clearTimeout(blinkTimeout);
  }, []);

  // Show speech bubble
  const speak = (text: string, exp: BotExpression = 'happy') => {
    setBubbleText(text);
    setExpression(exp);
    setBubbleVisible(true);

    Animated.spring(bubbleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
    }).start();

    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = setTimeout(() => {
      Animated.timing(bubbleAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setBubbleVisible(false));
    }, 5000);
  };

  // Handle Tap / Poke
  const handlePoke = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pokeCountRef.current += 1;

    if (pokeCountRef.current % 4 === 0) {
      speak('Lathi dumu 😡', 'angry');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      const msg = getRandomRobotMessage(category, historyRef.current);
      historyRef.current.push(msg.id);
      if (historyRef.current.length > 10) historyRef.current.shift();

      const randomExp: BotExpression =
        msg.category === 'achievement'
          ? 'sparkle'
          : msg.category === 'funny_office'
          ? 'cool'
          : 'happy';

      speak(msg.text, randomExp);
      if (onPress) onPress(msg.text);
    }
  };

  // Handle Long Press / Pet
  const handlePet = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    speak('muuahhhhh 😘', 'love');
    setTimeout(() => {
      if (expression === 'love') setExpression('happy');
    }, 4000);
  };

  // Render Eyes based on current expression
  const renderEyes = () => {
    const eyeColor = '#F97316'; // Golden Moments signature orange

    if (isBlinking && expression !== 'love') {
      return (
        <View style={styles.visorEyesRow}>
          <View style={[styles.eyeBlinkBar, { backgroundColor: eyeColor }]} />
          <View style={[styles.eyeBlinkBar, { backgroundColor: eyeColor }]} />
        </View>
      );
    }

    switch (expression) {
      case 'love':
        // Glowing red hearts (Reference image 2)
        return (
          <View style={styles.visorEyesRow}>
            <View style={styles.heartWrapper}>
              <Svg width={18 * scale} height={18 * scale} viewBox="0 0 24 24">
                <Path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill="#FF4D4D"
                />
              </Svg>
            </View>
            <View style={styles.heartWrapper}>
              <Svg width={18 * scale} height={18 * scale} viewBox="0 0 24 24">
                <Path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill="#FF4D4D"
                />
              </Svg>
            </View>
          </View>
        );

      case 'angry':
        // Slanted fierce orange eyebrows/eyes (Reference image 1)
        return (
          <View style={styles.visorEyesRow}>
            <View style={[styles.eyeAngryBar, { backgroundColor: eyeColor, transform: [{ rotate: '25deg' }] }]} />
            <View style={[styles.eyeAngryBar, { backgroundColor: eyeColor, transform: [{ rotate: '-25deg' }] }]} />
          </View>
        );

      case 'cool':
        // Cool visor bar
        return (
          <View style={styles.visorEyesRow}>
            <View style={[styles.eyeCoolGlasses, { backgroundColor: eyeColor }]}>
              <View style={styles.eyeCoolGlint} />
            </View>
          </View>
        );

      case 'sparkle':
        return (
          <View style={styles.visorEyesRow}>
            <Svg width={16 * scale} height={16 * scale} viewBox="0 0 24 24">
              <Path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill={eyeColor} />
            </Svg>
            <Svg width={16 * scale} height={16 * scale} viewBox="0 0 24 24">
              <Path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill={eyeColor} />
            </Svg>
          </View>
        );

      case 'sleepy':
        return (
          <View style={styles.visorEyesRow}>
            <View style={[styles.eyeSleepyArc, { borderColor: eyeColor }]} />
            <View style={[styles.eyeSleepyArc, { borderColor: eyeColor }]} />
          </View>
        );

      case 'happy':
      default:
        return (
          <View style={styles.visorEyesRow}>
            <View style={[styles.eyeHappyOval, { backgroundColor: eyeColor }]} />
            <View style={[styles.eyeHappyOval, { backgroundColor: eyeColor }]} />
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, { width: baseWidth + 30, height: baseHeight + 10 }, style]}>
      {/* Speech Bubble (Reference image 3) */}
      {bubbleVisible && (
        <Animated.View
          style={[
            styles.speechBubble,
            bubbleAlign === 'right' && { right: 0 },
            bubbleAlign === 'left' && { left: 0 },
            {
              opacity: bubbleAnim,
              transform: [{ scale: bubbleAnim }],
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              Animated.timing(bubbleAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start(() => setBubbleVisible(false));
            }}
          >
            <Text style={styles.speechBubbleText}>{bubbleText}</Text>
          </TouchableOpacity>
          <View
            style={[
              styles.speechBubbleTail,
              bubbleAlign === 'right' && { right: Math.max(16, (baseWidth / 2) - 5), left: undefined },
              bubbleAlign === 'left' && { left: Math.max(16, (baseWidth / 2) - 5), right: undefined },
            ]}
          />
        </Animated.View>
      )}

      {/* Interactive Floating Mascot Body */}
      <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handlePoke}
          onLongPress={handlePet}
          delayLongPress={350}
          style={[styles.botTouchTarget, { width: baseWidth, height: baseHeight }]}
        >
          {/* 1. Antenna */}
          <View style={styles.antennaContainer}>
            <View style={[styles.antennaOrb, { width: 14 * scale, height: 14 * scale, borderRadius: 7 * scale }]} />
            <View style={[styles.antennaStick, { width: 4 * scale, height: 7 * scale }]} />
          </View>

          {/* 2. Ears */}
          <View style={[styles.earLeft, { width: 8 * scale, height: 26 * scale, left: 4 * scale, top: 26 * scale }]} />
          <View style={[styles.earRight, { width: 8 * scale, height: 26 * scale, right: 4 * scale, top: 26 * scale }]} />

          {/* 3. Floating Arms */}
          <View
            style={[
              styles.armLeft,
              {
                width: 26 * scale,
                height: 14 * scale,
                left: -8 * scale,
                top: 56 * scale,
                transform: [{ rotate: '-18deg' }],
              },
            ]}
          />
          <View
            style={[
              styles.armRight,
              {
                width: 26 * scale,
                height: 14 * scale,
                right: -8 * scale,
                top: 56 * scale,
                transform: [{ rotate: '18deg' }],
              },
            ]}
          />

          {/* 4. Head Outer Shell */}
          <View
            style={[
              styles.headShell,
              {
                width: 76 * scale,
                height: 60 * scale,
                borderRadius: 24 * scale,
              },
            ]}
          >
            {/* Top Helmet Groove */}
            <View style={[styles.helmetDetail, { width: 28 * scale, height: 10 * scale }]} />

            {/* Dark Screen Visor */}
            <View
              style={[
                styles.visorScreen,
                {
                  width: 58 * scale,
                  height: 38 * scale,
                  borderRadius: 15 * scale,
                },
              ]}
            >
              {renderEyes()}
            </View>
          </View>

          {/* 5. Lower Body with Chest Logo */}
          <View
            style={[
              styles.lowerBody,
              {
                width: 48 * scale,
                height: 26 * scale,
                borderBottomLeftRadius: 24 * scale,
                borderBottomRightRadius: 24 * scale,
                marginTop: -4 * scale,
              },
            ]}
          >
            <Image
              source={require('@/../assets/images/chest-logo.png')}
              style={[styles.chestLogo, { width: 22 * scale, height: 22 * scale }]}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  botTouchTarget: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  /* Speech Bubble */
  speechBubble: {
    position: 'absolute',
    bottom: '100%',
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1E1E2D',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
    maxWidth: 240,
    minWidth: 110,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speechBubbleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E1E2D',
    textAlign: 'center',
    lineHeight: 16,
  },
  speechBubbleTail: {
    position: 'absolute',
    bottom: -6,
    width: 11,
    height: 11,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: '#1E1E2D',
    transform: [{ rotate: '45deg' }],
  },

  /* Antenna */
  antennaContainer: {
    alignItems: 'center',
    zIndex: 20,
    marginBottom: -2,
  },
  antennaOrb: {
    backgroundColor: '#F97316',
    borderWidth: 2,
    borderColor: '#1E1E2D',
  },
  antennaStick: {
    backgroundColor: '#1E1E2D',
    marginTop: -1,
  },

  /* Ears */
  earLeft: {
    position: 'absolute',
    backgroundColor: '#F97316',
    borderWidth: 2,
    borderColor: '#1E1E2D',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    zIndex: 5,
  },
  earRight: {
    position: 'absolute',
    backgroundColor: '#F97316',
    borderWidth: 2,
    borderColor: '#1E1E2D',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    zIndex: 5,
  },

  /* Floating Arms */
  armLeft: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1E1E2D',
    borderRadius: 10,
    zIndex: 25,
  },
  armRight: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1E1E2D',
    borderRadius: 10,
    zIndex: 25,
  },

  /* Head */
  headShell: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#1E1E2D',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
    overflow: 'hidden',
  },
  helmetDetail: {
    position: 'absolute',
    top: 0,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#1E1E2D',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    opacity: 0.15,
  },

  /* Screen Visor */
  visorScreen: {
    backgroundColor: '#1E1E2D',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: 2,
  },
  visorEyesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '78%',
  },

  /* Eye Variations */
  heartWrapper: {
    shadowColor: '#FF4D4D',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  eyeHappyOval: {
    width: 12,
    height: 14,
    borderRadius: 6,
  },
  eyeAngryBar: {
    width: 13,
    height: 4,
    borderRadius: 2,
  },
  eyeBlinkBar: {
    width: 12,
    height: 2.5,
    borderRadius: 1.5,
  },
  eyeCoolGlasses: {
    width: 42,
    height: 12,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  eyeCoolGlint: {
    width: 12,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 1,
    marginLeft: 3,
  },
  eyeSleepyArc: {
    width: 12,
    height: 6,
    borderBottomWidth: 2.5,
    borderRadius: 6,
  },

  /* Lower Body & Logo */
  lowerBody: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#1E1E2D',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    overflow: 'hidden',
  },
  chestLogo: {
    marginTop: 1,
  },
});
