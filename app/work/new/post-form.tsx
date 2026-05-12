"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { createPostAction } from "@/lib/work/actions";
import {
  postInputSchema,
  type PostInput,
  POST_MAX_LENGTH,
  POST_MEDIA_IMAGE_EXTENSIONS,
  POST_MEDIA_VIDEO_EXTENSIONS,
  POST_MEDIA_MAX_SIZE,
} from "@/lib/work/schemas";
import { getFileExtension, formatFileSize } from "@/lib/work/utils";
import { ImagePlus, X } from "lucide-react";

const ACCEPT = [
  ...POST_MEDIA_IMAGE_EXTENSIONS.map((e) => `.${e}`),
  ...POST_MEDIA_VIDEO_EXTENSIONS.map((e) => `.${e}`),
  "image/*",
  "video/*",
].join(",");

export function PostForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [media, setMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PostInput>({
    resolver: zodResolver(postInputSchema),
    defaultValues: { content: "" },
  });

  const contentLength = form.watch("content")?.length ?? 0;

  // Превью для выбранного медиа: создаём object URL и освобождаем при смене
  useEffect(() => {
    if (!media) {
      setMediaPreview(null);
      return;
    }
    const url = URL.createObjectURL(media);
    setMediaPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [media]);

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;

    const ext = getFileExtension(file.name);
    const isImage = ext && POST_MEDIA_IMAGE_EXTENSIONS.includes(ext);
    const isVideo = ext && POST_MEDIA_VIDEO_EXTENSIONS.includes(ext);
    if (!isImage && !isVideo) {
      setServerError("Можно прикрепить только фото или видео");
      return;
    }
    if (file.size > POST_MEDIA_MAX_SIZE) {
      setServerError("Файл больше 50 МБ");
      return;
    }
    setServerError(null);
    setMedia(file);
  }

  function onSubmit(values: PostInput) {
    setServerError(null);
    const formData = new FormData();
    if (media) formData.append("media", media);

    startTransition(async () => {
      const result = await createPostAction(values, formData);
      if (result && "error" in result) setServerError(result.error);
    });
  }

  const isVideo = media
    ? POST_MEDIA_VIDEO_EXTENSIONS.includes(getFileExtension(media.name) ?? "")
    : false;

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-5"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="rounded-lg border border-border bg-card p-6 flex flex-col gap-4">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Текст поста *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Что нового? Мысль, вопрос, заметка..."
                    rows={6}
                    className="text-base"
                    {...field}
                  />
                </FormControl>
                <div className="text-xs flex justify-end">
                  <span
                    className={
                      contentLength > POST_MAX_LENGTH
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }
                  >
                    {contentLength} / {POST_MAX_LENGTH}
                  </span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Медиа: одно фото или видео */}
          {media && mediaPreview ? (
            <div className="relative rounded-lg overflow-hidden border border-border bg-background">
              {isVideo ? (
                <video
                  src={mediaPreview}
                  controls
                  className="w-full max-h-[480px] object-contain bg-black"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaPreview}
                  alt="Превью"
                  className="w-full max-h-[480px] object-contain bg-black"
                />
              )}
              <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
                <span className="truncate">
                  {media.name} · {formatFileSize(media.size)}
                </span>
                <button
                  type="button"
                  onClick={() => setMedia(null)}
                  className="inline-flex items-center gap-1 hover:text-destructive"
                  aria-label="Убрать"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="size-4" />
              Прикрепить фото или видео
            </Button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={handleFileSelected}
          />
        </div>

        {serverError && (
          <p className="text-sm text-destructive">{serverError}</p>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Публикуем..." : "Опубликовать"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
