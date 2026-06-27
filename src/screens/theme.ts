export const COLORS = {
  primary: '#4F6BED',
  primaryLight: '#EEF1FD',
  primaryDark: '#3A52C4',
  secondary: '#3DAA7F',
  secondaryLight: '#EAF6F1',
  secondaryDark: '#2B8060',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  background: '#F8F9FB',
  surface: '#FFFFFF',
  border: '#E8EBF0',
  divider: '#F1F3F6',
  textPrimary: '#1A1D23',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  dark: {
    background: '#101012',
    surface: '#1C1C1E',
    border: '#2C2C2E',
    textPrimary: '#FFFFFF',
    textSecondary: '#8E8E93',
  },
};

export const getTheme = (isDarkMode: boolean) => ({
  bg: isDarkMode ? COLORS.dark.background : COLORS.background,
  card: isDarkMode ? COLORS.dark.surface : COLORS.surface,
  text: isDarkMode ? COLORS.dark.textPrimary : COLORS.textPrimary,
  subText: isDarkMode ? COLORS.dark.textSecondary : COLORS.textSecondary,
  border: isDarkMode ? COLORS.dark.border : COLORS.border,
});

export const getAccent = (role: string) =>
  role === 'parent' || role === 'PARENT' ? COLORS.primary : COLORS.secondary;

export const getAccentLight = (role: string) =>
  role === 'parent' || role === 'PARENT' ? COLORS.primaryLight : COLORS.secondaryLight;