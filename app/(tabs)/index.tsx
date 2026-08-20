/*
 * Madrasaty — Home Screen (الرئيسية)
 * Phase 2: 2×2 grid stage icons with images, shortcuts below stages
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAuth } from '@/template';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useStages } from '@/hooks/useCurriculum';
import { userService } from '@/services/userService';
import { Stage } from '@/services/curriculumService';
import { RoleBadge, Card } from '@/components';
import {
  Colors,
  FontSize,
  FontWeight,
  Radius,
  Spacing,
  Shadows,
} from '@/constants/theme';

const { width } = Dimensions.get('window');

// ── Stage visual config ──────────────────────────────────────────────────────
// order_index → local image + label override
const STAGE_IMAGES: Record<number, any> = {
  0: require('@/assets/images/stage-kg.jpg'),
  1: require('@/assets/images/stage-primary.jpg'),
  2: require('@/assets/images/stage-prep.jpg'),
  3: require('@/assets/images/stage-secondary.jpg'),
};

// Fallback if order_index beyond 3
const STAGE_FALLBACK = require('@/assets/images/stage-secondary.jpg');

// ── Quick access shortcuts ───────────────────────────────────────────────────
const SHORTCUTS = [
  {
    id: 'stats',
    label: 'إحصائياتي',
    icon: 'analytics',
    color: '#7C4DFF',
    colorEnd: '#651FFF',
    route: '/statistics' as const,
  },
  {
    id: 'english',
    label: 'كورس الإنجليزي',
    icon: 'language',
    color: '#00897B',
    colorEnd: '#00695C',
    route: '/(tabs)/courses' as const,
  },
  {
    id: 'ai',
    label: 'المعلم الذكي',
    icon: 'psychology',
    color: Colors.primary,
    colorEnd: Colors.primaryDarker,
    route: '/(tabs)/tutor' as const,
  },
  {
    id: 'leaderboard',
    label: 'المتصدرون',
    icon: 'leaderboard',
    color: '#F9A825',
    colorEnd: '#E65100',
    route: '/(tabs)/leaderboard' as const,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { stages, loading: stagesLoading, error: stagesError, refresh } = useStages();

  const xpInfo = userService.getXpLevel(profile?.xp_points ?? 0);
  const greeting = getGreeting();
  const displayName = profile?.username ?? user?.email?.split('@')[0] ?? 'طالب';
  const xpProgress = Math.min(100, ((profile?.xp_points ?? 0) / xpInfo.nextLevelXp) * 100);

  const handleStagePress = useCallback(
    (stage: Stage) => {
      router.push({
        pathname: '/stage/[id]',
        params: {
          id: stage.id,
          nameAr: stage.name_ar,
          colorStart: encodeURIComponent(stage.color_start),
          colorEnd: encodeURIComponent(stage.color_end),
        },
      });
    },
    [router]
  );

  const handleShortcutPress = useCallback(
    (route: string) => {
      router.push(route as any);
    },
    [router]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Hero Header ── */}
        <LinearGradient
          colors={[Colors.primaryDarker, Colors.primaryDark, Colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroCircle} />

          <View style={styles.heroRow}>
            {/* Profile Avatar */}
            <Pressable
              onPress={() => router.push('/(tabs)/profile')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.avatarBtn}
            >
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImage}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <MaterialIcons name="person" size={26} color="rgba(255,255,255,0.85)" />
              )}
            </Pressable>

            {/* Greeting */}
            <View style={styles.heroText}>
              <Text style={styles.greetingText}>{greeting}</Text>
              <Text style={styles.nameText}>{displayName}</Text>
              {profile ? <RoleBadge role={profile.role} /> : null}
            </View>
          </View>

          {/* XP progress strip */}
          {profile ? (
            <View style={styles.xpStrip}>
              <View style={styles.xpLabelRow}>
                <Text style={styles.xpPoints}>⭐ {profile.xp_points} XP</Text>
                <Text style={styles.xpLevel}>
                  المستوى {xpInfo.level} · {xpInfo.titleAr}
                </Text>
              </View>
              <View style={styles.xpTrack}>
                <LinearGradient
                  colors={[Colors.xpGold, '#FFB300']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.xpFill, { width: `${xpProgress}%` }]}
                />
              </View>
              <Text style={styles.xpNext}>
                {xpInfo.nextLevelXp - (profile.xp_points ?? 0)} نقطة للمستوى التالي
              </Text>
            </View>
          ) : null}
        </LinearGradient>

        {/* ── Educational Stages: 2×2 Grid ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="school" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>اختر مرحلتك الدراسية</Text>
          </View>

          {stagesLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>جارٍ تحميل المراحل...</Text>
            </View>
          ) : stagesError ? (
            <ErrorBox message={stagesError} onRetry={refresh} />
          ) : stages.length === 0 ? (
            <EmptyBox />
          ) : (
            <View style={styles.stagesGrid}>
              {stages.map((stage, index) => (
                <StageGridCard
                  key={stage.id}
                  stage={stage}
                  index={index}
                  onPress={() => handleStagePress(stage)}
                />
              ))}
            </View>
          )}
        </View>

        {/* ── Quick Shortcuts — BELOW stages ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="flash-on" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>وصول سريع</Text>
          </View>
          <View style={styles.shortcutsGrid}>
            {SHORTCUTS.map((shortcut, i) => (
              <Animated.View
                key={shortcut.id}
                entering={FadeInDown.delay(i * 60).duration(300).springify()}
                style={styles.shortcutWrapper}
              >
                <Pressable
                  onPress={() => handleShortcutPress(shortcut.route)}
                  style={({ pressed }) => [
                    styles.shortcutPressable,
                    pressed && { opacity: 0.85 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={shortcut.label}
                >
                  <LinearGradient
                    colors={[shortcut.color, shortcut.colorEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.shortcutCard}
                  >
                    <View style={styles.shortcutIconBg}>
                      <MaterialIcons name={shortcut.icon as any} size={24} color={shortcut.color} />
                    </View>
                    <Text style={styles.shortcutLabel}>{shortcut.label}</Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ── Quick Stats ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="bar-chart" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>إحصائياتي</Text>
          </View>
          <View style={styles.statsRow}>
            <StatPill icon="emoji-events" label="نقاط XP" value={String(profile?.xp_points ?? 0)} color={Colors.xpGold} />
            <StatPill icon="layers" label="المستوى" value={String(xpInfo.level)} color={Colors.primary} />
            <Pressable onPress={() => router.push('/statistics')} style={{ flex: 1 }}>
              <StatPill icon="analytics" label="تحليلاتي" value="→" color="#7C4DFF" />
            </Pressable>
          </View>
        </View>

        {/* ── Coming Soon strip ── */}
        <View style={styles.section}>
          <Card variant="filled" style={{}}>
            <View style={styles.comingRow}>
              <MaterialIcons name="rocket-launch" size={28} color={Colors.primary} />
              <View style={styles.comingText}>
                <Text style={styles.comingTitle}>اختبارات وشهادات قادمة 🚀</Text>
                <Text style={styles.comingDesc}>
                  قريباً: اختبر نفسك واحصل على شهادات موثّقة لكل مادة.
                </Text>
              </View>
            </View>
          </Card>
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stage Grid Card (2×2) ────────────────────────────────────────────────────

