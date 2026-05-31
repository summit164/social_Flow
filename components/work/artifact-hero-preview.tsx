import { FileText, ExternalLink } from "lucide-react";
import { formatFileSize } from "@/lib/work/utils";

type Props = {
  /** Подписанный URL первого файла. NULL если файлов нет или сгенерировать не удалось. */
  url: string | null;
  filename: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
};

const IMAGE_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

/**
 * Превью документа сверху страницы артефакта.
 * Картинка — показывается напрямую, PDF — встраивается через iframe,
 * остальные форматы — нейтральная карточка с иконкой и ссылкой на открытие.
 */
export function ArtifactHeroPreview({
  url,
  filename,
  mimeType,
  sizeBytes,
}: Props) {
  if (!url || !filename) return null;

  const isImage = mimeType ? IMAGE_MIMES.has(mimeType) : false;
  const isPdf = mimeType === "application/pdf";

  if (isImage) {
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={filename}
          className="w-full max-h-[520px] object-contain"
        />
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-secondary">
        <iframe
          src={url}
          title={filename}
          className="w-full h-[560px] bg-white"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-5">
      <div className="flex size-12 items-center justify-center rounded-md bg-secondary text-muted-foreground shrink-0">
        <FileText className="size-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{filename}</p>
        {sizeBytes && (
          <p className="text-xs text-muted-foreground">
            {formatFileSize(sizeBytes)}
          </p>
        )}
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline shrink-0"
      >
        Открыть
        <ExternalLink className="size-3.5" />
      </a>
    </div>
  );
}
