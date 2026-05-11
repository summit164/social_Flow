import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "./user-menu";

/**
 * Header — серверный компонент. На сервере проверяем сессию,
 * чтобы не было «мерцания» состояния авторизации.
 */
export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Если есть юзер — подгружаем его профиль для аватара/имени
  const { data: profile } = user
    ? await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
    : { data: null };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Логотип */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative size-11 flex items-center justify-center transition-transform group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="StudyFlow"
              width={88}
              height={88}
              priority
              className="size-11 object-contain"
            />
          </div>
          <span className="font-serif text-lg font-medium tracking-tight">
            StudyFlow
          </span>
        </Link>

        {/* Навигация */}
        <nav className="hidden md:flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/feed">Лента</Link>
          </Button>
          <Button variant="ghost" size="sm" disabled>
            Поиск
          </Button>
        </nav>

        {/* Действия справа: аватар-меню для залогиненного, кнопки для гостя */}
        <div className="flex items-center gap-2">
          {profile ? (
            <>
              <Button size="sm" asChild>
                <Link href="/work/new">
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">Создать</span>
                </Link>
              </Button>
              <UserMenu profile={profile} />
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Войти</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Создать аккаунт</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
