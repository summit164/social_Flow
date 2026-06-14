-- ============================================================
-- 0008 — Иерархия треков: parent_id + depth
-- ============================================================
-- Трек может быть подтреком другого трека (один родитель).
-- Максимальная глубина — 3 уровня (корень = 1).
-- При удалении родителя каскадно удаляются все подтреки;
-- артефакты внутри остаются (они лежат в works, а не в series).
-- ============================================================

alter table public.series
  add column parent_id uuid references public.series(id) on delete cascade,
  add column depth     int  not null default 1;

create index series_parent_idx on public.series (parent_id);

-- Глубина — от 1 до 3
alter table public.series
  add constraint series_depth_range check (depth between 1 and 3);

-- Запрет самореференса (трек не может быть подтреком самому себе)
alter table public.series
  add constraint series_no_self_parent
  check (parent_id is null or parent_id <> id);
