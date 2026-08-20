/*
 * Madrasaty — User Service
 * Manages user_profiles documents in OnSpace Cloud (Supabase-compatible)
 */

import { getSupabaseClient } from '@/template';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  governorate: string;
  xp_points: number;
  is_offline_access_enabled: boolean;
  is_verified: boolean;
  created_at: string;
  avatar_url: string;
  // Egyptian school fields
  school_name: string;
  date_of_birth: string | null; // ISO date string "YYYY-MM-DD"
  gender: string;               // 'male' | 'female' | ''
  guardian_phone: string;
}

export interface UpdateProfilePayload {
  username?: string | null;
  role?: 'STUDENT' | 'TEACHER' | 'ADMIN';
  governorate?: string;
  xp_points?: number;
  is_offline_access_enabled?: boolean;
  is_verified?: boolean;
  school_name?: string;
  date_of_birth?: string | null;
  gender?: string;
  guardian_phone?: string;
  avatar_url?: string;
}

const SELECT_FIELDS = [
  'id', 'email', 'username', 'role', 'governorate',
  'xp_points', 'is_offline_access_enabled', 'is_verified', 'created_at',
  'school_name', 'date_of_birth', 'gender', 'guardian_phone', 'avatar_url',
].join(', ');

// ─── Service ──────────────────────────────────────────────────────────────────

export const userService = {
  /**
   * Fetch a user's profile by their auth UID.
   */
  async getProfile(uid: string): Promise<{ data: UserProfile | null; error: string | null }> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('user_profiles')
        .select(SELECT_FIELDS)
        .eq('id', uid)
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as UserProfile, error: null };
    } catch {
      return { data: null, error: 'حدث خطأ غير متوقع أثناء تحميل الملف الشخصي.' };
    }
  },

  /**
   * Initialize profile fields after OTP-verified registration.
   */
  async initializeAfterRegistration(uid: string): Promise<{ error: string | null }> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('user_profiles')
        .update({
          role: 'STUDENT',
          governorate: '',
          xp_points: 0,
          is_offline_access_enabled: false,
          is_verified: true,
          school_name: '',
          date_of_birth: null,
          gender: '',
          guardian_phone: '',
        })
        .eq('id', uid);

      if (error) return { error: error.message };
      return { error: null };
    } catch {
      return { error: 'فشل تهيئة الملف الشخصي. يرجى المحاولة مرة أخرى.' };
    }
  },

  /**
   * Update specific profile fields.
   */
  async updateProfile(uid: string, payload: UpdateProfilePayload): Promise<{ error: string | null }> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('user_profiles')
        .update(payload)
        .eq('id', uid);

      if (error) return { error: error.message };
      return { error: null };
    } catch {
      return { error: 'فشل تحديث الملف الشخصي.' };
    }
  },

  /**
   * Award XP points to a user (additive).
   */
  async addXpPoints(uid: string, points: number, currentXp: number): Promise<{ error: string | null }> {
    return userService.updateProfile(uid, { xp_points: currentXp + points });
  },

  /**
   * Get XP level label (gamification helper).
   */
  getXpLevel(xp: number): { level: number; title: string; titleAr: string; nextLevelXp: number } {
    if (xp < 100) return { level: 1, title: 'Beginner', titleAr: 'مبتدئ', nextLevelXp: 100 };
    if (xp < 300) return { level: 2, title: 'Explorer', titleAr: 'مستكشف', nextLevelXp: 300 };
    if (xp < 600) return { level: 3, title: 'Scholar', titleAr: 'طالب علم', nextLevelXp: 600 };
    if (xp < 1000) return { level: 4, title: 'Advanced', titleAr: 'متقدم', nextLevelXp: 1000 };
    if (xp < 2000) return { level: 5, title: 'Expert', titleAr: 'خبير', nextLevelXp: 2000 };
    return { level: 6, title: 'Master', titleAr: 'أستاذ', nextLevelXp: 99999 };
  },
};

// ─── Egyptian Governorates ────────────────────────────────────────────────────

export const EGYPTIAN_GOVERNORATES = [
  'القاهرة',
  'الإسكندرية',
  'الجيزة',
  'الشرقية',
  'الدقهلية',
  'البحيرة',
  'المنوفية',
  'القليوبية',
  'الغربية',
  'كفر الشيخ',
  'دمياط',
  'بورسعيد',
  'الإسماعيلية',
  'السويس',
  'شمال سيناء',
  'جنوب سيناء',
  'الفيوم',
  'بني سويف',
  'المنيا',
  'أسيوط',
  'سوهاج',
  'قنا',
  'الأقصر',
  'أسوان',
  'البحر الأحمر',
  'الوادي الجديد',
  'مطروح',
];
