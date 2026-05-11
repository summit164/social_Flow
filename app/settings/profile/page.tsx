import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";
import { AvatarUpload } from "./avatar-upload";
import { CoverUpload } from "./cover-upload";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Настройки профиля — StudyFlow",
};

export default async function SettingsProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-6">
          <p className="text-sm">
            Профиль не найден. Обратитесь к администратору.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Настройки профиля</h1>
          <p className="text-sm text-muted-foreground">
            @{profile.username}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/u/${profile.username}`}>Открыть профиль</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <Section title="Обложка">
          <CoverUpload coverUrl={profile.cover_url} />
        </Section>

        <Section title="Аватар">
          <AvatarUpload
            avatarUrl={profile.avatar_url}
            displayName={profile.display_name ?? profile.username}
          />
        </Section>

        <Section title="Информация">
          <ProfileForm profile={profile} />
        </Section>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="mb-4 text-base font-medium">{title}</h2>
      {children}
    </section>
  );
}
