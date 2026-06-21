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
import { createVacancyAction } from "@/lib/jobs/actions";
import {
  vacancyInputSchema,
  type VacancyInput,
} from "@/lib/jobs/schemas";
import { EMPLOYMENT_LABELS } from "@/types/database";

type Props = {
  companies: Array<{ id: string; name: string }>;
};

export function VacancyForm({ companies }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<VacancyInput>({
    resolver: zodResolver(vacancyInputSchema),
    defaultValues: {
      companyId: companies[0]?.id ?? "",
      title: "",
      description: "",
      employmentType: "full_time",
      location: "",
      isRemote: false,
      salaryCurrency: "RUB",
      applyUrl: "",
      contactEmail: "",
    },
  });

  function onSubmit(values: VacancyInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await createVacancyAction(values);
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
            name="companyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Компания *</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Заголовок *</FormLabel>
                <FormControl>
                  <Input placeholder="Стажёр-разработчик ML" {...field} />
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
                    rows={8}
                    placeholder="Что предстоит делать, требования, что мы предлагаем..."
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Markdown поддерживается.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid sm:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="employmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Формат занятости</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {(Object.keys(EMPLOYMENT_LABELS) as Array<
                        keyof typeof EMPLOYMENT_LABELS
                      >).map((k) => (
                        <option key={k} value={k}>
                          {EMPLOYMENT_LABELS[k]}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Локация</FormLabel>
                  <FormControl>
                    <Input placeholder="Москва" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="isRemote"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="size-4"
                  />
                </FormControl>
                <FormLabel className="!mt-0">Можно удалённо</FormLabel>
              </FormItem>
            )}
          />

          <div className="grid sm:grid-cols-[1fr_1fr_120px] gap-3">
            <FormField
              control={form.control}
              name="salaryMin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Зарплата от</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="80000"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="salaryMax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>до</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="120000"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="salaryCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Валюта</FormLabel>
                  <FormControl>
                    <Input placeholder="RUB" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="applyUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ссылка на отклик</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://forms.example.com/apply"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Куда идти откликаться. Можно вместо неё указать email ниже.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email для отклика</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="hr@example.com"
                    {...field}
                  />
                </FormControl>
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
            {isPending ? "Публикуем..." : "Опубликовать вакансию"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