const CARD_SIZE = (width - Spacing.md * 2 - Spacing.sm) / 2;

function StageGridCard({
  stage,
  index,
  onPress,
}: {
  stage: Stage;
  index: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const bgImage = STAGE_IMAGES[stage.order_index] ?? STAGE_FALLBACK;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 90).duration(380).springify()}
      style={[gridStyles.wrapper, animStyle]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.93, { damping: 14 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 10 }); }}
        accessibilityRole="button"
        accessibilityLabel={stage.name_ar}
        style={gridStyles.pressable}
      >
        {/* Background image */}
        <Image
          source={bgImage}
          style={gridStyles.bgImage}
          contentFit="cover"
          transition={300}
        />

        {/* Gradient overlay */}
        <LinearGradient
          colors={[
            'transparent',
            stage.color_start + 'AA',
            stage.color_end + 'EE',
          ]}
          style={StyleSheet.absoluteFill}
          locations={[0.3, 0.65, 1]}
        />

        {/* Content */}
        <View style={gridStyles.content}>
          {/* Icon badge */}
          <View style={[gridStyles.iconBadge, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
            <MaterialIcons name={stage.icon as any} size={22} color="#FFFFFF" />
          </View>

          {/* Stage name */}
          <View style={gridStyles.textBlock}>
            <Text style={gridStyles.nameText} numberOfLines={2}>
              {stage.name_ar.replace('المرحلة ', '')}
            </Text>
            <Text style={gridStyles.nameEn} numberOfLines={1}>
              {stage.name_en}
            </Text>
          </View>
        </View>

        {/* Tap arrow */}
        <View style={gridStyles.arrow}>
          <MaterialIcons name="arrow-back" size={14} color="rgba(255,255,255,0.9)" />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const gridStyles = StyleSheet.create({
  wrapper: {
    width: CARD_SIZE,
    height: CARD_SIZE * 1.05,
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    ...(Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 14,
      },
      android: { elevation: 8 },
    }) as object),
  },
  pressable: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.xxl,
  },
  content: {
    padding: Spacing.sm,
    gap: 6,
  },
  iconBadge: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    backdropFilter: 'blur(4px)',
  },
  textBlock: {
    alignItems: 'flex-end',
  },
  nameText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.black,
    color: '#FFFFFF',
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    lineHeight: FontSize.md * 1.3,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  nameEn: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'right',
    includeFontPadding: false,
    marginTop: 1,
  },
  arrow: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
});

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={[styles.statPill, { borderColor: color + '30' }]}>
      <MaterialIcons name={icon as any} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Error / Empty ────────────────────────────────────────────────────────────

