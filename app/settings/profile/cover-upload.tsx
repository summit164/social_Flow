"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { uploadCoverAction, deleteCoverAction } from "@/lib/profile/actions";
import { ImagePlus } from "lucide-react";

export function CoverUpload({ coverUrl }: { coverUrl: string | null }) {
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
      const result = await uploadCoverAction(formData);
      if ("error" in result) setError(result.error);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function onDelete() {
    setError(null);
    startTransition(async () => {
      await deleteCoverAction();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative h-40 w-full overflow-hidden rounded-lg border bg-secondary"
        style={
          coverUrl
            ? {
                backgroundImage: `url(${coverUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        {!coverUrl && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground gap-2 text-sm">
            <ImagePlus className="size-5" />
            Без обложки
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
        >
          {isPending ? "Загрузка..." : coverUrl ? "Заменить" : "Загрузить"}
        </Button>
        {coverUrl && (
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
        <p className="text-xs text-muted-foreground ml-auto">
          Рекомендуем 1584×396, до 4 МБ
        </p>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
}
