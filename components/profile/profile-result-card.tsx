import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/profile/utils";

type Props = {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  affiliation: string | null;
};

/**
 * Компактная карточка пользователя для списков (поиск, рекомендации).
 */
export function ProfileResultCard({
  username,
  displayName,
  avatarUrl,
  bio,
  affiliation,
}: Props) {
  const name = displayName || username;

  return (
    <Link
      href={`/u/${username}`}
      className="flex gap-3 rounded-lg border border-border bg-card px-5 py-4 hover:bg-secondary/30 transition-colors"
    >
      <Avatar className="size-12 shrink-0">
        <AvatarImage src={avatarUrl ?? undefined} alt={name} />
        <AvatarFallback className="text-sm bg-secondary">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium truncate">{name}</span>
          <span className="text-xs text-muted-foreground truncate">
            @{username}
          </span>
        </div>
        {affiliation && (
          <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
            <GraduationCap className="size-3.5 shrink-0" />
            <span className="truncate">{affiliation}</span>
          </p>
        )}
        {bio && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {bio}
          </p>
        )}
      </div>
    </Link>
  );
}