function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.errorBox}>
      <MaterialIcons name="error-outline" size={36} color={Colors.error} />
      <Text style={styles.errorText}>{message}</Text>
      <Pressable style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryText}>إعادة المحاولة</Text>
      </Pressable>
    </View>
  );
}

function EmptyBox() {
  return (
    <View style={styles.errorBox}>
      <MaterialIcons name="school" size={36} color={Colors.textHint} />
      <Text style={styles.errorText}>لا توجد مراحل دراسية بعد.</Text>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'صباح الخير،';
  if (h < 17) return 'مساء الخير،';
  return 'مساء النور،';
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1 },

  // Hero
  hero: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl + 8,
    borderBottomLeftRadius: Radius.xxl,
    borderBottomRightRadius: Radius.xxl,
    overflow: 'hidden',
  },
  heroCircle: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    top: -100,
    left: -80,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  avatarBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  heroText: { flex: 1, alignItems: 'flex-end' },
  greetingText: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  nameText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    marginBottom: Spacing.xs,
  },

  // XP
  xpStrip: { marginTop: Spacing.sm },
  xpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  xpPoints: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.xpGold,
    includeFontPadding: false,
  },
  xpLevel: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  xpTrack: {
    height: 7,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  xpNext: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    marginTop: 4,
  },

  // Section
  section: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },

  // 2×2 Grid
  stagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },

  // Shortcuts grid (2×2)
  shortcutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  shortcutWrapper: {
    width: (width - Spacing.md * 2 - Spacing.sm) / 2,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...(Shadows.sm as object),
  },
  shortcutPressable: { flex: 1 },
  shortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    minHeight: 60,
  },
  shortcutIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  shortcutLabel: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    lineHeight: FontSize.sm * 1.4,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statPill: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    ...(Shadows.sm as object),
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
    includeFontPadding: false,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    includeFontPadding: false,
    textAlign: 'center',
  },

  // Coming soon
  comingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  comingText: { flex: 1, alignItems: 'flex-end' },
  comingTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    marginBottom: Spacing.xs,
  },
  comingDesc: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    lineHeight: FontSize.sm * 1.7,
  },

  // Loading / Error
  loadingBox: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  errorBox: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
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
