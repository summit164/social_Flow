import { notFound } from "next/navigation";
import Link from "next/link";
import { Building2, MapPin, Globe, Plus, Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { VacancyCard } from "@/components/jobs/vacancy-card";
import { DeleteCompanyButton } from "./delete-company-button";
import { CompanyLogoUpload } from "./logo-upload";
import { CompanyCoverUpload } from "./cover-upload";
import type { VacancyEmployment } from "@/types/database";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  return {
    title: data ? `${data.name} — StudyFlow` : "Компания — StudyFlow",
  };
}

export default async function CompanyPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select(
      "id, owner_id, name, description, logo_url, cover_url, website, location, industry, created_at"
    )
    .eq("id", id)
    .maybeSingle();
  if (!company) notFound();

  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();
  const isOwner = viewer?.id === company.owner_id;

  // Вакансии этой компании
  const { data: vacanciesRaw } = await supabase
    .from("vacancies")
    .select(
      `id, title, description, employment_type, location, is_remote,
       salary_min, salary_max, salary_currency, status, created_at`
    )
    .eq("company_id", id)
    .order("created_at", { ascending: false });

  type VRow = {
    id: string;
    title: string;
    description: string | null;
    employment_type: VacancyEmployment;
    location: string | null;
    is_remote: boolean;
    salary_min: number | null;
    salary_max: number | null;
    salary_currency: string | null;
    status: "open" | "closed";
    created_at: string;
  };
  const allVacancies = (vacanciesRaw as unknown as VRow[]) ?? [];
  const visible = isOwner
    ? allVacancies
    : allVacancies.filter((v) => v.status === "open");

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {/* ======= Обложка ======= */}
      {isOwner ? (
        <CompanyCoverUpload
          companyId={company.id}
          coverUrl={company.cover_url}
        />
      ) : (
        <div
          className="h-40 sm:h-48 w-full rounded-lg bg-gradient-to-br from-[#5b6ee1] via-[#4a86b0] to-[#a8b4be]"
          style={
            company.cover_url
              ? {
                  backgroundImage: `url(${company.cover_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        />
      )}

      {/* ======= Лого, заглубляющееся на обложку, + название ======= */}
      <section className="flex items-end justify-between gap-4 -mt-10 px-1">
        {isOwner ? (
          <CompanyLogoUpload
            companyId={company.id}
            logoUrl={company.logo_url}
            name={company.name}
          />
        ) : (
          <div className="flex size-20 items-center justify-center rounded-lg bg-secondary text-muted-foreground shrink-0 overflow-hidden ring-4 ring-card">
            {company.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={company.logo_url}
                alt={company.name}
                className="size-20 object-cover"
              />
            ) : (
              <Building2 className="size-10" />
            )}
          </div>
        )}

        {isOwner && (
          <Button asChild size="sm">
            <Link href="/jobs/new">
              <Plus className="size-4" />
              Вакансия
            </Link>
          </Button>
        )}
      </section>

      <section className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight leading-tight">
          {company.name}
        </h1>
        {company.industry && (
          <p className="mt-1 text-sm text-muted-foreground">
            {company.industry}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {company.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {company.location}
            </span>
          )}
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <Globe className="size-3.5" />
              Сайт
            </a>
          )}
        </div>
      </section>

      {company.description && (
        <p className="mt-6 text-base leading-relaxed text-muted-foreground whitespace-pre-wrap">
          {company.description}
        </p>
      )}

      {isOwner && (
        <div className="mt-6 py-3 border-y border-border">
          <DeleteCompanyButton companyId={company.id} />
        </div>
      )}

      {/* ======= Вакансии ======= */}
      <section className="mt-8">
        <h2 className="text-base font-medium mb-4 flex items-center gap-2">
          <Briefcase className="size-4" />
          Вакансии
          {visible.length > 0 && (
            <span className="text-muted-foreground font-normal">
              ({visible.length})
            </span>
          )}
        </h2>

        {visible.length > 0 ? (
          <div className="flex flex-col gap-3">
            {visible.map((v) => (
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
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {isOwner
              ? "Вакансий пока нет. Создайте первую — нажмите «+ Вакансия»."
              : "Сейчас открытых вакансий нет."}
          </p>
        )}
      </section>
    </main>
  );
}
