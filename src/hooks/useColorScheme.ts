import { useColorScheme as _useColorScheme } from 'react-native';
import { Colors } from '../constants/theme';

export function useThemeColors() {
  const scheme = _useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  return {
    isDark,
    background: isDark ? Colors.background.dark : Colors.background.light,
    surface: isDark ? Colors.surface.dark : Colors.surface.light,
    surfaceSecondary: isDark ? Colors.surfaceSecondary.dark : Colors.surfaceSecondary.light,
    text: isDark ? Colors.text.dark : Colors.text.light,
    textSecondary: isDark ? Colors.textSecondary.dark : Colors.textSecondary.light,
    primary: Colors.primary,
    accent: Colors.accent,
    danger: Colors.danger,
  };
}
