/**
 * Типы для таблиц Supabase. Соответствуют миграции 0001_initial_schema.sql.
 *
 * Позже эти типы можно автогенерировать через:
 *   npx supabase gen types typescript --project-id <id> > types/database.ts
 * Пока пишем вручную для прозрачности.
 */

export type WorkStatus = "draft" | "published" | "archived";
export type WorkKind = "artifact" | "post";

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  affiliation: string | null;
  fields: string[];
  links: Record<string, string>;
  created_at: string;
  updated_at: string;
};

export type Work = {
  id: string;
  author_id: string;
  root_work_id: string | null;
  version: number;
  title: string;
  description: string | null;
  content: string | null;
  discipline: string | null;
  status: WorkStatus;
  kind: WorkKind;
  views_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type WorkFile = {
  id: string;
  work_id: string;
  storage_path: string;
  filename: string;
  mime_type: string | null;
  size_bytes: number | null;
  position: number;
  extracted_text: string | null;
  created_at: string;
};

export type Tag = {
  id: string;
  slug: string;
  name: string;
  created_at: string;
};

export type Like = {
  user_id: string;
  work_id: string;
  created_at: string;
};

export type Follow = {
  follower_id: string;
  following_id: string;
  created_at: string;
};

export type Bookmark = {
  user_id: string;
  work_id: string;
  created_at: string;
};

/**
 * Минимальное Database-описание для @supabase/supabase-js.
 * Достаточно для строгой типизации .from("works") и т.д.
 */
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & Pick<Profile, "id" | "username">; Update: Partial<Profile> };
      works:    { Row: Work;    Insert: Partial<Work>    & Pick<Work, "author_id" | "title">;  Update: Partial<Work> };
      work_files: { Row: WorkFile; Insert: Omit<WorkFile, "id" | "created_at"> & { id?: string }; Update: Partial<WorkFile> };
      tags:     { Row: Tag;     Insert: Pick<Tag, "slug" | "name"> & Partial<Tag>; Update: Partial<Tag> };
      work_tags:{ Row: { work_id: string; tag_id: string }; Insert: { work_id: string; tag_id: string }; Update: never };
      likes:    { Row: Like;    Insert: Pick<Like, "user_id" | "work_id">; Update: never };
      follows:  { Row: Follow;  Insert: Pick<Follow, "follower_id" | "following_id">; Update: never };
      bookmarks:{ Row: Bookmark;Insert: Pick<Bookmark, "user_id" | "work_id">; Update: never };
    };
    Enums: { work_status: WorkStatus; work_kind: WorkKind };
  };
};
