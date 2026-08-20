/*
 * Madrasaty — Shared Reusable Styles (RTL Arabic)
 */

import { StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadows } from './theme';

export const globalStyles = StyleSheet.create({
  // Screens
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  screenPadded: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Cards
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...(Shadows.md as object),
  },
  cardSmall: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    ...(Shadows.sm as object),
  },

  // Typography – Arabic RTL
  heading1: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: FontSize.xxxl * 1.3,
  },
  heading2: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: FontSize.xxl * 1.3,
  },
  heading3: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  body: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: FontSize.base * 1.6,
  },
  bodyMuted: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    color: Colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  caption: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    color: Colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
    letterSpacing: 0.3,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.md,
  },

  // Row helpers
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Badge
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textOnPrimary,
    textAlign: 'center',
  },
});
