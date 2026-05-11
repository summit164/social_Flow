import { z } from "zod";

/**
 * Схемы валидации форм авторизации.
 * Используются и на клиенте (react-hook-form), и на сервере (server actions).
 */

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Введите email")
    .email("Некорректный email"),
  password: z
    .string()
    .min(1, "Введите пароль"),
});

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "Введите email")
    .email("Некорректный email"),
  password: z
    .string()
    .min(8, "Минимум 8 символов")
    .max(72, "Максимум 72 символа"),
  username: z
    .string()
    .min(3, "Минимум 3 символа")
    .max(24, "Максимум 24 символа")
    .regex(
      /^[a-z0-9_]+$/,
      "Только латиница в нижнем регистре, цифры и _"
    ),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
