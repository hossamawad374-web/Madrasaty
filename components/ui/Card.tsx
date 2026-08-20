/*
 * Madrasaty — Card Component
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadows } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'filled' | 'gradient';
}

export function Card({ children, style, onPress, variant = 'elevated' }: CardProps) {
  const cardStyle = [styles.base, styles[variant], style];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

// ─── XP Badge Card ────────────────────────────────────────────────────────────

interface XpBadgeProps {
  xp: number;
  level: number;
  titleAr: string;
  style?: ViewStyle;
}

export function XpBadge({ xp, level, titleAr, style }: XpBadgeProps) {
  return (
    <View style={[styles.xpBadge, style]}>
      <Text style={styles.xpLevel}>المستوى {level}</Text>
      <View style={styles.xpRow}>
        <Text style={styles.xpStar}>⭐</Text>
        <Text style={styles.xpValue}>{xp.toLocaleString('ar-EG')}</Text>
        <Text style={styles.xpLabel}>نقطة</Text>
      </View>
      <Text style={styles.xpTitle}>{titleAr}</Text>
    </View>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

interface RoleBadgeProps {
  role: string;
}

const ROLE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  STUDENT: { label: 'طالب', bg: Colors.primarySurface, text: Colors.primary },
  TEACHER: { label: 'معلم', bg: Colors.accentSurface, text: Colors.accentDark },
  ADMIN: { label: 'مشرف', bg: '#FFF3E0', text: '#E65100' },
};

export function RoleBadge({ role }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG['STUDENT'];
  return (
    <View style={[styles.roleBadge, { backgroundColor: config.bg }]}>
      <Text style={[styles.roleText, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
  style?: ViewStyle;
}

export function StatCard({ label, value, color = Colors.primary, style }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }, style]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
  },
  elevated: {
    ...(Shadows.md as object),
  },
  outlined: {
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  filled: {
    backgroundColor: Colors.primarySurface,
  },
  gradient: {
    backgroundColor: Colors.primary,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },

  // XP Badge
  xpBadge: {
    backgroundColor: Colors.xpGoldLight,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.xpGold,
  },
  xpLevel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.xpGoldDark,
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
    marginBottom: 4,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  xpStar: {
    fontSize: FontSize.lg,
  },
  xpValue: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.black,
    color: Colors.xpGoldDark,
    textAlign: 'center',
    includeFontPadding: false,
  },
  xpLabel: {
    fontSize: FontSize.sm,
    color: Colors.xpGoldDark,
    fontWeight: FontWeight.medium,
    includeFontPadding: false,
  },
  xpTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.xpGoldDark,
    marginTop: 4,
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },

  // Role Badge
  roleBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    writingDirection: 'rtl',
    includeFontPadding: false,
  },

  // Stat Card
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderTopWidth: 3,
    ...(Shadows.sm as object),
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.black,
    textAlign: 'center',
    includeFontPadding: false,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
});
