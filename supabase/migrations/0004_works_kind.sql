-- ============================================================
-- 0004 — Разделение works на типы: «артефакт» и «пост»
-- ============================================================
-- Артефакт — полноценная учебная работа: заголовок, описание,
--   markdown-тело, файлы, теги.
-- Пост — короткая заметка: только текст (content), без файлов.
-- Обе сущности живут в таблице works, чтобы переиспользовать
-- лайки/подписки/ленту. Различаются полем kind.
-- ============================================================

create type work_kind as enum ('artifact', 'post');

alter table public.works
  add column kind work_kind not null default 'artifact';

-- Лента фильтрует по (kind, published_at desc)
create index works_kind_published_idx
  on public.works (kind, published_at desc);
