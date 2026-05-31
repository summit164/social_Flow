-- ============================================================
-- 0005 — Комментарии к работам (артефактам и постам)
-- ============================================================
-- Простые плоские комментарии (без древовидной структуры).
-- При необходимости позже можно добавить parent_id для веток.
-- ============================================================

create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  work_id     uuid not null references public.works(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  content     text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint comments_content_length check (
    char_length(content) between 1 and 2000
  )
);

comment on table public.comments is 'Комментарии к работам (kind=artifact|post)';

create index comments_work_id_idx on public.comments (work_id, created_at);
create index comments_author_id_idx on public.comments (author_id);

create trigger comments_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();

alter table public.comments enable row level security;

-- Читать может тот, кому видна работа (опубликованная — всем, черновик — автору)
create policy "comments_select_visible"
  on public.comments for select
  using (
    exists (
      select 1 from public.works w
      where w.id = comments.work_id
        and (w.status = 'published' or auth.uid() = w.author_id)
    )
  );

-- Писать может любой залогиненный, и только от своего имени.
-- Дополнительно требуем, чтобы работа была опубликована
-- (комментировать чужие черновики бессмысленно — RLS их не покажет).
create policy "comments_insert_own"
  on public.comments for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.works w
      where w.id = comments.work_id
        and (w.status = 'published' or auth.uid() = w.author_id)
    )
  );

-- Редактировать и удалять — только своё.
create policy "comments_update_own"
  on public.comments for update
  using (auth.uid() = author_id);

create policy "comments_delete_own"
  on public.comments for delete
  using (auth.uid() = author_id);
