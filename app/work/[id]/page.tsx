import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileText, EyeOff, Layers } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getInitials } from "@/lib/profile/utils";
import { LikeButton } from "./like-button";
import { WorkActions } from "./work-actions";
import { FileLink } from "./file-link";
import { AuthorFollow } from "@/components/work/author-follow";
import { CommentSection } from "@/components/comment/comment-section";
import { ArtifactHeroPreview } from "@/components/work/artifact-hero-preview";
import { AuthorSideCard } from "@/components/work/author-side-card";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("works")
    .select("title")
    .eq("id", id)
    .maybeSingle();
  return { title: data ? `${data.title} — StudyFlow` : "Работа — StudyFlow" };
}

export default async function WorkPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: work } = await supabase
    .from("works")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!work) notFound();

  const [
    { data: author },
    { data: files },
    { data: workTags },
    { count: likesCount },
    {
      data: { user: viewer },
    },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, affiliation, bio")
      .eq("id", work.author_id)
      .maybeSingle(),
    supabase
      .from("work_files")
      .select("*")
      .eq("work_id", id)
      .order("position"),
    supabase
      .from("work_tags")
      .select("tag_id, tags(slug, name)")
      .eq("work_id", id),
    supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("work_id", id),
    supabase.auth.getUser(),
  ]);

  const isOwner = viewer?.id === work.author_id;
  const isPublished = work.status === "published";

  if (!isPublished && !isOwner) notFound();

  let isLiked = false;
  let isFollowingAuthor = false;
  if (viewer) {
    const [{ data: like }, { data: follow }] = await Promise.all([
      supabase
        .from("likes")
        .select("user_id")
        .eq("user_id", viewer.id)
        .eq("work_id", id)
        .maybeSingle(),
      supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", viewer.id)
        .eq("following_id", work.author_id)
        .maybeSingle(),
    ]);
    isLiked = !!like;
    isFollowingAuthor = !!follow;
  }

  const tags =
    workTags
      ?.map(
        (wt) =>
          (wt as unknown as { tags: { slug: string; name: string } | null }).tags
      )
      .filter((t): t is { slug: string; name: string } => !!t) ?? [];

  const authorName = author?.display_name || author?.username || "Аноним";
  const publishedDate = work.published_at
    ? new Date(work.published_at).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : new Date(work.created_at).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

  // ============================================================
  //   АРТЕФАКТ — двухколоночный лэйаут с превью документа сверху
  // ============================================================
  if (work.kind === "artifact") {
    // Подписанный URL для превью первого файла
    const firstFile = files?.[0] ?? null;
    let heroUrl: string | null = null;
    if (firstFile) {
      const { data: signed } = await supabase.storage
        .from("work-files")
        .createSignedUrl(firstFile.storage_path, 60 * 60);
      heroUrl = signed?.signedUrl ?? null;
    }

    // Счётчик подписчиков автора
    const { count: followersCount } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", work.author_id);

    // Треки, в которые входит этот артефакт
    const { data: trackRows } = await supabase
      .from("series_items")
      .select(
        `series_id,
         series:series!series_items_series_id_fkey(id, title, author_id)`
      )
      .eq("work_id", work.id);
    const trackList =
      (trackRows as unknown as Array<{
        series: { id: string; title: string; author_id: string } | null;
      }> | null)
        ?.map((r) => r.series)
        .filter((s): s is { id: string; title: string; author_id: string } => !!s) ?? [];

    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        {isOwner && !isPublished && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs">
            <EyeOff className="size-3.5" />
            Черновик · виден только вам
          </div>
        )}

        <div className="grid gap-6 md:gap-8 md:grid-cols-[minmax(0,1fr)_300px]">
          <article className="min-w-0">
            {/* 1. Превью документа сверху */}
            {firstFile && (
              <ArtifactHeroPreview
                url={heroUrl}
                filename={firstFile.filename}
                mimeType={firstFile.mime_type}
                sizeBytes={firstFile.size_bytes}
              />
            )}

            {/* 2. Полоска с автором */}
            <div className="mt-6 flex items-center justify-between gap-4">
              <Link
                href={author ? `/u/${author.username}` : "#"}
                className="flex items-center gap-3 group"
              >
                <Avatar className="size-10">
                  <AvatarImage
                    src={author?.avatar_url ?? undefined}
                    alt={authorName}
                  />
                  <AvatarFallback className="text-sm bg-secondary">
                    {getInitials(authorName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium group-hover:underline">
                    {authorName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {publishedDate}
                    {author?.affiliation && ` · ${author.affiliation}`}
                  </span>
                </div>
              </Link>
              <div className="flex items-center gap-2">
                <LikeButton
                  workId={work.id}
                  initialLiked={isLiked}
                  initialCount={likesCount ?? 0}
                />
                {isOwner && (
                  <WorkActions workId={work.id} isPublished={isPublished} />
                )}
              </div>
            </div>

            {/* 3. Заголовок — жирно */}
            <h1 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
              {work.title}
            </h1>

            {/* 4. Хэштеги */}
            {(work.discipline || tags.length > 0) && (
              <div className="flex flex-wrap gap-1.5 mt-5">
                {work.discipline && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
                    #{work.discipline}
                  </span>
                )}
                {tags.map((tag) => (
                  <span
                    key={tag.slug}
                    className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground"
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Краткое описание (если есть) */}
            {work.description && (
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                {work.description}
              </p>
            )}

            {/* 5. Основной текст */}
            {work.content && (
              <article className="mt-6 prose prose-neutral max-w-none prose-headings:font-serif prose-headings:tracking-tight prose-a:text-primary prose-code:rounded prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none prose-pre:bg-secondary prose-pre:text-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {work.content}
                </ReactMarkdown>
              </article>
            )}

            {/* Дополнительные файлы (если их больше одного — первый уже в превью) */}
            {files && files.length > 1 && (
              <section className="mt-8">
                <h2 className="text-base font-medium mb-3 flex items-center gap-2">
                  <FileText className="size-4" />
                  Все файлы ({files.length})
                </h2>
                <ul className="flex flex-col gap-1.5">
                  {files.map((file) => (
                    <FileLink key={file.id} file={file} />
                  ))}
                </ul>
              </section>
            )}

            {!work.content && (!files || files.length === 0) && (
              <div className="mt-8 rounded-lg border border-dashed border-border p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  В этой работе пока нет ни текста, ни файлов
                </p>
              </div>
            )}

            {isPublished && <CommentSection workId={work.id} />}
          </article>

          {/* 6. Правая колонка — карточка автора + треки */}
          {author && (
            <div className="md:sticky md:top-20 md:self-start flex flex-col gap-4">
              <AuthorSideCard
                author={author}
                followersCount={followersCount ?? 0}
                isOwnProfile={isOwner}
                viewerLogged={!!viewer}
                isFollowing={isFollowingAuthor}
              />
              {trackList.length > 0 && (
                <aside className="rounded-lg border border-border bg-card p-5">
                  <h2 className="text-sm font-medium mb-3 flex items-center gap-1.5">
                    <Layers className="size-3.5" />
                    В треках
                  </h2>
                  <ul className="flex flex-col gap-2">
                    {trackList.map((t) => (
                      <li key={t.id}>
                        <Link
                          href={`/tracks/${t.id}`}
                          className="text-sm text-primary hover:underline line-clamp-2"
                        >
                          {t.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </aside>
              )}
            </div>
          )}
        </div>
      </main>
    );
  }

  // ============================================================
  //   ПОСТ — прежний одно-колоночный лэйаут
  // ============================================================
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {isOwner && !isPublished && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs">
          <EyeOff className="size-3.5" />
          Черновик · виден только вам
        </div>
      )}

      <h1 className="text-3xl sm:text-4xl font-medium tracking-tight leading-tight">
        {work.title}
      </h1>

      {(work.discipline || tags.length > 0) && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {work.discipline && (
            <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
              {work.discipline}
            </span>
          )}
          {tags.map((tag) => (
            <span
              key={tag.slug}
              className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      {work.description && (
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">
          {work.description}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between gap-4 border-y border-border py-4">
        <Link
          href={author ? `/u/${author.username}` : "#"}
          className="flex items-center gap-3 group"
        >
          <Avatar className="size-10">
            <AvatarImage src={author?.avatar_url ?? undefined} alt={authorName} />
            <AvatarFallback className="text-sm bg-secondary">
              {getInitials(authorName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium group-hover:underline">
              {authorName}
            </span>
            <span className="text-xs text-muted-foreground">
              {publishedDate}
              {author?.affiliation && ` · ${author.affiliation}`}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {viewer && !isOwner && (
            <AuthorFollow
              targetUserId={work.author_id}
              initialFollowing={isFollowingAuthor}
            />
          )}
          <LikeButton
            workId={work.id}
            initialLiked={isLiked}
            initialCount={likesCount ?? 0}
          />
          {isOwner && (
            <WorkActions workId={work.id} isPublished={isPublished} />
          )}
        </div>
      </div>

      {files && files.length > 0 && (
        <section className="mt-8">
          <h2 className="text-base font-medium mb-3 flex items-center gap-2">
            <FileText className="size-4" />
            Файлы ({files.length})
          </h2>
          <ul className="flex flex-col gap-1.5">
            {files.map((file) => (
              <FileLink key={file.id} file={file} />
            ))}
          </ul>
        </section>
      )}

      {work.content && (
        <article className="mt-8 prose prose-neutral max-w-none prose-headings:font-serif prose-headings:tracking-tight prose-a:text-primary prose-code:rounded prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none prose-pre:bg-secondary prose-pre:text-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {work.content}
          </ReactMarkdown>
        </article>
      )}

      {!work.content && (!files || files.length === 0) && (
        <div className="mt-8 rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            В этой работе пока нет ни текста, ни файлов
          </p>
        </div>
      )}

      {isPublished && <CommentSection workId={work.id} />}
    </main>
  );
}
