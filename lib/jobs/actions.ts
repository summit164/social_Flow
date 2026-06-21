"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  companyInputSchema,
  vacancyInputSchema,
  type CompanyInput,
  type VacancyInput,
} from "./schemas";

type ActionResult =
  | { error: string }
  | { success: true; id?: string };

// ============================================================
//   COMPANIES
// ============================================================

/**
 * Создаёт компанию. Не делает redirect — возвращает id, чтобы клиент
 * мог сначала залить логотип/обложку, а уже потом перейти на страницу.
 */
export async function createCompanyAction(
  input: CompanyInput
): Promise<ActionResult> {
  const parsed = companyInputSchema.safeParse(input);
  if (!parsed.success) return { error: "Некорректные данные формы" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизован" };

  const { data: company, error } = await supabase
    .from("companies")
    .insert({
      owner_id: user.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      website: parsed.data.website || null,
      location: parsed.data.location || null,
      industry: parsed.data.industry || null,
    })
    .select("id")
    .single();
  if (error || !company) {
    return { error: error?.message ?? "Не удалось создать компанию" };
  }

  revalidatePath("/", "layout");
  return { success: true, id: company.id };
}

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2 МБ
const MAX_COVER_SIZE = 4 * 1024 * 1024; // 4 МБ
const ALLOWED_IMAGE_MIMES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
];

async function assertCompanyOwner(companyId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизован" as const };
  const { data: company } = await supabase
    .from("companies")
    .select("owner_id")
    .eq("id", companyId)
    .maybeSingle();
  if (!company || company.owner_id !== user.id) {
    return { error: "Нет прав" as const };
  }
  return { supabase, userId: user.id };
}

/**
 * Загрузка логотипа компании. Сохраняем в bucket "avatars" по пути
 * {owner_id}/companies/{company_id}/logo.{ext}, чтобы переиспользовать
 * существующие RLS-политики (первая папка = owner).
 */
export async function uploadCompanyLogoAction(
  companyId: string,
  formData: FormData
): Promise<ActionResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Файл не выбран" };
  }
  if (file.size > MAX_LOGO_SIZE) return { error: "Максимальный размер — 2 МБ" };
  if (!ALLOWED_IMAGE_MIMES.includes(file.type)) {
    return { error: "Поддерживаются PNG, JPG, WebP, GIF" };
  }

  const ctx = await assertCompanyOwner(companyId);
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, userId } = ctx;

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const dir = `${userId}/companies/${companyId}`;
  // Снесём предыдущий logo.*
  const { data: existing } = await supabase.storage.from("avatars").list(dir);
  const oldLogos = existing?.filter((f) => f.name.startsWith("logo.")) ?? [];
  if (oldLogos.length > 0) {
    await supabase.storage
      .from("avatars")
      .remove(oldLogos.map((f) => `${dir}/${f.name}`));
  }

  const path = `${dir}/logo.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("companies")
    .update({ logo_url: url })
    .eq("id", companyId);
  if (updateError) return { error: updateError.message };

  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/jobs");
  return { success: true };
}

export async function uploadCompanyCoverAction(
  companyId: string,
  formData: FormData
): Promise<ActionResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Файл не выбран" };
  }
  if (file.size > MAX_COVER_SIZE) return { error: "Максимальный размер — 4 МБ" };
  if (!ALLOWED_IMAGE_MIMES.includes(file.type)) {
    return { error: "Поддерживаются PNG, JPG, WebP, GIF" };
  }

  const ctx = await assertCompanyOwner(companyId);
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, userId } = ctx;

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const dir = `${userId}/companies/${companyId}`;
  const { data: existing } = await supabase.storage.from("avatars").list(dir);
  const oldCovers = existing?.filter((f) => f.name.startsWith("cover.")) ?? [];
  if (oldCovers.length > 0) {
    await supabase.storage
      .from("avatars")
      .remove(oldCovers.map((f) => `${dir}/${f.name}`));
  }

  const path = `${dir}/cover.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("companies")
    .update({ cover_url: url })
    .eq("id", companyId);
  if (updateError) return { error: updateError.message };

  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/jobs");
  return { success: true };
}

