/*
 * Madrasaty — Grade Screen
 * Phase 2 hierarchy:
 *   - KG stages → Grade → Subjects (skip terms)
 *   - Other stages → Grade → Terms → Subjects
 * Route: /grade/[id]
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  FlatList,
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
import { useTerms, useSubjectsByGrade } from '@/hooks/useCurriculum';
import { Term, Subject } from '@/services/curriculumService';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadows } from '@/constants/theme';

// KG stage UUIDs — must match seeded stage IDs
const KG_STAGE_ID = '00000000-0000-0000-0000-000000000000';

const TERM_CONFIGS = [
  { colorA: '#1565C0', colorB: '#0D47A1', icon: 'looks-one' },
  { colorA: '#6A1B9A', colorB: '#4A148C', icon: 'looks-two' },
];

const { width } = Dimensions.get('window');
const SUBJECT_CARD_WIDTH = (width - Spacing.md * 2 - Spacing.sm) / 2;

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function GradeScreen() {
  const router = useRouter();
  const { id, nameAr, stageColor, stageId } = useLocalSearchParams<{
    id: string;
    nameAr: string;
    stageColor: string;
    stageId: string;
  }>();

  const isKG = stageId === KG_STAGE_ID;

  const headerColor = stageColor ? decodeURIComponent(stageColor) : Colors.primary;
  const darkerColor = darkenHex(headerColor, 40);

  if (isKG) {
    return (
      <KGSubjectsView
        gradeId={id ?? ''}
        nameAr={nameAr ?? ''}
        headerColor={headerColor}
        darkerColor={darkerColor}
      />
    );
  }

  return (
    <TermsView
      gradeId={id ?? ''}
      nameAr={nameAr ?? ''}
      headerColor={headerColor}
      darkerColor={darkerColor}
    />
  );
}

// ─── Terms View (Primary / Prep / Secondary) ─────────────────────────────────

function TermsView({
  gradeId,
  nameAr,
  headerColor,
  darkerColor,
}: {
  gradeId: string;
  nameAr: string;
  headerColor: string;
  darkerColor: string;
}) {
  const router = useRouter();
  const { terms, grade, loading, error, refresh } = useTerms(gradeId);

  const handleTermPress = useCallback(
    (term: Term) => {
      router.push({
        pathname: '/term/[id]',
        params: {
          id: term.id,
          nameAr: term.name_ar,
          gradeNameAr: grade?.name_ar ?? nameAr,
          stageColor: encodeURIComponent(headerColor),
        },
      });
    },
    [router, grade, nameAr, headerColor]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
            <Text style={styles.headerSubtitle}>اختر الفصل الدراسي</Text>
            <Text style={styles.headerName} numberOfLines={2}>
              {grade?.name_ar ?? nameAr ?? '...'}
            </Text>
          </View>
        </View>
        {!loading && !error && terms.length > 0 ? (
          <View style={styles.countPill}>
            <Text style={styles.countText}>{terms.length} فصول دراسية</Text>
          </View>
        ) : null}
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={headerColor} />
          <Text style={styles.loadingText}>جارٍ تحميل الفصول...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <MaterialIcons name="error-outline" size={40} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={[styles.retryBtn, { backgroundColor: headerColor }]} onPress={refresh}>
            <Text style={styles.retryText}>إعادة المحاولة</Text>
          </Pressable>
        </View>
      ) : terms.length === 0 ? (
        <View style={styles.center}>
          <MaterialIcons name="calendar-month" size={48} color={Colors.textHint} />
          <Text style={styles.errorText}>لا توجد فصول دراسية بعد.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.chooseLabel}>
            {grade?.name_ar ?? nameAr}
          </Text>
          {terms.map((term, index) => (
            <TermCard
              key={term.id}
              term={term}
              index={index}
              onPress={() => handleTermPress(term)}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── KG Subjects View (skip terms layer) ─────────────────────────────────────

function KGSubjectsView({
  gradeId,
  nameAr,
  headerColor,
  darkerColor,
}: {
  gradeId: string;
  nameAr: string;
  headerColor: string;
  darkerColor: string;
}) {
  const router = useRouter();
  const { subjects, grade, loading, error, refresh } = useSubjectsByGrade(gradeId);

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
            <Text style={styles.headerSubtitle}>المواد الدراسية</Text>
            <Text style={styles.headerName} numberOfLines={2}>
              {grade?.name_ar ?? nameAr ?? '...'}
            </Text>
          </View>
        </View>
        {!loading && !error && subjects.length > 0 ? (
          <View style={styles.countPill}>
            <Text style={styles.countText}>{subjects.length} مواد دراسية</Text>
          </View>
        ) : null}
      </LinearGradient>

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
              <Text style={styles.gridHeader}>{subjects.length} مواد دراسية</Text>
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

// ─── Term Card ────────────────────────────────────────────────────────────────

function TermCard({
  term,
  index,
  onPress,
}: {
  term: Term;
  index: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const cfg = TERM_CONFIGS[index % TERM_CONFIGS.length];

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(320).springify()}
      style={[styles.termCardWrapper, animStyle]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
        accessibilityRole="button"
        accessibilityLabel={term.name_ar}
      >
        <LinearGradient
          colors={[cfg.colorA, cfg.colorB]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.termCard}
        >
          <View style={styles.termRing} />
          <View style={styles.termRing2} />
          <View style={styles.termIconBg}>
            <MaterialIcons name={cfg.icon as any} size={32} color="#FFFFFF" />
          </View>
          <View style={styles.termText}>
            <Text style={styles.termNameAr}>{term.name_ar}</Text>
            <Text style={styles.termNameEn}>{term.name_en}</Text>
            <View style={styles.termBadge}>
              <MaterialIcons name="menu-book" size={12} color="rgba(255,255,255,0.9)" />
              <Text style={styles.termBadgeText}>اعرض المواد الدراسية</Text>
            </View>
          </View>
          <View style={styles.termArrow}>
            <MaterialIcons name="arrow-back" size={20} color="rgba(255,255,255,0.9)" />
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ─── Subject Card (KG) ────────────────────────────────────────────────────────

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
        <View style={[styles.subjectIconCircle, { backgroundColor: subject.color }]}>
          <MaterialIcons name={subject.icon as any} size={28} color="#FFFFFF" />
        </View>
        <Text style={styles.subjectName}>{subject.name_ar}</Text>
        <Text style={styles.subjectNameEn}>{subject.name_en}</Text>
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
    lineHeight: FontSize.xxl * 1.3,
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

  content: {
    padding: Spacing.md,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  chooseLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    marginBottom: Spacing.xs,
  },

  // Term card
  termCardWrapper: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...(Shadows.md as object),
  },
  termCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    borderRadius: Radius.xl,
    minHeight: 100,
    overflow: 'hidden',
  },
  termRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    top: -50,
    right: -40,
  },
  termRing2: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    bottom: -20,
    left: 30,
  },
  termIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    flexShrink: 0,
  },
  termText: { flex: 1, alignItems: 'flex-end' },
  termNameAr: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.black,
    color: '#FFFFFF',
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  termNameEn: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'right',
    includeFontPadding: false,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  termBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.full,
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  termBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: 'rgba(255,255,255,0.9)',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  termArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // KG subject grid
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
    minHeight: 200,
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
