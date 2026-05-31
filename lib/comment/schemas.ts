import { z } from "zod";

export const COMMENT_MAX_LENGTH = 2000;

export const commentInputSchema = z.object({
  content: z
    .string()
    .min(1, "Введите текст комментария")
    .max(COMMENT_MAX_LENGTH, `Максимум ${COMMENT_MAX_LENGTH} символов`),
});

export type CommentInput = z.infer<typeof commentInputSchema>;
