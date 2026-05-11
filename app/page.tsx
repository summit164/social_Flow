import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Sparkles, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Залогиненных сразу везём на ленту — главная нужна только гостям как лендинг
  if (user) redirect("/feed");

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-20 sm:py-28">
      <section className="w-full max-w-3xl flex flex-col gap-10">
        {/* Бейдж */}
        <div className="inline-flex items-center self-start gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary" />
          В разработке · MVP
        </div>

        {/* Заголовок */}
        <h1 className="text-5xl sm:text-6xl font-medium leading-[1.05] tracking-tight">
          <span className="text-primary">StudyFlow</span> — поток ваших{" "}
          научных, учебных и профессиональных работ
        </h1>

        {/* Описание */}
        <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
          Публикуйте свои исследования по математике, физике, программированию
          и другим дисциплинам. Находите единомышленников, читайте чужие работы,
          обсуждайте идеи.
        </p>

        {/* Кнопки */}
        {user ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="rounded-xl">
              <Link href="/work/new">Создать работу</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-xl">
              <Link href="/settings/profile">Заполнить профиль</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="rounded-xl">
              <Link href="/register">Создать аккаунт</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-xl">
              <Link href="/login">Войти</Link>
            </Button>
          </div>
        )}
      </section>

      {/* Карточки с фичами */}
      <section className="w-full max-w-5xl mt-24 grid gap-4 sm:grid-cols-3">
        <FeatureCard
          icon={<BookOpen className="size-5" />}
          title="Публикуйте работы"
          description="Загружайте PDF, DOCX, Markdown, ноутбуки, код и архивы. Версионирование включено."
        />
        <FeatureCard
          icon={<Users className="size-5" />}
          title="Открытое сообщество"
          description="Подписывайтесь на авторов, обсуждайте работы, лайкайте интересное."
        />
        <FeatureCard
          icon={<Sparkles className="size-5" />}
          title="ИИ-поиск"
          description="Семантический поиск по работам с объяснением, почему результат подходит."
        />
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="flex flex-col gap-3 p-6">
        <div className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
          {icon}
        </div>
        <h3 className="text-base font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
