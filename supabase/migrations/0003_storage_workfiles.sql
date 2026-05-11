-- ============================================================
-- Storage policies для bucket "work-files" (приватный)
-- ============================================================
-- Bucket "work-files" должен быть создан вручную через Dashboard
-- (Storage → New bucket → НЕ публичный, 50 MB limit, mime пустой).
--
-- Файлы лежат по пути: work-files/{user_id}/{work_id}/{filename}
-- ============================================================

-- Чтение: автор файла видит всегда; чужие — только если работа published
create policy "work_files_read_visible"
  on storage.objects for select
  using (
    bucket_id = 'work-files'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or exists (
        select 1 from public.works w
        where w.id::text = (storage.foldername(name))[2]
          and w.status = 'published'
      )
    )
  );

-- Загрузка — только в свою папку
create policy "work_files_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'work-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "work_files_update_own"
  on storage.objects for update
  using (
    bucket_id = 'work-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "work_files_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'work-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
