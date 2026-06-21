"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteCompanyAction } from "@/lib/jobs/actions";

export function DeleteCompanyButton({ companyId }: { companyId: string }) {
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    if (
      !confirm("Удалить компанию? Все вакансии под ней тоже исчезнут.")
    )
      return;
    startTransition(async () => {
      await deleteCompanyAction(companyId);
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
      Удалить компанию
    </button>
  );
}
