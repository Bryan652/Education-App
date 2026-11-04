"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signedInClient } from "@/lib/supabase/server";
import { categorySchema, gradeItemSchema, gradingScaleSchema } from "@/lib/validation/grades";
import {
  idSchema,
  PREVIEW_MESSAGE,
  SIGNED_OUT_MESSAGE,
  type ActionResult,
  type FormState,
} from "@/lib/validation/subjects";

const MISSING_CATEGORY = "That category no longer exists.";
const MISSING_ITEM = "That score no longer exists.";
const MISSING_SCALE = "That grading scale no longer exists.";
const MISSING_SUBJECT = "That subject no longer exists.";

// Grades appear on the dashboard and subject pages as well as the grades page.
function refreshPages() {
  revalidatePath("/", "layout");
}

function fieldErrors(error: z.ZodError): FormState {
  return { status: "error", fieldErrors: z.flattenError(error).fieldErrors };
}

function parseCategory(formData: FormData) {
  return categorySchema.safeParse({ name: formData.get("name") ?? "", weight: formData.get("weight") ?? "" });
}

function parseItem(formData: FormData) {
  return gradeItemSchema.safeParse({
    category_id: formData.get("category_id") ?? "",
    name: formData.get("name") ?? "",
    score: formData.get("score") ?? "",
    max_score: formData.get("max_score") ?? "",
    graded_on: formData.get("graded_on") ?? "",
  });
}

export async function createCategory(subjectId: string, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { status: "error", message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(subjectId).success) return { status: "error", message: MISSING_SUBJECT };

  const parsed = parseCategory(formData);
  if (!parsed.success) return fieldErrors(parsed.error);

  const session = await signedInClient();
  if (!session) return { status: "error", message: SIGNED_OUT_MESSAGE };

  const { error } = await session.supabase.from("grade_categories").insert({ ...parsed.data, subject_id: subjectId });
  if (error?.code === "23503") return { status: "error", message: MISSING_SUBJECT };
  if (error) return { status: "error", message: "Couldn't save this category. Please try again." };

  refreshPages();
  return { status: "success", message: `Added ${parsed.data.name}.` };
}

