"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  workInputSchema,
  postInputSchema,
  type WorkInput,
  type PostInput,
  ALLOWED_FILE_EXTENSIONS,
  MAX_FILE_SIZE,
  POST_MEDIA_EXTENSIONS,
  POST_MEDIA_MAX_SIZE,
} from "./schemas";
import { parseTagsString, getFileExtension } from "./utils";

type ActionResult =
  | { error: string }
  | { success: true; workId?: string };

/**
 * Создание работы. Принимает данные формы и опционально файлы (FormData).
 * Если publish=true — сразу публикуется, иначе сохраняется как черновик.
 *
 * Алгоритм:
 *   1. Валидация
 *   2. INSERT в works
 *   3. Загрузка файлов в storage и INSERT в work_files
 *   4. Привязка тегов: upsert в tags + INSERT в work_tags
 *   5. Если publish=true — обновляем статус и published_at
 *   6. Redirect на /work/{id}
 */
export async function createWorkAction(
  input: WorkInput,
  formData: FormData,
  publish: boolean
): Promise<ActionResult> {
  const parsed = workInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Некорректные данные формы" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизован" };

  // 2. Создаём work
  const { data: work, error: insertError } = await supabase
    .from("works")
    .insert({
      author_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      content: parsed.data.content || null,
      discipline: parsed.data.discipline || null,
      status: publish ? "published" : "draft",
      published_at: publish ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (insertError || !work) {
    return { error: insertError?.message ?? "Не удалось создать работу" };
  }

  // 3. Загрузка файлов
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Валидация
    const ext = getFileExtension(file.name);
    if (file.size > MAX_FILE_SIZE) {
      return { error: `Файл "${file.name}" больше 50 МБ` };
    }
    if (ext && !ALLOWED_FILE_EXTENSIONS.includes(ext)) {
      return { error: `Расширение .${ext} не поддерживается` };
    }

    // Безопасное имя файла (заменяем пробелы и спецсимволы)
    const safeName = file.name.replace(/[^\w.\-]/g, "_");
    const path = `${user.id}/${work.id}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("work-files")
      .upload(path, file, { contentType: file.type });
    if (uploadError) {
      // При ошибке откатываем — удаляем созданную работу
      await supabase.from("works").delete().eq("id", work.id);
      return { error: `Ошибка загрузки "${file.name}": ${uploadError.message}` };
    }

    await supabase.from("work_files").insert({
      work_id: work.id,
      storage_path: path,
      filename: file.name,
      mime_type: file.type || null,
      size_bytes: file.size,
      position: i,
    });
  }

  // 4. Теги
  const tags = parseTagsString(parsed.data.tags || "");
  if (tags.length > 0) {
    // upsert по slug (если тега нет — создаём, если есть — берём существующий)
    await supabase
      .from("tags")
      .upsert(tags, { onConflict: "slug", ignoreDuplicates: true });

    const { data: tagRows } = await supabase
      .from("tags")
      .select("id, slug")
      .in(
        "slug",
        tags.map((t) => t.slug)
      );

    if (tagRows && tagRows.length > 0) {
      await supabase.from("work_tags").insert(
        tagRows.map((t) => ({ work_id: work.id, tag_id: t.id }))
      );
    }
  }

  revalidatePath("/", "layout");
  redirect(`/work/${work.id}`);
}

/**
 * Создание поста — короткой заметки. Сохраняется в той же таблице works
 * с kind='post'. Файлов нет, title генерируется из первых слов content,
 * чтобы удовлетворить NOT NULL-констрейнт.
 */
export async function createPostAction(
  input: PostInput,
  formData: FormData
): Promise<ActionResult> {
  const parsed = postInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Некорректные данные формы" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизован" };

  // Медиа — максимум один файл, фото или видео
  const mediaCandidate = formData.get("media");
  const media =
    mediaCandidate instanceof File && mediaCandidate.size > 0
      ? mediaCandidate
      : null;
  if (media) {
    const ext = getFileExtension(media.name);
    if (!ext || !POST_MEDIA_EXTENSIONS.includes(ext)) {
      return { error: "Поддерживаются только изображения и видео" };
    }
    if (media.size > POST_MEDIA_MAX_SIZE) {
      return { error: "Файл больше 50 МБ" };
    }
  }

  const content = parsed.data.content.trim();
  // Заголовок поста — первые 80 символов первой строки content, чтобы
  // удовлетворить check (length(title) >= 1) и нормально выглядеть в списках.
  const firstLine = content.split("\n")[0] ?? content;
  const title = firstLine.slice(0, 80) || "Пост";

  const { data: work, error: insertError } = await supabase
    .from("works")
    .insert({
      author_id: user.id,
      title,
      content,
      kind: "post",
      status: "published",
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError || !work) {
    return { error: insertError?.message ?? "Не удалось опубликовать пост" };
  }

  if (media) {
    const safeName = media.name.replace(/[^\w.\-]/g, "_");
    const path = `${user.id}/${work.id}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("work-files")
      .upload(path, media, { contentType: media.type });
    if (uploadError) {
      await supabase.from("works").delete().eq("id", work.id);
      return { error: `Не удалось загрузить файл: ${uploadError.message}` };
    }

    await supabase.from("work_files").insert({
      work_id: work.id,
      storage_path: path,
      filename: media.name,
      mime_type: media.type || null,
      size_bytes: media.size,
      position: 0,
    });
  }

  revalidatePath("/", "layout");
  redirect(`/work/${work.id}`);
}

/**
 * Удаление работы. Каскадно удалит work_files и records, файлы из Storage чистим вручную.
 */
export async function deleteWorkAction(workId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизован" };

  // Сначала собираем список файлов для удаления из Storage
  const { data: files } = await supabase
    .from("work_files")
    .select("storage_path")
    .eq("work_id", workId);

  if (files && files.length > 0) {
    await supabase.storage
      .from("work-files")
      .remove(files.map((f) => f.storage_path));
  }

  // Потом удаляем запись (cascade удалит work_files и work_tags)
  const { error } = await supabase
    .from("works")
    .delete()
    .eq("id", workId)
    .eq("author_id", user.id); // защита: можно удалить только свою

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Переключить статус: draft <-> published
 */
export async function togglePublishAction(workId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизован" };

  const { data: work } = await supabase
    .from("works")
    .select("status, author_id")
    .eq("id", workId)
    .single();
  if (!work || work.author_id !== user.id) {
    return { error: "Не найдено или нет прав" };
  }

  const newStatus = work.status === "published" ? "draft" : "published";
  await supabase
    .from("works")
    .update({
      status: newStatus,
      published_at: newStatus === "published" ? new Date().toISOString() : null,
    })
    .eq("id", workId);

  revalidatePath(`/work/${workId}`);
  return { success: true };
}

/**
 * Лайк / снять лайк
 */
export async function toggleLikeAction(workId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("likes")
    .select()
    .eq("user_id", user.id)
    .eq("work_id", workId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("likes")
      .delete()
      .eq("user_id", user.id)
      .eq("work_id", workId);
  } else {
    await supabase.from("likes").insert({ user_id: user.id, work_id: workId });
  }

  revalidatePath(`/work/${workId}`);
  return { success: true };
}
