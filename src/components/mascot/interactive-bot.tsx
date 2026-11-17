import { getRandomRobotMessage, MessageCategory } from '@/services/robot-personality';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

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
  onSinglePress?: (message: string) => void;
  onDoublePress?: () => void;
  onLongPress?: () => void;
  showBubbleByDefault?: boolean;
  initialMessage?: string;
  bubbleAlign?: 'center' | 'left' | 'right';
  style?: any;
}

export const InteractiveBot: React.FC<InteractiveBotProps> = ({
  size = 'md',
  category,
  onPress,
  onSinglePress,
  onDoublePress,
  onLongPress,
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
  const lastTapRef = useRef<number>(0);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionIndexRef = useRef<number>(0);

  // Floating & Bounce animations
  const floatAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const bubbleAnim = useRef(new Animated.Value(showBubbleByDefault ? 1 : 0)).current;

  // Scale mapping
  const scale = size === 'xs' ? 0.45 : size === 'sm' ? 0.88 : size === 'lg' ? 1.25 : 0.95;
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

  // 1. One Click: Normal and common greetings / tips
  const triggerSingleTap = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    } catch { }
    const msg = getRandomRobotMessage(category || 'welcome', historyRef.current);
    historyRef.current.push(msg.id);
    if (historyRef.current.length > 10) historyRef.current.shift();

    const randomExp: BotExpression =
      msg.category === 'achievement'
        ? 'sparkle'
        : msg.category === 'funny_office'
          ? 'cool'
          : 'happy';

    speak(msg.text, randomExp);
    if (onSinglePress) onSinglePress(msg.text);
    if (onPress) onPress(msg.text);
  };

  // 2. Double Click: Action reaction
  const triggerDoubleTap = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => { });
    } catch { }

    // Dynamic bounce pop on action
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 1.18,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    const actionList: { text: string; exp: BotExpression }[] = [
      { text: 'Lathi dumu 😡', exp: 'angry' },
      { text: 'muuahhhhh 😘', exp: 'love' },
      { text: 'Action mode ON! ⚡🎬', exp: 'sparkle' },
      { text: 'Abhishek da dekhche kintu! 👀', exp: 'cool' },
    ];

    const currentAction = actionList[actionIndexRef.current % actionList.length];
    actionIndexRef.current += 1;

    speak(currentAction.text, currentAction.exp);
    if (onDoublePress) onDoublePress();
  };

  // Tap handler distinguishing Single vs Double Click
  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 280;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      triggerDoubleTap();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = setTimeout(() => {
        triggerSingleTap();
        singleTapTimerRef.current = null;
      }, DOUBLE_TAP_DELAY);
    }
  };

  // 3. Long Press: Open Pre-Shoot Briefing
  const handleLongPress = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
    } catch { }
    if (singleTapTimerRef.current) {
      clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = null;
    }
    if (onLongPress) {
      onLongPress();
    } else {
      speak('muuahhhhh 😘', 'love');
    }
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
            { bottom: baseHeight + 14 },
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
              bubbleAlign === 'right' && { right: Math.max(20, Math.round((baseWidth + 30) / 2 - 6)), left: undefined },
              bubbleAlign === 'left' && { left: Math.max(20, Math.round((baseWidth + 30) / 2 - 6)), right: undefined },
            ]}
          />
        </Animated.View>
      )}

      {/* Interactive Floating Mascot Body */}
      <Animated.View style={{ transform: [{ translateY: floatAnim }, { scale: bounceAnim }] }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleTap}
          onLongPress={handleLongPress}
          delayLongPress={380}
          style={[styles.botTouchTarget, { width: baseWidth, height: baseHeight }]}
        >
          {/* 1. Antenna */}
          <View style={styles.antennaContainer}>
            <View style={[styles.antennaOrb, { width: 14 * scale, height: 14 * scale, borderRadius: 7 * scale }]} />
            <View style={[styles.antennaStick, { width: 4 * scale, height: 7 * scale }]} />
          </View>

          {/* 2. Ears (Curved Orange Headphone Cups matching reference) */}
          <View
            style={[
              styles.earLeft,
              {
                width: 13 * scale,
                height: 32 * scale,
                left: 2 * scale,
                top: 30 * scale,
                borderTopLeftRadius: 16 * scale,
                borderBottomLeftRadius: 16 * scale,
                borderTopRightRadius: 6 * scale,
                borderBottomRightRadius: 6 * scale,
              },
            ]}
          />
          <View
            style={[
              styles.earRight,
              {
                width: 13 * scale,
                height: 32 * scale,
                right: 2 * scale,
                top: 30 * scale,
                borderTopRightRadius: 16 * scale,
                borderBottomRightRadius: 16 * scale,
                borderTopLeftRadius: 6 * scale,
                borderBottomLeftRadius: 6 * scale,
              },
            ]}
          />

          {/* 3. Floating Hands (Detached Angled Capsules behind head outline matching reference) */}
          <View
            style={[
              styles.handLeft,
              {
                width: 36 * scale,
                height: 15 * scale,
                borderRadius: 8 * scale,
                left: -14 * scale,
                top: 66 * scale,
                transform: [{ rotate: '-25deg' }],
              },
            ]}
          />
          <View
            style={[
              styles.handRight,
              {
                width: 36 * scale,
                height: 15 * scale,
                borderRadius: 8 * scale,
                right: -14 * scale,
                top: 66 * scale,
                transform: [{ rotate: '25deg' }],
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

  /* Ears (Headphone Ear Cups) */
  earLeft: {
    position: 'absolute',
    backgroundColor: '#F97316',
    borderWidth: 2.2,
    borderColor: '#1E1E2D',
    zIndex: 10,
  },
  earRight: {
    position: 'absolute',
    backgroundColor: '#F97316',
    borderWidth: 2.2,
    borderColor: '#1E1E2D',
    zIndex: 10,
  },

  /* Floating Hands */
  handLeft: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderWidth: 2.2,
    borderColor: '#1E1E2D',
    zIndex: 12,
  },
  handRight: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderWidth: 2.2,
    borderColor: '#1E1E2D',
    zIndex: 12,
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
