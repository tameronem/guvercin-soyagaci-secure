-- SUPABASE STORAGE RLS POLICIES (DÜZELTİLMİŞ VERSİYON)

-- =====================================================
-- PIGEON-IMAGES BUCKET POLICIES
-- =====================================================

-- Herkes okuyabilir (public bucket)
CREATE POLICY "Public read access on pigeon-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'pigeon-images');

-- Kullanıcılar sadece kendi klasörlerine yükleyebilir
CREATE POLICY "Users can upload to own folder in pigeon-images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'pigeon-images' AND
    (auth.uid())::text = (string_to_array(name, '/'))[1]
  );

-- Kullanıcılar sadece kendi dosyalarını güncelleyebilir
CREATE POLICY "Users can update own images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'pigeon-images' AND
    (auth.uid())::text = (string_to_array(name, '/'))[1]
  );

-- Kullanıcılar sadece kendi dosyalarını silebilir
CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'pigeon-images' AND
    (auth.uid())::text = (string_to_array(name, '/'))[1]
  );

-- =====================================================
-- DOCUMENTS BUCKET POLICIES
-- =====================================================

-- Kullanıcılar sadece kendi belgelerini görebilir
CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    (auth.uid())::text = (string_to_array(name, '/'))[1]
  );

-- Kullanıcılar sadece kendi klasörlerine yükleyebilir
CREATE POLICY "Users can upload to own folder in documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    (auth.uid())::text = (string_to_array(name, '/'))[1]
  );

-- Kullanıcılar sadece kendi belgelerini güncelleyebilir
CREATE POLICY "Users can update own documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' AND
    (auth.uid())::text = (string_to_array(name, '/'))[1]
  );

-- Kullanıcılar sadece kendi belgelerini silebilir
CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND
    (auth.uid())::text = (string_to_array(name, '/'))[1]
  );

-- =====================================================
-- BACKUPS BUCKET POLICIES
-- =====================================================

-- Kullanıcılar sadece kendi yedeklerini görebilir
CREATE POLICY "Users can view own backups" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'backups' AND
    (auth.uid())::text = (string_to_array(name, '/'))[1]
  );

-- Kullanıcılar sadece kendi klasörlerine yükleyebilir
CREATE POLICY "Users can upload to own folder in backups" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'backups' AND
    (auth.uid())::text = (string_to_array(name, '/'))[1]
  );

-- Kullanıcılar sadece kendi yedeklerini silebilir
CREATE POLICY "Users can delete own backups" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'backups' AND
    (auth.uid())::text = (string_to_array(name, '/'))[1]
  );

-- =====================================================
-- ALTERNATİF (DAHA BASİT) YAKLAŞIM
-- =====================================================
-- Eğer yukarıdaki policy'ler hata verirse, daha basit bir yaklaşım:

/*
-- Pigeon Images - Alternatif
CREATE POLICY "Anyone can view pigeon images" ON storage.objects
  FOR SELECT USING (bucket_id = 'pigeon-images');

CREATE POLICY "Authenticated users can upload pigeon images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'pigeon-images' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own pigeon images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'pigeon-images' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete own pigeon images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'pigeon-images' AND
    auth.uid() IS NOT NULL
  );

-- Documents - Alternatif
CREATE POLICY "Authenticated users can manage documents" ON storage.objects
  FOR ALL USING (
    bucket_id = 'documents' AND
    auth.role() = 'authenticated'
  );

-- Backups - Alternatif
CREATE POLICY "Authenticated users can manage backups" ON storage.objects
  FOR ALL USING (
    bucket_id = 'backups' AND
    auth.role() = 'authenticated'
  );
*/