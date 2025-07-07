-- Storage RLS Politikalarını Yeniden Oluşturma
-- Önce mevcut politikaları sil, sonra yeniden oluştur

-- =====================================================
-- MEVCUT POLİTİKALARI SİL
-- =====================================================

-- pigeon-images bucket politikaları
DROP POLICY IF EXISTS "Public read access on pigeon-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own folder in pigeon-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- documents bucket politikaları
DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own folder in documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;

-- backups bucket politikaları
DROP POLICY IF EXISTS "Users can view own backups" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own folder in backups" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own backups" ON storage.objects;

-- Alternatif politikalar (varsa)
DROP POLICY IF EXISTS "Anyone can view pigeon images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload pigeon images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own pigeon images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own pigeon images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can manage documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can manage backups" ON storage.objects;

-- =====================================================
-- YENİ POLİTİKALARI OLUŞTUR
-- =====================================================

-- PIGEON-IMAGES BUCKET POLICIES
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

-- DOCUMENTS BUCKET POLICIES
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

-- BACKUPS BUCKET POLICIES
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