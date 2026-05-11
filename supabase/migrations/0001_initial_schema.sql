-- ============================================================
-- StudyFlow — начальная схема БД (MVP)
-- ============================================================
-- Содержит:
--   1. Таблицы: profiles, works, work_files, tags, work_tags,
--      likes, follows, bookmarks
--   2. RLS-политики
--   3. Триггер автосоздания профиля при регистрации
--   4. Индексы
-- ============================================================

-- Расширения, которые нам пригодятся
create extension if not exists pgcrypto;        -- gen_random_uuid()
create extension if not exists pg_trgm;         -- нечёткий поиск (пригодится позже)

-- ============================================================
-- 1. PROFILES — расширение auth.users
-- ============================================================
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  display_name  text,
  bio           text,
  avatar_url    text,
  cover_url     text,
  affiliation   text,                            -- вуз/организация
  fields        text[] default '{}',             -- области интересов
  links         jsonb  default '{}'::jsonb,      -- {github, website, scholar, ...}
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- username: латиница нижнего регистра, цифры, _
  constraint username_format check (username ~ '^[a-z0-9_]{3,24}$')
);

comment on table public.profiles is 'Профили пользователей, расширяют auth.users';

-- ============================================================
-- 2. WORKS — публикуемые работы
-- ============================================================
create type work_status as enum ('draft', 'published', 'archived');

create table public.works (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid not null references public.profiles(id) on delete cascade,
  -- root_work_id = id «корневой» версии этой же работы.
  -- NULL у самой первой версии. Все последующие версии указывают на root.
  root_work_id    uuid references public.works(id) on delete cascade,
  version         int  not null default 1,       -- номер версии: 1, 2, 3...
  title           text not null,
  description     text,                           -- короткое описание
  content         text,                           -- markdown-тело
  discipline      text,                           -- основная дисциплина
  status          work_status not null default 'draft',
  views_count     int  not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  published_at    timestamptz,
  constraint title_not_empty check (length(title) >= 1)
);

comment on table public.works is 'Работы пользователей. root_work_id связывает версии одной логической работы';

-- ============================================================
-- 3. WORK_FILES — файлы, прикреплённые к работе
-- ============================================================
create table public.work_files (
  id            uuid primary key default gen_random_uuid(),
  work_id       uuid not null references public.works(id) on delete cascade,
  storage_path  text not null,                  -- путь в Supabase Storage
  filename      text not null,
  mime_type     text,
  size_bytes    bigint,
  position      int  not null default 0,        -- порядок отображения
  -- extracted_text заполнится позже, на шаге парсинга PDF/DOCX
  extracted_text text,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- 4. TAGS и WORK_TAGS (M:N)
-- ============================================================
create table public.tags (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,             -- latex, ml, calculus
  name        text not null,                    -- LaTeX, Машинное обучение
  created_at  timestamptz not null default now(),
  constraint slug_format check (slug ~ '^[a-z0-9-]{1,40}$')
);

create table public.work_tags (
  work_id  uuid not null references public.works(id) on delete cascade,
  tag_id   uuid not null references public.tags(id)  on delete cascade,
  primary key (work_id, tag_id)
);

-- ============================================================
-- 5. LIKES
-- ============================================================
create table public.likes (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  work_id     uuid not null references public.works(id)    on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, work_id)
);

-- ============================================================
-- 6. FOLLOWS — подписки между пользователями
-- ============================================================
create table public.follows (
  follower_id   uuid not null references public.profiles(id) on delete cascade,
  following_id  uuid not null references public.profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

-- ============================================================
-- 7. BOOKMARKS — закладки (видны только владельцу)
-- ============================================================
create table public.bookmarks (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  work_id     uuid not null references public.works(id)    on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, work_id)
);

-- ============================================================
-- ИНДЕКСЫ
-- ============================================================
create index works_author_id_idx        on public.works (author_id);
create index works_published_at_idx     on public.works (published_at desc);
create index works_root_work_id_idx     on public.works (root_work_id);
create index works_status_idx           on public.works (status);
create index work_files_work_id_idx     on public.work_files (work_id, position);
create index follows_follower_idx       on public.follows (follower_id);
create index follows_following_idx      on public.follows (following_id);
create index likes_work_id_idx          on public.likes (work_id);
create index work_tags_tag_id_idx       on public.work_tags (tag_id);
create index profiles_fields_idx        on public.profiles using gin (fields);

