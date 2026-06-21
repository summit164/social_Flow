"use client";

import { useState, useTransition, useRef } from "react";
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
import { createWorkAction } from "@/lib/work/actions";
import { workInputSchema, type WorkInput, MAX_FILE_SIZE } from "@/lib/work/schemas";
import { formatFileSize } from "@/lib/work/utils";
import { FileText, X, Paperclip } from "lucide-react";
import { GithubIcon } from "@/components/ui/icons/github-icon";

export function WorkForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<WorkInput>({
    resolver: zodResolver(workInputSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
      discipline: "",
      tags: "",
      repo_url: "",
    },
  });

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files ?? []);
    const valid = newFiles.filter((f) => {
      if (f.size > MAX_FILE_SIZE) {
        setServerError(`Файл "${f.name}" больше 50 МБ`);
        return false;
      }
      return true;
    });
    setFiles((prev) => [...prev, ...valid]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function onSubmit(values: WorkInput, publish: boolean) {
    setServerError(null);
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));

    startTransition(async () => {
      const result = await createWorkAction(values, formData, publish);
      if (result && "error" in result) setServerError(result.error);
      // Успех → server action делает redirect
    });
  }

  return (
    <Form {...form}>
      <form className="flex flex-col gap-5">
        <div className="rounded-lg border border-border bg-card p-6 flex flex-col gap-5">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Заголовок *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Численное решение уравнения теплопроводности"
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
                <FormLabel>Краткое описание</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="2–3 предложения, о чём работа"
                    rows={2}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="discipline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Дисциплина</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Математика / Физика / Программирование / ..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Теги</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ML, Python, Дифуры"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Через запятую
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="repo_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <GithubIcon className="size-4" />
                  Ссылка на GitHub
                </FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://github.com/owner/repo"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Если работа лежит в репозитории — добавьте ссылку, и на странице
                  артефакта появится живая карточка с описанием, языком и куском README.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Текст работы</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={"# Введение\n\nПишите в Markdown. Поддерживаются заголовки, списки, ссылки, таблицы и блоки кода.\n\n```python\nprint('hello')\n```"}
                    rows={14}
                    className="font-mono text-sm"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Markdown. Можно оставить пустым, если основное содержимое — в файлах.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm font-medium mb-1">Файлы</p>
          <p className="text-xs text-muted-foreground mb-4">
            PDF, DOCX, MD, ноутбуки, код, архивы и др. До 50 МБ на файл.
          </p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="size-4" />
            Прикрепить файлы
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFilesSelected}
          />

          {files.length > 0 && (
            <ul className="mt-4 flex flex-col gap-1.5">
              {files.map((file, i) => (
                <li
                  key={`${file.name}-${i}`}
                  className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <FileText className="size-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Убрать файл"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {serverError && (
          <p className="text-sm text-destructive">{serverError}</p>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={form.handleSubmit((v) => onSubmit(v, false))}
          >
            {isPending ? "Сохраняем..." : "Сохранить как черновик"}
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={form.handleSubmit((v) => onSubmit(v, true))}
          >
            {isPending ? "Публикуем..." : "Опубликовать"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
