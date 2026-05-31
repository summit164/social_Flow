import Link from "next/link";
import { FileText, EyeOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/profile/utils";
import { CardActions } from "./card-actions";

type Author = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type WorkCardProps = {
  id: string;
  title: string;
  description: string | null;
  discipline: string | null;
  status: "draft" | "published" | "archived";
  publishedAt: string | null;
  filesCount: number;
  likesCount: number;
  commentsCount: number;
  viewerLiked: boolean;
  canInteract: boolean;
  /** Если передан — отображается строка с автором сверху. */
  author?: Author;
};

export function WorkCard({
  id,
  title,
  description,
  discipline,
  status,
  publishedAt,
  filesCount,
  likesCount,
  commentsCount,
  viewerLiked,
  canInteract,
  author,
}: WorkCardProps) {
  const date = publishedAt
    ? new Date(publishedAt).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <article className="rounded-lg border border-border bg-card transition-colors hover:bg-secondary/30">
      {author && (
        <div className="flex items-center gap-2 px-5 pt-4">
          <Link
            href={`/u/${author.username}`}
            className="flex items-center gap-2 group"
          >
            <Avatar className="size-7">
              <AvatarImage
                src={author.avatar_url ?? undefined}
                alt={author.display_name ?? author.username}
              />
              <AvatarFallback className="text-xs bg-secondary">
                {getInitials(author.display_name ?? author.username)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium group-hover:underline">
              {author.display_name ?? author.username}
            </span>
            <span className="text-xs text-muted-foreground">
              @{author.username}
            </span>
          </Link>
          {date && (
            <>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{date}</span>
            </>
          )}
        </div>
      )}

      <Link href={`/work/${id}`} className="block px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-medium leading-snug line-clamp-2">
            {title}
          </h3>
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
          {!author && date && <span>{date}</span>}
          {filesCount > 0 && (
            <span className="flex items-center gap-1">
              <FileText className="size-3.5" />
              {filesCount}
            </span>
          )}
        </div>
      </Link>

      <div className="px-3 pb-2 pt-1 border-t border-border/60">
        <CardActions
          workId={id}
          initialLiked={viewerLiked}
          likesCount={likesCount}
          commentsCount={commentsCount}
          canInteract={canInteract}
        />
      </div>
    </article>
  );
}