export async function updateCategory(id: string, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { status: "error", message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { status: "error", message: MISSING_CATEGORY };

  const parsed = parseCategory(formData);
  if (!parsed.success) return fieldErrors(parsed.error);

  const session = await signedInClient();
  if (!session) return { status: "error", message: SIGNED_OUT_MESSAGE };

  // Row-level security turns someone else's row into zero rows, not an error, so check the count.
  const { data, error } = await session.supabase.from("grade_categories").update(parsed.data).eq("id", id).select("id");
  if (error) return { status: "error", message: "Couldn't save this category. Please try again." };
  if (data.length === 0) return { status: "error", message: MISSING_CATEGORY };

  refreshPages();
  return { status: "success", message: `Saved ${parsed.data.name}.` };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { ok: false, message: MISSING_CATEGORY };

  const session = await signedInClient();
  if (!session) return { ok: false, message: SIGNED_OUT_MESSAGE };

  const { data, error } = await session.supabase.from("grade_categories").delete().eq("id", id).select("name");
  if (error) return { ok: false, message: "Couldn't delete this category. Please try again." };
  if (data.length === 0) return { ok: false, message: MISSING_CATEGORY };

  refreshPages();
  return { ok: true, message: `Deleted ${data[0].name}.` };
}

export async function createGradeItem(formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { status: "error", message: PREVIEW_MESSAGE };

  const parsed = parseItem(formData);
  if (!parsed.success) return fieldErrors(parsed.error);

  const session = await signedInClient();
  if (!session) return { status: "error", message: SIGNED_OUT_MESSAGE };

  const { error } = await session.supabase.from("grade_items").insert(parsed.data);
  if (error?.code === "23503") {
    return { status: "error", fieldErrors: { category_id: ["That category no longer exists. Choose another."] } };
  }
  if (error) return { status: "error", message: "Couldn't save this score. Please try again." };

  refreshPages();
  return { status: "success", message: `Added ${parsed.data.name}.` };
}

export async function updateGradeItem(id: string, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { status: "error", message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { status: "error", message: MISSING_ITEM };

  const parsed = parseItem(formData);
  if (!parsed.success) return fieldErrors(parsed.error);

  const session = await signedInClient();
  if (!session) return { status: "error", message: SIGNED_OUT_MESSAGE };

  const { data, error } = await session.supabase.from("grade_items").update(parsed.data).eq("id", id).select("id");
  if (error?.code === "23503") {
    return { status: "error", fieldErrors: { category_id: ["That category no longer exists. Choose another."] } };
  }
  if (error) return { status: "error", message: "Couldn't save this score. Please try again." };
  if (data.length === 0) return { status: "error", message: MISSING_ITEM };

  refreshPages();
  return { status: "success", message: `Saved ${parsed.data.name}.` };
}

export async function deleteGradeItem(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { ok: false, message: MISSING_ITEM };

  const session = await signedInClient();
  if (!session) return { ok: false, message: SIGNED_OUT_MESSAGE };

  const { data, error } = await session.supabase.from("grade_items").delete().eq("id", id).select("name");
  if (error) return { ok: false, message: "Couldn't delete this score. Please try again." };
  if (data.length === 0) return { ok: false, message: MISSING_ITEM };

  refreshPages();
  return { ok: true, message: `Deleted ${data[0].name}.` };
}

function parseScale(formData: FormData) {
  const minimums = formData.getAll("band_min");
  const labels = formData.getAll("band_label");
  const points = formData.getAll("band_point");

  return gradingScaleSchema.safeParse({
    name: formData.get("name") ?? "",
    higher_is_better: formData.get("higher_is_better") ?? "",
    passing_grade_point: formData.get("passing_grade_point") ?? "",
    average_label: formData.get("average_label") ?? "",
    base_percent: formData.get("base_percent") ?? "",
    bands: minimums.map((min, index) => ({
      // A blank box would otherwise count as 0 and quietly become the lowest grade.
      min_percent: min === "" ? undefined : min,
      label: labels[index] ?? "",
      grade_point: points[index] ?? "",
    })),
  });
}

/** Creates a scale when id is null. A student's first scale also becomes their default. */
export async function saveGradingScale(id: string | null, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { status: "error", message: PREVIEW_MESSAGE };
  if (id !== null && !idSchema.safeParse(id).success) return { status: "error", message: MISSING_SCALE };

  const parsed = parseScale(formData);
  if (!parsed.success) return fieldErrors(parsed.error);

  const session = await signedInClient();
  if (!session) return { status: "error", message: SIGNED_OUT_MESSAGE };
  const { supabase } = session;

  const { data: savedId, error } = await supabase.rpc("save_grading_scale", {
    // The generated types don't allow null for these two, but the function accepts it.
    // A null p_id means "create".
    p_id: id as string,
    p_name: parsed.data.name,
    p_higher_is_better: parsed.data.higher_is_better,
    p_passing_grade_point: parsed.data.passing_grade_point as number,
    p_average_label: parsed.data.average_label,
    p_base_percent: parsed.data.base_percent,
    p_bands: parsed.data.bands,
  });
  if (error?.code === "P0002") return { status: "error", message: MISSING_SCALE };
  if (error) return { status: "error", message: "Couldn't save this grading scale. Please try again." };

  if (id === null) {
    await supabase
      .from("profiles")
      .update({ default_grading_scale_id: savedId })
      .eq("id", session.userId)
      .is("default_grading_scale_id", null);
  }

  refreshPages();
  return { status: "success", message: `Saved ${parsed.data.name}.` };
}

export async function setDefaultGradingScale(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { ok: false, message: MISSING_SCALE };

  const session = await signedInClient();
  if (!session) return { ok: false, message: SIGNED_OUT_MESSAGE };

  const { error } = await session.supabase
    .from("profiles")
    .update({ default_grading_scale_id: id })
    .eq("id", session.userId);
  if (error?.code === "23503") return { ok: false, message: MISSING_SCALE };
  if (error) return { ok: false, message: "Couldn't change your default scale. Please try again." };

  refreshPages();
  return { ok: true, message: "Changed your default grading scale." };
}

export async function deleteGradingScale(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { ok: false, message: MISSING_SCALE };

  const session = await signedInClient();
  if (!session) return { ok: false, message: SIGNED_OUT_MESSAGE };

  const { data, error } = await session.supabase.from("grading_scales").delete().eq("id", id).select("name");
  if (error) return { ok: false, message: "Couldn't delete this grading scale. Please try again." };
  if (data.length === 0) return { ok: false, message: MISSING_SCALE };

  refreshPages();
  return { ok: true, message: `Deleted ${data[0].name}.` };
}
