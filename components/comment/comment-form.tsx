"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { createCommentAction } from "@/lib/comment/actions";
import {
  commentInputSchema,
  type CommentInput,
  COMMENT_MAX_LENGTH,
} from "@/lib/comment/schemas";

type CommentFormProps = {
  workId: string;
  parentId?: string | null;
  /** Если задана — показывается кнопка «Отмена» рядом с «Отправить». */
  onCancel?: () => void;
  /** Колбек после успешной отправки (например, чтобы свернуть форму ответа). */
  onSubmitted?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
};

export function CommentForm({
  workId,
  parentId = null,
  onCancel,
  onSubmitted,
  autoFocus = false,
  placeholder = "Напишите комментарий...",
}: CommentFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CommentInput>({
    resolver: zodResolver(commentInputSchema),
    defaultValues: { content: "" },
  });

  const len = form.watch("content")?.length ?? 0;

  function onSubmit(values: CommentInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await createCommentAction(workId, values, parentId);
      if ("error" in result) {
        setServerError(result.error);
      } else {
        form.reset({ content: "" });
        onSubmitted?.();
      }
    });
  }

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-2"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder={placeholder}
                  rows={parentId ? 2 : 3}
                  autoFocus={autoFocus}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center justify-between gap-3">
          <span
            className={
              "text-xs " +
              (len > COMMENT_MAX_LENGTH
                ? "text-destructive"
                : "text-muted-foreground")
            }
          >
            {len} / {COMMENT_MAX_LENGTH}
          </span>
          <div className="flex items-center gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={isPending}
              >
                Отмена
              </Button>
            )}
            <Button type="submit" size="sm" disabled={isPending || len === 0}>
              {isPending
                ? "Отправляем..."
                : parentId
                  ? "Ответить"
                  : "Отправить"}
            </Button>
          </div>
        </div>
        {serverError && (
          <p className="text-sm text-destructive">{serverError}</p>
        )}
      </form>
    </Form>
  );
}
