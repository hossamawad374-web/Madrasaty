/*
 * Madrasaty — Curriculum Hooks
 * React state layer for curriculum navigation
 */

import { useState, useEffect, useCallback } from 'react';
import {
  curriculumService,
  Stage,
  Grade,
  Term,
  Subject,
  Lesson,
} from '@/services/curriculumService';

// ── useStages ────────────────────────────────────────────────────────────────

export function useStages() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await curriculumService.getStages();
    setStages(data);
    setError(err);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { stages, loading, error, refresh: load };
}

// ── useGrades ────────────────────────────────────────────────────────────────

export function useGrades(stageId: string) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [stage, setStage] = useState<Stage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!stageId) return;
    setLoading(true);
    setError(null);
    const [gradesResult, stageResult] = await Promise.all([
      curriculumService.getGradesByStage(stageId),
      curriculumService.getStageById(stageId),
    ]);
    setGrades(gradesResult.data);
    setStage(stageResult.data);
    setError(gradesResult.error ?? stageResult.error);
    setLoading(false);
  }, [stageId]);

  useEffect(() => { load(); }, [load]);

  return { grades, stage, loading, error, refresh: load };
}

// ── useTerms ─────────────────────────────────────────────────────────────────

export function useTerms(gradeId: string) {
  const [terms, setTerms] = useState<Term[]>([]);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!gradeId) return;
    setLoading(true);
    setError(null);
    const [termsResult, gradeResult] = await Promise.all([
      curriculumService.getTermsByGrade(gradeId),
      curriculumService.getGradeById(gradeId),
    ]);
    setTerms(termsResult.data);
    setGrade(gradeResult.data);
    setError(termsResult.error ?? gradeResult.error);
    setLoading(false);
  }, [gradeId]);

  useEffect(() => { load(); }, [load]);

  return { terms, grade, loading, error, refresh: load };
}

// ── useSubjectsByGrade (new simplified hierarchy) ────────────────────────────

export function useSubjectsByGrade(gradeId: string) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!gradeId) return;
    setLoading(true);
    setError(null);
    const [subjectsResult, gradeResult] = await Promise.all([
      curriculumService.getSubjectsByGrade(gradeId),
      curriculumService.getGradeById(gradeId),
    ]);
    setSubjects(subjectsResult.data);
    setGrade(gradeResult.data);
    setError(subjectsResult.error ?? gradeResult.error);
    setLoading(false);
  }, [gradeId]);

  useEffect(() => { load(); }, [load]);

  return { subjects, grade, loading, error, refresh: load };
}

// ── useSubjects (legacy term-based) ──────────────────────────────────────────

export function useSubjects(termId: string) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [term, setTerm] = useState<Term | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!termId) return;
    setLoading(true);
    setError(null);
    const [subjectsResult, termResult] = await Promise.all([
      curriculumService.getSubjectsByTerm(termId),
      curriculumService.getTermById(termId),
    ]);
    setSubjects(subjectsResult.data);
    setTerm(termResult.data);
    setError(subjectsResult.error ?? termResult.error);
    setLoading(false);
  }, [termId]);

  useEffect(() => { load(); }, [load]);

  return { subjects, term, loading, error, refresh: load };
}

// ── useLessons ───────────────────────────────────────────────────────────────

export function useLessons(subjectId: string) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!subjectId) return;
    setLoading(true);
    setError(null);
    const [lessonsResult, subjectResult] = await Promise.all([
      curriculumService.getLessonsBySubject(subjectId),
      curriculumService.getSubjectById(subjectId),
    ]);
    setLessons(lessonsResult.data);
    setSubject(subjectResult.data);
    setError(lessonsResult.error ?? subjectResult.error);
    setLoading(false);
  }, [subjectId]);

  useEffect(() => { load(); }, [load]);

  return { lessons, subject, loading, error, refresh: load };
}
