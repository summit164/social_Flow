import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GraduationCap, Users } from "lucide-react";
import { getInitials } from "@/lib/profile/utils";
import { AuthorFollow } from "@/components/work/author-follow";

type Author = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  affiliation: string | null;
  bio: string | null;
};

type Props = {
  author: Author;
  followersCount: number;
  isOwnProfile: boolean;
  viewerLogged: boolean;
  isFollowing: boolean;
};

/**
 * Боковая карточка с информацией об авторе работы — для страницы артефакта.
 * Имя/аватар/аффилиация, био, счётчик подписчиков, кнопка подписки.
 */
export function AuthorSideCard({
  author,
  followersCount,
  isOwnProfile,
  viewerLogged,
  isFollowing,
}: Props) {
  const name = author.display_name || author.username;

  return (
    <aside className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
      <Link
        href={`/u/${author.username}`}
        className="flex items-center gap-3 group"
      >
        <Avatar className="size-12">
          <AvatarImage src={author.avatar_url ?? undefined} alt={name} />
          <AvatarFallback className="text-base bg-secondary">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium group-hover:underline truncate">
            {name}
          </span>
          <span className="text-xs text-muted-foreground truncate">
            @{author.username}
          </span>
        </div>
      </Link>

      {author.affiliation && (
        <p className="text-xs flex items-center gap-1.5 text-muted-foreground">
          <GraduationCap className="size-3.5 shrink-0" />
          <span className="truncate">{author.affiliation}</span>
        </p>
      )}

      {author.bio && (
        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-5">
          {author.bio}
        </p>
      )}

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Users className="size-3.5" />
        <span>
          <span className="font-medium text-foreground">{followersCount}</span>{" "}
          подписчиков
        </span>
      </div>

      {!isOwnProfile && viewerLogged && (
        <AuthorFollow targetUserId={author.id} initialFollowing={isFollowing} />
      )}
      <Link
        href={`/u/${author.username}`}
        className="text-xs text-primary hover:underline"
      >
        Открыть профиль →
      </Link>
    </aside>
  );
}
