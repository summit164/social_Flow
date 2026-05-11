-- ============================================================
-- Storage policies для bucket "avatars"
-- ============================================================
-- Bucket "avatars" должен быть создан вручную через Dashboard
-- (Storage → New bucket → public, 2MB limit, image/* mime types).
--
-- Файлы хранятся по пути: avatars/{user_id}/avatar.{ext}
-- Первая папка в пути = user_id владельца — это используется в политиках.
-- ============================================================

-- Чтение — всем (bucket публичный, политика для полноты картины)
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Загрузка — только в свою папку
create policy "avatars_upload_own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Обновление — только своих файлов
create policy "avatars_update_own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Удаление — только своих файлов
create policy "avatars_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
