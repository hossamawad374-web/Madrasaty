/*
 * Madrasaty — Subject Screen
 * Displays lessons list for a selected subject
 * Route: /subject/[id]
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLessons } from '@/hooks/useCurriculum';
import { Lesson } from '@/services/curriculumService';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadows } from '@/constants/theme';

export default function SubjectScreen() {
  const router = useRouter();
  const { id, nameAr } = useLocalSearchParams<{ id: string; nameAr: string }>();
  const { lessons, subject, loading, error, refresh } = useLessons(id ?? '');

  const subjectColor = subject?.color ?? Colors.primary;

  const gradientColors: [string, string] = [
    darkenHex(subjectColor, 40),
    subjectColor,
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="arrow-forward" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerTitle}>
            <Text style={styles.headerSubtitle}>الدروس</Text>
            <Text style={styles.headerName}>{subject?.name_ar ?? nameAr ?? '...'}</Text>
          </View>
          {subject ? (
            <View style={styles.subjectIconHeader}>
              <MaterialIcons name={subject.icon as any} size={28} color="rgba(255,255,255,0.9)" />
            </View>
          ) : null}
        </View>
        {subject ? (
          <View style={styles.headerMeta}>
            <Text style={styles.headerMetaText}>{subject.name_en}</Text>
            <Text style={styles.headerMetaDot}>·</Text>
            <Text style={styles.headerMetaText}>{lessons.length} درس</Text>
          </View>
        ) : null}
      </LinearGradient>

      {/* Body */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={subjectColor} />
          <Text style={styles.loadingText}>جارٍ تحميل الدروس...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <MaterialIcons name="error-outline" size={40} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={refresh}>
            <Text style={styles.retryText}>إعادة المحاولة</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={lessons}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          ListHeaderComponent={
            lessons.length > 0 ? (
              <Text style={styles.listHeader}>
                جميع الدروس ({lessons.length})
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: subjectColor + '15' }]}>
                <MaterialIcons name="menu-book" size={48} color={subjectColor} />
              </View>
              <Text style={styles.emptyTitle}>لا توجد دروس بعد</Text>
              <Text style={styles.emptyDesc}>
                يعمل فريق مدرستي على إضافة محتوى لهذه المادة.{'\n'}
                ترقّب الإضافة قريباً!
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <LessonRow
              lesson={item}
              index={index}
              color={subjectColor}
              onPress={() => router.push({
                pathname: '/lesson/[id]',
                params: {
                  id: item.id,
                  subjectId: id ?? '',
                  nameAr: item.title_ar,
                  subjectColor: encodeURIComponent(subjectColor),
                  subjectAr: subject?.name_ar ?? '',
                },
              })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Lesson Row ───────────────────────────────────────────────────────────────

function LessonRow({
  lesson,
  index,
  color,
  onPress,
}: {
  lesson: Lesson;
  index: number;
  color: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
        style={[styles.lessonRow, lesson.is_free && { borderLeftWidth: 3, borderLeftColor: color }]}
        accessibilityRole="button"
        accessibilityLabel={lesson.title_ar}
      >
        {/* Number */}
        <View style={[styles.lessonNum, { backgroundColor: color + '18' }]}>
          <Text style={[styles.lessonNumText, { color }]}>{index + 1}</Text>
        </View>

        {/* Content */}
        <View style={styles.lessonContent}>
          <Text style={styles.lessonTitle}>{lesson.title_ar}</Text>
          {lesson.title_en ? (
            <Text style={styles.lessonTitleEn}>{lesson.title_en}</Text>
          ) : null}
          <View style={styles.lessonMeta}>
            {lesson.duration_minutes > 0 ? (
              <View style={styles.metaChip}>
                <MaterialIcons name="schedule" size={12} color={Colors.textMuted} />
                <Text style={styles.metaChipText}>{lesson.duration_minutes} دقيقة</Text>
              </View>
            ) : null}
            {lesson.is_free ? (
              <View style={[styles.metaChip, { backgroundColor: Colors.successLight }]}>
                <MaterialIcons name="lock-open" size={12} color={Colors.success} />
                <Text style={[styles.metaChipText, { color: Colors.success }]}>مجاني</Text>
              </View>
            ) : (
              <View style={[styles.metaChip, { backgroundColor: Colors.primarySurface }]}>
                <MaterialIcons name="lock" size={12} color={Colors.primary} />
                <Text style={[styles.metaChipText, { color: Colors.primary }]}>مدفوع</Text>
              </View>
            )}
          </View>
        </View>

        {/* Play icon */}
        <View style={[styles.playBtn, { backgroundColor: color }]}>
          <MaterialIcons name="play-arrow" size={20} color="#FFFFFF" />
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function darkenHex(hex: string, amount: number): string {
  try {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0xff) - amount);
    const b = Math.max(0, (num & 0xff) - amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  } catch {
    return '#1A237E';
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: Radius.xxl,
    borderBottomRightRadius: Radius.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, alignItems: 'flex-end' },
  headerSubtitle: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  headerName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  subjectIconHeader: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMeta: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  headerMetaText: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.75)',
    includeFontPadding: false,
  },
  headerMetaDot: {
    color: 'rgba(255,255,255,0.4)',
    includeFontPadding: false,
  },

  list: {
    padding: Spacing.md,
    paddingTop: Spacing.lg,
  },
  listHeader: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    marginBottom: Spacing.md,
  },

  // Lesson Row
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    minHeight: 72,
    ...(Shadows.sm as object),
  },
  lessonNum: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonNumText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    includeFontPadding: false,
  },
  lessonContent: { flex: 1, alignItems: 'flex-end' },
  lessonTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    marginBottom: 2,
  },
  lessonTitleEn: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'right',
    includeFontPadding: false,
    marginBottom: 4,
  },
  lessonMeta: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  metaChipText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    includeFontPadding: false,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  emptyDesc: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
    lineHeight: FontSize.base * 1.7,
    paddingHorizontal: Spacing.lg,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
    minHeight: 240,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  errorText: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  retryBtn: {
    backgroundColor: Colors.primarySurface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  retryText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
});
