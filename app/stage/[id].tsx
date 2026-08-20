/*
 * Madrasaty — Stage Screen
 * Displays grades list for a selected educational stage
 * Route: /stage/[id]
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
import { useGrades } from '@/hooks/useCurriculum';
import { Grade } from '@/services/curriculumService';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadows } from '@/constants/theme';

export default function StageScreen() {
  const router = useRouter();
  const { id, nameAr } = useLocalSearchParams<{ id: string; nameAr: string }>();
  const { grades, stage, loading, error, refresh } = useGrades(id ?? '');

  const handleGradePress = (grade: Grade) => {
    router.push({
      pathname: '/grade/[id]',
      params: {
        id: grade.id,
        nameAr: grade.name_ar,
        stageColor: encodeURIComponent(stage?.color_start ?? Colors.primary),
        stageId: stage?.id ?? id ?? '',
      },
    });
  };

  const gradientColors: [string, string] = stage
    ? [stage.color_start, stage.color_end]
    : [Colors.primaryDarker, Colors.primary];

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
            accessibilityRole="button"
            accessibilityLabel="رجوع"
          >
            <MaterialIcons name="arrow-forward" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerTitle}>
            <Text style={styles.headerSubtitle}>المرحلة الدراسية</Text>
            <Text style={styles.headerName}>{stage?.name_ar ?? nameAr ?? '...'}</Text>
          </View>
        </View>
        <Text style={styles.headerDesc}>
          {stage?.description_ar || 'اختر الصف الدراسي'}
        </Text>
      </LinearGradient>

      {/* Body */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>جارٍ التحميل...</Text>
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
          data={grades}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={
            <Text style={styles.listHeader}>
              {grades.length} {grades.length === 1 ? 'صف دراسي' : 'صفوف دراسية'}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <MaterialIcons name="inbox" size={40} color={Colors.textHint} />
              <Text style={styles.errorText}>لا توجد صفوف دراسية بعد.</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <GradeRow
              grade={item}
              index={index}
              colorStart={gradientColors[0]}
              colorEnd={gradientColors[1]}
              onPress={() => handleGradePress(item)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Grade Row ────────────────────────────────────────────────────────────────

function GradeRow({
  grade,
  index,
  colorStart,
  colorEnd,
  onPress,
}: {
  grade: Grade;
  index: number;
  colorStart: string;
  colorEnd: string;
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
        style={styles.gradeRow}
        accessibilityRole="button"
        accessibilityLabel={grade.name_ar}
      >
        {/* Number badge */}
        <LinearGradient
          colors={[colorStart, colorEnd]}
          style={styles.gradeBadge}
        >
          <Text style={styles.gradeBadgeText}>{index + 1}</Text>
        </LinearGradient>

        {/* Name */}
        <Text style={styles.gradeName}>{grade.name_ar}</Text>

        {/* Arrow */}
        <MaterialIcons name="arrow-back-ios" size={18} color={Colors.textHint} />
      </Pressable>
    </Animated.View>
  );
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
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
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
  headerDesc: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'right',
    writingDirection: 'rtl',
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
  separator: { height: Spacing.sm },

  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    minHeight: 64,
    ...(Shadows.sm as object),
  },
  gradeBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeBadgeText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    includeFontPadding: false,
  },
  gradeName: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
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
