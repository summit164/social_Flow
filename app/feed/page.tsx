import Link from "next/link";
import { redirect } from "next/navigation";
import { NotebookText, MessageSquareText, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { WorkCard } from "@/components/work/work-card";
import { PostCard } from "@/components/work/post-card";
import { buildPostMediaMap } from "@/lib/work/post-media";
import { cn } from "@/lib/utils";

export const metadata = { title: "Лента — StudyFlow" };

type FeedTab = "artifacts" | "posts" | "following";

type SearchParams = Promise<{ tab?: string }>;

const PAGE_SIZE = 30;

export default async function FeedPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { tab } = await searchParams;
  const activeTab: FeedTab =
    tab === "following" ? "following" : tab === "posts" ? "posts" : "artifacts";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (activeTab === "following" && !user) {
    redirect("/login");
  }

  // Базовый запрос работ с автором, файлами и лайками
  let query = supabase
    .from("works")
    .select(
      `id, title, content, description, discipline, status, kind, published_at, created_at,
       author:profiles!works_author_id_fkey(username, display_name, avatar_url),
       work_files(storage_path, mime_type, position), likes(count)`
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (activeTab === "artifacts") {
    query = query.eq("kind", "artifact");
  } else if (activeTab === "posts") {
    query = query.eq("kind", "post");
  }

  if (activeTab === "following" && user) {
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);
    const followingIds = follows?.map((f) => f.following_id) ?? [];
    if (followingIds.length === 0) {
      query = query.in("author_id", ["00000000-0000-0000-0000-000000000000"]);
    } else {
      query = query.in("author_id", followingIds);
    }
  }

  const { data: works } = await query;

  // Сгенерим signed URLs для медиа постов одним батчем
  const postRows = (works ?? [])
    .filter((w) => w.kind === "post")
    .map((w) => ({
      id: w.id,
      work_files: (w.work_files as unknown as Array<{
        storage_path: string;
        mime_type: string | null;
        position: number;
      }> | null) ?? [],
    }));
  const postMedia = await buildPostMediaMap(supabase, postRows);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      {/* Вкладки */}
      <div className="flex justify-center border-b border-border mb-6">
        <TabLink
          href="/feed"
          label="Артефакты"
          icon={<NotebookText className="size-4" />}
          active={activeTab === "artifacts"}
        />
        <TabLink
          href="/feed?tab=posts"
          label="Посты"
          icon={<MessageSquareText className="size-4" />}
          active={activeTab === "posts"}
        />
        <TabLink
          href="/feed?tab=following"
          label="Подписки"
          icon={<Users className="size-4" />}
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
            const likesCount =
              Array.isArray(w.likes) && w.likes[0]
                ? (w.likes[0] as { count: number }).count
                : 0;
            const filesCount = Array.isArray(w.work_files)
              ? w.work_files.length
              : 0;

            if (w.kind === "post") {
              return (
                <PostCard
                  key={w.id}
                  id={w.id}
                  content={w.content}
                  discipline={w.discipline}
                  publishedAt={w.published_at ?? w.created_at}
                  likesCount={likesCount}
                  author={a ?? undefined}
                  media={postMedia.get(w.id) ?? null}
                />
              );
            }

            return (
              <WorkCard
                key={w.id}
                id={w.id}
                title={w.title}
                description={w.description}
                discipline={w.discipline}
                status={w.status}
                publishedAt={w.published_at ?? w.created_at}
                filesCount={filesCount}
                likesCount={likesCount}
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
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2",
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

function EmptyState({
  tab,
  hasUser,
}: {
  tab: FeedTab;
  hasUser: boolean;
}) {
  if (tab === "following") {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center">
        <p className="text-sm font-medium">Здесь пусто</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Подпишитесь на авторов, чтобы видеть их работы.
        </p>
        <Link
          href="/feed"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          ← Перейти к артефактам
        </Link>
      </div>
    );
  }

  const what = tab === "posts" ? "постов" : "артефактов";
  const createHref = tab === "posts" ? "/work/new?kind=post" : "/work/new";
  const createLabel = tab === "posts" ? "Написать пост →" : "Создать артефакт →";

  return (
    <div className="rounded-lg border border-dashed border-border p-10 text-center">
      <p className="text-sm font-medium">Пока нет {what}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasUser
          ? "Будьте первым — опубликуйте что-нибудь!"
          : "Зарегистрируйтесь и опубликуйте первым."}
      </p>
      {hasUser ? (
        <Link
          href={createHref}
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          {createLabel}
        </Link>
      ) : (
        <Link
          href="/register"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          Создать аккаунт →
        </Link>
      )}
    </div>
  );
}
