import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Тип записи work_files, какой её отдаёт select из ленты/профиля.
 */
export type PostMediaFileRow = {
  storage_path: string;
  mime_type: string | null;
  position: number;
};

export type PostMedia = { url: string; mime: string | null };

/**
 * Пакетно генерирует signed URL для медиа-файлов постов из bucket "work-files".
 * Принимает массив постов (id + work_files[]), возвращает Map<workId, PostMedia>.
 * Bucket приватный, поэтому без signed URL картинку/видео не отобразить.
 */
export async function buildPostMediaMap(
  supabase: SupabaseClient,
  posts: Array<{ id: string; work_files?: PostMediaFileRow[] | null }>,
  ttlSeconds = 60 * 60
): Promise<Map<string, PostMedia>> {
  const map = new Map<string, PostMedia>();

  // Для каждого поста берём первый по position файл
  const entries: Array<{ workId: string; path: string; mime: string | null }> =
    [];
  for (const p of posts) {
    const files = Array.isArray(p.work_files) ? p.work_files : [];
    if (files.length === 0) continue;
    const first = [...files].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0)
    )[0];
    entries.push({ workId: p.id, path: first.storage_path, mime: first.mime_type });
  }

  if (entries.length === 0) return map;

  const { data: signed } = await supabase.storage
    .from("work-files")
    .createSignedUrls(
      entries.map((e) => e.path),
      ttlSeconds
    );

  if (!signed) return map;
  signed.forEach((s, i) => {
    if (s.signedUrl) {
      const e = entries[i];
      map.set(e.workId, { url: s.signedUrl, mime: e.mime });
    }
  });

  return map;
}
