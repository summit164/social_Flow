-- ============================================================
-- 0007 — Треки (series): авторские коллекции артефактов
-- ============================================================
-- Автор создаёт серию ("Линейная алгебра, 1 курс") и наполняет её
-- собственными артефактами в нужном порядке. Артефакт может входить
-- в несколько серий. Редактировать серию может только её автор.
-- ============================================================

create table public.series (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  description   text,
  cover_url     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint series_title_length check (char_length(title) between 1 and 200)
);

comment on table public.series is 'Авторские коллекции артефактов (треки)';

create table public.series_items (
  series_id     uuid not null references public.series(id) on delete cascade,
  work_id       uuid not null references public.works(id)  on delete cascade,
  position      int  not null default 0,
  added_at      timestamptz not null default now(),
  primary key (series_id, work_id)
);

create index series_author_idx        on public.series (author_id, created_at desc);
create index series_items_series_idx  on public.series_items (series_id, position);
create index series_items_work_idx    on public.series_items (work_id);

create trigger series_updated_at
  before update on public.series
  for each row execute function public.set_updated_at();

alter table public.series       enable row level security;
alter table public.series_items enable row level security;

-- ---------- SERIES ----------
-- Чтение публично
create policy "series_select_all"
  on public.series for select using (true);

-- Создавать может залогиненный, только от своего имени
create policy "series_insert_own"
  on public.series for insert
  with check (auth.uid() = author_id);

create policy "series_update_own"
  on public.series for update
  using (auth.uid() = author_id);

create policy "series_delete_own"
  on public.series for delete
  using (auth.uid() = author_id);

-- ---------- SERIES_ITEMS ----------
-- Читают все (если серия публична и работа published — RLS на works
-- сама отфильтрует чужие черновики при join)
create policy "series_items_select_all"
  on public.series_items for select using (true);

-- Изменять может только автор серии, и только своими артефактами
create policy "series_items_modify_own"
  on public.series_items for all
  using (
    exists (
      select 1 from public.series s
      where s.id = series_items.series_id and s.author_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.series s
      where s.id = series_items.series_id and s.author_id = auth.uid()
    )
    and exists (
      select 1 from public.works w
      where w.id = series_items.work_id and w.author_id = auth.uid()
    )
  );
