/*
 * Madrasaty (مدرستي) — Design System
 * Premium Indigo/Blue EdTech color scheme with full RTL Arabic support
 */

import { Platform } from 'react-native';

// ─── Colors ────────────────────────────────────────────────────────────────
export const Colors = {
  // Primary – Indigo
  primary: '#3F51B5',
  primaryDark: '#283593',
  primaryDarker: '#1A237E',
  primaryLight: '#7986CB',
  primaryLighter: '#C5CAE9',
  primarySurface: '#E8EAF6',

  // Accent – Blue
  accent: '#2196F3',
  accentDark: '#1565C0',
  accentLight: '#64B5F6',
  accentSurface: '#E3F2FD',

  // Backgrounds
  background: '#F0F2FF',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F6FF',
  surfaceElevated: '#FFFFFF',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#5C6BC0',
  textMuted: '#757575',
  textHint: '#BDBDBD',
  textOnPrimary: '#FFFFFF',
  textOnAccent: '#FFFFFF',

  // Semantic
  success: '#43A047',
  successLight: '#E8F5E9',
  error: '#E53935',
  errorLight: '#FFEBEE',
  warning: '#FB8C00',
  warningLight: '#FFF3E0',
  info: '#0288D1',
  infoLight: '#E1F5FE',

  // UI chrome
  border: '#E0E3FF',
  borderLight: '#F0F2FF',
  divider: '#EEEEEE',
  overlay: 'rgba(26, 26, 46, 0.55)',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E8EAF6',

  // Gamification
  xpGold: '#F9A825',
  xpGoldLight: '#FFF8E1',
  xpGoldDark: '#E65100',
  badgePurple: '#7C4DFF',
  badgePurpleLight: '#EDE7F6',

  // Gradient anchors (used with expo-linear-gradient)
  gradientStart: '#3F51B5',
  gradientMid: '#5C6BC0',
  gradientEnd: '#2196F3',
};

// ─── Spacing (8-pt grid) ────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// ─── Border Radius ───────────────────────────────────────────────────────────
export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

// ─── Typography ──────────────────────────────────────────────────────────────
export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  display: 36,
  hero: 44,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
};

export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
  loose: 2.0,
};

// ─── Shadows ─────────────────────────────────────────────────────────────────
export const Shadows = {
  none: {},
  sm: Platform.select({
    ios: {
      shadowColor: '#3F51B5',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: { elevation: 2 },
    default: {},
  }) as object,
  md: Platform.select({
    ios: {
      shadowColor: '#3F51B5',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.14,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
    default: {},
  }) as object,
  lg: Platform.select({
    ios: {
      shadowColor: '#3F51B5',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
    },
    android: { elevation: 8 },
    default: {},
  }) as object,
  xl: Platform.select({
    ios: {
      shadowColor: '#1A237E',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.22,
      shadowRadius: 24,
    },
    android: { elevation: 12 },
    default: {},
  }) as object,
};
