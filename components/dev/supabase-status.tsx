import { createClient } from "@/lib/supabase/server";

/**
 * Маленький индикатор статуса подключения к Supabase.
 * Используется только во время разработки — потом удалим.
 */
export async function SupabaseStatus() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasEnv = Boolean(url && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasEnv) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
        ❌ Supabase не настроен — заполни{" "}
        <code className="text-xs px-1 py-0.5 rounded bg-background/40">
          .env.local
        </code>
      </div>
    );
  }

  // Пытаемся обратиться к Supabase. Без таблиц вернётся ошибка от auth,
  // но это докажет, что URL+ключ валидны и сеть работает.
  let connected = false;
  let errorMsg: string | null = null;
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getSession();
    if (error) errorMsg = error.message;
    else connected = true;
  } catch (e) {
    errorMsg = e instanceof Error ? e.message : "Unknown error";
  }

  if (!connected) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
        ⚠️ Supabase env есть, но подключение не удалось: {errorMsg}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
      ✓ Supabase подключён —{" "}
      <code className="text-xs px-1 py-0.5 rounded bg-secondary text-foreground">
        {new URL(url!).hostname}
      </code>
    </div>
  );
}
