/*
 * Madrasaty — Settings Screen (الإعدادات)
 * Grouped settings: Account, Preferences, Support, Community, Logout
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Share,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useAuth, useAlert } from '@/template';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Image } from 'expo-image';
import {
  Colors,
  FontSize,
  FontWeight,
  Radius,
  Spacing,
  Shadows,
} from '@/constants/theme';

// ─── Storage Keys ─────────────────────────────────────────────────────────────
const KEY_NOTIFICATIONS = 'madrasaty_notifications';
const KEY_LANGUAGE      = 'madrasaty_language';
const KEY_DARK_MODE     = 'madrasaty_dark_mode';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showAlert } = useAlert();
  const { profile } = useUserProfile();

  const [notifications, setNotifications] = useState(true);
  const [isArabic, setIsArabic]           = useState(true);
  const [darkMode, setDarkMode]           = useState(false);
  const [loggingOut, setLoggingOut]       = useState(false);
  const [prefsLoaded, setPrefsLoaded]     = useState(false);

  const displayName = profile?.username ?? user?.email?.split('@')[0] ?? 'طالب';

  // Load persisted prefs
  useEffect(() => {
    (async () => {
      try {
        const [n, l, d] = await Promise.all([
          AsyncStorage.getItem(KEY_NOTIFICATIONS),
          AsyncStorage.getItem(KEY_LANGUAGE),
          AsyncStorage.getItem(KEY_DARK_MODE),
        ]);
        if (n !== null) setNotifications(n === 'true');
        if (l !== null) setIsArabic(l === 'ar');
        if (d !== null) setDarkMode(d === 'true');
      } catch { /* silent */ }
      setPrefsLoaded(true);
    })();
  }, []);

  const toggleNotifications = useCallback(async (val: boolean) => {
    setNotifications(val);
    await AsyncStorage.setItem(KEY_NOTIFICATIONS, String(val));
  }, []);

  const toggleLanguage = useCallback(async (val: boolean) => {
    setIsArabic(val);
    await AsyncStorage.setItem(KEY_LANGUAGE, val ? 'ar' : 'en');
    showAlert(
      val ? 'اللغة العربية' : 'English',
      val ? 'سيتم تطبيق اللغة العربية عند إعادة تشغيل التطبيق.' : 'Language will apply on app restart.',
      [{ text: 'حسناً' }]
    );
  }, [showAlert]);

  const toggleDarkMode = useCallback(async (val: boolean) => {
    setDarkMode(val);
    await AsyncStorage.setItem(KEY_DARK_MODE, String(val));
    showAlert(
      val ? 'المظهر الداكن' : 'المظهر الفاتح',
      'سيتم تطبيق المظهر عند إعادة تشغيل التطبيق.',
      [{ text: 'حسناً' }]
    );
  }, [showAlert]);

  const handleShareApp = useCallback(async () => {
    try {
      await Share.share({
        message: 'حمّل تطبيق مدرستي — منصتك التعليمية الذكية لجميع المراحل الدراسية في مصر! 🎓',
        title: 'مدرستي | منصة التعلم الذكي',
      });
    } catch { /* silent */ }
  }, []);

  const handleRateApp = useCallback(() => {
    const url = Platform.OS === 'ios'
      ? 'itms-apps://itunes.apple.com/app/id000000000'
      : 'market://details?id=com.madrasaty.app';
    Linking.canOpenURL(url).then((can) => {
      if (can) Linking.openURL(url);
      else showAlert('تقييم التطبيق', 'يسعدنا تقييمك! ابحث عن "مدرستي" في متجر التطبيقات.', [{ text: 'حسناً' }]);
    });
  }, [showAlert]);

  const handleLogout = useCallback(() => {
    showAlert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج من حسابك؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تسجيل الخروج',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            const { error } = await logout();
            setLoggingOut(false);
            if (error) {
              showAlert('خطأ', 'فشل تسجيل الخروج. حاول مجدداً.', [{ text: 'حسناً' }]);
              return;
            }
            // Navigate to login after successful logout
            router.replace('/login');
          },
        },
      ]
    );
  }, [logout, showAlert, router]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Header ── */}
        <LinearGradient
          colors={[Colors.primaryDarker, Colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerDecoCircle} />
          <View style={styles.headerContent}>
            <Pressable
              onPress={() => router.push('/(tabs)/profile')}
              style={styles.headerAvatar}
              accessibilityRole="button"
              accessibilityLabel="الملف الشخصي"
            >
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.headerAvatarImg}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <MaterialIcons name="person" size={28} color="rgba(255,255,255,0.9)" />
              )}
            </Pressable>
            <View style={styles.headerText}>
              <Text style={styles.headerName}>{displayName}</Text>
              <Text style={styles.headerEmail}>{user?.email}</Text>
            </View>
          </View>
          <Text style={styles.headerTitle}>الإعدادات</Text>
        </LinearGradient>

        {/* ── Section 1: Account ── */}
        <SectionLabel icon="manage-accounts" title="الحساب" />
        <SettingsGroup>
          <SettingsRow
            icon="person"
            iconColor="#3F51B5"
            label="تعديل الملف الشخصي"
            onPress={() => router.push('/(tabs)/profile')}
          />
          <GroupDivider />
          <SettingsRow
            icon="workspace-premium"
            iconColor="#F9A825"
            label="الاشتراكات"
            badge="قريباً"
            onPress={() =>
              showAlert('الاشتراكات', 'ستتوفر خيارات الاشتراك المميز قريباً. ترقّبوا التحديثات!', [
                { text: 'حسناً' },
              ])
            }
          />
        </SettingsGroup>

        {/* ── Section 2: Preferences ── */}
        <SectionLabel icon="tune" title="تفضيلات التطبيق" />
        <SettingsGroup>
          {prefsLoaded ? (
            <>
              <SettingsToggleRow
                icon="notifications"
                iconColor="#E53935"
                label="الإشعارات"
                value={notifications}
                onValueChange={toggleNotifications}
              />
              <GroupDivider />
              <SettingsToggleRow
                icon="translate"
                iconColor="#00897B"
                label="لغة التطبيق"
                sublabel={isArabic ? 'العربية' : 'English'}
                value={isArabic}
                onValueChange={toggleLanguage}
              />
              <GroupDivider />
              <SettingsToggleRow
                icon="dark-mode"
                iconColor="#5C6BC0"
                label="المظهر الداكن"
                sublabel={darkMode ? 'مفعّل' : 'مُعطّل'}
                value={darkMode}
                onValueChange={toggleDarkMode}
              />
            </>
          ) : (
            <View style={styles.prefLoading}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          )}
        </SettingsGroup>

        {/* ── Section 3: Support & About ── */}
        <SectionLabel icon="help-outline" title="الدعم، السياسات ونبذة عن التطبيق" />
        <SettingsGroup>
          <SettingsRow
            icon="info"
            iconColor="#1565C0"
            label="نبذة عن التطبيق"
            onPress={() => router.push('/about')}
          />
          <GroupDivider />
          <SettingsRow
            icon="support-agent"
            iconColor="#43A047"
            label="الدعم والمساعدة"
            onPress={() => router.push('/support')}
          />
          <GroupDivider />
          <SettingsRow
            icon="policy"
            iconColor="#6D4C41"
            label="سياسة الاستخدام والخصوصية"
            onPress={() => router.push('/privacy')}
          />
        </SettingsGroup>

        {/* ── Section 4: Community ── */}
        <SectionLabel icon="groups" title="التفاعل" />
        <SettingsGroup>
          <SettingsRow
            icon="share"
            iconColor="#7C4DFF"
            label="مشاركة التطبيق"
            onPress={handleShareApp}
          />
          <GroupDivider />
          <SettingsRow
            icon="star"
            iconColor="#F9A825"
            label="تقييم التطبيق"
            onPress={handleRateApp}
          />
        </SettingsGroup>

        {/* ── Section 5: Logout ── */}
        <View style={styles.logoutSection}>
          <Pressable
            style={({ pressed }) => [
              styles.logoutBtn,
              pressed && { opacity: 0.8 },
              loggingOut && { opacity: 0.6 },
            ]}
            onPress={handleLogout}
            disabled={loggingOut}
            accessibilityRole="button"
            accessibilityLabel="تسجيل الخروج"
          >
            {loggingOut ? (
              <ActivityIndicator size="small" color={Colors.error} />
            ) : (
              <MaterialIcons name="logout" size={20} color={Colors.error} />
            )}
            <Text style={styles.logoutText}>
              {loggingOut ? 'جارٍ تسجيل الخروج...' : 'تسجيل الخروج'}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.version}>مدرستي — الإصدار 1.0.0</Text>
        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({
  icon,
  title,
}: {
  icon: string;
  title: string;
}) {
  return (
    <View style={sectionStyles.row}>
      <MaterialIcons name={icon as any} size={15} color={Colors.primary} />
      <Text style={sectionStyles.text}>{title}</Text>
    </View>
  );
}

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return <View style={groupStyles.container}>{children}</View>;
}

