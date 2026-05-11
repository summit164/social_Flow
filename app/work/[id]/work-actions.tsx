"use client";

import { useTransition, useState } from "react";
import { MoreHorizontal, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  togglePublishAction,
  deleteWorkAction,
} from "@/lib/work/actions";

/**
 * Меню для автора работы: опубликовать/снять с публикации, удалить.
 */
export function WorkActions({
  workId,
  isPublished,
}: {
  workId: string;
  isPublished: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function onTogglePublish() {
    startTransition(async () => {
      await togglePublishAction(workId);
    });
  }

  function onDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      // Сбросим через 3 сек
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    startTransition(async () => {
      await deleteWorkAction(workId);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" disabled={isPending}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onTogglePublish}>
          {isPublished ? (
            <>
              <EyeOff className="size-4" />
              Снять с публикации
            </>
          ) : (
            <>
              <Eye className="size-4" />
              Опубликовать
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="size-4" />
          {confirmDelete ? "Точно удалить?" : "Удалить работу"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
