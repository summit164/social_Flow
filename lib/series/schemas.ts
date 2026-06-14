import { z } from "zod";

export const SERIES_TITLE_MAX = 200;
export const SERIES_DESCRIPTION_MAX = 1000;

export const seriesInputSchema = z.object({
  title: z
    .string()
    .min(1, "Введите заголовок трека")
    .max(SERIES_TITLE_MAX, `Максимум ${SERIES_TITLE_MAX} символов`),
  description: z
    .string()
    .max(SERIES_DESCRIPTION_MAX, `Максимум ${SERIES_DESCRIPTION_MAX} символов`)
    .optional()
    .or(z.literal("")),
});

export type SeriesInput = z.infer<typeof seriesInputSchema>;
