import Link from "next/link";
import { MapPin, Wifi, Briefcase, Building2 } from "lucide-react";
import {
  EMPLOYMENT_LABELS,
  type VacancyEmployment,
} from "@/types/database";

type Props = {
  id: string;
  title: string;
  description: string | null;
  employmentType: VacancyEmployment;
  location: string | null;
  isRemote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  createdAt: string;
  company?: { id: string; name: string; logo_url: string | null } | null;
};

export function VacancyCard({
  id,
  title,
  description,
  employmentType,
  location,
  isRemote,
  salaryMin,
  salaryMax,
  salaryCurrency,
  createdAt,
  company,
}: Props) {
  const date = new Date(createdAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link
      href={`/jobs/${id}`}
      className="block rounded-lg border border-border bg-card p-5 hover:bg-secondary/30 transition-colors"
    >
      {company && (
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Building2 className="size-3.5" />
          <span className="truncate">{company.name}</span>
        </div>
      )}

      <h3 className="text-base font-medium leading-snug">{title}</h3>

      {description && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {description}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium">
          <Briefcase className="size-3" />
          {EMPLOYMENT_LABELS[employmentType]}
        </span>
        {isRemote && (
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">
            <Wifi className="size-3" />
            Удалённо
          </span>
        )}
        {location && (
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">
            <MapPin className="size-3" />
            {location}
          </span>
        )}
        {(salaryMin || salaryMax) && (
          <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 font-medium">
            {formatSalary(salaryMin, salaryMax, salaryCurrency)}
          </span>
        )}
        <span className="ml-auto text-muted-foreground">{date}</span>
      </div>
    </Link>
  );
}

export function formatSalary(
  min: number | null,
  max: number | null,
  currency: string | null
): string {
  const cur = currency || "RUB";
  const fmt = (n: number) =>
    n.toLocaleString("ru-RU", { maximumFractionDigits: 0 });
  if (min && max) return `${fmt(min)}–${fmt(max)} ${cur}`;
  if (min) return `от ${fmt(min)} ${cur}`;
  if (max) return `до ${fmt(max)} ${cur}`;
  return "";
}
