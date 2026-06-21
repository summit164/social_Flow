"use client";

import { useTransition } from "react";
import { Trash2, Power } from "lucide-react";
import {
  deleteVacancyAction,
  toggleVacancyStatusAction,
} from "@/lib/jobs/actions";
import { cn } from "@/lib/utils";

type Props = {
  vacancyId: string;
  isOpen: boolean;
};

export function VacancyOwnerActions({ vacancyId, isOpen }: Props) {
  const [isPending, startTransition] = useTransition();

  function onToggle() {
    startTransition(async () => {
      await toggleVacancyStatusAction(vacancyId);
    });
  }

  function onDelete() {
    if (!confirm("Удалить вакансию?")) return;
    startTransition(async () => {
      await deleteVacancyAction(vacancyId);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onToggle}
        disabled={isPending}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border border-border px-3 h-8 text-xs hover:bg-secondary transition-colors disabled:opacity-50",
          isOpen ? "" : "bg-secondary"
        )}
      >
        <Power className="size-3.5" />
        {isOpen ? "Закрыть" : "Открыть"}
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
      >
        <Trash2 className="size-3.5" />
        Удалить
      </button>
    </div>
  );
}
