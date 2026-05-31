"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { commentInputSchema, type CommentInput } from "./schemas";

type ActionResult = { error: string } | { success: true };

export async function createCommentAction(
  workId: string,
  input: CommentInput,
  parentId: string | null = null
): Promise<ActionResult> {
  const parsed = commentInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Некорректный комментарий" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизован" };

  // Если есть parent — проверяем, что он принадлежит этой же работе.
  if (parentId) {
    const { data: parent } = await supabase
      .from("comments")
      .select("work_id")
      .eq("id", parentId)
      .maybeSingle();
    if (!parent || parent.work_id !== workId) {
      return { error: "Родительский комментарий не найден" };
    }
  }

  const { error } = await supabase.from("comments").insert({
    work_id: workId,
    author_id: user.id,
    parent_id: parentId,
    content: parsed.data.content.trim(),
  });
  if (error) return { error: error.message };

  revalidatePath(`/work/${workId}`);
  return { success: true };
}

export async function deleteCommentAction(
  commentId: string,
  workId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизован" };

  // RLS позволит удалить только свой комментарий
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("author_id", user.id);
  if (error) return { error: error.message };

  revalidatePath(`/work/${workId}`);
  return { success: true };
}
