export const Colors = {
  primary: '#1DB954',
  primaryDark: '#17a348',
  secondary: '#0A0A0A',
  accent: '#FFD700',
  background: {
    light: '#F7F7F5',
    dark: '#111111',
  },
  surface: {
    light: '#FFFFFF',
    dark: '#1C1C1E',
  },
  surfaceSecondary: {
    light: '#F2F2F7',
    dark: '#2C2C2E',
  },
  text: {
    light: '#000000',
    dark: '#FFFFFF',
  },
  textSecondary: {
    light: '#6B7280',
    dark: '#9CA3AF',
  },
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#1DB954',
  blue: '#3B82F6',
  purple: '#8B5CF6',
} as const;

export const CompanyColors = [
  '#FF6B6B', // coral red
  '#4ECDC4', // teal
  '#45B7D1', // sky blue
  '#96CEB4', // sage green
  '#FFEAA7', // light gold
  '#DDA0DD', // plum
  '#98D8C8', // mint
  '#F7DC6F', // warm yellow
] as const;

export const Radius = {
  card: 16,
  chip: 12,
  button: 12,
  small: 8,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const PresetCategories = [
  'Food & Drink',
  'Fashion',
  'Travel',
  'Health & Beauty',
  'Electronics',
  'Home',
  'Entertainment',
  'Services',
  'Other',
] as const;
