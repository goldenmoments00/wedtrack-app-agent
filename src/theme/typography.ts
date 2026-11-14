import { TextStyle, Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography: Record<string, TextStyle> = {
  largeTitle: {
    fontFamily,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: 0.35,
  },
  title1: {
    fontFamily,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  title2: {
    fontFamily,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  title3: {
    fontFamily,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  headline: {
    fontFamily,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  body: {
    fontFamily,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400',
  },
  bodyMedium: {
    fontFamily,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
  callout: {
    fontFamily,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '400',
  },
  subhead: {
    fontFamily,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  footnote: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  caption1: {
    fontFamily,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
  },
  caption2: {
    fontFamily,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
};
