-- ============================================================
-- 0006 — Древовидные комментарии: ответы на комментарии
-- ============================================================
-- parent_id = id родительского комментария (NULL для верхнего уровня).
-- При удалении родителя каскадно удаляются все его ответы.
-- ============================================================

alter table public.comments
  add column parent_id uuid references public.comments(id) on delete cascade;

create index comments_parent_id_idx on public.comments (parent_id, created_at);

-- Запрет самореференса (комментарий не может быть родителем самому себе)
alter table public.comments
  add constraint comments_no_self_parent
  check (parent_id is null or parent_id <> id);
