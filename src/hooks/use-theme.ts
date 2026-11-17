import { useColorScheme } from 'react-native';
import { lightColors, darkColors, ColorPalette } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export function useTheme() {
  // Fresh color theory: Default to luminous clean fresh light mode per user design system
  const isDark = false;
  const colors: ColorPalette = lightColors;

  return {
    isDark,
    colors,
    spacing,
    radii,
    typography,
  };
}
