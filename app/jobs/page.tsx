import Link from "next/link";
import { Briefcase, Building2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { VacancyCard } from "@/components/jobs/vacancy-card";
import { CompanyCard } from "@/components/jobs/company-card";
import { CompaniesFilters } from "./companies-filters";
import type { VacancyEmployment } from "@/types/database";

export const metadata = { title: "Вакансии — StudyFlow" };

type SearchParams = Promise<{
  tab?: string;
  q?: string;
  city?: string;
  industry?: string;
}>;

const PAGE_SIZE = 60;

/** Чистим пользовательский ввод для .or() и ILIKE. */
function sanitizeForIlike(input: string): string {
  return input.replace(/[,()'"\\%_]/g, " ").trim();
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const activeTab: "vacancies" | "companies" =
    params.tab === "companies" ? "companies" : "vacancies";

  const q = (params.q ?? "").trim();
  const city = (params.city ?? "").trim();
  const industry = (params.industry ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  type VacancyRow = {
    id: string;
    title: string;
    description: string | null;
    employment_type: VacancyEmployment;
    location: string | null;
    is_remote: boolean;
    salary_min: number | null;
    salary_max: number | null;
    salary_currency: string | null;
    created_at: string;
    company: { id: string; name: string; logo_url: string | null } | null;
  };
  type CompanyRow = {
    id: string;
    name: string;
    description: string | null;
    logo_url: string | null;
    cover_url: string | null;
    location: string | null;
    industry: string | null;
    website: string | null;
    vacancies: Array<{ count: number }> | null;
  };

  let vacancies: VacancyRow[] = [];
  let companies: CompanyRow[] = [];

  if (activeTab === "vacancies") {
    const { data } = await supabase
      .from("vacancies")
      .select(
        `id, title, description, employment_type, location, is_remote,
         salary_min, salary_max, salary_currency, created_at,
         company:companies!vacancies_company_id_fkey(id, name, logo_url)`
      )
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    vacancies = (data as unknown as VacancyRow[]) ?? [];
  } else {
    let query = supabase
      .from("companies")
      .select(
        `id, name, description, logo_url, cover_url, location, industry, website,
         vacancies(count)`
      )
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (q) {
      const safe = `%${sanitizeForIlike(q)}%`;
      query = query.ilike("name", safe);
    }
    if (city) {
      const safe = `%${sanitizeForIlike(city)}%`;
      query = query.ilike("location", safe);
    }
    if (industry) {
      const safe = `%${sanitizeForIlike(industry)}%`;
      query = query.ilike("industry", safe);
    }

    const { data } = await query;
    companies = (data as unknown as CompanyRow[]) ?? [];
  }

  // Лэйаут для «Компании» — широкий с боковыми фильтрами
  if (activeTab === "companies") {
    return (
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Header viewer={!!viewer} />
        <Tabs activeTab={activeTab} />

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <CompaniesFilters
            initialQ={q}
            initialCity={city}
            initialIndustry={industry}
          />
          {companies.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {companies.map((c) => (
                <CompanyCard
                  key={c.id}
                  id={c.id}
                  name={c.name}
                  description={c.description}
                  logoUrl={c.logo_url}
                  coverUrl={c.cover_url}
                  location={c.location}
                  industry={c.industry}
                  website={c.website}
                  vacanciesCount={c.vacancies?.[0]?.count ?? 0}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={
                q || city || industry
                  ? "Ничего не нашлось"
                  : "Пока нет компаний"
              }
              hint={
                q || city || industry
                  ? "Попробуйте другие фильтры или сбросьте их."
                  : viewer
                    ? "Создайте первую компанию — нажмите «+ Компания»."
                    : "Зарегистрируйтесь и создайте первую компанию."
              }
            />
          )}
        </div>
      </main>
    );
  }

  // Лэйаут для «Вакансии» — узкая колонка
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Header viewer={!!viewer} />
      <Tabs activeTab={activeTab} />

      {vacancies.length > 0 ? (
        <div className="flex flex-col gap-3">
          {vacancies.map((v) => (
            <VacancyCard
              key={v.id}
              id={v.id}
              title={v.title}
              description={v.description}
              employmentType={v.employment_type}
              location={v.location}
              isRemote={v.is_remote}
              salaryMin={v.salary_min}
              salaryMax={v.salary_max}
              salaryCurrency={v.salary_currency}
              createdAt={v.created_at}
              company={v.company ?? null}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Пока нет вакансий"
          hint={
            viewer
              ? "Создайте свою компанию и опубликуйте вакансию."
              : "Зарегистрируйтесь и опубликуйте первую вакансию."
          }
        />
      )}
    </main>
  );
}

function Header({ viewer }: { viewer: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <h1 className="text-2xl font-medium tracking-tight">Вакансии</h1>
      {viewer && (
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/companies/new">
              <Plus className="size-4" />
              Компания
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/jobs/new">
              <Plus className="size-4" />
              Вакансия
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function Tabs({
  activeTab,
}: {
  activeTab: "vacancies" | "companies";
}) {
  return (
    <div className="flex justify-center border-b border-border mb-6">
      <TabLink
        href="/jobs"
        label="Вакансии"
        icon={<Briefcase className="size-4" />}
        active={activeTab === "vacancies"}
      />
      <TabLink
        href="/jobs?tab=companies"
        label="Компании"
        icon={<Building2 className="size-4" />}
        active={activeTab === "companies"}
      />
    </div>
  );
}

function TabLink({
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
        "inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2",
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

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}
