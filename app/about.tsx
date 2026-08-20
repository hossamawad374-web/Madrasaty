/*
 * Madrasaty — About the App Screen (نبذة عن التطبيق)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadows } from '@/constants/theme';

const FEATURES = [
  {
    icon: 'account-tree',
    color: '#2E7D32',
    text: 'تغطية شاملة للمناهج المصرية: تسلسل هرمي دقيق يغطي مرحلة رياض الأطفال (KG)، الابتدائية، الإعدادية، والثانوية مقسمة حسب الصفوف والفصول الدراسية (الترم الأول والثاني).',
  },
  {
    icon: 'psychology',
    color: '#3F51B5',
    text: 'المعلم الذكي (AI Teacher): مساعد تعليمي تفاعلي يعمل بالذكاء الاصطناعي للإجابة عن استفساراتك فوراً، وتبسيط الشروح الصعبة بأسلوب يناسب مستواك.',
  },
  {
    icon: 'analytics',
    color: '#7C4DFF',
    text: 'إحصائيات وتحليلات حقيقية للأداء: نظام ذكي يتتبع نتائج اختباراتك الفعلية، يحدد نقاط قوتك والمواضيع التي تحتاج إلى مراجعة، ويقدم لك توصيات مخصصة لتحسين مستواك.',
  },
  {
    icon: 'play-circle-filled',
    color: '#E53935',
    text: 'تجربة الدرس المتكاملة: تحتوي صفحة كل درس على فيديو شرح تفاعلي، ملخص لأهم النقاط، شرح كتابي مفصل، واختبار قياس مدى الاستيعاب.',
  },
  {
    icon: 'language',
    color: '#00897B',
    text: 'تطوير اللغات والمهارات: قسم خاص لكورسات اللغة الإنجليزية والمراجع الخارجية لتأسيس مهارات الطالب بشكل موازي للمنهج الدراسي.',
  },
  {
    icon: 'devices',
    color: '#F57C00',
    text: 'واجهة تفاعلية وعصرية: تصميم مرن وسلس يدعم المظهرين الليلي والنهاري، مع إمكانية تخصيص الملف الشخصي وتتبع الإنجازات اليومية.',
  },
];

export default function AboutScreen() {
  const router = useRouter();

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
          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle}>نبذة عن التطبيق</Text>
            <Text style={styles.headerSub}>مدرستي — منصة التعلم الذكي</Text>
          </View>
        </View>

        {/* App logo / icon display */}
        <View style={styles.appIconRow}>
          <View style={styles.appIconCircle}>
            <MaterialIcons name="school" size={40} color={Colors.primary} />
          </View>
          <View style={styles.appTitleBlock}>
            <Text style={styles.appName}>مدرستي</Text>
            <Text style={styles.appVersion}>الإصدار 1.0.0</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Intro paragraph */}
        <Animated.View entering={FadeInDown.delay(80).duration(350).springify()} style={styles.card}>
          <Text style={styles.introParagraph}>
            تطبيق "مدرستي" هو المنصة التعليمية الذكية الشاملة المصممة خصيصاً لدعم الطلاب في مختلف المراحل الدراسية داخل مصر، حيث يدمج بين أساليب التعلم الحديثة وتقنيات الذكاء الاصطناعي ليقدم تجربة تفاعلية ممتعة واحترافية.
          </Text>
        </Animated.View>

        {/* Vision */}
        <Animated.View entering={FadeInDown.delay(140).duration(350).springify()} style={styles.visionCard}>
          <LinearGradient
            colors={[Colors.primarySurface, Colors.background]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.visionGradient}
          >
            <View style={styles.visionHeader}>
              <MaterialIcons name="visibility" size={22} color={Colors.primary} />
              <Text style={styles.visionTitle}>رؤيتنا</Text>
            </View>
            <Text style={styles.visionText}>
              تمكين كل طالب من تحقيق أقصى درجات التفوق الأكاديمي، من خلال توفير بيئة تعليمية شائقة ومحتوى موثوق يتوافق تماماً مع المعايير الرسمية لوزارة التربية والتعليم المصرية.
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Features */}
        <Animated.View entering={FadeInDown.delay(200).duration(350).springify()} style={styles.featuresSection}>
          <View style={styles.featuresTitleRow}>
            <MaterialIcons name="star" size={20} color={Colors.xpGold} />
            <Text style={styles.featuresTitle}>أبرز ميزات المنصة:</Text>
          </View>

          {FEATURES.map((feat, i) => (
            <Animated.View
              key={i}
              entering={FadeInDown.delay(240 + i * 60).duration(300).springify()}
              style={styles.featureRow}
            >
              <View style={[styles.featureIconCircle, { backgroundColor: feat.color + '18' }]}>
                <MaterialIcons name={feat.icon as any} size={20} color={feat.color} />
              </View>
              <View style={styles.featureBullet}>
                <Text style={styles.bulletDot}>●</Text>
              </View>
              <Text style={styles.featureText}>{feat.text}</Text>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Tagline */}
        <Animated.View entering={FadeInDown.delay(650).duration(400).springify()} style={styles.taglineCard}>
          <LinearGradient
            colors={[Colors.primaryDarker, Colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.taglineGradient}
          >
            <MaterialIcons name="auto-awesome" size={28} color="#FFD54F" />
            <Text style={styles.taglineText}>
              مدرستي.. معلمك الذكي ورفيق تفوقك في كل خطوة!
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Footer info */}
        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>© 2026 مدرستي. جميع الحقوق محفوظة.</Text>
          <Text style={styles.footerText}>صُنع بـ ❤️ في مصر</Text>
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: Radius.xxl,
    borderBottomRightRadius: Radius.xxl,
    gap: Spacing.md,
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
  headerTitleBlock: { flex: 1, alignItems: 'flex-end', paddingLeft: Spacing.sm },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  headerSub: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
    includeFontPadding: false,
    marginTop: 2,
  },
  appIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  appIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
    }) as object),
  },
  appTitleBlock: { alignItems: 'flex-end' },
  appName: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.black,
    color: '#FFFFFF',
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  appVersion: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'right',
    includeFontPadding: false,
    marginTop: 3,
  },

  scroll: { padding: Spacing.md, gap: Spacing.md },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    ...(Shadows.sm as object),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  introParagraph: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    lineHeight: FontSize.base * 1.8,
  },

  visionCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...(Shadows.sm as object),
    borderWidth: 1.5,
    borderColor: Colors.primaryLighter,
  },
  visionGradient: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  visionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  visionTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
    color: Colors.primary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  visionText: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    lineHeight: FontSize.base * 1.8,
  },

  featuresSection: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.md,
    ...(Shadows.sm as object),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featuresTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    paddingBottom: Spacing.sm,
  },
  featuresTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  featureIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  featureBullet: {
    paddingTop: 4,
    flexShrink: 0,
  },
  bulletDot: {
    fontSize: 8,
    color: Colors.primary,
    lineHeight: 14,
  },
  featureText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    lineHeight: FontSize.sm * 1.8,
  },

  taglineCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...(Shadows.md as object),
  },
  taglineGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  taglineText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.black,
    color: '#FFFFFF',
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
    lineHeight: FontSize.lg * 1.6,
  },

  footerInfo: {
    alignItems: 'center',
    gap: 4,
    paddingTop: Spacing.sm,
  },
  footerText: {
    fontSize: FontSize.xs,
    color: Colors.textHint,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
