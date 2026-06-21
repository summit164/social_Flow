import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Briefcase,
  MapPin,
  Wifi,
  Building2,
  Globe,
  Mail,
  ExternalLink,
  EyeOff,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { EMPLOYMENT_LABELS } from "@/types/database";
import { formatSalary } from "@/components/jobs/vacancy-card";
import { VacancyOwnerActions } from "./owner-actions";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("vacancies")
    .select("title")
    .eq("id", id)
    .maybeSingle();
  return { title: data ? `${data.title} — StudyFlow` : "Вакансия — StudyFlow" };
}

export default async function VacancyPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: v } = await supabase
    .from("vacancies")
    .select(
      `id, title, description, employment_type, location, is_remote,
       salary_min, salary_max, salary_currency, apply_url, contact_email,
       status, created_at, company_id,
       company:companies!vacancies_company_id_fkey(
         id, name, description, logo_url, website, location, industry, owner_id
       )`
    )
    .eq("id", id)
    .maybeSingle();
  if (!v) notFound();

  const company = v.company as unknown as {
    id: string;
    name: string;
    description: string | null;
    logo_url: string | null;
    website: string | null;
    location: string | null;
    industry: string | null;
    owner_id: string;
  } | null;

  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();
  const isOwner = !!company && viewer?.id === company.owner_id;

  const isOpen = v.status === "open";
  // Закрытые могут видеть только владельцы — RLS отфильтрует, но 404 ясней
  if (!isOpen && !isOwner) notFound();

  const date = new Date(v.created_at).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const salaryLine = formatSalary(
    v.salary_min,
    v.salary_max,
    v.salary_currency
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {!isOpen && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs">
          <EyeOff className="size-3.5" />
          Закрыта · видна только вам
        </div>
      )}

      <div className="grid gap-6 md:gap-8 md:grid-cols-[minmax(0,1fr)_300px]">
        <article className="min-w-0">
          {/* Компания вверху */}
          {company && (
            <Link
              href={`/companies/${company.id}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Building2 className="size-4" />
              <span className="font-medium">{company.name}</span>
            </Link>
          )}

          {/* Заголовок */}
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            {v.title}
          </h1>

          {/* Метки */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 font-medium">
              <Briefcase className="size-3.5" />
              {EMPLOYMENT_LABELS[v.employment_type]}
            </span>
            {v.is_remote && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-muted-foreground">
                <Wifi className="size-3.5" />
                Удалённо
              </span>
            )}
            {v.location && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-muted-foreground">
                <MapPin className="size-3.5" />
                {v.location}
              </span>
            )}
            {salaryLine && (
              <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 font-medium">
                {salaryLine}
              </span>
            )}
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{date}</span>
          </div>

          {/* Управление для владельца */}
          {isOwner && (
            <div className="mt-5 py-3 border-y border-border">
              <VacancyOwnerActions vacancyId={v.id} isOpen={isOpen} />
            </div>
          )}

          {/* Кнопки отклика */}
          {(v.apply_url || v.contact_email) && (
            <div className="mt-6 flex flex-wrap gap-3">
              {v.apply_url && (
                <Button asChild>
                  <a
                    href={v.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Откликнуться
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
              )}
              {v.contact_email && (
                <Button asChild variant="outline">
                  <a href={`mailto:${v.contact_email}`}>
                    <Mail className="size-4" />
                    Написать на email
                  </a>
                </Button>
              )}
            </div>
          )}

          {/* Описание */}
          {v.description && (
            <article className="mt-8 prose prose-neutral max-w-none prose-headings:font-serif prose-headings:tracking-tight prose-a:text-primary prose-code:rounded prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none prose-pre:bg-secondary prose-pre:text-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {v.description}
              </ReactMarkdown>
            </article>
          )}

          {!v.description && (
            <div className="mt-8 rounded-lg border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Описание не заполнено
              </p>
            </div>
          )}
        </article>

        {/* Правая колонка — карточка компании */}
        {company && (
          <aside className="md:sticky md:top-20 md:self-start">
            <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
              <Link
                href={`/companies/${company.id}`}
                className="flex items-center gap-3 group"
              >
                <div className="flex size-12 items-center justify-center rounded-md bg-secondary text-muted-foreground shrink-0 overflow-hidden">
                  {company.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={company.logo_url}
                      alt={company.name}
                      className="size-12 object-cover"
                    />
                  ) : (
                    <Building2 className="size-6" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium group-hover:underline truncate">
                    {company.name}
                  </span>
                  {company.industry && (
                    <span className="text-xs text-muted-foreground truncate">
                      {company.industry}
                    </span>
                  )}
                </div>
              </Link>

              {company.description && (
                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-5">
                  {company.description}
                </p>
              )}

              <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                {company.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5 shrink-0" />
                    {company.location}
                  </span>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline w-fit"
                  >
                    <Globe className="size-3.5" />
                    Сайт
                  </a>
                )}
              </div>

              <Link
                href={`/companies/${company.id}`}
                className="text-xs text-primary hover:underline"
              >
                Открыть компанию →
              </Link>
            </div>
          </aside>
        )}
      </div>
    </main>
  );
}
