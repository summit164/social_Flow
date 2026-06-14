"use client";

import { useTransition } from "react";
import { ArrowUp, ArrowDown, X } from "lucide-react";
import {
  removeWorkFromSeriesAction,
  reorderSeriesItemAction,
} from "@/lib/series/actions";

type Props = {
  seriesId: string;
  workId: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
};

export function ItemControls({ seriesId, workId, canMoveUp, canMoveDown }: Props) {
  const [isPending, startTransition] = useTransition();

  function move(direction: "up" | "down") {
    startTransition(async () => {
      await reorderSeriesItemAction(seriesId, workId, direction);
    });
  }

  function remove() {
    if (!confirm("Убрать артефакт из трека? Сам артефакт не удалится.")) return;
    startTransition(async () => {
      await removeWorkFromSeriesAction(seriesId, workId);
    });
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => move("up")}
        disabled={!canMoveUp || isPending}
        aria-label="Вверх"
        className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ArrowUp className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => move("down")}
        disabled={!canMoveDown || isPending}
        aria-label="Вниз"
        className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ArrowDown className="size-4" />
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={isPending}
        aria-label="Убрать из трека"
        className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-secondary disabled:opacity-30"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
