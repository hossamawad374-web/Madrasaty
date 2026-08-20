/*
 * Madrasaty — Term Screen
 * Phase 2: Displays subjects grid for a selected term
 * Route: /term/[id]
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSubjects } from '@/hooks/useCurriculum';
import { Subject } from '@/services/curriculumService';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');
const SUBJECT_CARD_WIDTH = (width - Spacing.md * 2 - Spacing.sm) / 2;

export default function TermScreen() {
  const router = useRouter();
  const { id, nameAr, gradeNameAr, stageColor } = useLocalSearchParams<{
    id: string;
    nameAr: string;
    gradeNameAr: string;
    stageColor: string;
  }>();

  const { subjects, term, loading, error, refresh } = useSubjects(id ?? '');

  const headerColor = stageColor ? decodeURIComponent(stageColor) : Colors.primary;
  const darkerColor = darkenHex(headerColor, 40);

  const handleSubjectPress = useCallback(
    (subject: Subject) => {
      router.push({
        pathname: '/subject/[id]',
        params: {
          id: subject.id,
          nameAr: subject.name_ar,
          color: encodeURIComponent(subject.color),
        },
      });
    },
    [router]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={[darkerColor, headerColor]}
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
            <Text style={styles.headerBreadcrumb}>
              {gradeNameAr ? `${gradeNameAr} ← ` : ''}المواد
            </Text>
            <Text style={styles.headerName}>{term?.name_ar ?? nameAr ?? '...'}</Text>
          </View>
        </View>

        {!loading && !error && subjects.length > 0 ? (
          <View style={styles.countPill}>
            <Text style={styles.countText}>{subjects.length} مادة دراسية</Text>
          </View>
        ) : null}
      </LinearGradient>

      {/* Body */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={headerColor} />
          <Text style={styles.loadingText}>جارٍ تحميل المواد...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <MaterialIcons name="error-outline" size={40} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={[styles.retryBtn, { backgroundColor: headerColor }]} onPress={refresh}>
            <Text style={styles.retryText}>إعادة المحاولة</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={subjects}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            subjects.length > 0 ? (
              <Text style={styles.gridHeader}>
                {subjects.length} {subjects.length === 1 ? 'مادة' : 'مواد دراسية'}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <MaterialIcons name="menu-book" size={48} color={Colors.textHint} />
              <Text style={styles.errorText}>
                لا توجد مواد دراسية بعد.{'\n'}ترقّب الإضافة قريباً!
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <SubjectCard
              subject={item}
              index={index}
              onPress={() => handleSubjectPress(item)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Subject Card ─────────────────────────────────────────────────────────────

function SubjectCard({
  subject,
  index,
  onPress,
}: {
  subject: Subject;
  index: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const bgColor = subject.color + '15';
  const borderColor = subject.color + '40';

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 70).duration(280).springify()}
      style={[styles.subjectCardWrapper, animStyle]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.93, { damping: 14 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 11 }); }}
        style={[styles.subjectCard, { backgroundColor: bgColor, borderColor }]}
        accessibilityRole="button"
        accessibilityLabel={subject.name_ar}
      >
        {/* Icon circle */}
        <View style={[styles.subjectIconCircle, { backgroundColor: subject.color }]}>
          <MaterialIcons name={subject.icon as any} size={28} color="#FFFFFF" />
        </View>

        {/* Names */}
        <Text style={styles.subjectName}>{subject.name_ar}</Text>
        <Text style={styles.subjectNameEn}>{subject.name_en}</Text>

        {/* Tap CTA */}
        <View style={[styles.subjectTap, { backgroundColor: subject.color + '22' }]}>
          <MaterialIcons name="arrow-back" size={12} color={subject.color} />
          <Text style={[styles.subjectTapText, { color: subject.color }]}>اعرض الدروس</Text>
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
    gap: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, alignItems: 'flex-end', paddingLeft: Spacing.sm },
  headerBreadcrumb: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.65)',
    writingDirection: 'rtl',
    includeFontPadding: false,
    textAlign: 'right',
  },
  headerName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  countPill: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  countText: {
    fontSize: FontSize.xs,
    color: '#FFFFFF',
    fontWeight: FontWeight.semibold,
    includeFontPadding: false,
  },

  grid: {
    padding: Spacing.md,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  columnWrapper: {
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  gridHeader: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    marginBottom: Spacing.sm,
  },

  // Subject card
  subjectCardWrapper: {
    width: SUBJECT_CARD_WIDTH,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...(Shadows.sm as object),
  },
  subjectCard: {
    padding: Spacing.md,
    borderRadius: Radius.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    minHeight: 165,
    justifyContent: 'space-between',
    gap: 4,
  },
  subjectIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
    ...(Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }) as object),
  },
  subjectName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  subjectNameEn: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    includeFontPadding: false,
  },
  subjectTap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.full,
    marginTop: Spacing.xs,
  },
  subjectTapText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    writingDirection: 'rtl',
    includeFontPadding: false,
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
    lineHeight: FontSize.base * 1.7,
  },
  retryBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  retryText: {
    fontSize: FontSize.sm,
    color: '#FFFFFF',
    fontWeight: FontWeight.semibold,
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
});
