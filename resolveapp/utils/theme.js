// Centralized design tokens for the Resolve app
// All screens should import from here for consistency

export const colors = {
  bg: '#050505',
  surface: '#0F0F0F',
  surfaceAlt: '#1A1A1A',
  border: '#2A2A2A',
  text: '#F5F5F5',
  textMuted: '#858585',
  accent: '#8ac108',
  accentSoft: '#8ac1081A',
  success: '#8ac108',
  successSoft: '#8ac1081A',
  danger: '#E5484D',
  dangerSoft: '#E5484D1A',
  warning: '#C8C8C8',
  warningSoft: '#C8C8C81A',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 22, fontWeight: '700', color: colors.text },
  h2: { fontSize: 18, fontWeight: '600', color: colors.text },
  h3: { fontSize: 15, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, fontWeight: '400', color: colors.text },
  caption: { fontSize: 12, fontWeight: '400', color: colors.textMuted },
  label: { fontSize: 13, fontWeight: '500', color: colors.textMuted },
  stat: { fontSize: 28, fontWeight: '700', color: colors.text },
};
