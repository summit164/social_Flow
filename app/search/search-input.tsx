"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type Props = {
  initialQuery: string;
  activeTab: "people" | "works";
};

export function SearchInput({ initialQuery, activeTab }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("tab", activeTab);
    startTransition(() => {
      router.push(`/search?${params.toString()}`);
    });
  }

  return (
    <form onSubmit={submit} className="relative">
      <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={
          activeTab === "people"
            ? "Поиск по людям: имя, @username, вуз..."
            : "Поиск по работам: заголовок, описание, текст..."
        }
        className="pl-9 h-11 text-base"
        autoFocus
        disabled={isPending}
      />
    </form>
  );
}
