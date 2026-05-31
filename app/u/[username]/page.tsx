import { notFound } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Globe,
  Code2,
  GraduationCap,
  BookOpen,
  Pencil,
  Users,
  Send,
  NotebookText,
  MessageSquareText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getInitials } from "@/lib/profile/utils";
import { cn } from "@/lib/utils";
import { FollowButton } from "./follow-button";
import { WorkCard } from "@/components/work/work-card";
import { PostCard } from "@/components/work/post-card";
import { buildPostMediaMap } from "@/lib/work/post-media";

type Params = Promise<{ username: string }>;
type SearchParams = Promise<{ tab?: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { username } = await params;
  return { title: `@${username} — StudyFlow` };
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { username } = await params;
  const { tab } = await searchParams;
  const activeTab: "artifacts" | "posts" = tab === "posts" ? "posts" : "artifacts";
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();
  if (!profile) notFound();

  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();
  const isOwnProfile = viewer?.id === profile.id;

  let isFollowing = false;
  if (viewer && !isOwnProfile) {
    const { data: follow } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", viewer.id)
      .eq("following_id", profile.id)
      .maybeSingle();
    isFollowing = !!follow;
  }

  const [{ count: followersCount }, { count: followingCount }] =
    await Promise.all([
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profile.id),
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", profile.id),
    ]);

  // Работы автора по активной вкладке. RLS отфильтрует чужие черновики.
  const { data: works } = await supabase
    .from("works")
    .select(
      `id, title, content, description, discipline, status, kind, published_at, created_at,
       work_files(storage_path, mime_type, position),
       likes(count), comments(count)`
    )
    .eq("author_id", profile.id)
    .eq("kind", activeTab === "posts" ? "post" : "artifact")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  // Лайки текущего пользователя на этих работах
  const workIds = (works ?? []).map((w) => w.id);
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

  // Signed URLs для медиа постов на этом профиле
  const postMedia =
    activeTab === "posts"
      ? await buildPostMediaMap(
          supabase,
          (works ?? []).map((w) => ({
            id: w.id,
            work_files: (w.work_files as unknown as Array<{
              storage_path: string;
              mime_type: string | null;
              position: number;
            }> | null) ?? [],
          }))
        )
      : new Map<string, { url: string; mime: string | null }>();

  const displayName = profile.display_name || profile.username;
  const links = profile.links ?? {};
  const hasLinks = Object.keys(links).length > 0;
  const hasFields = profile.fields && profile.fields.length > 0;

  return (
    <main className="ml-[147px] mr-[80px] py-6">
      {/* Контейнер 1400px шириной, padding 60px → края контента
          совпадают с центрами логотипа и аватара в шапке (та же max-w-[1400px]
          с px-10 = 40px padding и иконками внутри по 22px от края). */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
      {/* ======= ОСНОВНАЯ КАРТОЧКА: обложка + аватар + базовая инфа ======= */}
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        {/* Обложка */}
        <div
          className="relative h-40 sm:h-56 w-full bg-gradient-to-br from-[#2c4a66] via-[#4a86b0] to-[#a8b4be]"
          style={
            profile.cover_url
              ? {
                  backgroundImage: `url(${profile.cover_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        />

        <div className="relative px-6 pb-6">
          {/* Аватар, наезжающий на обложку */}
          <div className="-mt-16 sm:-mt-20 mb-4 flex items-end justify-between">
            <Avatar className="size-32 sm:size-40 ring-4 ring-card">
              <AvatarImage src={profile.avatar_url ?? undefined} alt={displayName} />
              <AvatarFallback className="text-4xl bg-secondary text-foreground">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex items-center gap-2">
              {isOwnProfile ? (
                <Button asChild size="sm" variant="outline">
                  <Link href="/settings/profile">
                    <Pencil className="size-4" />
                    Редактировать
                  </Link>
                </Button>
              ) : viewer ? (
                <FollowButton
                  targetUserId={profile.id}
                  isFollowing={isFollowing}
                />
              ) : (
                <Button asChild size="sm">
                  <Link href="/login">Войти, чтобы подписаться</Link>
                </Button>
              )}
            </div>
          </div>

          {/* Имя и данные */}
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight">
              {displayName}
            </h1>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>

            {profile.affiliation && (
              <p className="text-sm flex items-center gap-1.5 mt-1">
                <GraduationCap className="size-4 text-muted-foreground" />
                {profile.affiliation}
              </p>
            )}

            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
              <Users className="size-4" />
              <span>
                <span className="font-medium text-foreground">
                  {followersCount ?? 0}
                </span>{" "}
                подписчиков
              </span>
              <span className="mx-1">·</span>
              <span>
                <span className="font-medium text-foreground">
                  {followingCount ?? 0}
                </span>{" "}
                подписок
              </span>
            </div>
          </div>
        </div>
      </section>

          {/* ======= ПУБЛИКАЦИИ — табы Артефакты / Посты ======= */}
          <section className="mt-4 rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4 -mx-2">
              <div className="flex border-b border-border flex-1 mx-2">
                <ProfileTabLink
                  href={`/u/${profile.username}`}
                  label="Артефакты"
                  icon={<NotebookText className="size-4" />}
                  active={activeTab === "artifacts"}
                />
                <ProfileTabLink
                  href={`/u/${profile.username}?tab=posts`}
                  label="Посты"
                  icon={<MessageSquareText className="size-4" />}
                  active={activeTab === "posts"}
                />
              </div>
              {isOwnProfile && (
                <Link
                  href={
                    activeTab === "posts" ? "/work/new?kind=post" : "/work/new"
                  }
                  className="ml-3 text-xs text-primary hover:underline whitespace-nowrap"
                >
                  + Создать
                </Link>
              )}
            </div>
            {works && works.length > 0 ? (
              <div className="flex flex-col gap-3">
                {works.map((w) => {
                  const likesCount =
                    Array.isArray(w.likes) && w.likes[0]
                      ? (w.likes[0] as { count: number }).count
                      : 0;
                  const commentsCount =
                    Array.isArray(w.comments) && w.comments[0]
                      ? (w.comments[0] as { count: number }).count
                      : 0;
                  const filesCount = Array.isArray(w.work_files)
                    ? w.work_files.length
                    : 0;
                  const viewerLiked = likedSet.has(w.id);
                  const canInteract = !!viewer;

                  if (activeTab === "posts") {
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
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {isOwnProfile
                  ? activeTab === "posts"
                    ? "У вас пока нет постов. Напишите первый — нажмите «+ Создать»."
                    : "У вас пока нет артефактов. Создайте первый — нажмите «+ Создать»."
                  : activeTab === "posts"
                    ? "У этого пользователя пока нет постов."
                    : "У этого пользователя пока нет артефактов."}
              </p>
            )}
          </section>
        </div>

        {/* ======= ПРАВАЯ КОЛОНКА: О себе, Интересы, Ссылки ======= */}
        <aside className="flex flex-col gap-4">
          {profile.bio ? (
            <SidebarSection title="О себе">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {profile.bio}
              </p>
            </SidebarSection>
          ) : isOwnProfile ? (
            <SidebarSection title="О себе">
              <EmptyHint href="/settings/profile">
                Расскажите о себе
              </EmptyHint>
            </SidebarSection>
          ) : null}

          {hasFields ? (
            <SidebarSection title="Области интересов">
              <div className="flex flex-wrap gap-1.5">
                {profile.fields!.map((field) => (
                  <span
                    key={field}
                    className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </SidebarSection>
          ) : isOwnProfile ? (
            <SidebarSection title="Области интересов">
              <EmptyHint href="/settings/profile">
                Добавьте области интересов
              </EmptyHint>
            </SidebarSection>
          ) : null}

          {hasLinks ? (
            <SidebarSection title="Ссылки">
              <div className="flex flex-col gap-2 text-sm">
                {links.website && (
                  <ProfileLink
                    href={links.website}
                    icon={<Globe className="size-4" />}
                    label="Сайт"
                  />
                )}
                {links.github && (
                  <ProfileLink
                    href={links.github}
                    icon={<Code2 className="size-4" />}
                    label="GitHub"
                  />
                )}
                {links.scholar && (
                  <ProfileLink
                    href={links.scholar}
                    icon={<BookOpen className="size-4" />}
                    label="Scholar"
                  />
                )}
                {links.telegram && (
                  <ProfileLink
                    href={links.telegram}
                    icon={<Send className="size-4" />}
                    label="Telegram"
                  />
                )}
              </div>
            </SidebarSection>
          ) : isOwnProfile ? (
            <SidebarSection title="Ссылки">
              <EmptyHint href="/settings/profile">Добавьте ссылки</EmptyHint>
            </SidebarSection>
          ) : null}
        </aside>
      </div>
    </main>
  );
}

function ProfileTabLink({
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
        "inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors -mb-px border-b-2",
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

function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="mb-3 text-sm font-medium">{title}</h2>
      {children}
    </section>
  );
}

function EmptyHint({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-xs text-muted-foreground hover:text-primary hover:underline"
    >
      {children} →
    </Link>
  );
}

function ProfileLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-primary hover:underline w-fit"
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="font-medium">{label}</span>
      <span className="text-xs text-muted-foreground truncate max-w-xs">
        {href.replace(/^https?:\/\//, "")}
      </span>
    </a>
  );
}
