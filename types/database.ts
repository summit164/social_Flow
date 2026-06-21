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
  repo_url: string | null;
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

export type Comment = {
  id: string;
  work_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
};

export type Series = {
  id: string;
  author_id: string;
  parent_id: string | null;
  depth: number;
  title: string;
  description: string | null;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
};

export const SERIES_MAX_DEPTH = 3;

export type SeriesItem = {
  series_id: string;
  work_id: string;
  position: number;
  added_at: string;
};

export type Company = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  website: string | null;
  location: string | null;
  industry: string | null;
  created_at: string;
  updated_at: string;
};

export type VacancyEmployment =
  | "full_time"
  | "part_time"
  | "internship"
  | "contract";

export type VacancyStatus = "open" | "closed";

export type Vacancy = {
  id: string;
  company_id: string;
  posted_by: string;
  title: string;
  description: string | null;
  employment_type: VacancyEmployment;
  location: string | null;
  is_remote: boolean;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  apply_url: string | null;
  contact_email: string | null;
  status: VacancyStatus;
  created_at: string;
  updated_at: string;
};

export const EMPLOYMENT_LABELS: Record<VacancyEmployment, string> = {
  full_time: "Полный день",
  part_time: "Частичная занятость",
  internship: "Стажировка",
  contract: "Контракт",
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
      comments: { Row: Comment; Insert: Pick<Comment, "work_id" | "author_id" | "content"> & Partial<Comment>; Update: Partial<Comment> };
      series: { Row: Series; Insert: Pick<Series, "author_id" | "title"> & Partial<Series>; Update: Partial<Series> };
      series_items: { Row: SeriesItem; Insert: Pick<SeriesItem, "series_id" | "work_id"> & Partial<SeriesItem>; Update: Partial<SeriesItem> };
      companies: { Row: Company; Insert: Pick<Company, "owner_id" | "name"> & Partial<Company>; Update: Partial<Company> };
      vacancies: { Row: Vacancy; Insert: Pick<Vacancy, "company_id" | "posted_by" | "title"> & Partial<Vacancy>; Update: Partial<Vacancy> };
    };
    Enums: { work_status: WorkStatus; work_kind: WorkKind };
  };
};
