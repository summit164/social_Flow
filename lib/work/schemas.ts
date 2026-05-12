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

/**
 * Схема валидации поста — короткой заметки.
 * У поста только текст и опциональные дисциплина/теги, без файлов.
 */
export const postInputSchema = z.object({
  content: z
    .string()
    .min(1, "Напишите что-нибудь")
    .max(2000, "Максимум 2000 символов"),
});

export type PostInput = z.infer<typeof postInputSchema>;

export const POST_MAX_LENGTH = 2000;

// К посту можно прикрепить одно изображение или одно видео.
export const POST_MEDIA_IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp"];
export const POST_MEDIA_VIDEO_EXTENSIONS = ["mp4", "webm", "mov", "m4v"];
export const POST_MEDIA_EXTENSIONS = [
  ...POST_MEDIA_IMAGE_EXTENSIONS,
  ...POST_MEDIA_VIDEO_EXTENSIONS,
];
export const POST_MEDIA_MAX_SIZE = 50 * 1024 * 1024; // 50 МБ

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
