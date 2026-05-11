import Link from "next/link";
import { FileText, Heart, EyeOff } from "lucide-react";

type WorkCardProps = {
  id: string;
  title: string;
  description: string | null;
  discipline: string | null;
  status: "draft" | "published" | "archived";
  publishedAt: string | null;
  filesCount: number;
  likesCount: number;
};

/**
 * Карточка превью работы — для лент и страниц профиля.
 */
export function WorkCard({
  id,
  title,
  description,
  discipline,
  status,
  publishedAt,
  filesCount,
  likesCount,
}: WorkCardProps) {
  const date = publishedAt
    ? new Date(publishedAt).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <Link
      href={`/work/${id}`}
      className="block rounded-lg border border-border bg-card p-5 transition-colors hover:bg-secondary/50"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-medium leading-snug line-clamp-2">{title}</h3>
        {status === "draft" && (
          <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            <EyeOff className="size-3" />
            Черновик
          </span>
        )}
      </div>

      {description && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {description}
        </p>
      )}

      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        {discipline && (
          <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium">
            {discipline}
          </span>
        )}
        {date && <span>{date}</span>}
        {filesCount > 0 && (
          <span className="flex items-center gap-1">
            <FileText className="size-3.5" />
            {filesCount}
          </span>
        )}
        {likesCount > 0 && (
          <span className="flex items-center gap-1">
            <Heart className="size-3.5" />
            {likesCount}
          </span>
        )}
      </div>
    </Link>
  );
}
