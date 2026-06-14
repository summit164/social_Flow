"use client";

import { useTransition } from "react";
import { Plus, Check } from "lucide-react";
import { addWorkToSeriesAction } from "@/lib/series/actions";

type Props = {
  seriesId: string;
  workId: string;
};

export function AddArtifactButton({ seriesId, workId }: Props) {
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      await addWorkToSeriesAction(seriesId, workId);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 h-8 text-sm hover:bg-secondary transition-colors disabled:opacity-50"
    >
      {isPending ? (
        <Check className="size-4" />
      ) : (
        <Plus className="size-4" />
      )}
      Добавить
    </button>
  );
}