-- ============================================================
-- ТРИГГЕРЫ
-- ============================================================

-- updated_at автоматически
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger works_updated_at
  before update on public.works
  for each row execute function public.set_updated_at();

-- Автосоздание профиля при регистрации.
-- Берём username из user_metadata, который мы передаём при signUp.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer            -- работает с правами owner-а функции, обходит RLS
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      'user_' || substr(new.id::text, 1, 8)   -- fallback, если username не передали
    ),
    new.raw_user_meta_data->>'username'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- RLS — ВКЛЮЧАЕМ НА ВСЕХ ТАБЛИЦАХ
-- ============================================================
alter table public.profiles   enable row level security;
alter table public.works      enable row level security;
alter table public.work_files enable row level security;
alter table public.tags       enable row level security;
alter table public.work_tags  enable row level security;
alter table public.likes      enable row level security;
alter table public.follows    enable row level security;
alter table public.bookmarks  enable row level security;

-- ---------- PROFILES ----------
-- Читать может кто угодно (открытая соцсеть)
create policy "profiles_select_all"
  on public.profiles for select using (true);

-- Изменять может только владелец
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Insert не нужен — профиль создаёт триггер. Но на всякий случай разрешим
-- залогиненному вставить только запись на самого себя.
create policy "profiles_insert_self"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ---------- WORKS ----------
-- Читать опубликованные могут все. Черновики/архивы — только автор.
create policy "works_select_visible"
  on public.works for select
  using (status = 'published' or auth.uid() = author_id);

-- Создавать может только залогиненный, и только от своего имени
create policy "works_insert_own"
  on public.works for insert
  with check (auth.uid() = author_id);

create policy "works_update_own"
  on public.works for update
  using (auth.uid() = author_id);

create policy "works_delete_own"
  on public.works for delete
  using (auth.uid() = author_id);

-- ---------- WORK_FILES ----------
-- Видны те файлы, чья работа видна
create policy "work_files_select_via_work"
  on public.work_files for select
  using (
    exists (
      select 1 from public.works w
      where w.id = work_files.work_id
        and (w.status = 'published' or auth.uid() = w.author_id)
    )
  );

create policy "work_files_modify_own"
  on public.work_files for all
  using (
    exists (
      select 1 from public.works w
      where w.id = work_files.work_id and w.author_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.works w
      where w.id = work_files.work_id and w.author_id = auth.uid()
    )
  );

-- ---------- TAGS ----------
create policy "tags_select_all" on public.tags for select using (true);
-- Залогиненные могут создавать новые теги (для удобства)
create policy "tags_insert_authenticated"
  on public.tags for insert
  with check (auth.uid() is not null);

-- ---------- WORK_TAGS ----------
create policy "work_tags_select_all"
  on public.work_tags for select using (true);

create policy "work_tags_modify_own"
  on public.work_tags for all
  using (
    exists (
      select 1 from public.works w
      where w.id = work_tags.work_id and w.author_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.works w
      where w.id = work_tags.work_id and w.author_id = auth.uid()
    )
  );

-- ---------- LIKES ----------
create policy "likes_select_all"
  on public.likes for select using (true);

create policy "likes_insert_own"
  on public.likes for insert
  with check (auth.uid() = user_id);

create policy "likes_delete_own"
  on public.likes for delete
  using (auth.uid() = user_id);

-- ---------- FOLLOWS ----------
create policy "follows_select_all"
  on public.follows for select using (true);

create policy "follows_insert_self"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "follows_delete_self"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- ---------- BOOKMARKS — приватные ----------
create policy "bookmarks_select_own"
  on public.bookmarks for select
  using (auth.uid() = user_id);

create policy "bookmarks_insert_own"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

create policy "bookmarks_delete_own"
  on public.bookmarks for delete
  using (auth.uid() = user_id);
