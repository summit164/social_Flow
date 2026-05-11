import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkCard } from "@/components/work/work-card";
import { cn } from "@/lib/utils";

export const metadata = { title: "Лента — StudyFlow" };

type SearchParams = Promise<{ tab?: string }>;

const PAGE_SIZE = 30;

export default async function FeedPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { tab } = await searchParams;
  const activeTab: "for-you" | "following" =
    tab === "following" ? "following" : "for-you";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Если на «Подписках», но не залогинен — отправляем логиниться
  if (activeTab === "following" && !user) {
    redirect("/login");
  }

  // Базовый запрос работ с автором, файлами и лайками
  let query = supabase
    .from("works")
    .select(
      `id, title, description, discipline, status, published_at, created_at,
       author:profiles!works_author_id_fkey(username, display_name, avatar_url),
       work_files(count), likes(count)`
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(PAGE_SIZE);

  // На «Подписках» — фильтруем по подпискам
  if (activeTab === "following" && user) {
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);
    const followingIds = follows?.map((f) => f.following_id) ?? [];
    if (followingIds.length === 0) {
      // Нет подписок — покажем пустое состояние
      query = query.in("author_id", ["00000000-0000-0000-0000-000000000000"]);
    } else {
      query = query.in("author_id", followingIds);
    }
  }

  const { data: works } = await query;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      {/* Вкладки */}
      <div className="flex border-b border-border mb-6">
        <TabLink
          href="/feed"
          label="Открытия"
          active={activeTab === "for-you"}
        />
        <TabLink
          href="/feed?tab=following"
          label="Подписки"
          active={activeTab === "following"}
        />
      </div>

      {/* Лента */}
      {works && works.length > 0 ? (
        <div className="flex flex-col gap-3">
          {works.map((w) => {
            const a = w.author as unknown as
              | { username: string; display_name: string | null; avatar_url: string | null }
              | null;
            return (
              <WorkCard
                key={w.id}
                id={w.id}
                title={w.title}
                description={w.description}
                discipline={w.discipline}
                status={w.status}
                publishedAt={w.published_at ?? w.created_at}
                filesCount={
                  Array.isArray(w.work_files) && w.work_files[0]
                    ? (w.work_files[0] as { count: number }).count
                    : 0
                }
                likesCount={
                  Array.isArray(w.likes) && w.likes[0]
                    ? (w.likes[0] as { count: number }).count
                    : 0
                }
                author={a ?? undefined}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState tab={activeTab} hasUser={!!user} />
      )}
    </main>
  );
}

function TabLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "px-4 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2",
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </Link>
  );
}

function EmptyState({
  tab,
  hasUser,
}: {
  tab: "for-you" | "following";
  hasUser: boolean;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border p-10 text-center">
      {tab === "following" ? (
        <>
          <p className="text-sm font-medium">Здесь пусто</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Подпишитесь на авторов, чтобы видеть их работы.
          </p>
          <Link
            href="/feed"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            ← Перейти к открытиям
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm font-medium">Пока никто ничего не опубликовал</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasUser
              ? "Будьте первым — создайте работу!"
              : "Зарегистрируйтесь и опубликуйте первую работу."}
          </p>
          {hasUser ? (
            <Link
              href="/work/new"
              className="mt-4 inline-block text-sm text-primary hover:underline"
            >
              Создать работу →
            </Link>
          ) : (
            <Link
              href="/register"
              className="mt-4 inline-block text-sm text-primary hover:underline"
            >
              Создать аккаунт →
            </Link>
          )}
        </>
      )}
    </div>
  );
}
