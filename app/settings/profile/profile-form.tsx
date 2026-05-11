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
import { updateProfileAction } from "@/lib/profile/actions";
import {
  profileUpdateSchema,
  type ProfileUpdateInput,
} from "@/lib/profile/schemas";
import type { Profile } from "@/types/database";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      display_name: profile.display_name ?? "",
      bio: profile.bio ?? "",
      affiliation: profile.affiliation ?? "",
      fields: (profile.fields ?? []).join(", "),
      link_website: profile.links?.website ?? "",
      link_github: profile.links?.github ?? "",
      link_scholar: profile.links?.scholar ?? "",
      link_telegram: profile.links?.telegram ?? "",
    },
  });

  function onSubmit(values: ProfileUpdateInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await updateProfileAction(values);
      if ("error" in result) setServerError(result.error);
      else setSavedAt(new Date());
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <FormField
          control={form.control}
          name="display_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Отображаемое имя</FormLabel>
              <FormControl>
                <Input placeholder="Иван Иванов" {...field} />
              </FormControl>
              <FormDescription className="text-xs">
                Как вас будут видеть другие. Если пусто — показываем @username.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>О себе</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Чем занимаетесь, что изучаете..."
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="affiliation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Организация</FormLabel>
              <FormControl>
                <Input placeholder="МГУ, мехмат · 4 курс" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fields"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Области интересов</FormLabel>
              <FormControl>
                <Input
                  placeholder="Математика, StartUp, Машинное обучение"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs">
                Перечислите через запятую — каждое значение станет отдельной плашкой
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-5 rounded-xl border border-border p-4">
          <p className="text-sm font-medium">Ссылки</p>

          <FormField
            control={form.control}
            name="link_website"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">Сайт</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="link_github"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">GitHub</FormLabel>
                <FormControl>
                  <Input placeholder="https://github.com/username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="link_scholar"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">
                  Google Scholar / ORCID
                </FormLabel>
                <FormControl>
                  <Input placeholder="https://scholar.google.com/..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="link_telegram"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">
                  Telegram
                </FormLabel>
                <FormControl>
                  <Input placeholder="https://t.me/username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {serverError && (
          <p className="text-sm text-destructive">{serverError}</p>
        )}
        {savedAt && !serverError && !isPending && (
          <p className="text-sm text-muted-foreground">
            ✓ Сохранено в {savedAt.toLocaleTimeString("ru-RU")}
          </p>
        )}

        <Button type="submit" disabled={isPending} className="self-start">
          {isPending ? "Сохраняем..." : "Сохранить изменения"}
        </Button>
      </form>
    </Form>
  );
}
