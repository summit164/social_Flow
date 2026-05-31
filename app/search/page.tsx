import Link from "next/link";
import { Users, NotebookText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { WorkCard } from "@/components/work/work-card";
import { PostCard } from "@/components/work/post-card";
import { ProfileResultCard } from "@/components/profile/profile-result-card";
import { buildPostMediaMap } from "@/lib/work/post-media";
import { SearchInput } from "./search-input";

export const metadata = { title: "Поиск — StudyFlow" };

type SearchParams = Promise<{ q?: string; tab?: string }>;

const PAGE_SIZE = 30;

/**
 * Чистим пользовательский ввод для использования в Supabase .or().
 * Запятые и круглые скобки ломают синтаксис .or(), кавычки/обратные слэши
 * убираем на всякий случай. Также убираем % и _ — они спецсимволы ILIKE.
 */
function sanitizeForIlike(input: string): string {
  return input.replace(/[,()'"\\%_]/g, " ").trim();
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q: rawQ, tab } = await searchParams;
  const activeTab: "people" | "works" = tab === "people" ? "people" : "works";
  const q = (rawQ ?? "").trim();
  const sanitized = sanitizeForIlike(q);
  const hasQuery = sanitized.length >= 1;
  const pattern = `%${sanitized}%`;

  const supabase = await createClient();
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  // ---------- Поиск ----------
  let profiles: Array<{
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    affiliation: string | null;
  }> = [];

  let works: Array<{
    id: string;
    title: string;
    content: string | null;
    description: string | null;
    discipline: string | null;
    status: "draft" | "published" | "archived";
    kind: "artifact" | "post";
    published_at: string | null;
    created_at: string;
    author: { username: string; display_name: string | null; avatar_url: string | null } | null;
    work_files: Array<{ storage_path: string; mime_type: string | null; position: number }> | null;
    likes: Array<{ count: number }> | null;
    comments: Array<{ count: number }> | null;
  }> = [];

  if (hasQuery) {
    if (activeTab === "people") {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, bio, affiliation")
        .or(
          `username.ilike.${pattern},display_name.ilike.${pattern},bio.ilike.${pattern},affiliation.ilike.${pattern}`
        )
        .limit(PAGE_SIZE);
      profiles = (data as typeof profiles) ?? [];
    } else {
      const { data } = await supabase
        .from("works")
        .select(
          `id, title, content, description, discipline, status, kind, published_at, created_at,
           author:profiles!works_author_id_fkey(username, display_name, avatar_url),
           work_files(storage_path, mime_type, position),
           likes(count), comments(count)`
        )
        .eq("status", "published")
        .or(
          `title.ilike.${pattern},description.ilike.${pattern},content.ilike.${pattern},discipline.ilike.${pattern}`
        )
        .order("published_at", { ascending: false })
        .limit(PAGE_SIZE);
      works = (data as typeof works) ?? [];
    }
  }

  // Лайки текущего пользователя по результатам
  const workIds = works.map((w) => w.id);
  const likedSet = new Set<string>();
  if (viewer && workIds.length > 0) {
    const { data: likedRows } = await supabase
      .from("likes")
      .select("work_id")
      .eq("user_id", viewer.id)
      .in("work_id", workIds);
    likedRows?.forEach((r) =>
      likedSet.add((r as unknown as { work_id: string }).work_id)
    );
  }

  // Подписанные ссылки для медиа постов
  const postRows = works
    .filter((w) => w.kind === "post")
    .map((w) => ({ id: w.id, work_files: w.work_files ?? [] }));
  const postMedia = await buildPostMediaMap(supabase, postRows);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <SearchInput initialQuery={q} activeTab={activeTab} />

      {/* Вкладки */}
      <div className="mt-5 flex justify-center border-b border-border">
        <TabLink
          href={makeUrl(q, "works")}
          label="Работы"
          icon={<NotebookText className="size-4" />}
          active={activeTab === "works"}
        />
        <TabLink
          href={makeUrl(q, "people")}
          label="Люди"
          icon={<Users className="size-4" />}
          active={activeTab === "people"}
        />
      </div>

      <div className="mt-6">
        {!hasQuery ? (
          <EmptyHint />
        ) : activeTab === "people" ? (
          profiles.length > 0 ? (
            <div className="flex flex-col gap-3">
              {profiles.map((p) => (
                <ProfileResultCard
                  key={p.id}
                  username={p.username}
                  displayName={p.display_name}
                  avatarUrl={p.avatar_url}
                  bio={p.bio}
                  affiliation={p.affiliation}
                />
              ))}
            </div>
          ) : (
            <NoResults query={q} />
          )
        ) : works.length > 0 ? (
          <div className="flex flex-col gap-3">
            {works.map((w) => {
              const likesCount = w.likes?.[0]?.count ?? 0;
              const commentsCount = w.comments?.[0]?.count ?? 0;
              const filesCount = w.work_files?.length ?? 0;
              const viewerLiked = likedSet.has(w.id);
              const canInteract = !!viewer;

              if (w.kind === "post") {
                return (
                  <PostCard
                    key={w.id}
                    id={w.id}
                    content={w.content}
                    discipline={w.discipline}
                    publishedAt={w.published_at ?? w.created_at}
                    likesCount={likesCount}
                    commentsCount={commentsCount}
                    viewerLiked={viewerLiked}
                    canInteract={canInteract}
                    author={w.author ?? undefined}
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
                  commentsCount={commentsCount}
                  viewerLiked={viewerLiked}
                  canInteract={canInteract}
                  author={w.author ?? undefined}
                />
              );
            })}
          </div>
        ) : (
          <NoResults query={q} />
        )}
      </div>
    </main>
  );
}

function makeUrl(q: string, tab: "people" | "works") {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("tab", tab);
  return `/search?${params.toString()}`;
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

function EmptyHint() {
  return (
    <div className="rounded-lg border border-dashed border-border p-10 text-center">
      <p className="text-sm font-medium">Что ищем?</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Введите название работы, имя автора, дисциплину или ключевые слова.
      </p>
    </div>
  );
}

function NoResults({ query }: { query: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-10 text-center">
      <p className="text-sm font-medium">Ничего не нашлось</p>
      <p className="mt-1 text-sm text-muted-foreground">
        По запросу «{query}» пока пусто. Попробуйте другие слова.
      </p>
    </div>
  );
}
