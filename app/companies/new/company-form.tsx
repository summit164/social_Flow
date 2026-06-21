"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createCompanyAction,
  uploadCompanyLogoAction,
  uploadCompanyCoverAction,
} from "@/lib/jobs/actions";
import { companyInputSchema, type CompanyInput } from "@/lib/jobs/schemas";

const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const MAX_COVER_SIZE = 4 * 1024 * 1024;
const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

export function CompanyForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  const form = useForm<CompanyInput>({
    resolver: zodResolver(companyInputSchema),
    defaultValues: {
      name: "",
      description: "",
      website: "",
      location: "",
      industry: "",
    },
  });

  function pickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (logoInputRef.current) logoInputRef.current.value = "";
    if (!file) return;
    if (file.size > MAX_LOGO_SIZE) {
      setServerError("Лого больше 2 МБ");
      return;
    }
    setServerError(null);
    setLogoFile(file);
  }

  function pickCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (coverInputRef.current) coverInputRef.current.value = "";
    if (!file) return;
    if (file.size > MAX_COVER_SIZE) {
      setServerError("Обложка больше 4 МБ");
      return;
    }
    setServerError(null);
    setCoverFile(file);
  }

  function onSubmit(values: CompanyInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await createCompanyAction(values);
      if ("error" in result) {
        setServerError(result.error);
        return;
      }
      const id = result.id;
      if (!id) {
        setServerError("Не удалось получить id компании");
        return;
      }

      // Загружаем лого и обложку, если выбраны
      if (logoFile) {
        const fd = new FormData();
        fd.append("file", logoFile);
        const r = await uploadCompanyLogoAction(id, fd);
        if ("error" in r) {
          setServerError(`Лого: ${r.error}`);
          // Компанию всё равно создали — переходим
        }
      }
      if (coverFile) {
        const fd = new FormData();
        fd.append("file", coverFile);
        const r = await uploadCompanyCoverAction(id, fd);
        if ("error" in r) {
          setServerError(`Обложка: ${r.error}`);
        }
      }

      router.push(`/companies/${id}`);
    });
  }

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-5"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        {/* ======= ВИЗУАЛЬНОЕ ПРЕВЬЮ — обложка + лого ======= */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {/* Обложка */}
          <div className="relative group">
            <div
              className="h-40 sm:h-48 w-full bg-gradient-to-br from-[#5b6ee1] via-[#4a86b0] to-[#a8b4be]"
              style={
                coverPreview
                  ? {
                      backgroundImage: `url(${coverPreview})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
            />
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={isPending}
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white"
              aria-label="Загрузить обложку"
            >
              <span className="inline-flex items-center gap-1.5 text-sm">
                <Camera className="size-4" />
                Обложка
              </span>
            </button>
            {coverFile && (
              <button
                type="button"
                onClick={() => setCoverFile(null)}
                disabled={isPending}
                aria-label="Убрать"
                className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-md bg-black/50 px-2 py-1 text-xs text-white hover:bg-black/70"
              >
                <X className="size-3" />
                Убрать
              </button>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={pickCover}
            />
          </div>

          {/* Лого */}
          <div className="px-5 pb-5">
            <div className="relative group -mt-10 w-fit">
              <div className="flex size-20 items-center justify-center rounded-lg bg-card text-muted-foreground shrink-0 overflow-hidden ring-4 ring-card shadow-sm">
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoPreview}
                    alt="Лого"
                    className="size-20 object-cover"
                  />
                ) : (
                  <Building2 className="size-10" />
                )}
              </div>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={isPending}
                aria-label="Загрузить лого"
                className="absolute inset-0 rounded-lg flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white"
              >
                <Camera className="size-5" />
              </button>
              {logoFile && (
                <button
                  type="button"
                  onClick={() => setLogoFile(null)}
                  disabled={isPending}
                  aria-label="Убрать"
                  className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-destructive"
                >
                  <X className="size-3" />
                </button>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={pickLogo}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Наведите на обложку или лого, чтобы загрузить картинку. PNG, JPG,
              WebP, GIF. Лого до 2 МБ, обложка до 4 МБ. Необязательно — можно
              сделать позже.
            </p>
          </div>
        </div>

        {/* ======= ОСНОВНЫЕ ПОЛЯ ======= */}
        <div className="rounded-lg border border-border bg-card p-6 flex flex-col gap-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Название компании *</FormLabel>
                <FormControl>
                  <Input placeholder="Яндекс Школа" {...field} />
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
                    rows={4}
                    placeholder="Чем занимается компания, кого ищет, культура..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid sm:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Отрасль</FormLabel>
                  <FormControl>
                    <Input placeholder="IT / Образование / ..." {...field} />
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
                    <Input placeholder="Новосибирск" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Сайт</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://example.com"
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
            {isPending ? "Создаём..." : "Создать компанию"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
