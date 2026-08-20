/*
 * Madrasaty — Leaderboard Screen (المتصدرون) — Phase 1 Placeholder
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '@/constants/theme';

export default function LeaderboardScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[Colors.xpGoldLight, Colors.background]}
        style={styles.header}
      >
        <Text style={styles.title}>المتصدرون</Text>
        <Text style={styles.subtitle}>قائمة الشرف</Text>
      </LinearGradient>

      <View style={styles.emptyState}>
        <View style={styles.trophyRow}>
          {['🥈', '🥇', '🥉'].map((medal, i) => (
            <View
              key={i}
              style={[
                styles.podiumBox,
                i === 1 && styles.podiumBoxFirst,
              ]}
            >
              <Text style={styles.medal}>{medal}</Text>
              <View style={[styles.podiumBar, { height: i === 1 ? 80 : 56 }]} />
            </View>
          ))}
        </View>

        <Text style={styles.emptyTitle}>لوحة الشرف قادمة قريباً</Text>
        <Text style={styles.emptyText}>
          تنافس مع الطلاب وتصدّر قائمة المتميزين.{'\n'}
          اكسب نقاط الخبرة واحتل المراتب الأولى!
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
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
  trophyRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  podiumBox: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  podiumBoxFirst: {
    transform: [{ translateY: -12 }],
  },
  medal: {
    fontSize: 40,
  },
  podiumBar: {
    width: 64,
    backgroundColor: Colors.primaryLight,
    borderTopLeftRadius: Radius.sm,
    borderTopRightRadius: Radius.sm,
    opacity: 0.5,
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
  },
});
