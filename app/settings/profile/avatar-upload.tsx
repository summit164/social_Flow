"use client";

import { useRef, useState, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { uploadAvatarAction, deleteAvatarAction } from "@/lib/profile/actions";
import { getInitials } from "@/lib/profile/utils";

export function AvatarUpload({
  avatarUrl,
  displayName,
}: {
  avatarUrl: string | null;
  displayName: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const result = await uploadAvatarAction(formData);
      if ("error" in result) setError(result.error);
      // input всё равно ресетим, чтобы можно было загрузить тот же файл
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function onDelete() {
    setError(null);
    startTransition(async () => {
      await deleteAvatarAction();
    });
  }

  return (
    <div className="flex items-center gap-5">
      <Avatar className="size-20">
        <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
        <AvatarFallback className="text-xl bg-secondary">
          {getInitials(displayName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => inputRef.current?.click()}
          >
            {isPending ? "Загрузка..." : "Загрузить"}
          </Button>
          {avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={onDelete}
            >
              Удалить
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          PNG, JPG, WebP или GIF. Максимум 2 МБ.
        </p>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
}
