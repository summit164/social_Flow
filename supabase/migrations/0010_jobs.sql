-- ============================================================
-- 0010 — Вакансии и компании
-- ============================================================
-- companies: профили компаний, создаёт залогиненный пользователь.
-- vacancies: вакансии, привязаны к компании; постит владелец компании.
-- Отклик пока внешний — apply_url или contact_email.
-- ============================================================

-- ---------- COMPANIES ----------
create table public.companies (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  description   text,
  logo_url      text,
  website       text,
  location      text,
  industry      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint companies_name_length check (char_length(name) between 1 and 200)
);

comment on table public.companies is 'Карточки компаний — кого можно нанимать через платформу';

create index companies_owner_idx     on public.companies (owner_id);
create index companies_created_idx   on public.companies (created_at desc);

create trigger companies_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

-- ---------- VACANCIES ----------
create type vacancy_employment as enum (
  'full_time', 'part_time', 'internship', 'contract'
);

create type vacancy_status as enum ('open', 'closed');

create table public.vacancies (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  posted_by       uuid not null references public.profiles(id)  on delete cascade,
  title           text not null,
  description     text,
  employment_type vacancy_employment not null default 'full_time',
  location        text,
  is_remote       boolean not null default false,
  salary_min      int,
  salary_max      int,
  salary_currency text default 'RUB',
  apply_url       text,
  contact_email   text,
  status          vacancy_status not null default 'open',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint vacancies_title_length check (char_length(title) between 1 and 200),
  constraint vacancies_salary_order check (
    salary_min is null or salary_max is null or salary_min <= salary_max
  )
);

comment on table public.vacancies is 'Вакансии под компаниями';

create index vacancies_company_idx   on public.vacancies (company_id, created_at desc);
create index vacancies_status_idx    on public.vacancies (status, created_at desc);
create index vacancies_created_idx   on public.vacancies (created_at desc);

create trigger vacancies_updated_at
  before update on public.vacancies
  for each row execute function public.set_updated_at();

-- ---------- RLS ----------
alter table public.companies  enable row level security;
alter table public.vacancies  enable row level security;

-- Компании: читаются всеми
create policy "companies_select_all"
  on public.companies for select using (true);

create policy "companies_insert_own"
  on public.companies for insert
  with check (auth.uid() = owner_id);

create policy "companies_update_own"
  on public.companies for update
  using (auth.uid() = owner_id);

create policy "companies_delete_own"
  on public.companies for delete
  using (auth.uid() = owner_id);

-- Вакансии: open видят все; закрытые — только владелец компании
create policy "vacancies_select_visible"
  on public.vacancies for select
  using (
    status = 'open'
    or exists (
      select 1 from public.companies c
      where c.id = vacancies.company_id and c.owner_id = auth.uid()
    )
  );

-- Постить можно только в свою компанию
create policy "vacancies_insert_own_company"
  on public.vacancies for insert
  with check (
    auth.uid() = posted_by
    and exists (
      select 1 from public.companies c
      where c.id = vacancies.company_id and c.owner_id = auth.uid()
    )
  );

create policy "vacancies_update_own_company"
  on public.vacancies for update
  using (
    exists (
      select 1 from public.companies c
      where c.id = vacancies.company_id and c.owner_id = auth.uid()
    )
  );

create policy "vacancies_delete_own_company"
  on public.vacancies for delete
  using (
    exists (
      select 1 from public.companies c
      where c.id = vacancies.company_id and c.owner_id = auth.uid()
    )
  );
