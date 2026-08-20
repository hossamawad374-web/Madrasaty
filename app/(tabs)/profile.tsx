/*
 * Madrasaty — Profile Screen (حسابي)
 * Full student profile with Egyptian school fields + Edit Modal
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuth, useAlert, getSupabaseClient } from '@/template';
import { useRouter } from 'expo-router';
import { useUserProfile } from '@/hooks/useUserProfile';
import { userService, UpdateProfilePayload, EGYPTIAN_GOVERNORATES } from '@/services/userService';
import { XpBadge, RoleBadge, Card } from '@/components';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadows } from '@/constants/theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const GENDERS = [
  { value: 'male', label: 'ذكر', icon: 'man' as const },
  { value: 'female', label: 'أنثى', icon: 'woman' as const },
];

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const MONTHS = [
  '01 - يناير', '02 - فبراير', '03 - مارس', '04 - أبريل',
  '05 - مايو', '06 - يونيو', '07 - يوليو', '08 - أغسطس',
  '09 - سبتمبر', '10 - أكتوبر', '11 - نوفمبر', '12 - ديسمبر',
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 60 }, (_, i) => String(currentYear - 5 - i));

function getRoleLabel(role: string): string {
  const map: Record<string, string> = { STUDENT: 'طالب', TEACHER: 'معلم', ADMIN: 'مشرف' };
  return map[role] ?? 'طالب';
}

function formatDateDisplay(iso: string | null): string {
  if (!iso) return 'غير محدد';
  try {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  } catch {
    return iso;
  }
}

// ─── Edit Profile Modal ───────────────────────────────────────────────────────

interface EditModalProps {
  visible: boolean;
  onClose: () => void;
}

type PickerMode = 'governorate' | 'dob-day' | 'dob-month' | 'dob-year' | null;

function EditProfileModal({ visible, onClose }: EditModalProps) {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { profile, refreshProfile, updateProfileLocally } = useUserProfile();
  const insets = useSafeAreaInsets();

  const [saving, setSaving] = useState(false);
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);

  // Form state
  const [username, setUsername] = useState(profile?.username ?? '');
  const [schoolName, setSchoolName] = useState(profile?.school_name ?? '');
  const [governorate, setGovernorate] = useState(profile?.governorate ?? '');
  const [gender, setGender] = useState(profile?.gender ?? '');
  const [guardianPhone, setGuardianPhone] = useState(profile?.guardian_phone ?? '');

  // Date of birth broken into parts
  const dobParts = profile?.date_of_birth ? profile.date_of_birth.split('-') : ['', '', ''];
  const [dobYear, setDobYear] = useState(dobParts[0] ?? '');
  const [dobMonth, setDobMonth] = useState(dobParts[1] ?? '');
  const [dobDay, setDobDay] = useState(dobParts[2] ?? '');

  // Reset form when modal opens
  const resetForm = useCallback(() => {
    setUsername(profile?.username ?? '');
    setSchoolName(profile?.school_name ?? '');
    setGovernorate(profile?.governorate ?? '');
    setGender(profile?.gender ?? '');
    setGuardianPhone(profile?.guardian_phone ?? '');
    const parts = profile?.date_of_birth ? profile.date_of_birth.split('-') : ['', '', ''];
    setDobYear(parts[0] ?? '');
    setDobMonth(parts[1] ?? '');
    setDobDay(parts[2] ?? '');
    setPickerMode(null);
  }, [profile]);

  React.useEffect(() => {
    if (visible) resetForm();
  }, [visible]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    // Build date_of_birth ISO string
    let dob: string | null = null;
    if (dobYear && dobMonth && dobDay) {
      const monthNum = dobMonth.split(' - ')[0];
      dob = `${dobYear}-${monthNum}-${dobDay}`;
    }

    const payload: UpdateProfilePayload = {
      username: username.trim() || null,
      school_name: schoolName.trim(),
      governorate,
      gender,
      guardian_phone: guardianPhone.trim(),
      date_of_birth: dob,
    };

    const { error } = await userService.updateProfile(user.id, payload);
    setSaving(false);

    if (error) {
      showAlert('خطأ في الحفظ', error, [{ text: 'حسناً' }]);
      return;
    }

    // Optimistic local update
    updateProfileLocally({
      username: username.trim() || null,
      school_name: schoolName.trim(),
      governorate,
      gender,
      guardian_phone: guardianPhone.trim(),
      date_of_birth: dob,
    });
    await refreshProfile();
    showAlert('تم الحفظ', 'تم تحديث ملفك الشخصي بنجاح.', [{ text: 'حسناً' }]);
    onClose();
  };

  // Picker data
  const pickerData =
    pickerMode === 'governorate' ? EGYPTIAN_GOVERNORATES
    : pickerMode === 'dob-day' ? DAYS
    : pickerMode === 'dob-month' ? MONTHS
    : pickerMode === 'dob-year' ? YEARS
    : [];

  const pickerTitle =
    pickerMode === 'governorate' ? 'اختر المحافظة'
    : pickerMode === 'dob-day' ? 'اختر اليوم'
    : pickerMode === 'dob-month' ? 'اختر الشهر'
    : 'اختر السنة';

  const handlePickerSelect = (val: string) => {
    if (pickerMode === 'governorate') setGovernorate(val);
    else if (pickerMode === 'dob-day') setDobDay(val.split(' ')[0]);
    else if (pickerMode === 'dob-month') setDobMonth(val);
    else if (pickerMode === 'dob-year') setDobYear(val);
    setPickerMode(null);
  };

  const displayDob = (() => {
    if (!dobDay || !dobMonth || !dobYear) return 'اختر تاريخ الميلاد';
    const monthNum = dobMonth.split(' - ')[0];
    return `${dobDay}/${monthNum}/${dobYear}`;
  })();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={editStyles.container} edges={['top']}>
        {/* ── Header ── */}
        <View style={editStyles.header}>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={editStyles.closeBtn}
          >
            <MaterialIcons name="close" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={editStyles.headerTitle}>تعديل الملف الشخصي</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[editStyles.saveBtn, saving && { opacity: 0.6 }]}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.textOnPrimary} />
            ) : (
              <Text style={editStyles.saveBtnText}>حفظ</Text>
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={[
              editStyles.scroll,
              { paddingBottom: insets.bottom + 32 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Section: Personal ── */}
            <SectionHeader icon="person" title="المعلومات الشخصية" />

            <EditField label="الاسم (الكنية / اسم المستخدم)" icon="badge">
              <TextInput
                style={editStyles.textInput}
                value={username}
                onChangeText={setUsername}
                placeholder="أدخل اسمك"
                placeholderTextColor={Colors.textHint}
                textAlign="right"
                writingDirection="rtl"
                maxLength={60}
              />
            </EditField>

            {/* Gender */}
            <EditField label="الجنس" icon="wc">
              <View style={editStyles.genderRow}>
                {GENDERS.map((g) => (
                  <Pressable
                    key={g.value}
                    onPress={() => setGender(g.value)}
                    style={({ pressed }) => [
                      editStyles.genderOption,
                      gender === g.value && editStyles.genderSelected,
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <MaterialIcons
                      name={g.icon}
                      size={22}
                      color={gender === g.value ? Colors.textOnPrimary : Colors.textMuted}
                    />
                    <Text
                      style={[
                        editStyles.genderLabel,
                        gender === g.value && editStyles.genderLabelSelected,
                      ]}
                    >
                      {g.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </EditField>

            {/* Date of birth */}
            <EditField label="تاريخ الميلاد" icon="cake">
              <TouchableOpacity
                style={editStyles.pickerTrigger}
                onPress={() => setPickerMode('dob-day')}
                activeOpacity={0.7}
              >
                <MaterialIcons name="arrow-drop-down" size={22} color={Colors.primary} />
                <Text
                  style={[
                    editStyles.pickerTriggerText,
                    (!dobDay || !dobMonth || !dobYear) && { color: Colors.textHint },
                  ]}
                >
                  {displayDob}
                </Text>
                <MaterialIcons name="event" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
              {(dobDay || dobMonth || dobYear) ? (
                <View style={editStyles.dobPartsRow}>
                  <TouchableOpacity
                    style={editStyles.dobPart}
                    onPress={() => setPickerMode('dob-day')}
                  >
                    <Text style={editStyles.dobPartLabel}>يوم</Text>
                    <Text style={editStyles.dobPartValue}>{dobDay || '—'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={editStyles.dobPart}
                    onPress={() => setPickerMode('dob-month')}
                  >
                    <Text style={editStyles.dobPartLabel}>شهر</Text>
                    <Text style={editStyles.dobPartValue}>
                      {dobMonth ? dobMonth.split(' - ')[0] : '—'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={editStyles.dobPart}
                    onPress={() => setPickerMode('dob-year')}
                  >
                    <Text style={editStyles.dobPartLabel}>سنة</Text>
                    <Text style={editStyles.dobPartValue}>{dobYear || '—'}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </EditField>

            {/* ── Section: School ── */}
            <SectionHeader icon="school" title="بيانات المدرسة" />

            <EditField label="اسم المدرسة" icon="account-balance">
              <TextInput
                style={editStyles.textInput}
                value={schoolName}
                onChangeText={setSchoolName}
                placeholder="أدخل اسم مدرستك"
                placeholderTextColor={Colors.textHint}
                textAlign="right"
                writingDirection="rtl"
                maxLength={100}
              />
            </EditField>

            {/* Governorate picker */}
            <EditField label="المحافظة" icon="location-on">
              <TouchableOpacity
                style={editStyles.pickerTrigger}
                onPress={() => setPickerMode('governorate')}
                activeOpacity={0.7}
              >
                <MaterialIcons name="arrow-drop-down" size={22} color={Colors.primary} />
                <Text
                  style={[
                    editStyles.pickerTriggerText,
                    !governorate && { color: Colors.textHint },
                  ]}
                >
                  {governorate || 'اختر المحافظة'}
                </Text>
                <MaterialIcons name="map" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </EditField>

            {/* ── Section: Guardian ── */}
            <SectionHeader icon="family-restroom" title="بيانات ولي الأمر" />

            <EditField label="رقم هاتف ولي الأمر (اختياري)" icon="phone">
              <TextInput
                style={editStyles.textInput}
                value={guardianPhone}
                onChangeText={setGuardianPhone}
                placeholder="01xxxxxxxxx"
                placeholderTextColor={Colors.textHint}
                keyboardType="phone-pad"
                textAlign="right"
                writingDirection="rtl"
                maxLength={15}
              />
            </EditField>

            <View style={editStyles.noteBox}>
              <MaterialIcons name="info-outline" size={16} color={Colors.info} />
              <Text style={editStyles.noteText}>
                رقم ولي الأمر يُستخدم فقط للتواصل الرسمي من إدارة مدرستي. لن يُشارك مع أطراف أخرى.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* ── Picker Modal ── */}
        {pickerMode !== null ? (
          <Modal
            visible
            animationType="slide"
            transparent
            onRequestClose={() => setPickerMode(null)}
          >
            <View style={pickerStyles.overlay}>
              <Pressable
                style={pickerStyles.backdrop}
                onPress={() => setPickerMode(null)}
              />
              <View style={[pickerStyles.sheet, { paddingBottom: insets.bottom + 8 }]}>
                <View style={pickerStyles.sheetHandle} />
                <View style={pickerStyles.sheetHeader}>
                  <TouchableOpacity onPress={() => setPickerMode(null)}>
                    <Text style={pickerStyles.cancelText}>إلغاء</Text>
                  </TouchableOpacity>
                  <Text style={pickerStyles.sheetTitle}>{pickerTitle}</Text>
                  <View style={{ width: 50 }} />
                </View>
                <FlatList
                  data={pickerData}
                  keyExtractor={(item) => item}
                  showsVerticalScrollIndicator={false}
                  style={pickerStyles.list}
                  renderItem={({ item }) => {
                    const isSelected =
                      (pickerMode === 'governorate' && item === governorate) ||
                      (pickerMode === 'dob-day' && item === dobDay) ||
                      (pickerMode === 'dob-month' && item.split(' - ')[0] === dobMonth.split(' - ')[0]) ||
                      (pickerMode === 'dob-year' && item === dobYear);
                    return (
                      <Pressable
                        style={[pickerStyles.item, isSelected && pickerStyles.itemSelected]}
                        onPress={() => handlePickerSelect(item)}
                      >
                        <Text
                          style={[
                            pickerStyles.itemText,
                            isSelected && pickerStyles.itemTextSelected,
                          ]}
                        >
                          {item}
                        </Text>
                        {isSelected ? (
                          <MaterialIcons name="check" size={18} color={Colors.primary} />
                        ) : null}
                      </Pressable>
                    );
                  }}
                />
              </View>
            </View>
          </Modal>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

// ─── Profile Screen ───────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showAlert } = useAlert();
  const { profile, profileLoading, refreshProfile, updateProfileLocally } = useUserProfile();
  const [loggingOut, setLoggingOut] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const xpInfo = userService.getXpLevel(profile?.xp_points ?? 0);
  const displayName = profile?.username ?? user?.email?.split('@')[0] ?? 'طالب';

  const handleAvatarUpload = useCallback(async () => {
    if (!user) return;

    // Request permission
    const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permResult.status !== 'granted') {
      showAlert('إذن مطلوب', 'يرجى السماح للتطبيق بالوصول إلى مكتبة الصور.', [{ text: 'حسناً' }]);
      return;
    }

    // Launch picker — no base64 here; we use manipulator for compression
    let pickerResult: ImagePicker.ImagePickerResult;
    try {
      pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        base64: false,
      });
    } catch {
      showAlert('خطأ', 'فشل فتح مكتبة الصور. حاول مجدداً.', [{ text: 'حسناً' }]);
      return;
    }

    if (pickerResult.canceled) return;

    const asset = pickerResult.assets?.[0];
    if (!asset || !asset.uri) {
      showAlert('خطأ', 'لم يتم اختيار صورة. حاول مجدداً.', [{ text: 'حسناً' }]);
      return;
    }

    setAvatarUploading(true);
    try {
      // Compress image using expo-image-manipulator (client-side, before upload)
      const compressed = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 400, height: 400 } }],
        { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (!compressed.base64 || compressed.base64.length === 0) {
        showAlert('خطأ', 'فشل ضغط الصورة. حاول مجدداً.', [{ text: 'حسناً' }]);
        return;
      }

      const supabase = getSupabaseClient();
      const filePath = `${user.id}/avatar_${Date.now()}.jpg`;

      // Convert base64 → Uint8Array
      let bytes: Uint8Array;
      try {
        const binaryStr = atob(compressed.base64);
        bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
      } catch {
        showAlert('خطأ', 'فشل معالجة بيانات الصورة.', [{ text: 'حسناً' }]);
        return;
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, bytes, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) {
        showAlert('خطأ', 'فشل رفع الصورة: ' + uploadError.message, [{ text: 'حسناً' }]);
        return;
      }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) {
        showAlert('خطأ', 'فشل الحصول على رابط الصورة.', [{ text: 'حسناً' }]);
        return;
      }

      const { error: updateError } = await userService.updateProfile(user.id, { avatar_url: publicUrl });
      if (updateError) {
        showAlert('خطأ', 'فشل حفظ الصورة في قاعدة البيانات: ' + updateError, [{ text: 'حسناً' }]);
        return;
      }

      updateProfileLocally({ avatar_url: publicUrl } as any);
      await refreshProfile();
      showAlert('تم التحديث ✓', 'تم تحديث صورة الملف الشخصي بنجاح.', [{ text: 'حسناً' }]);
    } catch (err: any) {
      const msg = err?.message ?? 'حدث خطأ غير متوقع.';
      showAlert('خطأ', msg, [{ text: 'حسناً' }]);
    } finally {
      setAvatarUploading(false);
    }
  }, [user, showAlert, updateProfileLocally, refreshProfile]);

  const handleLogout = () => {
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
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Header ── */}
        <LinearGradient
          colors={[Colors.primaryDarker, Colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
        {/* Avatar with upload button */}
          <Pressable
            onPress={handleAvatarUpload}
            disabled={avatarUploading}
            style={styles.avatarLargeWrapper}
            accessibilityRole="button"
            accessibilityLabel="تغيير صورة الملف"
          >
            <View style={styles.avatarLarge}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={{ width: 96, height: 96, borderRadius: 48 }}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <MaterialIcons name="person" size={52} color="rgba(255,255,255,0.9)" />
              )}
            </View>
            <View style={styles.avatarEditBadge}>
              {avatarUploading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <MaterialIcons name="camera-alt" size={16} color={Colors.primary} />
              )}
            </View>
          </Pressable>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          {profile ? (
            <View style={styles.headerBadges}>
              <RoleBadge role={profile.role} />
              {profile.is_verified ? (
                <View style={styles.verifiedBadge}>
                  <MaterialIcons name="verified" size={14} color={Colors.success} />
                  <Text style={styles.verifiedText}>موثّق</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Edit button */}
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => setEditVisible(true)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="edit" size={16} color={Colors.primary} />
            <Text style={styles.editProfileBtnText}>تعديل الملف الشخصي</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* ── XP Section ── */}
        {profile ? (
          <View style={styles.section}>
            <XpBadge
              xp={profile.xp_points}
              level={xpInfo.level}
              titleAr={xpInfo.titleAr}
            />
          </View>
        ) : null}

        {/* ── Student Details ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>البيانات الشخصية</Text>
          <Card variant="elevated">
            <InfoRow icon="badge" label="الاسم" value={profile?.username || 'غير محدد'} />
            <View style={styles.divider} />
            <InfoRow
              icon="wc"
              label="الجنس"
              value={profile?.gender === 'male' ? 'ذكر' : profile?.gender === 'female' ? 'أنثى' : 'غير محدد'}
            />
            <View style={styles.divider} />
            <InfoRow
              icon="cake"
              label="تاريخ الميلاد"
              value={formatDateDisplay(profile?.date_of_birth ?? null)}
            />
            <View style={styles.divider} />
            <InfoRow icon="location-on" label="المحافظة" value={profile?.governorate || 'غير محدد'} />
          </Card>
        </View>

        {/* ── School Details ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>بيانات المدرسة</Text>
          <Card variant="elevated">
            <InfoRow icon="account-balance" label="اسم المدرسة" value={profile?.school_name || 'غير محدد'} />
            <View style={styles.divider} />
            <InfoRow icon="school" label="الدور" value={getRoleLabel(profile?.role ?? 'STUDENT')} />
            <View style={styles.divider} />
            <InfoRow
              icon="offline-bolt"
              label="الوصول دون انترنت"
              value={profile?.is_offline_access_enabled ? 'مفعّل' : 'غير مفعّل'}
              valueColor={profile?.is_offline_access_enabled ? Colors.success : Colors.textMuted}
            />
          </Card>
        </View>

        {/* ── Guardian ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>بيانات ولي الأمر</Text>
          <Card variant="elevated">
            <InfoRow
              icon="phone"
              label="رقم الهاتف"
              value={profile?.guardian_phone || 'غير محدد'}
            />
          </Card>
        </View>

        {/* ── Account Info ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات الحساب</Text>
          <Card variant="elevated">
            <InfoRow icon="email" label="البريد الإلكتروني" value={user?.email ?? '—'} />
            <View style={styles.divider} />
            <InfoRow
              icon="verified-user"
              label="حالة التحقق"
              value={profile?.is_verified ? 'بريد مؤكد ✓' : 'غير مؤكد'}
              valueColor={profile?.is_verified ? Colors.success : Colors.error}
            />
            <View style={styles.divider} />
            <InfoRow
              icon="calendar-today"
              label="تاريخ الانضمام"
              value={
                profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '—'
              }
            />
          </Card>
        </View>

        {/* ── Settings ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الإعدادات</Text>
          <Card variant="elevated">
            <SettingsRow icon="edit" label="تعديل الملف الشخصي" onPress={() => setEditVisible(true)} />
            <View style={styles.divider} />
            <SettingsRow icon="notifications" label="إعدادات الإشعارات" onPress={() => {}} />
            <View style={styles.divider} />
            <SettingsRow icon="help" label="الدعم والمساعدة" onPress={() => {}} />
          </Card>
        </View>

        {/* ── Logout ── */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            disabled={loggingOut}
            activeOpacity={0.8}
          >
            <MaterialIcons name="logout" size={20} color={Colors.error} />
            <Text style={styles.logoutText}>
              {loggingOut ? 'جارٍ تسجيل الخروج...' : 'تسجيل الخروج'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>مدرستي — الإصدار 1.0</Text>
        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={editVisible}
        onClose={() => setEditVisible(false)}
      />
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={editStyles.sectionHeader}>
      <MaterialIcons name={icon as any} size={18} color={Colors.primary} />
      <Text style={editStyles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

function EditField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <View style={editStyles.field}>
      <View style={editStyles.fieldLabel}>
        <MaterialIcons name={icon as any} size={16} color={Colors.primary} />
        <Text style={editStyles.fieldLabelText}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={infoStyles.row}>
      <Text style={[infoStyles.value, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
      <View style={infoStyles.labelRow}>
        <Text style={infoStyles.label}>{label}</Text>
        <MaterialIcons name={icon as any} size={18} color={Colors.primary} />
      </View>
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={infoStyles.settingsRow} onPress={onPress} activeOpacity={0.7}>
      <MaterialIcons name="chevron-left" size={20} color={Colors.textHint} />
      <Text style={infoStyles.settingsLabel}>{label}</Text>
      <MaterialIcons name={icon as any} size={20} color={Colors.primary} />
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 0,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  value: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    textAlign: 'left',
    includeFontPadding: false,
    flex: 1,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    minHeight: 48,
  },
  settingsLabel: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    marginHorizontal: Spacing.sm,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1 },

  headerGradient: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: Radius.xxl,
    borderBottomRightRadius: Radius.xxl,
  },
  avatarLargeWrapper: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primaryLighter,
    ...(Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }) as object),
  },
  profileName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    includeFontPadding: false,
    marginBottom: Spacing.sm,
  },
  headerBadges: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  verifiedText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.success,
    includeFontPadding: false,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 9,
    borderRadius: Radius.full,
    ...(Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }) as object),
  },
  editProfileBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    includeFontPadding: false,
    writingDirection: 'rtl',
  },

  section: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    marginBottom: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.md,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.error + '30',
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

const editStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: Radius.full,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  saveBtnText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textOnPrimary,
    includeFontPadding: false,
  },

  scroll: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
    justifyContent: 'flex-end',
  },
  sectionHeaderText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    writingDirection: 'rtl',
    includeFontPadding: false,
  },

  field: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    ...(Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }) as object),
  },
  fieldLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  fieldLabelText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    includeFontPadding: false,
  },

  textInput: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    includeFontPadding: false,
    minHeight: 44,
  },

  // Gender
  genderRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  genderSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genderLabel: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    includeFontPadding: false,
  },
  genderLabelSelected: {
    color: Colors.textOnPrimary,
  },

  // Date parts
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 11,
    minHeight: 44,
  },
  pickerTriggerText: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  dobPartsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  dobPart: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.primaryLighter,
  },
  dobPartLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    includeFontPadding: false,
  },
  dobPartValue: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    includeFontPadding: false,
    marginTop: 2,
  },

  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.infoLight,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  noteText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.info,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    lineHeight: FontSize.sm * 1.6,
  },
});

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    maxHeight: '65%',
    ...(Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 16 },
    }) as object),
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  cancelText: {
    fontSize: FontSize.base,
    color: Colors.error,
    fontWeight: FontWeight.medium,
    includeFontPadding: false,
  },
  sheetTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  list: {
    paddingHorizontal: Spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    marginVertical: 2,
  },
  itemSelected: {
    backgroundColor: Colors.primarySurface,
  },
  itemText: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  itemTextSelected: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
});
