import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompanyForm } from "./company-form";

export const metadata = { title: "Новая компания — StudyFlow" };

export default async function NewCompanyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-medium tracking-tight">Новая компания</h1>
        <p className="text-sm text-muted-foreground mt-1">
          После создания компании вы сможете публиковать под ней вакансии.
        </p>
      </div>
      <CompanyForm />
    </main>
  );
}
