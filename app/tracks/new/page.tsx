import Link from "next/link";
import { redirect } from "next/navigation";
import { Layers } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SeriesForm } from "./series-form";

export const metadata = { title: "Новый трек — StudyFlow" };

type SearchParams = Promise<{ parent?: string }>;

export default async function NewSeriesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { parent: parentId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Если создаём подтрек — проверим, что родитель существует и принадлежит автору,
  // и не упёрлись ли в лимит глубины.
  let parent: {
    id: string;
    title: string;
    depth: number;
    author_id: string;
  } | null = null;
  if (parentId) {
    const { data } = await supabase
      .from("series")
      .select("id, title, depth, author_id")
      .eq("id", parentId)
      .maybeSingle();
    parent = (data as typeof parent) ?? null;
    if (!parent || parent.author_id !== user.id) {
      // Тихо отбрасываем неверный parentId — создадим корневой
      parent = null;
    }
  }

  const depthFull = parent ? parent.depth >= 3 : false;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-medium tracking-tight">
          {parent ? "Новый подтрек" : "Новый трек"}
        </h1>
        {parent ? (
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <Layers className="size-3.5" />
            Внутри{" "}
            <Link
              href={`/tracks/${parent.id}`}
              className="text-primary hover:underline"
            >
              {parent.title}
            </Link>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">
            Сначала создайте заголовок и описание. Артефакты и подтреки добавите на следующем шаге.
          </p>
        )}
      </div>

      {depthFull ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm font-medium">Глубина исчерпана</p>
          <p className="mt-1 text-sm text-muted-foreground">
            В этом треке уже 3 уровня вложенности — подтрек не создать.
          </p>
        </div>
      ) : (
        <SeriesForm parentId={parent?.id ?? null} />
      )}
    </main>
  );
}
