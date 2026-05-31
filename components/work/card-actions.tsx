"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import { toggleLikeAction } from "@/lib/work/actions";
import { cn } from "@/lib/utils";

type Props = {
  workId: string;
  initialLiked: boolean;
  likesCount: number;
  commentsCount: number;
  /** Если пользователь не залогинен — кнопки ведут на /login вместо тоггла. */
  canInteract: boolean;
};

/**
 * Компактная панель действий внутри карточки в ленте/профиле.
 * Лайк ставится прямо отсюда, комментарий ведёт на /work/{id}#comments.
 */
export function CardActions({
  workId,
  initialLiked,
  likesCount,
  commentsCount,
  canInteract,
}: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(likesCount);
  const [isPending, startTransition] = useTransition();

  function onLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!canInteract) {
      window.location.href = "/login";
      return;
    }
    setLiked((v) => !v);
    setCount((c) => (liked ? c - 1 : c + 1));
    startTransition(async () => {
      await toggleLikeAction(workId);
    });
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        type="button"
        onClick={onLike}
        disabled={isPending}
        aria-pressed={liked}
        aria-label={liked ? "Убрать лайк" : "Поставить лайк"}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 h-8 transition-colors",
          liked
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        )}
      >
        <Heart className={cn("size-4", liked && "fill-current")} />
        <span className="tabular-nums">{count}</span>
      </button>

      <Link
        href={`/work/${workId}#comments`}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1.5 rounded-md px-2.5 h-8 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        aria-label="Комментарии"
      >
        <MessageCircle className="size-4" />
        <span className="tabular-nums">{commentsCount}</span>
      </Link>
    </div>
  );
}
