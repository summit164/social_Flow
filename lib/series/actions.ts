"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { seriesInputSchema, type SeriesInput } from "./schemas";

type ActionResult = { error: string } | { success: true; seriesId?: string };

const SERIES_MAX_DEPTH = 3;

export async function createSeriesAction(
  input: SeriesInput,
  parentId: string | null = null
): Promise<ActionResult> {
  const parsed = seriesInputSchema.safeParse(input);
  if (!parsed.success) return { error: "Некорректные данные формы" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизован" };

  // Если у нового трека есть родитель — проверяем владельца и глубину.
  let depth = 1;
  if (parentId) {
    const { data: parent } = await supabase
      .from("series")
      .select("author_id, depth")
      .eq("id", parentId)
      .maybeSingle();
    if (!parent) return { error: "Родительский трек не найден" };
    if (parent.author_id !== user.id) {
      return { error: "Можно создавать подтреки только в своих треках" };
    }
    if (parent.depth >= SERIES_MAX_DEPTH) {
      return {
        error: `Достигнута максимальная глубина дерева (${SERIES_MAX_DEPTH})`,
      };
    }
    depth = parent.depth + 1;
  }

  const { data: series, error } = await supabase
    .from("series")
    .insert({
      author_id: user.id,
      parent_id: parentId,
      depth,
      title: parsed.data.title,
      description: parsed.data.description || null,
    })
    .select("id")
    .single();
  if (error || !series) {
    return { error: error?.message ?? "Не удалось создать трек" };
  }

  revalidatePath("/", "layout");
  redirect(`/tracks/${series.id}`);
}

export async function updateSeriesAction(
  seriesId: string,
  input: SeriesInput
): Promise<ActionResult> {
  const parsed = seriesInputSchema.safeParse(input);
  if (!parsed.success) return { error: "Некорректные данные формы" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизован" };

  const { error } = await supabase
    .from("series")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
    })
    .eq("id", seriesId)
    .eq("author_id", user.id);
  if (error) return { error: error.message };

  revalidatePath(`/tracks/${seriesId}`);
  return { success: true };
}

export async function deleteSeriesAction(
  seriesId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизован" };

  const { error } = await supabase
    .from("series")
    .delete()
    .eq("id", seriesId)
    .eq("author_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Добавляет артефакт в конец трека. position = max(position) + 1.
 * Идемпотентно: если уже добавлен — вернёт success без изменений.
 */
export async function addWorkToSeriesAction(
  seriesId: string,
  workId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизован" };

  // Проверяем, что трек принадлежит пользователю — RLS тоже это сделает,
  // но дадим понятную ошибку.
  const { data: series } = await supabase
    .from("series")
    .select("author_id")
    .eq("id", seriesId)
    .maybeSingle();
  if (!series || series.author_id !== user.id) {
    return { error: "Нет прав на этот трек" };
  }

  // Артефакт должен принадлежать тому же автору
  const { data: work } = await supabase
    .from("works")
    .select("author_id, kind")
    .eq("id", workId)
    .maybeSingle();
  if (!work || work.author_id !== user.id) {
    return { error: "Артефакт не найден или не ваш" };
  }
  if (work.kind !== "artifact") {
    return { error: "В трек можно добавлять только артефакты" };
  }

  // Уже есть в треке?
  const { data: existing } = await supabase
    .from("series_items")
    .select("work_id")
    .eq("series_id", seriesId)
    .eq("work_id", workId)
    .maybeSingle();
  if (existing) {
    revalidatePath(`/tracks/${seriesId}`);
    return { success: true };
  }

  // Следующая позиция
  const { data: last } = await supabase
    .from("series_items")
    .select("position")
    .eq("series_id", seriesId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPosition = ((last?.position as number | undefined) ?? -1) + 1;

  const { error } = await supabase.from("series_items").insert({
    series_id: seriesId,
    work_id: workId,
    position: nextPosition,
  });
  if (error) return { error: error.message };

  revalidatePath(`/tracks/${seriesId}`);
  return { success: true };
}

export async function removeWorkFromSeriesAction(
  seriesId: string,
  workId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизован" };

  const { error } = await supabase
    .from("series_items")
    .delete()
    .eq("series_id", seriesId)
    .eq("work_id", workId);
  if (error) return { error: error.message };

  revalidatePath(`/tracks/${seriesId}`);
  return { success: true };
}

/**
 * Сдвигает артефакт в треке вверх или вниз на одну позицию.
 * Реализовано через swap двух соседних элементов.
 */
export async function reorderSeriesItemAction(
  seriesId: string,
  workId: string,
  direction: "up" | "down"
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизован" };

  const { data: series } = await supabase
    .from("series")
    .select("author_id")
    .eq("id", seriesId)
    .maybeSingle();
  if (!series || series.author_id !== user.id) {
    return { error: "Нет прав" };
  }

  const { data: items } = await supabase
    .from("series_items")
    .select("work_id, position")
    .eq("series_id", seriesId)
    .order("position", { ascending: true });

  const list =
    (items as Array<{ work_id: string; position: number }> | null) ?? [];
  const idx = list.findIndex((i) => i.work_id === workId);
  if (idx < 0) return { error: "Артефакт не в треке" };

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= list.length) {
    return { success: true }; // некуда двигать — молча выходим
  }

  const a = list[idx];
  const b = list[swapIdx];

  // Двух-шаговый swap с использованием временной позиции, чтобы не
  // словить duplicate-key, если на (series_id, position) когда-то появится
  // уникальный индекс.
  await supabase
    .from("series_items")
    .update({ position: -1 })
    .eq("series_id", seriesId)
    .eq("work_id", a.work_id);
  await supabase
    .from("series_items")
    .update({ position: a.position })
    .eq("series_id", seriesId)
    .eq("work_id", b.work_id);
  await supabase
    .from("series_items")
    .update({ position: b.position })
    .eq("series_id", seriesId)
    .eq("work_id", a.work_id);

  revalidatePath(`/tracks/${seriesId}`);
  return { success: true };
}
