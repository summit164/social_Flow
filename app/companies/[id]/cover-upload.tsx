"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, X } from "lucide-react";
import {
  uploadCompanyCoverAction,
  deleteCompanyCoverAction,
} from "@/lib/jobs/actions";

type Props = {
  companyId: string;
  coverUrl: string | null;
};

export function CompanyCoverUpload({ companyId, coverUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    startTransition(async () => {
      const result = await uploadCompanyCoverAction(companyId, formData);
      if ("error" in result) setError(result.error);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function onDelete() {
    setError(null);
    startTransition(async () => {
      await deleteCompanyCoverAction(companyId);
    });
  }

  return (
    <div className="relative group">
      <div
        className="h-40 sm:h-48 w-full rounded-lg bg-gradient-to-br from-[#5b6ee1] via-[#4a86b0] to-[#a8b4be] overflow-hidden"
        style={
          coverUrl
            ? {
                backgroundImage: `url(${coverUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        aria-label="Загрузить обложку"
        className="absolute inset-0 rounded-lg flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white"
      >
        <Camera className="size-6" />
      </button>

      {coverUrl && (
        <button
          type="button"
          onClick={onDelete}
          disabled={isPending}
          aria-label="Удалить обложку"
          className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-md bg-black/50 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
        >
          <X className="size-3" />
          Убрать
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={onFileChange}
      />

      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
