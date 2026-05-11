"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { profileUpdateSchema, type ProfileUpdateInput } from "./schemas";

type ActionResult = { error: string } | { success: true };

/**
 * Обновление полей профиля.
 */
export async function updateProfileAction(
  input: ProfileUpdateInput
): Promise<ActionResult> {
  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Некорректные данные формы" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизован" };

  // "ml, физика, calculus" → ["ml", "физика", "calculus"]
  const fields = (parsed.data.fields ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Собираем jsonb с ссылками, пустые поля не сохраняем
  const links: Record<string, string> = {};
  if (parsed.data.link_website) links.website = parsed.data.link_website;
  if (parsed.data.link_github) links.github = parsed.data.link_github;
  if (parsed.data.link_scholar) links.scholar = parsed.data.link_scholar;
  if (parsed.data.link_telegram) links.telegram = parsed.data.link_telegram;

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.display_name || null,
      bio: parsed.data.bio || null,
      affiliation: parsed.data.affiliation || null,
      fields,
      links,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings/profile");
  revalidatePath("/u/[username]", "page");
  return { success: true };
}

/**
 * Загрузка аватара. Принимает FormData (файл),
 * сохраняет в Supabase Storage по пути avatars/{user_id}/avatar.{ext},
 * обновляет profiles.avatar_url.
 */
export async function uploadAvatarAction(formData: FormData): Promise<ActionResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Файл не выбран" };
  }

  if (file.size > 2 * 1024 * 1024) {
    return { error: "Максимальный размер — 2 МБ" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизован" };

  // Извлекаем расширение
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${user.id}/avatar.${ext}`;

  // Удалим все старые аватары пользователя (могло быть с другим расширением)
  const { data: existing } = await supabase.storage
    .from("avatars")
    .list(user.id);
  if (existing && existing.length > 0) {
    await supabase.storage
      .from("avatars")
      .remove(existing.map((f) => `${user.id}/${f.name}`));
  }

  // Загружаем новый
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  // Получаем публичный URL и сохраняем в profiles.avatar_url
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  // Добавляем cache-buster (?v=timestamp), чтобы браузер не показывал старую картинку
  const url = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", user.id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/settings/profile");
  revalidatePath("/", "layout"); // Header показывает аватар
  return { success: true };
}

/**
 * Загрузка обложки. Структура такая же, как у аватара:
 * avatars/{user_id}/cover.{ext} (используем тот же bucket для простоты).
 */
export async function uploadCoverAction(formData: FormData): Promise<ActionResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Файл не выбран" };
  }
  if (file.size > 4 * 1024 * 1024) {
    return { error: "Максимальный размер — 4 МБ" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизован" };

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  // Удаляем старую обложку (если была с другим расширением)
  const { data: existing } = await supabase.storage
    .from("avatars")
    .list(user.id);
  const oldCovers = existing?.filter((f) => f.name.startsWith("cover.")) ?? [];
  if (oldCovers.length > 0) {
    await supabase.storage
      .from("avatars")
      .remove(oldCovers.map((f) => `${user.id}/${f.name}`));
  }

  const path = `${user.id}/cover.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ cover_url: url })
    .eq("id", user.id);
  if (updateError) return { error: updateError.message };

  revalidatePath("/settings/profile");
  revalidatePath("/u/[username]", "page");
  return { success: true };
}

export async function deleteCoverAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизован" };

  const { data: existing } = await supabase.storage
    .from("avatars")
    .list(user.id);
  const oldCovers = existing?.filter((f) => f.name.startsWith("cover.")) ?? [];
  if (oldCovers.length > 0) {
    await supabase.storage
      .from("avatars")
      .remove(oldCovers.map((f) => `${user.id}/${f.name}`));
  }

  await supabase
    .from("profiles")
    .update({ cover_url: null })
    .eq("id", user.id);
  revalidatePath("/settings/profile");
  revalidatePath("/u/[username]", "page");
  return { success: true };
}

/**
 * Удалить аватар.
 */
export async function deleteAvatarAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизован" };

  const { data: existing } = await supabase.storage
    .from("avatars")
    .list(user.id);
  if (existing && existing.length > 0) {
    await supabase.storage
      .from("avatars")
      .remove(existing.map((f) => `${user.id}/${f.name}`));
  }

  await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);

  revalidatePath("/settings/profile");
  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * Подписаться/отписаться от пользователя.
 */
export async function toggleFollowAction(targetUserId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.id === targetUserId) return { error: "Нельзя подписаться на себя" };

  // Проверяем, есть ли уже подписка
  const { data: existing } = await supabase
    .from("follows")
    .select()
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId);
  } else {
    await supabase
      .from("follows")
      .insert({ follower_id: user.id, following_id: targetUserId });
  }

  revalidatePath("/u/[username]", "page");
  return { success: true };
}