function GroupDivider() {
  return (
    <View style={groupStyles.divider}>
      <View style={groupStyles.dividerLine} />
    </View>
  );
}

function SettingsRow({
  icon,
  iconColor,
  label,
  sublabel,
  badge,
  onPress,
}: {
  icon: string;
  iconColor: string;
  label: string;
  sublabel?: string;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [rowStyles.row, pressed && { backgroundColor: Colors.borderLight }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {/* Icon badge */}
      <View style={[rowStyles.iconWrap, { backgroundColor: iconColor + '18' }]}>
        <MaterialIcons name={icon as any} size={20} color={iconColor} />
      </View>

      {/* Label */}
      <View style={rowStyles.labelWrap}>
        <Text style={rowStyles.label}>{label}</Text>
        {sublabel ? <Text style={rowStyles.sublabel}>{sublabel}</Text> : null}
      </View>

      {/* Right side */}
      <View style={rowStyles.right}>
        {badge ? (
          <View style={rowStyles.badge}>
            <Text style={rowStyles.badgeText}>{badge}</Text>
          </View>
        ) : null}
        <MaterialIcons name="arrow-back-ios" size={15} color={Colors.textHint} />
      </View>
    </Pressable>
  );
}

function SettingsToggleRow({
  icon,
  iconColor,
  label,
  sublabel,
  value,
  onValueChange,
}: {
  icon: string;
  iconColor: string;
  label: string;
  sublabel?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
}) {
  return (
    <View style={rowStyles.row}>
      {/* Icon badge */}
      <View style={[rowStyles.iconWrap, { backgroundColor: iconColor + '18' }]}>
        <MaterialIcons name={icon as any} size={20} color={iconColor} />
      </View>

      {/* Label */}
      <View style={rowStyles.labelWrap}>
        <Text style={rowStyles.label}>{label}</Text>
        {sublabel ? <Text style={rowStyles.sublabel}>{sublabel}</Text> : null}
      </View>

      {/* Toggle */}
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.borderLight, true: Colors.primaryLight }}
        thumbColor={value ? Colors.primary : Colors.textHint}
        ios_backgroundColor={Colors.borderLight}
        style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1 },

  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: Radius.xxl,
    borderBottomRightRadius: Radius.xxl,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  headerDecoCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    top: -80,
    left: -50,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  headerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  headerAvatarImg: { width: 52, height: 52, borderRadius: 26 },
  headerText: { flex: 1, alignItems: 'flex-end' },
  headerName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  headerEmail: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
    includeFontPadding: false,
    marginTop: 2,
  },
  headerTitle: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    alignSelf: 'flex-end',
  },

  prefLoading: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },

  logoutSection: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.error + '30',
    minHeight: 52,
  },
  logoutText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.error,
    writingDirection: 'rtl',
    includeFontPadding: false,
  },

  version: {
    fontSize: FontSize.xs,
    color: Colors.textHint,
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
    marginTop: Spacing.lg,
  },
});

const sectionStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

const groupStyles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...(Shadows.sm as object),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  divider: {
    paddingLeft: 60,
  },
  dividerLine: {
    height: 1,
    backgroundColor: Colors.divider,
    marginRight: Spacing.md,
  },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    minHeight: 56,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  labelWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  label: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  sublabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexShrink: 0,
  },
  badge: {
    backgroundColor: Colors.accentSurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.accent,
    includeFontPadding: false,
  },
});