export async function deleteCompanyLogoAction(
  companyId: string
): Promise<ActionResult> {
  const ctx = await assertCompanyOwner(companyId);
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, userId } = ctx;
  const dir = `${userId}/companies/${companyId}`;
  const { data: existing } = await supabase.storage.from("avatars").list(dir);
  const old = existing?.filter((f) => f.name.startsWith("logo.")) ?? [];
  if (old.length > 0) {
    await supabase.storage
      .from("avatars")
      .remove(old.map((f) => `${dir}/${f.name}`));
  }
  await supabase
    .from("companies")
    .update({ logo_url: null })
    .eq("id", companyId);
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/jobs");
  return { success: true };
}

export async function deleteCompanyCoverAction(
  companyId: string
): Promise<ActionResult> {
  const ctx = await assertCompanyOwner(companyId);
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, userId } = ctx;
  const dir = `${userId}/companies/${companyId}`;
  const { data: existing } = await supabase.storage.from("avatars").list(dir);
  const old = existing?.filter((f) => f.name.startsWith("cover.")) ?? [];
  if (old.length > 0) {
    await supabase.storage
      .from("avatars")
      .remove(old.map((f) => `${dir}/${f.name}`));
  }
  await supabase
    .from("companies")
    .update({ cover_url: null })
    .eq("id", companyId);
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/jobs");
  return { success: true };
}

export async function deleteCompanyAction(
  companyId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизован" };

  const { error } = await supabase
    .from("companies")
    .delete()
    .eq("id", companyId)
    .eq("owner_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/jobs");
}

// ============================================================
//   VACANCIES
// ============================================================

export async function createVacancyAction(
  input: VacancyInput
): Promise<ActionResult> {
  const parsed = vacancyInputSchema.safeParse(input);
  if (!parsed.success) return { error: "Некорректные данные формы" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизован" };

  // Проверим, что пользователь — владелец компании
  const { data: company } = await supabase
    .from("companies")
    .select("owner_id")
    .eq("id", parsed.data.companyId)
    .maybeSingle();
  if (!company || company.owner_id !== user.id) {
    return { error: "Нельзя постить вакансию в чужую компанию" };
  }

  const { data: vacancy, error } = await supabase
    .from("vacancies")
    .insert({
      company_id: parsed.data.companyId,
      posted_by: user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      employment_type: parsed.data.employmentType,
      location: parsed.data.location || null,
      is_remote: parsed.data.isRemote,
      salary_min: parsed.data.salaryMin ?? null,
      salary_max: parsed.data.salaryMax ?? null,
      salary_currency: parsed.data.salaryCurrency || "RUB",
      apply_url: parsed.data.applyUrl || null,
      contact_email: parsed.data.contactEmail || null,
      status: "open",
    })
    .select("id")
    .single();
  if (error || !vacancy) {
    return { error: error?.message ?? "Не удалось создать вакансию" };
  }

  revalidatePath("/jobs");
  redirect(`/jobs/${vacancy.id}`);
}

export async function toggleVacancyStatusAction(
  vacancyId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизован" };

  const { data: vacancy } = await supabase
    .from("vacancies")
    .select("status, company_id")
    .eq("id", vacancyId)
    .maybeSingle();
  if (!vacancy) return { error: "Вакансия не найдена" };

  const { data: company } = await supabase
    .from("companies")
    .select("owner_id")
    .eq("id", vacancy.company_id)
    .maybeSingle();
  if (!company || company.owner_id !== user.id) {
    return { error: "Нет прав" };
  }

  const newStatus = vacancy.status === "open" ? "closed" : "open";
  await supabase
    .from("vacancies")
    .update({ status: newStatus })
    .eq("id", vacancyId);

  revalidatePath(`/jobs/${vacancyId}`);
  return { success: true };
}

export async function deleteVacancyAction(
  vacancyId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизован" };

  const { data: vacancy } = await supabase
    .from("vacancies")
    .select("company_id")
    .eq("id", vacancyId)
    .maybeSingle();
  if (!vacancy) return { error: "Вакансия не найдена" };

  const { data: company } = await supabase
    .from("companies")
    .select("owner_id")
    .eq("id", vacancy.company_id)
    .maybeSingle();
  if (!company || company.owner_id !== user.id) {
    return { error: "Нет прав" };
  }

  await supabase.from("vacancies").delete().eq("id", vacancyId);

  revalidatePath("/jobs");
  redirect("/jobs");
}
