"use client";

import { useState } from "react";
import { FileText, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatFileSize } from "@/lib/work/utils";
import type { WorkFile } from "@/types/database";

/**
 * Кнопка-карточка файла. Bucket "work-files" приватный, поэтому генерируем
 * signed URL по клику и открываем в новой вкладке.
 */
export function FileLink({ file }: { file: WorkFile }) {
  const [loading, setLoading] = useState(false);

  async function open() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("work-files")
      .createSignedUrl(file.storage_path, 60 * 5); // 5 минут
    setLoading(false);
    if (error || !data) {
      alert("Не удалось получить ссылку на файл");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  return (
    <li>
      <button
        type="button"
        onClick={open}
        disabled={loading}
        className="w-full flex items-center gap-3 rounded-md border border-border bg-card hover:bg-secondary px-4 py-3 text-left transition-colors group"
      >
        <FileText className="size-5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.filename}</p>
          {file.size_bytes && (
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size_bytes)}
            </p>
          )}
        </div>
        <Download className="size-4 text-muted-foreground group-hover:text-primary shrink-0" />
      </button>
    </li>
  );
}
