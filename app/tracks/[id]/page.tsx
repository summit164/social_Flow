import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, Layers, List, Network, ChevronRight, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getInitials } from "@/lib/profile/utils";
import { cn } from "@/lib/utils";
import {
  getAncestors,
  getChildren,
  getSubtree,
  type FlatSeries,
} from "@/lib/series/tree";
import { SeriesMap } from "@/components/series/series-map";
import { ItemControls } from "./item-controls";
import { AddArtifactButton } from "./add-button";
import { DeleteTrackButton } from "./delete-track-button";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ view?: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("series")
    .select("title")
    .eq("id", id)
    .maybeSingle();
  return { title: data ? `${data.title} — StudyFlow` : "Трек — StudyFlow" };
}

export default async function SeriesPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { view: viewParam } = await searchParams;
  const view: "list" | "map" = viewParam === "map" ? "map" : "list";

  const supabase = await createClient();

  const { data: series } = await supabase
    .from("series")
    .select(
      `id, author_id, parent_id, depth, title, description, created_at,
       author:profiles!series_author_id_fkey(username, display_name, avatar_url, affiliation)`
    )
    .eq("id", id)
    .maybeSingle();
  if (!series) notFound();

  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();
  const isOwner = viewer?.id === series.author_id;

  // Все треки автора (для breadcrumbs, детей и карты)
  const { data: allRows } = await supabase
    .from("series")
    .select(
      `id, parent_id, depth, title, created_at,
       series_items(count)`
    )
    .eq("author_id", series.author_id);

  type Row = {
    id: string;
    parent_id: string | null;
    depth: number;
    title: string;
    created_at: string;
    series_items: Array<{ count: number }> | null;
  };
  const flat: FlatSeries[] = ((allRows as unknown as Row[]) ?? []).map((r) => ({
    id: r.id,
    parent_id: r.parent_id,
    depth: r.depth,
    title: r.title,
    artifactsCount: r.series_items?.[0]?.count ?? 0,
  }));
  // Сортируем детей по created_at одинаково везде
  const createdAt = new Map(
    ((allRows as unknown as Row[]) ?? []).map((r) => [r.id, r.created_at])
  );
  flat.sort(
    (a, b) =>
      (createdAt.get(a.id) ?? "").localeCompare(createdAt.get(b.id) ?? "")
  );

  const ancestors = getAncestors(flat, id);
  const children = getChildren(flat, id);
  const subtree = getSubtree(flat, id);

  // Артефакты в самом треке (только в list-режиме они нужны полностью)
  const { data: items } =
    view === "list"
      ? await supabase
          .from("series_items")
          .select(
            `position, work_id,
             work:works!series_items_work_id_fkey(id, title, description, discipline, status, published_at, created_at, kind)`
          )
          .eq("series_id", id)
          .order("position", { ascending: true })
      : { data: null };

  type ItemRow = {
    position: number;
    work_id: string;
    work: {
      id: string;
      title: string;
      description: string | null;
      discipline: string | null;
      status: "draft" | "published" | "archived";
      published_at: string | null;
      created_at: string;
      kind: "artifact" | "post";
    } | null;
  };
  const itemRows = ((items as unknown as ItemRow[]) ?? []).filter(
    (r) => r.work && (r.work.status === "published" || isOwner)
  );

  // Для автора — список его артефактов, которых ещё нет в треке
  let availableArtifacts: Array<{
    id: string;
    title: string;
    discipline: string | null;
  }> = [];
  if (isOwner && view === "list") {
    const inTrack = new Set(itemRows.map((r) => r.work_id));
    const { data: own } = await supabase
      .from("works")
      .select("id, title, discipline")
      .eq("author_id", series.author_id)
      .eq("kind", "artifact")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false });
    availableArtifacts = (
      (own as typeof availableArtifacts) ?? []
    ).filter((w) => !inTrack.has(w.id));
  }

  const author = series.author as unknown as {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    affiliation: string | null;
  } | null;
  const authorName = author?.display_name || author?.username || "Аноним";
  const canAddSubtrack = isOwner && series.depth < 3;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {/* Хлебные крошки — путь от корня (если этот трек глубже первого уровня) */}
      {ancestors.length > 1 && (
        <nav
          aria-label="Путь по дереву треков"
          className="mb-3 flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
        >
          {ancestors.map((a, idx) => {
            const isLast = idx === ancestors.length - 1;
            return (
              <span key={a.id} className="flex items-center gap-1">
                {idx > 0 && <ChevronRight className="size-3" />}
                {isLast ? (
                  <span className="text-foreground">{a.title}</span>
                ) : (
                  <Link
                    href={`/tracks/${a.id}`}
                    className="hover:text-foreground hover:underline"
                  >
                    {a.title}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        <Layers className="size-3.5" />
        <span>Трек</span>
        {series.depth > 1 && (
          <>
            <span>·</span>
            <span>уровень {series.depth}</span>
          </>
        )}
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
        {series.title}
      </h1>

      {series.description && (
        <p className="mt-4 text-base leading-relaxed text-muted-foreground whitespace-pre-wrap">
          {series.description}
        </p>
      )}

      {/* Автор + действия владельца + переключатель режима */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-border py-4">
        <Link
          href={author ? `/u/${author.username}` : "#"}
          className="flex items-center gap-3 group"
        >
          <Avatar className="size-9">
            <AvatarImage src={author?.avatar_url ?? undefined} alt={authorName} />
            <AvatarFallback className="text-xs bg-secondary">
              {getInitials(authorName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium group-hover:underline">
              {authorName}
            </span>
            {author?.affiliation && (
              <span className="text-xs text-muted-foreground">
                {author.affiliation}
              </span>
            )}
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <ViewToggle id={series.id} current={view} />
          {isOwner && <DeleteTrackButton seriesId={series.id} />}
        </div>
      </div>

      {/* ============================================================
            КАРТА — SVG-дерево от текущего узла вниз
          ============================================================ */}
      {view === "map" && subtree && (
        <section className="mt-6">
          <SeriesMap root={subtree} highlightId={series.id} />
          <p className="mt-2 text-xs text-muted-foreground text-center">
            Нажмите на узел, чтобы перейти в трек.
          </p>
        </section>
      )}

      {/* ============================================================
            СПИСОК — подтреки, артефакты, панель добавления
          ============================================================ */}
      {view === "list" && (
        <>
          {/* Подтреки */}
          {(children.length > 0 || canAddSubtrack) && (
            <section className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-medium flex items-center gap-2">
                  <Layers className="size-4" />
                  Подтреки
                  {children.length > 0 && (
                    <span className="text-muted-foreground font-normal">
                      ({children.length})
                    </span>
                  )}
                </h2>
                {canAddSubtrack && (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/tracks/new?parent=${series.id}`}>
                      <Plus className="size-4" />
                      Подтрек
                    </Link>
                  </Button>
                )}
              </div>
              {children.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {children.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/tracks/${c.id}`}
                        className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 hover:bg-secondary/30 transition-colors"
                      >
                        <div className="flex size-8 items-center justify-center rounded-md bg-secondary text-muted-foreground shrink-0">
                          <Layers className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {c.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {c.artifactsCount} артефактов
                          </p>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Подтреков пока нет.
                </p>
              )}
            </section>
          )}

          {/* Артефакты в треке */}
          <section className="mt-8">
            <h2 className="text-base font-medium mb-3 flex items-center gap-2">
              <FileText className="size-4" />
              Артефакты
              {itemRows.length > 0 && (
                <span className="text-muted-foreground font-normal">
                  ({itemRows.length})
                </span>
              )}
            </h2>
            {itemRows.length > 0 ? (
              <ol className="flex flex-col gap-3">
                {itemRows.map((row, idx) => {
                  const w = row.work!;
                  const date = w.published_at
                    ? new Date(w.published_at).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : null;
                  return (
                    <li key={w.id}>
                      <article className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 hover:bg-secondary/30 transition-colors">
                        <div className="flex size-8 items-center justify-center rounded-md bg-secondary text-sm font-medium text-muted-foreground shrink-0">
                          {idx + 1}
                        </div>
                        <Link
                          href={`/work/${w.id}?series=${series.id}`}
                          className="flex-1 min-w-0"
                        >
                          <h3 className="text-base font-medium leading-snug line-clamp-2">
                            {w.title}
                          </h3>
                          {w.description && (
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                              {w.description}
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                            {w.discipline && (
                              <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium">
                                {w.discipline}
                              </span>
                            )}
                            {date && <span>{date}</span>}
                          </div>
                        </Link>
                        {isOwner && (
                          <ItemControls
                            seriesId={series.id}
                            workId={w.id}
                            canMoveUp={idx > 0}
                            canMoveDown={idx < itemRows.length - 1}
                          />
                        )}
                      </article>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">
                {isOwner
                  ? "В треке пока нет артефактов. Добавьте свои ниже."
                  : "Автор ещё не добавил артефакты в этот трек."}
              </p>
            )}
          </section>

          {/* Доступные для добавления */}
          {isOwner && (
            <section className="mt-8">
              <h2 className="text-base font-medium mb-3 flex items-center gap-2">
                <FileText className="size-4" />
                Ваши артефакты
                {availableArtifacts.length > 0 && (
                  <span className="text-muted-foreground font-normal">
                    ({availableArtifacts.length})
                  </span>
                )}
              </h2>
              {availableArtifacts.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {availableArtifacts.map((w) => (
                    <li
                      key={w.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{w.title}</p>
                        {w.discipline && (
                          <p className="text-xs text-muted-foreground truncate">
                            {w.discipline}
                          </p>
                        )}
                      </div>
                      <AddArtifactButton seriesId={series.id} workId={w.id} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Все ваши опубликованные артефакты уже в этом треке.{" "}
                  <Link
                    href="/work/new"
                    className="text-primary hover:underline"
                  >
                    Создать новый →
                  </Link>
                </p>
              )}
            </section>
          )}
        </>
      )}
    </main>
  );
}

function ViewToggle({
  id,
  current,
}: {
  id: string;
  current: "list" | "map";
}) {
  return (
    <div className="inline-flex items-center rounded-md border border-border bg-card p-0.5">
      <ViewLink
        href={`/tracks/${id}`}
        active={current === "list"}
        label="Список"
        icon={<List className="size-3.5" />}
      />
      <ViewLink
        href={`/tracks/${id}?view=map`}
        active={current === "map"}
        label="Карта"
        icon={<Network className="size-3.5" />}
      />
    </div>
  );
}

function ViewLink({
  href,
  active,
  label,
  icon,
}: {
  href: string;
  active: boolean;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2.5 h-7 text-xs font-medium transition-colors",
        active
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
