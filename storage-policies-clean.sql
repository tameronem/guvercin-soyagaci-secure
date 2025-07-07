-- PIGEON-IMAGES BUCKET POLICIES

CREATE POLICY "Public read access on pigeon-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'pigeon-images');

CREATE POLICY "Users can upload to own folder in pigeon-images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'pigeon-images' AND
    (auth.uid())::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Users can update own images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'pigeon-images' AND
    (auth.uid())::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'pigeon-images' AND
    (auth.uid())::text = (string_to_array(name, '/'))[1]
  );

-- DOCUMENTS BUCKET POLICIES

CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    (auth.uid())::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Users can upload to own folder in documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    (auth.uid())::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Users can update own documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' AND
    (auth.uid())::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND
    (auth.uid())::text = (string_to_array(name, '/'))[1]
  );

-- BACKUPS BUCKET POLICIES

CREATE POLICY "Users can view own backups" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'backups' AND
    (auth.uid())::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Users can upload to own folder in backups" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'backups' AND
    (auth.uid())::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Users can delete own backups" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'backups' AND
    (auth.uid())::text = (string_to_array(name, '/'))[1]
  );