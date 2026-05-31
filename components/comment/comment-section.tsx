import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CommentForm } from "./comment-form";
import {
  CommentItem,
  type CommentNode,
  type CommentAuthor,
} from "./comment-item";

type Row = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  parent_id: string | null;
  author: CommentAuthor | null;
};

/**
 * Серверный компонент с комментариями к работе/посту.
 * Загружает плоский список и собирает дерево.
 * Корневые комментарии сортируются от новых к старым,
 * ответы внутри ветки — от старых к новым, чтобы читать как разговор.
 */
export async function CommentSection({ workId }: { workId: string }) {
  const supabase = await createClient();

  const [
    { data: comments },
    {
      data: { user: viewer },
    },
  ] = await Promise.all([
    supabase
      .from("comments")
      .select(
        `id, content, created_at, author_id, parent_id,
         author:profiles!comments_author_id_fkey(username, display_name, avatar_url)`
      )
      .eq("work_id", workId)
      .order("created_at", { ascending: true }),
    supabase.auth.getUser(),
  ]);

  const rows = (comments ?? []) as unknown as Row[];
  const tree = buildTree(rows);

  return (
    <section id="comments" className="mt-10 scroll-mt-20">
      <h2 className="text-base font-medium mb-4 flex items-center gap-2">
        <MessageCircle className="size-4" />
        Комментарии
        {rows.length > 0 && (
          <span className="text-muted-foreground font-normal">
            ({rows.length})
          </span>
        )}
      </h2>

      {viewer ? (
        <div className="mb-2">
          <CommentForm workId={workId} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-4">
          <Link href="/login" className="text-primary hover:underline">
            Войдите
          </Link>
          , чтобы оставить комментарий.
        </p>
      )}

      {tree.length > 0 ? (
        <ul className="mt-2">
          {tree.map((node) => (
            <CommentItem
              key={node.id}
              node={node}
              workId={workId}
              viewerId={viewer?.id ?? null}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground mt-4">
          Пока нет комментариев. Будьте первым!
        </p>
      )}
    </section>
  );
}

/**
 * Собирает дерево комментариев из плоского списка.
 * Корни идут от новых к старым; внутри ветки — от старых к новым.
 */
function buildTree(rows: Row[]): CommentNode[] {
  const byId = new Map<string, CommentNode>();
  for (const r of rows) {
    byId.set(r.id, {
      id: r.id,
      content: r.content,
      createdAt: r.created_at,
      authorId: r.author_id,
      author: r.author,
      children: [],
    });
  }

  const roots: CommentNode[] = [];
  for (const r of rows) {
    const node = byId.get(r.id)!;
    if (r.parent_id && byId.has(r.parent_id)) {
      byId.get(r.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // rows уже отсортированы по created_at ASC, поэтому children в правильном
  // порядке. Корни переворачиваем — новые сверху.
  roots.reverse();
  return roots;
}
