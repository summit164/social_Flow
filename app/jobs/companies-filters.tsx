"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Building2, MapPin, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";

type Props = {
  initialQ: string;
  initialCity: string;
  initialIndustry: string;
};

/**
 * Боковая панель фильтров для вкладки «Компании».
 * При изменении любого поля делает дебаунс и пушит в URL — на сервере
 * /jobs читает эти параметры и фильтрует выдачу.
 */
export function CompaniesFilters({
  initialQ,
  initialCity,
  initialIndustry,
}: Props) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [city, setCity] = useState(initialCity);
  const [industry, setIndustry] = useState(initialIndustry);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const handle = setTimeout(() => {
      const params = new URLSearchParams();
      params.set("tab", "companies");
      if (q.trim()) params.set("q", q.trim());
      if (city.trim()) params.set("city", city.trim());
      if (industry.trim()) params.set("industry", industry.trim());
      startTransition(() => {
        router.push(`/jobs?${params.toString()}`);
      });
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, city, industry]);

  return (
    <aside className="rounded-xl border border-border bg-card p-5 flex flex-col gap-5">
      <h2 className="text-sm font-semibold">Фильтры</h2>

      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">
          Поиск
        </label>
        <div className="relative">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Название компании"
            className="pl-9"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">
          Город
        </label>
        <div className="relative">
          <MapPin className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Поиск города..."
            className="pl-9"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">
          Отрасль
        </label>
        <div className="relative">
          <Briefcase className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="Поиск отрасли..."
            className="pl-9"
          />
        </div>
      </div>

      {(q || city || industry) && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            setCity("");
            setIndustry("");
          }}
          className="text-xs text-primary hover:underline self-start inline-flex items-center gap-1"
        >
          <Building2 className="size-3.5" />
          Сбросить
        </button>
      )}
    </aside>
  );
}
