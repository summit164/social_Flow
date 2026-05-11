"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleLikeAction } from "@/lib/work/actions";
import { cn } from "@/lib/utils";

export function LikeButton({
  workId,
  initialLiked,
  initialCount,
}: {
  workId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  function onClick() {
    setLiked((v) => !v);
    setCount((c) => (liked ? c - 1 : c + 1));
    startTransition(async () => {
      await toggleLikeAction(workId);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 h-9 text-sm transition-colors",
        liked
          ? "text-primary border-primary/40 bg-primary/5"
          : "text-foreground hover:bg-secondary"
      )}
    >
      <Heart className={cn("size-4", liked && "fill-current")} />
      {count}
    </button>
  );
}
