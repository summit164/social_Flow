import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/profile/utils";
import { CardActions } from "./card-actions";

type Author = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type PostMedia = {
  url: string;
  mime: string | null;
};

type PostCardProps = {
  id: string;
  content: string | null;
  discipline: string | null;
  publishedAt: string | null;
  likesCount: number;
  commentsCount: number;
  viewerLiked: boolean;
  canInteract: boolean;
  author?: Author;
  media?: PostMedia | null;
};

export function PostCard({
  id,
  content,
  discipline,
  publishedAt,
  likesCount,
  commentsCount,
  viewerLiked,
  canInteract,
  author,
  media,
}: PostCardProps) {
  const isVideo = media?.mime?.startsWith("video/") ?? false;
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

      <Link href={`/work/${id}`} className="block">
        <div className="px-5 pt-4">
          {content && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap line-clamp-6">
              {content}
            </p>
          )}
        </div>

        {media && (
          <div className="mt-3 mx-5 overflow-hidden rounded-md border border-border bg-black">
            {isVideo ? (
              <video
                src={media.url}
                controls
                preload="metadata"
                className="w-full max-h-72 object-contain"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={media.url}
                alt=""
                className="w-full max-h-72 object-contain"
              />
            )}
          </div>
        )}
      </Link>

      <div className="px-3 pb-2 pt-2 flex items-center justify-between gap-3">
        <CardActions
          workId={id}
          initialLiked={viewerLiked}
          likesCount={likesCount}
          commentsCount={commentsCount}
          canInteract={canInteract}
        />
        {discipline && (
          <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium mr-2">
            {discipline}
          </span>
        )}
      </div>
    </article>
  );
}
