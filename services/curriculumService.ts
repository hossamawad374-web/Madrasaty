/*
 * Madrasaty — Curriculum Service
 * Data layer for: stages → grades → terms → subjects → lessons
 */

import { getSupabaseClient } from '@/template';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Stage {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  order_index: number;
  color_start: string;
  color_end: string;
  icon: string;
  is_active: boolean;
}

export interface Grade {
  id: string;
  stage_id: string;
  name_ar: string;
  name_en: string;
  order_index: number;
  is_active: boolean;
}

export interface Term {
  id: string;
  grade_id: string;
  name_ar: string;
  name_en: string;
  order_index: number;
  is_active: boolean;
}

export interface Subject {
  id: string;
  term_id: string;
  name_ar: string;
  name_en: string;
  icon: string;
  color: string;
  order_index: number;
  is_active: boolean;
}

export interface Lesson {
  id: string;
  subject_id: string;
  title_ar: string;
  title_en: string;
  content: string;
  duration_minutes: number;
  order_index: number;
  is_free: boolean;
  is_active: boolean;
  created_at: string;
  // Cinematic media fields
  video_url: string;
  thumbnail_url: string;
  key_takeaways: string[];
  cinematic_content: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const curriculumService = {

  // ── Stages ────────────────────────────────────────────────────────────────

  async getStages(): Promise<{ data: Stage[]; error: string | null }> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('stages')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      if (error) return { data: [], error: error.message };
      return { data: (data ?? []) as Stage[], error: null };
    } catch {
      return { data: [], error: 'فشل تحميل المراحل الدراسية.' };
    }
  },

  async getStageById(id: string): Promise<{ data: Stage | null; error: string | null }> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('stages')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return { data: null, error: error.message };
      return { data: data as Stage, error: null };
    } catch {
      return { data: null, error: 'فشل تحميل بيانات المرحلة.' };
    }
  },

  // ── Grades ────────────────────────────────────────────────────────────────

  async getGradesByStage(stageId: string): Promise<{ data: Grade[]; error: string | null }> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('grades')
        .select('*')
        .eq('stage_id', stageId)
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      if (error) return { data: [], error: error.message };
      return { data: (data ?? []) as Grade[], error: null };
    } catch {
      return { data: [], error: 'فشل تحميل الصفوف الدراسية.' };
    }
  },

  async getGradeById(id: string): Promise<{ data: Grade | null; error: string | null }> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('grades')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return { data: null, error: error.message };
      return { data: data as Grade, error: null };
    } catch {
      return { data: null, error: 'فشل تحميل بيانات الصف.' };
    }
  },

  // ── Terms ─────────────────────────────────────────────────────────────────

  async getTermsByGrade(gradeId: string): Promise<{ data: Term[]; error: string | null }> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('terms')
        .select('*')
        .eq('grade_id', gradeId)
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      if (error) return { data: [], error: error.message };
      return { data: (data ?? []) as Term[], error: null };
    } catch {
      return { data: [], error: 'فشل تحميل الفصول الدراسية.' };
    }
  },

  async getTermById(id: string): Promise<{ data: Term | null; error: string | null }> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('terms')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return { data: null, error: error.message };
      return { data: data as Term, error: null };
    } catch {
      return { data: null, error: 'فشل تحميل بيانات الفصل.' };
    }
  },

  // ── Subjects ──────────────────────────────────────────────────────────────

  // Subjects by grade_id (new simplified hierarchy — no terms layer)
  async getSubjectsByGrade(gradeId: string): Promise<{ data: Subject[]; error: string | null }> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('grade_id', gradeId)
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      if (error) return { data: [], error: error.message };
      return { data: (data ?? []) as Subject[], error: null };
    } catch {
      return { data: [], error: 'فشل تحميل المواد الدراسية.' };
    }
  },

  // Legacy: subjects by term_id (kept for backward compat)
  async getSubjectsByTerm(termId: string): Promise<{ data: Subject[]; error: string | null }> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('term_id', termId)
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      if (error) return { data: [], error: error.message };
      return { data: (data ?? []) as Subject[], error: null };
    } catch {
      return { data: [], error: 'فشل تحميل المواد الدراسية.' };
    }
  },

  async getSubjectById(id: string): Promise<{ data: Subject | null; error: string | null }> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return { data: null, error: error.message };
      return { data: data as Subject, error: null };
    } catch {
      return { data: null, error: 'فشل تحميل بيانات المادة.' };
    }
  },

  // ── Lessons ───────────────────────────────────────────────────────────────

  async getLessonsBySubject(subjectId: string): Promise<{ data: Lesson[]; error: string | null }> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      if (error) return { data: [], error: error.message };
      return { data: (data ?? []) as Lesson[], error: null };
    } catch {
      return { data: [], error: 'فشل تحميل الدروس.' };
    }
  },

  async getLessonById(id: string): Promise<{ data: Lesson | null; error: string | null }> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return { data: null, error: error.message };
      return { data: data as Lesson, error: null };
    } catch {
      return { data: null, error: 'فشل تحميل بيانات الدرس.' };
    }
  },
};
