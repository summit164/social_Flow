import Link from "next/link";
import { Building2 } from "lucide-react";

type Props = {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  location: string | null;
  industry: string | null;
  website: string | null;
  vacanciesCount: number;
};

/**
 * Карточка компании в стиле hh-Карьеры / Хабр Карьеры:
 * сверху баннер-обложка, лого наезжает снизу-слева,
 * под ним название и отрасль, ниже — короткое описание.
 */
export function CompanyCard({
  id,
  name,
  description,
  logoUrl,
  coverUrl,
  industry,
}: Props) {
  return (
    <Link
      href={`/companies/${id}`}
      className="block rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Обложка */}
      <div
        className="relative h-32 w-full bg-gradient-to-br from-[#5b6ee1] via-[#4a86b0] to-[#a8b4be]"
        style={
          coverUrl
            ? {
                backgroundImage: `url(${coverUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      />

      {/* Лого, заглубляющееся на обложку */}
      <div className="relative px-5 pb-5">
        <div className="flex size-14 -mt-8 items-center justify-center rounded-lg bg-card text-muted-foreground shrink-0 overflow-hidden ring-4 ring-card shadow-sm">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={name} className="size-14 object-cover" />
          ) : (
            <Building2 className="size-7" />
          )}
        </div>

        <h3 className="mt-3 text-lg font-semibold leading-snug">{name}</h3>
        {industry && (
          <p className="mt-0.5 text-sm text-muted-foreground">{industry}</p>
        )}
        {description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </Link>
  );
}
