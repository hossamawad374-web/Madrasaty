/*
 * Madrasaty — Quiz Service
 * Saves quiz attempt results and aggregates student performance statistics
 */

import { getSupabaseClient } from '@/template';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuizResult {
  id: string;
  student_id: string;
  lesson_id: string;
  subject_id: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

export interface SubjectPerformance {
  subject_id: string;
  subject_name_ar: string;
  subject_name_en: string;
  subject_color: string;
  attempts: number;
  total_score: number;
  total_questions: number;
  accuracy: number; // 0-100
}

export interface StudentStats {
  total_attempts: number;
  overall_accuracy: number;
  subjects: SubjectPerformance[];
  recent_results: QuizResult[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const quizService = {
  /**
   * Save a quiz result after lesson completion.
   */
  async saveResult(payload: {
    student_id: string;
    lesson_id: string;
    subject_id: string;
    score: number;
    total_questions: number;
  }): Promise<{ error: string | null }> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('quiz_results').insert({
        student_id: payload.student_id,
        lesson_id: payload.lesson_id,
        subject_id: payload.subject_id,
        score: payload.score,
        total_questions: payload.total_questions,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch {
      return { error: 'فشل حفظ نتيجة الاختبار.' };
    }
  },

  /**
   * Get aggregated statistics for a student.
   * Returns per-subject accuracy and overall figures.
   */
  async getStudentStats(studentId: string): Promise<{ data: StudentStats | null; error: string | null }> {
    try {
      const supabase = getSupabaseClient();

      // Fetch all results for this student, joining subjects for labels
      const { data: results, error: resultsError } = await supabase
        .from('quiz_results')
        .select(`
          id,
          student_id,
          lesson_id,
          subject_id,
          score,
          total_questions,
          completed_at,
          subjects:subject_id (
            name_ar,
            name_en,
            color
          )
        `)
        .eq('student_id', studentId)
        .order('completed_at', { ascending: false });

      if (resultsError) return { data: null, error: resultsError.message };
      if (!results || results.length === 0) {
        return {
          data: {
            total_attempts: 0,
            overall_accuracy: 0,
            subjects: [],
            recent_results: [],
          },
          error: null,
        };
      }

      // Aggregate per subject
      const subjectMap: Record<string, SubjectPerformance> = {};
      let totalScore = 0;
      let totalQuestions = 0;

      for (const r of results as any[]) {
        totalScore += r.score;
        totalQuestions += r.total_questions;

        if (!subjectMap[r.subject_id]) {
          subjectMap[r.subject_id] = {
            subject_id: r.subject_id,
            subject_name_ar: r.subjects?.name_ar ?? 'غير محدد',
            subject_name_en: r.subjects?.name_en ?? '',
            subject_color: r.subjects?.color ?? '#3F51B5',
            attempts: 0,
            total_score: 0,
            total_questions: 0,
            accuracy: 0,
          };
        }

        subjectMap[r.subject_id].attempts += 1;
        subjectMap[r.subject_id].total_score += r.score;
        subjectMap[r.subject_id].total_questions += r.total_questions;
      }

      const subjects = Object.values(subjectMap).map((s) => ({
        ...s,
        accuracy: s.total_questions > 0
          ? Math.round((s.total_score / s.total_questions) * 100)
          : 0,
      })).sort((a, b) => b.accuracy - a.accuracy);

      const overallAccuracy = totalQuestions > 0
        ? Math.round((totalScore / totalQuestions) * 100)
        : 0;

      // Map recent_results without the joined subject data
      const recent_results: QuizResult[] = (results as any[]).slice(0, 10).map((r) => ({
        id: r.id,
        student_id: r.student_id,
        lesson_id: r.lesson_id,
        subject_id: r.subject_id,
        score: r.score,
        total_questions: r.total_questions,
        completed_at: r.completed_at,
      }));

      return {
        data: {
          total_attempts: results.length,
          overall_accuracy: overallAccuracy,
          subjects,
          recent_results,
        },
        error: null,
      };
    } catch {
      return { data: null, error: 'فشل تحميل إحصائيات الطالب.' };
    }
  },
};
