import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkForm } from "./work-form";

export const metadata = { title: "Новая работа — StudyFlow" };

export default async function NewWorkPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-medium tracking-tight">Новая работа</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Заполните основные поля. Можно сохранить как черновик и продолжить позже.
        </p>
      </div>
      <WorkForm />
    </main>
  );
}
