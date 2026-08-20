/*
 * Madrasaty — Student Statistics Screen (إحصائيات الطالب)
 * Real quiz data + Gemini AI personalized performance analysis
 * Route: /statistics
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAuth } from '@/template';
import { useUserProfile } from '@/hooks/useUserProfile';
import { quizService, StudentStats, SubjectPerformance } from '@/services/quizService';
import { getSupabaseClient } from '@/template';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadows } from '@/constants/theme';

// ─── AI Analysis Types ───────────────────────────────────────────────────────

interface AIAnalysis {
  strengths: string[];
  improvements: string[];
  advice: string;
}

// ─── Skeleton Pulse ──────────────────────────────────────────────────────────

function SkeletonPulse({ style }: { style?: object }) {
  const opacity = useSharedValue(0.35);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 750 }), withTiming(0.35, { duration: 750 })),
      -1,
      true
    );
  }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[{ backgroundColor: Colors.borderLight, borderRadius: Radius.md }, style, animStyle]}
    />
  );
}

// ─── Accuracy Ring ────────────────────────────────────────────────────────────

function AccuracyRing({ value, color, size = 120 }: { value: number; color: string; size?: number }) {
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });
  }, []);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const getLabel = (v: number) => {
    if (v >= 80) return 'ممتاز';
    if (v >= 60) return 'جيد';
    if (v >= 40) return 'متوسط';
    return 'يحتاج مراجعة';
  };

  const ringColor = value >= 70 ? Colors.success : value >= 40 ? Colors.warning : Colors.error;

  return (
    <Animated.View style={[ringStyles.container, { width: size, height: size }, animStyle]}>
      <View
        style={[
          ringStyles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: ringColor,
            borderWidth: size * 0.07,
            backgroundColor: ringColor + '18',
          },
        ]}
      >
        <Text style={[ringStyles.value, { fontSize: size * 0.26, color: ringColor }]}>
          {value}%
        </Text>
        <Text style={[ringStyles.label, { fontSize: size * 0.11, color: ringColor }]}>
          {getLabel(value)}
        </Text>
      </View>
    </Animated.View>
  );
}

const ringStyles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  ring: { alignItems: 'center', justifyContent: 'center' },
  value: { fontWeight: FontWeight.black, includeFontPadding: false },
  label: { fontWeight: FontWeight.semibold, includeFontPadding: false, marginTop: 2 },
});

// ─── Subject Bar ──────────────────────────────────────────────────────────────

function SubjectBar({ subject, index }: { subject: SubjectPerformance; index: number }) {
  const barWidth = useSharedValue(0);
  useEffect(() => {
    barWidth.value = withTiming(subject.accuracy, { duration: 800 + index * 120 });
  }, [subject.accuracy]);
  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
  }));

  const barColor =
    subject.accuracy >= 70 ? Colors.success
    : subject.accuracy >= 40 ? Colors.warning
    : Colors.error;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(300)}
      style={subBarStyles.row}
    >
      <View style={subBarStyles.labelRow}>
        <Text style={subBarStyles.accuracy}>{subject.accuracy}%</Text>
        <View style={subBarStyles.nameRow}>
          <Text style={subBarStyles.attempts}>{subject.attempts} محاولة</Text>
          <Text style={subBarStyles.name}>{subject.subject_name_ar}</Text>
        </View>
      </View>
      <View style={subBarStyles.track}>
        <Animated.View style={[subBarStyles.fill, { backgroundColor: barColor }, barStyle]} />
      </View>
    </Animated.View>
  );
}

const subBarStyles = StyleSheet.create({
  row: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  attempts: {
    fontSize: FontSize.xs,
    color: Colors.textHint,
    includeFontPadding: false,
  },
  accuracy: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
    minWidth: 40,
    textAlign: 'left',
  },
  track: {
    height: 10,
    backgroundColor: Colors.borderLight,
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
});

// ─── AI Analysis Card ─────────────────────────────────────────────────────────

function AIAnalysisCard({
  analysis,
  loading,
  onRegenerate,
}: {
  analysis: AIAnalysis | null;
  loading: boolean;
  onRegenerate: () => void;
}) {
  if (loading) {
    return (
      <View style={aiCardStyles.container}>
        <View style={aiCardStyles.header}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={aiCardStyles.headerText}>المعلم الذكي يحلل أداءك...</Text>
          <MaterialIcons name="psychology" size={22} color={Colors.primary} />
        </View>
        <View style={aiCardStyles.skeletons}>
          <SkeletonPulse style={{ height: 16, marginBottom: 8 }} />
          <SkeletonPulse style={{ height: 16, width: '85%', marginBottom: 8 }} />
          <SkeletonPulse style={{ height: 16, width: '70%', marginBottom: 16 }} />
          <SkeletonPulse style={{ height: 14, width: '90%', marginBottom: 8 }} />
          <SkeletonPulse style={{ height: 14, width: '75%' }} />
        </View>
      </View>
    );
  }

  if (!analysis) {
    return (
      <View style={aiCardStyles.container}>
        <View style={aiCardStyles.header}>
          <MaterialIcons name="psychology" size={22} color={Colors.primary} />
          <Text style={aiCardStyles.headerText}>تحليل المعلم الذكي</Text>
        </View>
        <Text style={aiCardStyles.emptyText}>
          أكمل اختبارات الدروس لتحصل على تحليل مخصص من المعلم الذكي.
        </Text>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeInUp.duration(400)} style={aiCardStyles.container}>
      {/* Header */}
      <View style={aiCardStyles.header}>
        <Pressable
          onPress={onRegenerate}
          style={aiCardStyles.refreshBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="refresh" size={18} color={Colors.primary} />
        </Pressable>
        <Text style={aiCardStyles.headerText}>تحليل المعلم الذكي</Text>
        <View style={aiCardStyles.aiIconBg}>
          <MaterialIcons name="psychology" size={20} color="#FFFFFF" />
        </View>
      </View>

      {/* Strengths */}
      {analysis.strengths.length > 0 ? (
        <View style={aiCardStyles.section}>
          <View style={aiCardStyles.sectionHeader}>
            <Text style={[aiCardStyles.sectionTitle, { color: Colors.success }]}>نقاط القوة</Text>
            <MaterialIcons name="star" size={18} color={Colors.success} />
          </View>
          {analysis.strengths.map((s, i) => (
            <View key={i} style={aiCardStyles.bulletRow}>
              <Text style={[aiCardStyles.bullet, { color: Colors.success }]}>✦</Text>
              <Text style={aiCardStyles.bulletText}>{s}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Areas for Improvement */}
      {analysis.improvements.length > 0 ? (
        <View style={[aiCardStyles.section, { borderTopWidth: 1, borderTopColor: Colors.divider }]}>
          <View style={aiCardStyles.sectionHeader}>
            <Text style={[aiCardStyles.sectionTitle, { color: Colors.warning }]}>تحتاج إلى تحسين</Text>
            <MaterialIcons name="trending-up" size={18} color={Colors.warning} />
          </View>
          {analysis.improvements.map((s, i) => (
            <View key={i} style={aiCardStyles.bulletRow}>
              <Text style={[aiCardStyles.bullet, { color: Colors.warning }]}>◆</Text>
              <Text style={aiCardStyles.bulletText}>{s}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* AI Advice */}
      <View style={[aiCardStyles.adviceBox]}>
        <MaterialIcons name="lightbulb" size={18} color={Colors.primary} />
        <Text style={aiCardStyles.adviceText}>{analysis.advice}</Text>
      </View>
    </Animated.View>
  );
}

const aiCardStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...(Shadows.md as object),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.primarySurface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    flex: 1,
    marginHorizontal: 8,
  },
  aiIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletons: { padding: Spacing.md },
  emptyText: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
    padding: Spacing.md,
    lineHeight: FontSize.base * 1.7,
  },
  section: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    includeFontPadding: false,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    fontSize: 10,
    marginTop: 5,
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    lineHeight: FontSize.base * 1.6,
  },
  adviceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.primarySurface,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  adviceText: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.primary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    lineHeight: FontSize.base * 1.7,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function StatisticsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const [stats, setStats] = useState<StudentStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Load stats
  const loadStats = useCallback(async () => {
    if (!user) return;
    setStatsLoading(true);
    setStatsError(null);
    const { data, error } = await quizService.getStudentStats(user.id);
    if (error) {
      setStatsError(error);
    } else {
      setStats(data);
    }
    setStatsLoading(false);
  }, [user]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Generate AI analysis when stats load
  useEffect(() => {
    if (stats && stats.total_attempts > 0) {
      generateAiAnalysis(stats);
    }
  }, [stats]);

  const generateAiAnalysis = useCallback(async (studentStats: StudentStats) => {
    setAiLoading(true);
    setAiAnalysis(null);

    try {
      const supabase = getSupabaseClient();

      // Build a performance summary for the AI
      const subjectSummary = studentStats.subjects.map((s) =>
        `- ${s.subject_name_ar}: ${s.accuracy}% دقة (${s.attempts} محاولة)`
      ).join('\n');

      const prompt = `أنت معلم ذكي متخصص في تحليل أداء الطلاب المصريين.

بيانات أداء الطالب:
- الدقة الإجمالية: ${studentStats.overall_accuracy}%
- عدد الاختبارات المكتملة: ${studentStats.total_attempts}
- الأداء حسب المواد:
${subjectSummary}

المطلوب: حلل هذه البيانات وأعطني تقريراً موجزاً بالتنسيق التالي (بدون عناوين إضافية):

STRENGTHS:
• [نقطة قوة 1]
• [نقطة قوة 2]

IMPROVEMENTS:
• [مجال تحسين 1]
• [مجال تحسين 2]

ADVICE:
[جملة نصيحة واحدة موجزة ومحفزة]

اجعل التحليل مخصصاً وعملياً ومبنياً على البيانات الفعلية أعلاه.`;

      const messages = [{ role: 'user', content: prompt }];

      const { data: fnData, error: fnError } = await supabase.functions.invoke('ai-tutor', {
        body: { messages, subjectContext: null },
      });

      if (fnError) {
        let errorMessage = fnError.message;
        if (fnError instanceof FunctionsHttpError) {
          try {
            const textContent = await fnError.context?.text();
            errorMessage = textContent || fnError.message;
          } catch {
            errorMessage = fnError.message;
          }
        }
        console.error('AI analysis error:', errorMessage);
        setAiLoading(false);
        return;
      }

      // Parse the AI response
      const responseText = typeof fnData === 'string' ? fnData : JSON.stringify(fnData);
      const parsed = parseAIResponse(responseText);
      setAiAnalysis(parsed);
    } catch (err) {
      console.error('generateAiAnalysis error:', err);
    } finally {
      setAiLoading(false);
    }
  }, []);

  function parseAIResponse(text: string): AIAnalysis {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const strengths: string[] = [];
    const improvements: string[] = [];
    let advice = '';
    let section: 'none' | 'strengths' | 'improvements' | 'advice' = 'none';

    for (const line of lines) {
      const l = line.toLowerCase();
      if (l.includes('strength') || l.includes('نقاط القوة') || l.includes('strength')) {
        section = 'strengths';
        continue;
      }
      if (l.includes('improvement') || l.includes('تحسين') || l.includes('improve')) {
        section = 'improvements';
        continue;
      }
      if (l.includes('advice') || l.includes('نصيحة') || l.includes('توصية')) {
        section = 'advice';
        continue;
      }

      const bullet = line.replace(/^[•\-\*\d\.]+\s*/, '').trim();
      if (!bullet) continue;

      if (section === 'strengths') strengths.push(bullet);
      else if (section === 'improvements') improvements.push(bullet);
      else if (section === 'advice') advice = (advice ? advice + ' ' : '') + bullet;
    }

    // Fallback if parsing fails
    if (strengths.length === 0 && improvements.length === 0) {
      const fullText = lines.join(' ');
      return {
        strengths: ['استمر في العمل الجاد وتحسين مستواك'],
        improvements: ['راجع المواد التي حصلت فيها على دقة أقل من 60%'],
        advice: fullText.slice(0, 200) || 'واصل التعلم وحافظ على ممارسة الاختبارات بانتظام.',
      };
    }

    return {
      strengths: strengths.slice(0, 3),
      improvements: improvements.slice(0, 3),
      advice: advice || 'واصل التعلم المنتظم وراجع نقاط الضعف أسبوعياً.',
    };
  }

  const handleRegenerate = useCallback(() => {
    if (stats && stats.total_attempts > 0) {
      generateAiAnalysis(stats);
    }
  }, [stats, generateAiAnalysis]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.primaryDarker, Colors.primary]}
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
            <Text style={styles.headerSubtitle}>لوحة الإحصائيات</Text>
            <Text style={styles.headerName}>أداء الطالب</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {statsLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>جارٍ تحميل الإحصائيات...</Text>
          </View>
        ) : statsError ? (
          <View style={styles.errorBox}>
            <MaterialIcons name="error-outline" size={40} color={Colors.error} />
            <Text style={styles.errorText}>{statsError}</Text>
            <Pressable style={styles.retryBtn} onPress={loadStats}>
              <Text style={styles.retryText}>إعادة المحاولة</Text>
            </Pressable>
          </View>
        ) : !stats || stats.total_attempts === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Overall accuracy ring */}
            <Animated.View
              entering={ZoomIn.duration(500).springify()}
              style={styles.overallCard}
            >
              <LinearGradient
                colors={[Colors.primaryDarker, Colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.overallGradient}
              >
                <View style={styles.overallRow}>
                  <View style={styles.overallStats}>
                    <View style={styles.overallStat}>
                      <Text style={styles.overallStatValue}>{stats.total_attempts}</Text>
                      <Text style={styles.overallStatLabel}>اختبار مكتمل</Text>
                    </View>
                    <View style={styles.overallDivider} />
                    <View style={styles.overallStat}>
                      <Text style={styles.overallStatValue}>{stats.subjects.length}</Text>
                      <Text style={styles.overallStatLabel}>مادة مدروسة</Text>
                    </View>
                  </View>
                  <AccuracyRing value={stats.overall_accuracy} color={Colors.primary} size={130} />
                </View>
                <Text style={styles.overallLabel}>الدقة الإجمالية</Text>
              </LinearGradient>
            </Animated.View>

            {/* Subject breakdown */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="bar-chart" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>الأداء حسب المادة</Text>
              </View>
              <View style={styles.subjectsCard}>
                {stats.subjects.map((subject, i) => (
                  <SubjectBar key={subject.subject_id} subject={subject} index={i} />
                ))}
              </View>
            </View>

            {/* AI Analysis */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="psychology" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>تحليل المعلم الذكي</Text>
              </View>
              <AIAnalysisCard
                analysis={aiAnalysis}
                loading={aiLoading}
                onRegenerate={handleRegenerate}
              />
            </View>

            {/* Performance legend */}
            <View style={styles.section}>
              <View style={styles.legendRow}>
                <LegendDot color={Colors.success} label="ممتاز (≥70%)" />
                <LegendDot color={Colors.warning} label="جيد (40–69%)" />
                <LegendDot color={Colors.error} label="يحتاج مراجعة (<40%)" />
              </View>
            </View>
          </>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyState}>
      <MaterialIcons name="analytics" size={72} color={Colors.textHint} />
      <Text style={styles.emptyTitle}>لا توجد إحصائيات بعد</Text>
      <Text style={styles.emptyText}>
        أكمل اختبارات الدروس لترى تحليلاً مفصلاً لأدائك ونصائح المعلم الذكي.
      </Text>
      <View style={styles.emptyTip}>
        <MaterialIcons name="lightbulb" size={16} color={Colors.xpGold} />
        <Text style={styles.emptyTipText}>
          انتقل إلى أي درس واختر تبويب "اختبار" لتبدأ
        </Text>
      </View>
    </Animated.View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={legendStyles.row}>
      <Text style={legendStyles.label}>{label}</Text>
      <View style={[legendStyles.dot, { backgroundColor: color }]} />
    </View>
  );
}

const legendStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { fontSize: FontSize.xs, color: Colors.textMuted, includeFontPadding: false },
});

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
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, alignItems: 'flex-end' },
  headerSubtitle: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.75)',
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

  scroll: { padding: Spacing.md, paddingTop: Spacing.lg, gap: Spacing.md },

  // Overall card
  overallCard: {
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    ...(Shadows.lg as object),
  },
  overallGradient: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  overallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overallStats: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingLeft: Spacing.sm,
  },
  overallStat: { alignItems: 'center', gap: 4 },
  overallStatValue: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.black,
    color: '#FFFFFF',
    includeFontPadding: false,
  },
  overallStatLabel: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.75)',
    writingDirection: 'rtl',
    includeFontPadding: false,
    textAlign: 'center',
  },
  overallDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  overallLabel: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },

  // Section
  section: { gap: Spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },

  // Subjects card
  subjectsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.md,
    ...(Shadows.sm as object),
  },

  // Legend
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'flex-end',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  emptyText: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
    lineHeight: FontSize.base * 1.75,
    paddingHorizontal: Spacing.md,
  },
  emptyTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.xpGoldLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.xpGold + '50',
  },
  emptyTipText: {
    fontSize: FontSize.sm,
    color: Colors.xpGoldDark,
    fontWeight: FontWeight.medium,
    writingDirection: 'rtl',
    includeFontPadding: false,
  },

  loadingBox: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
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
    paddingVertical: Spacing.xxl,
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
    includeFontPadding: false,
  },
});
