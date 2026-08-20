/*
 * Madrasaty — Privacy Policy & Terms of Use Screen
 * (سياسة الاستخدام والخصوصية)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadows } from '@/constants/theme';

// ─── Policy Sections ──────────────────────────────────────────────────────────

const SECTIONS = [
  {
    icon: 'info',
    iconColor: '#1565C0',
    title: 'مقدمة',
    body: 'يلتزم تطبيق مدرستي بحماية خصوصية مستخدميه والحفاظ على بياناتهم الشخصية بالكامل وفقاً للمعايير الدولية لحماية البيانات. باستخدامك لهذا التطبيق، فأنت توافق على سياسة الخصوصية وشروط الاستخدام الواردة في هذه الوثيقة.',
  },
  {
    icon: 'database',
    iconColor: '#2E7D32',
    title: 'البيانات التي نجمعها',
    body: 'نجمع المعلومات الأساسية اللازمة لتقديم الخدمة: البريد الإلكتروني، اسم المستخدم، بيانات المدرسة والصف الدراسي، والمحافظة. نجمع أيضاً بيانات الأداء الدراسي (نتائج الاختبارات) لتحسين التوصيات التعليمية المخصصة لك.',
  },
  {
    icon: 'security',
    iconColor: '#7C4DFF',
    title: 'أمن البيانات',
    body: 'تُخزَّن جميع بياناتك على خوادم آمنة تستخدم تشفير SSL/TLS من الدرجة الأولى. لا يمكن لأي طرف ثالث الوصول إلى بياناتك الشخصية دون موافقتك الصريحة. نطبق أفضل ممارسات الأمن السيبراني لحماية خصوصيتك.',
  },
  {
    icon: 'privacy-tip',
    iconColor: '#E53935',
    title: 'حماية الأطفال',
    body: 'يُعدّ تطبيق مدرستي منصة تعليمية موجهة للطلاب من جميع الأعمار. نلتزم بالمعايير الدولية لحماية خصوصية الأطفال ولا نجمع أي بيانات حساسة غير ضرورية من المستخدمين دون الثمانية عشرة عاماً.',
  },
  {
    icon: 'psychology',
    iconColor: '#00897B',
    title: 'استخدام الذكاء الاصطناعي',
    body: 'يستخدم المعلم الذكي في مدرستي نماذج Gemini AI من Google لمعالجة أسئلتك التعليمية. لا تُستخدم محادثاتك لتدريب نماذج الذكاء الاصطناعي الخارجية ولا تُشارك مع أطراف ثالثة لأغراض تجارية.',
  },
  {
    icon: 'notifications',
    iconColor: '#F57C00',
    title: 'الإشعارات والتواصل',
    body: 'قد نرسل إليك إشعارات تعليمية وتنبيهات حول المحتوى الجديد. يمكنك إدارة تفضيلات الإشعارات في أي وقت من إعدادات التطبيق. لن نرسل إليك أي رسائل تسويقية دون موافقتك.',
  },
  {
    icon: 'edit',
    iconColor: '#6D4C41',
    title: 'حقوقك وتعديل البيانات',
    body: 'يحق لك في أي وقت: الاطلاع على بياناتك الشخصية، تعديلها من خلال ملفك الشخصي، أو طلب حذفها نهائياً بالتواصل مع فريق الدعم. سنستجيب لطلبك خلال 30 يوماً كحد أقصى.',
  },
  {
    icon: 'school',
    iconColor: '#3F51B5',
    title: 'المحتوى التعليمي',
    body: 'جميع المحتوى التعليمي على مدرستي محمي بحقوق الملكية الفكرية. لا يجوز نسخ أو توزيع أو إعادة نشر أي محتوى من التطبيق دون إذن كتابي مسبق. يُسمح بالاستخدام الشخصي للطلاب فقط.',
  },
  {
    icon: 'update',
    iconColor: '#43A047',
    title: 'تحديثات السياسة',
    body: 'نحتفظ بحق تحديث هذه السياسة في أي وقت لتعكس التغييرات في ممارساتنا أو متطلبات القانون. سنخطرك بأي تغييرات جوهرية عبر إشعار داخل التطبيق قبل سريان التحديث بـ 30 يوماً.',
  },
  {
    icon: 'gavel',
    iconColor: '#880E4F',
    title: 'الاختصاص القضائي',
    body: 'تخضع هذه الاتفاقية للقوانين المصرية المعمول بها. في حال نشوء أي نزاع، يُتفق على أن المحاكم المختصة في جمهورية مصر العربية هي الجهة الوحيدة للفصل في النزاعات.',
  },
];

export default function PrivacyScreen() {
  const router = useRouter();
  const { returnAccept } = useLocalSearchParams<{ returnAccept?: string }>();
  const isReturnFlow = returnAccept === 'true';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={['#4A148C', '#6A1B9A']}
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
            <Text style={styles.headerTitle}>سياسة الاستخدام والخصوصية</Text>
            <Text style={styles.headerSub}>آخر تحديث: يناير 2026</Text>
          </View>
          <View style={styles.headerIconCircle}>
            <MaterialIcons name="policy" size={26} color="#FFFFFF" />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Intro box */}
        <Animated.View entering={FadeInDown.delay(60).duration(300).springify()} style={styles.introBox}>
          <MaterialIcons name="verified-user" size={24} color="#6A1B9A" />
          <Text style={styles.introText}>
            خصوصيتك أولويتنا. نلتزم بحماية بياناتك وعدم مشاركتها مع أطراف ثالثة دون موافقتك الصريحة.
          </Text>
        </Animated.View>

        {/* Sections */}
        {SECTIONS.map((section, index) => (
          <Animated.View
            key={index}
            entering={FadeInDown.delay(80 + index * 40).duration(280).springify()}
            style={styles.sectionCard}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconCircle, { backgroundColor: section.iconColor + '15' }]}>
                <MaterialIcons name={section.icon as any} size={20} color={section.iconColor} />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </Animated.View>
        ))}

        {/* Contact for privacy */}
        <Animated.View entering={FadeInDown.delay(500).duration(320).springify()} style={styles.contactCard}>
          <LinearGradient
            colors={['#4A148C18', Colors.background]}
            style={styles.contactGradient}
          >
            <MaterialIcons name="mail" size={24} color="#6A1B9A" />
            <View style={styles.contactText}>
              <Text style={styles.contactTitle}>للاستفسار عن خصوصيتك</Text>
              <Text style={styles.contactEmail}>privacy@madrasaty.app</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <Text style={styles.footer}>
          © 2026 مدرستي. جميع الحقوق محفوظة.
        </Text>

        {/* Accept & Return button — shown when navigated from registration */}
        {isReturnFlow ? (
          <Pressable
            style={styles.acceptBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
          >
            <LinearGradient
              colors={['#4A148C', '#6A1B9A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.acceptGradient}
            >
              <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
              <Text style={styles.acceptText}>العودة والموافقة</Text>
            </LinearGradient>
          </Pressable>
        ) : null}

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
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    lineHeight: FontSize.xl * 1.3,
  },
  headerSub: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'right',
    includeFontPadding: false,
    marginTop: 3,
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

  scroll: { padding: Spacing.md, gap: Spacing.sm },

  introBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: '#F3E5F5',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#CE93D8',
    marginBottom: Spacing.xs,
  },
  introText: {
    flex: 1,
    fontSize: FontSize.base,
    color: '#4A148C',
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    lineHeight: FontSize.base * 1.7,
    fontWeight: FontWeight.medium,
  },

  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...(Shadows.sm as object),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    paddingBottom: Spacing.sm,
  },
  sectionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    flex: 1,
  },
  sectionBody: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    lineHeight: FontSize.sm * 1.8,
  },

  contactCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CE93D8',
    ...(Shadows.sm as object),
    marginTop: Spacing.sm,
  },
  contactGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  contactText: { flex: 1, alignItems: 'flex-end' },
  contactTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: '#4A148C',
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  contactEmail: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: '#6A1B9A',
    textAlign: 'right',
    includeFontPadding: false,
    marginTop: 2,
  },

  footer: {
    fontSize: FontSize.xs,
    color: Colors.textHint,
    textAlign: 'center',
    includeFontPadding: false,
    marginTop: Spacing.md,
  },

  acceptBtn: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  acceptGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 16,
    paddingHorizontal: Spacing.lg,
  },
  acceptText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
});
