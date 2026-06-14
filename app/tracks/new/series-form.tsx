"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createSeriesAction } from "@/lib/series/actions";
import { seriesInputSchema, type SeriesInput } from "@/lib/series/schemas";

export function SeriesForm({ parentId }: { parentId?: string | null }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<SeriesInput>({
    resolver: zodResolver(seriesInputSchema),
    defaultValues: { title: "", description: "" },
  });

  function onSubmit(values: SeriesInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await createSeriesAction(values, parentId ?? null);
      if (result && "error" in result) setServerError(result.error);
    });
  }

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-5"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="rounded-lg border border-border bg-card p-6 flex flex-col gap-5">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Заголовок трека *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Линейная алгебра, 1 курс"
                    className="text-base"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Описание</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="О чём этот трек, как им пользоваться, для кого..."
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  После создания вы сможете добавлять в трек свои артефакты.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {serverError && (
          <p className="text-sm text-destructive">{serverError}</p>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending
            ? "Создаём..."
            : parentId
              ? "Создать подтрек"
              : "Создать трек"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
