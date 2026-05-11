import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Supabase-клиент для серверных компонентов и Route Handlers.
 * Читает сессию пользователя из cookies — нужен, чтобы запросы выполнялись
 * от имени залогиненного юзера и работали RLS-политики.
 *
 * Использование внутри Server Component:
 *   const supabase = await createClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Из Server Component нельзя писать cookies — это нормально,
            // обновление сессии происходит в middleware.
          }
        },
      },
    }
  );
}
