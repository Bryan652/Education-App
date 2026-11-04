import { connection } from "next/server";
import {
  getSubject as getSampleSubject,
  subjects as sampleSubjects,
  term as sampleTerm,
  type Subject,
} from "@/lib/mock-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_SUBJECT_COLOR, idSchema } from "@/lib/validation/subjects";
import type { Tables } from "@/types/database";

export interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface SubjectRecord extends Subject {
  termId: string | null;
  termName: string | null;
  // Null means the subject uses the student's default grading scale.
  gradingScaleId: string | null;
  archivedAt: string | null;
  // Sample subjects are read-only. Other pages still link to them until their build steps.
  isSample: boolean;
}

function toSampleRecord(subject: Subject): SubjectRecord {
  return {
    ...subject,
    termId: sampleTerm.id,
    termName: sampleTerm.name,
    gradingScaleId: null,
    archivedAt: null,
    isSample: true,
  };
}

function toRecord(row: Tables<"subjects">, terms: Term[]): SubjectRecord {
  return {
    id: row.id,
    name: row.name,
    code: row.code ?? "",
    instructor: row.instructor ?? "",
    color: row.color ?? DEFAULT_SUBJECT_COLOR,
    units: row.units ?? 0,
    termId: row.term_id,
    termName: terms.find((term) => term.id === row.term_id)?.name ?? null,
    gradingScaleId: row.grading_scale_id,
    archivedAt: row.archived_at,
    isSample: false,
  };
}

export async function getTerms(): Promise<Term[]> {
  if (!isSupabaseConfigured) {
    return [
      { id: sampleTerm.id, name: sampleTerm.name, startDate: sampleTerm.startDate, endDate: sampleTerm.endDate },
    ];
  }

  await connection(); // Student data must load per request, never during prerendering.
  const supabase = await createClient();
  const { data, error } = await supabase.from("terms").select("*").order("start_date", { ascending: false });
  if (error) throw new Error(`Couldn't load terms: ${error.message}`);

  return data.map((row) => ({ id: row.id, name: row.name, startDate: row.start_date, endDate: row.end_date }));
}

export async function getSubjects() {
  if (!isSupabaseConfigured) {
    return { active: sampleSubjects.map(toSampleRecord), archived: [] as SubjectRecord[], terms: await getTerms() };
  }

  await connection();
  const supabase = await createClient();
  const [terms, result] = await Promise.all([
    getTerms(),
    supabase.from("subjects").select("*").order("name"),
  ]);
  if (result.error) throw new Error(`Couldn't load subjects: ${result.error.message}`);

  const records = result.data.map((row) => toRecord(row, terms));
  return {
    active: records.filter((subject) => !subject.archivedAt),
    archived: records.filter((subject) => subject.archivedAt),
    terms,
  };
}

export async function getSubjectById(id: string): Promise<SubjectRecord | null> {
  const sample = getSampleSubject(id);
  if (sample) return toSampleRecord(sample);
  if (!isSupabaseConfigured || !idSchema.safeParse(id).success) return null;

  await connection();
  const supabase = await createClient();
  const [terms, result] = await Promise.all([
    getTerms(),
    supabase.from("subjects").select("*").eq("id", id).maybeSingle(),
  ]);
  if (result.error) throw new Error(`Couldn't load this subject: ${result.error.message}`);

  return result.data ? toRecord(result.data, terms) : null;
}
