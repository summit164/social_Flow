"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Trash2, Reply, ChevronDown, ChevronUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/profile/utils";
import { deleteCommentAction } from "@/lib/comment/actions";
import { CommentForm } from "./comment-form";

export type CommentAuthor = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type CommentNode = {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  author: CommentAuthor | null;
  children: CommentNode[];
};

type Props = {
  node: CommentNode;
  workId: string;
  viewerId: string | null;
  depth?: number;
};

const MAX_VISUAL_DEPTH = 6;

export function CommentItem({ node, workId, viewerId, depth = 0 }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isReplying, setIsReplying] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const repliesCount = countDescendants(node);

  const date = new Date(node.createdAt).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  function onDelete() {
    if (!confirm("Удалить комментарий? Ответы тоже исчезнут.")) return;
    startTransition(async () => {
      await deleteCommentAction(node.id, workId);
    });
  }

  const name =
    node.author?.display_name || node.author?.username || "Аноним";
  const canDelete = !!viewerId && viewerId === node.authorId;
  const canReply = !!viewerId;
  const indentDepth = Math.min(depth, MAX_VISUAL_DEPTH);

  return (
    <li
      className={
        depth === 0
          ? "py-4 border-b border-border last:border-0"
          : "pt-3 border-l border-border pl-4"
      }
      style={depth > 0 ? { marginLeft: `${indentDepth * 4}px` } : undefined}
    >
      <div className="flex gap-3">
        <Avatar className="size-8 shrink-0">
          <AvatarImage src={node.author?.avatar_url ?? undefined} alt={name} />
          <AvatarFallback className="text-xs bg-secondary">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
            {node.author ? (
              <Link
                href={`/u/${node.author.username}`}
                className="font-medium hover:underline"
              >
                {name}
              </Link>
            ) : (
              <span className="font-medium">{name}</span>
            )}
            {node.author && (
              <span className="text-xs text-muted-foreground">
                @{node.author.username}
              </span>
            )}
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{date}</span>
            {canDelete && (
              <button
                type="button"
                onClick={onDelete}
                disabled={isPending}
                aria-label="Удалить"
                className="ml-auto text-muted-foreground hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
          <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">
            {node.content}
          </p>

          {canReply && (
            <div className="mt-1.5">
              {isReplying ? (
                <div className="mt-2">
                  <CommentForm
                    workId={workId}
                    parentId={node.id}
                    autoFocus
                    placeholder={`Ответить ${name}...`}
                    onCancel={() => setIsReplying(false)}
                    onSubmitted={() => setIsReplying(false)}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsReplying(true)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                >
                  <Reply className="size-3.5" />
                  Ответить
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {node.children.length > 0 && (
        <>
          <div className="mt-2 ml-11">
            <button
              type="button"
              onClick={() => setIsCollapsed((v) => !v)}
              aria-expanded={!isCollapsed}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {isCollapsed ? (
                <>
                  <ChevronDown className="size-3.5" />
                  Показать ответы ({repliesCount})
                </>
              ) : (
                <>
                  <ChevronUp className="size-3.5" />
                  Скрыть ответы
                </>
              )}
            </button>
          </div>

          {!isCollapsed && (
            <ul className="mt-2 flex flex-col">
              {node.children.map((child) => (
                <CommentItem
                  key={child.id}
                  node={child}
                  workId={workId}
                  viewerId={viewerId}
                  depth={depth + 1}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </li>
  );
}

function countDescendants(node: CommentNode): number {
  let n = node.children.length;
  for (const c of node.children) n += countDescendants(c);
  return n;
}
