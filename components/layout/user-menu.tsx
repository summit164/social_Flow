import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/lib/auth/actions";
import { getInitials } from "@/lib/profile/utils";
import type { Profile } from "@/types/database";
import { LogOut, Settings, User } from "lucide-react";

/**
 * Кнопка-аватар в шапке с выпадающим меню.
 */
export function UserMenu({ profile }: { profile: Profile }) {
  const displayName = profile.display_name || profile.username;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring transition-opacity hover:opacity-80">
        <Avatar className="size-9">
          <AvatarImage src={profile.avatar_url ?? undefined} alt={displayName} />
          <AvatarFallback className="bg-secondary text-sm">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
          <span className="text-sm font-medium">{displayName}</span>
          <span className="text-xs text-muted-foreground">@{profile.username}</span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href={`/u/${profile.username}`}>
            <User className="size-4" />
            Мой профиль
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/settings/profile">
            <Settings className="size-4" />
            Настройки
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <form action={logoutAction} className="w-full">
            <button
              type="submit"
              className="w-full flex items-center gap-2 text-left"
            >
              <LogOut className="size-4" />
              Выйти
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
