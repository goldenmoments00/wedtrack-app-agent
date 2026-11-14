import { useColorScheme } from 'react-native';
import { lightColors, darkColors, ColorPalette } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors: ColorPalette = isDark ? darkColors : lightColors;

  return {
    isDark,
    colors,
    spacing,
    radii,
    typography,
  };
}
