import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Обновление сессии Supabase в middleware.
 * Запускается на каждом запросе, чтобы access-токен не протухал
 * и cookies были актуальны и в Server, и в Client Components.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Если ключи ещё не заполнены — пропускаем обновление сессии,
  // чтобы приложение работало во время начальной настройки.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return supabaseResponse;

  const supabase = createServerClient(
    url,
    anon,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ВАЖНО: getUser() обязательно вызывается между createServerClient
  // и возвратом ответа — иначе сессия не обновится корректно.
  await supabase.auth.getUser();

  return supabaseResponse;
}
