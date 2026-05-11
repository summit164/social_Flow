import { z } from "zod";

/**
 * Схема валидации формы редактирования профиля.
 * Username не редактируется через эту форму — менять его в MVP нельзя.
 */
export const profileUpdateSchema = z.object({
  display_name: z
    .string()
    .max(60, "Максимум 60 символов")
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .max(500, "Максимум 500 символов")
    .optional()
    .or(z.literal("")),
  affiliation: z
    .string()
    .max(120, "Максимум 120 символов")
    .optional()
    .or(z.literal("")),
  fields: z
    .string()
    .max(200, "Максимум 200 символов")
    .optional()
    .or(z.literal("")),
  // Ссылки — храним как jsonb, но в форме это три отдельных поля
  link_website: z.string().url("Некорректный URL").optional().or(z.literal("")),
  link_github: z.string().url("Некорректный URL").optional().or(z.literal("")),
  link_scholar: z.string().url("Некорректный URL").optional().or(z.literal("")),
  link_telegram: z.string().url("Некорректный URL").optional().or(z.literal("")),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
