import { z } from "zod";

export const companyInputSchema = z.object({
  name: z
    .string()
    .min(1, "Введите название компании")
    .max(200, "Максимум 200 символов"),
  description: z
    .string()
    .max(2000, "Максимум 2000 символов")
    .optional()
    .or(z.literal("")),
  website: z
    .string()
    .trim()
    .url("Ожидается корректная ссылка")
    .max(300)
    .optional()
    .or(z.literal("")),
  location: z
    .string()
    .max(120, "Максимум 120 символов")
    .optional()
    .or(z.literal("")),
  industry: z
    .string()
    .max(120, "Максимум 120 символов")
    .optional()
    .or(z.literal("")),
});

export type CompanyInput = z.infer<typeof companyInputSchema>;

export const EMPLOYMENT_OPTIONS = [
  "full_time",
  "part_time",
  "internship",
  "contract",
] as const;

export const vacancyInputSchema = z
  .object({
    companyId: z.string().uuid("Выберите компанию"),
    title: z
      .string()
      .min(1, "Введите заголовок")
      .max(200, "Максимум 200 символов"),
    description: z
      .string()
      .max(8000, "Максимум 8000 символов")
      .optional()
      .or(z.literal("")),
    employmentType: z.enum(EMPLOYMENT_OPTIONS),
    location: z
      .string()
      .max(120, "Максимум 120 символов")
      .optional()
      .or(z.literal("")),
    isRemote: z.boolean().default(false),
    salaryMin: z
      .preprocess(
        (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
        z.number().int().nonnegative().optional()
      ),
    salaryMax: z
      .preprocess(
        (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
        z.number().int().nonnegative().optional()
      ),
    salaryCurrency: z
      .string()
      .max(10)
      .optional()
      .or(z.literal("")),
    applyUrl: z
      .string()
      .trim()
      .url("Ожидается корректная ссылка")
      .max(500)
      .optional()
      .or(z.literal("")),
    contactEmail: z
      .string()
      .trim()
      .email("Ожидается корректный email")
      .max(200)
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (v) =>
      v.salaryMin === undefined ||
      v.salaryMax === undefined ||
      v.salaryMin <= v.salaryMax,
    {
      message: "Нижняя граница зарплаты больше верхней",
      path: ["salaryMin"],
    }
  );

export type VacancyInput = z.infer<typeof vacancyInputSchema>;
