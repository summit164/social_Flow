import Link from "next/link";
import { redirect } from "next/navigation";
import { NotebookText, MessageSquareText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { WorkForm } from "./work-form";
import { PostForm } from "./post-form";

export const metadata = { title: "Создать — StudyFlow" };

type SearchParams = Promise<{ kind?: string }>;

export default async function NewWorkPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { kind } = await searchParams;
  const activeKind: "artifact" | "post" = kind === "post" ? "post" : "artifact";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-medium tracking-tight">
          {activeKind === "artifact" ? "Новый артефакт" : "Новый пост"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {activeKind === "artifact"
            ? "Полноценная учебная работа: текст, файлы, теги. Можно сохранить как черновик."
            : "Короткая заметка для ленты — только текст."}
        </p>
      </div>

      {/* Переключатель типа создаваемой публикации */}
      <div className="flex border-b border-border mb-6">
        <KindTab
          href="/work/new"
          label="Артефакт"
          icon={<NotebookText className="size-4" />}
          active={activeKind === "artifact"}
        />
        <KindTab
          href="/work/new?kind=post"
          label="Пост"
          icon={<MessageSquareText className="size-4" />}
          active={activeKind === "post"}
        />
      </div>

      {activeKind === "artifact" ? <WorkForm /> : <PostForm />}
    </main>
  );
}

function KindTab({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2",
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
