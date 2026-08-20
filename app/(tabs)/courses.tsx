/*
 * Madrasaty — Courses Screen (الدروس) — Phase 1 Placeholder
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '@/constants/theme';

export default function CoursesScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>الدروس</Text>
        <Text style={styles.subtitle}>مكتبة التعلم</Text>
      </View>

      <View style={styles.emptyState}>
        <LinearGradient
          colors={[Colors.primarySurface, Colors.accentSurface]}
          style={styles.emptyIcon}
        >
          <MaterialIcons name="menu-book" size={56} color={Colors.primary} />
        </LinearGradient>
        <Text style={styles.emptyTitle}>الدروس قادمة قريباً</Text>
        <Text style={styles.emptyText}>
          نعمل على إعداد محتوى تعليمي متميز لك.{'\n'}
          ترقّب الإطلاق قريباً!
        </Text>
        <View style={styles.comingTag}>
          <MaterialIcons name="rocket-launch" size={14} color={Colors.primary} />
          <Text style={styles.comingTagText}>الإصدار القادم</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: Radius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
    lineHeight: FontSize.base * 1.8,
    marginBottom: Spacing.lg,
  },
  comingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primarySurface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  comingTagText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
});
