"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteSeriesAction } from "@/lib/series/actions";

export function DeleteTrackButton({ seriesId }: { seriesId: string }) {
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    if (
      !confirm(
        "Удалить трек? Артефакты внутри останутся, исчезнет только сам трек."
      )
    )
      return;
    startTransition(async () => {
      await deleteSeriesAction(seriesId);
    });
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
    >
      <Trash2 className="size-3.5" />
      Удалить трек
    </button>
  );
}
