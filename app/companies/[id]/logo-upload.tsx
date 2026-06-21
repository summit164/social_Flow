"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Building2, X } from "lucide-react";
import {
  uploadCompanyLogoAction,
  deleteCompanyLogoAction,
} from "@/lib/jobs/actions";

type Props = {
  companyId: string;
  logoUrl: string | null;
  name: string;
};

export function CompanyLogoUpload({ companyId, logoUrl, name }: Props) {
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
      const result = await uploadCompanyLogoAction(companyId, formData);
      if ("error" in result) setError(result.error);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function onDelete() {
    setError(null);
    startTransition(async () => {
      await deleteCompanyLogoAction(companyId);
    });
  }

  return (
    <div className="relative group">
      <div className="flex size-20 items-center justify-center rounded-lg bg-secondary text-muted-foreground overflow-hidden ring-4 ring-card">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={name} className="size-20 object-cover" />
        ) : (
          <Building2 className="size-10" />
        )}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        aria-label="Загрузить лого"
        className="absolute inset-0 rounded-lg flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white"
      >
        <Camera className="size-5" />
      </button>

      {logoUrl && (
        <button
          type="button"
          onClick={onDelete}
          disabled={isPending}
          aria-label="Удалить лого"
          className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="size-3" />
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
        <p className="absolute top-full mt-1 text-xs text-destructive whitespace-nowrap">
          {error}
        </p>
      )}
    </div>
  );
}
