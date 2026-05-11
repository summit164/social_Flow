import { z } from "zod";

/**
 * Схема валидации формы создания/редактирования работы.
 * Используется и на клиенте (react-hook-form), и в server actions.
 */
export const workInputSchema = z.object({
  title: z
    .string()
    .min(1, "Введите заголовок")
    .max(200, "Максимум 200 символов"),
  description: z
    .string()
    .max(500, "Максимум 500 символов")
    .optional()
    .or(z.literal("")),
  content: z
    .string()
    .max(50000, "Максимум 50 000 символов")
    .optional()
    .or(z.literal("")),
  discipline: z
    .string()
    .max(60, "Максимум 60 символов")
    .optional()
    .or(z.literal("")),
  // Теги — строкой через запятую (как в профиле)
  tags: z
    .string()
    .max(200, "Максимум 200 символов")
    .optional()
    .or(z.literal("")),
});

export type WorkInput = z.infer<typeof workInputSchema>;

// Допустимые расширения файлов работ
export const ALLOWED_FILE_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "md",
  "txt",
  "rtf",
  "ipynb",
  "py",
  "js",
  "ts",
  "tsx",
  "jsx",
  "java",
  "cpp",
  "c",
  "h",
  "go",
  "rs",
  "rb",
  "php",
  "html",
  "css",
  "json",
  "xml",
  "yml",
  "yaml",
  "csv",
  "xlsx",
  "tex",
  "zip",
  "tar",
  "gz",
  "rar",
  "7z",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 МБ
