import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VacancyForm } from "./vacancy-form";

export const metadata = { title: "Новая вакансия — StudyFlow" };

export default async function NewVacancyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Список компаний, которыми владеет пользователь
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const list = ((companies as Array<{ id: string; name: string }>) ?? []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-medium tracking-tight">Новая вакансия</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Заполните информацию и нажмите «Опубликовать».
        </p>
      </div>

      {list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm font-medium">Сначала создайте компанию</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Вакансии публикуются от имени компании, которой вы владеете.
          </p>
          <Link
            href="/companies/new"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            Создать компанию →
          </Link>
        </div>
      ) : (
        <VacancyForm companies={list} />
      )}
    </main>
  );
}
