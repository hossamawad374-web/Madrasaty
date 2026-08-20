/*
 * Madrasaty — Support & Help Screen (الدعم والمساعدة)
 * FAQ accordion + quick contact buttons
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAlert } from '@/template';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadows } from '@/constants/theme';

// ─── FAQ Data ─────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'كيف أبدأ الدراسة على مدرستي؟',
    a: 'بعد تسجيل الدخول، اختر مرحلتك الدراسية من الشاشة الرئيسية، ثم اختر الصف → الترم → المادة → الدرس. يمكنك مشاهدة الفيديو وقراءة الشرح والتفاعل مع المعلم الذكي في كل درس.',
  },
  {
    q: 'ما هو المعلم الذكي وكيف يعمل؟',
    a: 'المعلم الذكي هو مساعد تعليمي مدعوم بالذكاء الاصطناعي (Gemini AI). يمكنك طرح أي سؤال متعلق بالمنهج وسيجيبك فوراً بشرح مبسط يناسب مستواك الدراسي.',
  },
  {
    q: 'كيف أغيّر صورة ملفي الشخصي؟',
    a: 'اذهب إلى شاشة الإعدادات → تعديل الملف الشخصي، أو اضغط على صورة الملف في أعلى الصفحة الرئيسية. اضغط على الصورة واختر صورة جديدة من مكتبتك.',
  },
  {
    q: 'هل الدروس مجانية؟',
    a: 'بعض الدروس مجانية ومتاحة للجميع (تظهر بعلامة "مجاني"). الدروس المدفوعة تتطلب اشتراكاً مميزاً سيتوفر قريباً. في الوقت الحالي يمكنك الوصول إلى جميع المحتوى.',
  },
  {
    q: 'كيف تُحسب نقاط الخبرة (XP)؟',
    a: 'تكسب نقاط XP عند إكمال الدروس وإجراء الاختبارات. كل إجابة صحيحة في الاختبار تمنحك نقاطاً. تتراكم النقاط لترفع مستواك وتصعد في قائمة المتصدرين.',
  },
  {
    q: 'ما الفرق بين الترم الأول والترم الثاني؟',
    a: 'يعكس هيكل التطبيق المنهج الرسمي لوزارة التربية والتعليم المصرية. الترم الأول يشمل مقررات الفصل الدراسي الأول، والترم الثاني يشمل مقررات الفصل الثاني لكل صف دراسي.',
  },
  {
    q: 'كيف أُعيد تعيين كلمة المرور؟',
    a: 'في شاشة تسجيل الدخول، اضغط على "نسيت كلمة المرور؟"، أدخل بريدك الإلكتروني وسيصلك رابط إعادة التعيين فوراً.',
  },
  {
    q: 'هل يعمل التطبيق بدون إنترنت؟',
    a: 'حالياً يتطلب التطبيق اتصالاً بالإنترنت لتحميل المحتوى والتفاعل مع المعلم الذكي. ميزة الوصول دون إنترنت قيد التطوير وستتوفر في التحديثات القادمة.',
  },
];

// ─── Contact Data ─────────────────────────────────────────────────────────────

const CONTACT_OPTIONS = [
  {
    id: 'whatsapp',
    icon: 'chat',
    label: 'واتساب الدعم',
    sublabel: '+20 10 0000 0000',
    color: '#25D366',
    onPress: () => Linking.openURL('https://wa.me/201000000000?text=مرحباً%20أحتاج%20مساعدة%20في%20تطبيق%20مدرستي'),
  },
  {
    id: 'email',
    icon: 'email',
    label: 'البريد الإلكتروني',
    sublabel: 'support@madrasaty.app',
    color: '#EA4335',
    onPress: () => Linking.openURL('mailto:support@madrasaty.app?subject=دعم%20مدرستي'),
  },
  {
    id: 'phone',
    icon: 'phone',
    label: 'اتصل بنا',
    sublabel: '+20 10 0000 0000',
    color: '#1E88E5',
    onPress: () => Linking.openURL('tel:+201000000000'),
  },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SupportScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = useCallback((index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  }, []);

  const handleContact = useCallback(
    async (opt: (typeof CONTACT_OPTIONS)[0]) => {
      try {
        const canOpen = await Linking.canOpenURL(opt.onPress.toString());
        await opt.onPress();
      } catch {
        showAlert(
          'تعذّر الفتح',
          `يرجى التواصل معنا على: ${opt.sublabel}`,
          [{ text: 'حسناً' }]
        );
      }
    },
    [showAlert]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={['#1B5E20', '#2E7D32']}
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
            <Text style={styles.headerTitle}>الدعم والمساعدة</Text>
            <Text style={styles.headerSub}>نحن هنا لمساعدتك دائماً</Text>
          </View>
          <View style={styles.headerIconCircle}>
            <MaterialIcons name="support-agent" size={28} color="#FFFFFF" />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Quick Contact */}
        <Animated.View entering={FadeInDown.delay(60).duration(320).springify()}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="headset-mic" size={18} color="#2E7D32" />
            <Text style={styles.sectionTitle}>تواصل معنا</Text>
          </View>
          <View style={styles.contactGrid}>
            {CONTACT_OPTIONS.map((opt, i) => (
              <Animated.View
                key={opt.id}
                entering={FadeInDown.delay(80 + i * 60).duration(280).springify()}
                style={styles.contactCardWrapper}
              >
                <Pressable
                  onPress={() => {
                    opt.onPress().catch(() => {
                      showAlert('تعذّر الفتح', `يرجى التواصل: ${opt.sublabel}`, [{ text: 'حسناً' }]);
                    });
                  }}
                  style={({ pressed }) => [
                    styles.contactCard,
                    { borderColor: opt.color + '40' },
                    pressed && { opacity: 0.8 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={opt.label}
                >
                  <View style={[styles.contactIcon, { backgroundColor: opt.color + '15' }]}>
                    <MaterialIcons name={opt.icon as any} size={24} color={opt.color} />
                  </View>
                  <Text style={styles.contactLabel}>{opt.label}</Text>
                  <Text style={[styles.contactSublabel, { color: opt.color }]}>
                    {opt.sublabel}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* FAQ Section */}
        <Animated.View entering={FadeInDown.delay(280).duration(320).springify()}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="quiz" size={18} color="#2E7D32" />
            <Text style={styles.sectionTitle}>الأسئلة الشائعة</Text>
          </View>

          <View style={styles.faqList}>
            {FAQ_ITEMS.map((item, index) => (
              <FaqItem
                key={index}
                index={index}
                question={item.q}
                answer={item.a}
                isOpen={openFaqIndex === index}
                onToggle={() => toggleFaq(index)}
              />
            ))}
          </View>
        </Animated.View>

        {/* Still need help */}
        <Animated.View entering={FadeInDown.delay(420).duration(320).springify()} style={styles.helpCard}>
          <LinearGradient
            colors={[Colors.primarySurface, Colors.background]}
            style={styles.helpGradient}
          >
            <MaterialIcons name="live-help" size={28} color={Colors.primary} />
            <View style={styles.helpText}>
              <Text style={styles.helpTitle}>لم تجد إجابتك؟</Text>
              <Text style={styles.helpDesc}>
                تواصل معنا مباشرة عبر واتساب أو البريد الإلكتروني وسيرد عليك فريق الدعم خلال 24 ساعة.
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

function FaqItem({
  index,
  question,
  answer,
  isOpen,
  onToggle,
}: {
  index: number;
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const rotation = useSharedValue(0);
  const iconAnim = useAnimatedStyle(() => ({
    transform: [{ rotate: `${withTiming(isOpen ? 180 : 0, { duration: 200 })}deg` }],
  }));

  return (
    <View style={faqStyles.item}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [
          faqStyles.question,
          isOpen && faqStyles.questionOpen,
          pressed && { opacity: 0.85 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={question}
      >
        <Animated.View style={iconAnim}>
          <MaterialIcons
            name="keyboard-arrow-down"
            size={22}
            color={isOpen ? Colors.primary : Colors.textMuted}
          />
        </Animated.View>
        <Text style={[faqStyles.questionText, isOpen && { color: Colors.primary }]}>
          {question}
        </Text>
        <View style={[faqStyles.numBadge, isOpen && { backgroundColor: Colors.primary }]}>
          <Text style={[faqStyles.numText, isOpen && { color: '#FFFFFF' }]}>
            {String(index + 1).padStart(2, '0')}
          </Text>
        </View>
      </Pressable>

      {isOpen ? (
        <Animated.View entering={FadeInDown.duration(200)} style={faqStyles.answer}>
          <Text style={faqStyles.answerText}>{answer}</Text>
        </Animated.View>
      ) : null}
    </View>
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
    gap: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBlock: { flex: 1, alignItems: 'flex-end' },
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
  headerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  scroll: { padding: Spacing.md, gap: Spacing.md },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },

  // Contact
  contactGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  contactCardWrapper: {
    flex: 1,
  },
  contactCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1.5,
    ...(Shadows.sm as object),
    minHeight: 100,
    justifyContent: 'center',
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  contactLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  contactSublabel: {
    fontSize: FontSize.xs,
    includeFontPadding: false,
    textAlign: 'center',
  },

  // FAQ
  faqList: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },

  // Help card
  helpCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.primaryLighter,
    ...(Shadows.sm as object),
  },
  helpGradient: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  helpText: { flex: 1, alignItems: 'flex-end' },
  helpTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    marginBottom: Spacing.xs,
  },
  helpDesc: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    lineHeight: FontSize.sm * 1.7,
  },
});

const faqStyles = StyleSheet.create({
  item: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...(Shadows.sm as object),
  },
  question: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    minHeight: 56,
  },
  questionOpen: {
    backgroundColor: Colors.primarySurface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryLighter,
  },
  numBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  numText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    includeFontPadding: false,
  },
  questionText: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    lineHeight: FontSize.base * 1.4,
  },
  answer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primarySurface,
  },
  answerText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    lineHeight: FontSize.sm * 1.8,
  },
});
