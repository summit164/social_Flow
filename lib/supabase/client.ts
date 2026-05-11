import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Supabase-клиент для браузера (Client Components).
 * Использует только публичные ключи — безопасно для клиентского кода.
 *
 * Использование:
 *   const supabase = createClient();
 *   const { data } = await supabase.from("works").select("*");
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
