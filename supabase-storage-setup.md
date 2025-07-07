# SUPABASE STORAGE BUCKET KURULUMU

## Storage Bucket'ları Oluşturma

Supabase Dashboard'da Storage bölümüne gidin ve aşağıdaki bucket'ları oluşturun:

### 1. pigeon-images
- **Açıklama**: Güvercin fotoğrafları için
- **Public**: Evet (herkes görüntüleyebilir)
- **Allowed MIME types**: image/jpeg, image/png, image/webp, image/gif
- **Max file size**: 5MB

### 2. documents
- **Açıklama**: PDF raporları ve belgeler için
- **Public**: Hayır (sadece kullanıcı kendi belgelerini görebilir)
- **Allowed MIME types**: application/pdf
- **Max file size**: 10MB

### 3. backups
- **Açıklama**: Veri yedekleri için
- **Public**: Hayır (sadece kullanıcı kendi yedeklerini görebilir)
- **Allowed MIME types**: application/json, application/zip
- **Max file size**: 50MB

## Storage Policies (RLS)

### pigeon-images bucket policies:

```sql
-- Herkes okuyabilir (public bucket)
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'pigeon-images');

-- Kullanıcılar sadece kendi klasörlerine yükleyebilir
CREATE POLICY "Users can upload own images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'pigeon-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Kullanıcılar sadece kendi dosyalarını güncelleyebilir
CREATE POLICY "Users can update own images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'pigeon-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Kullanıcılar sadece kendi dosyalarını silebilir
CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'pigeon-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### documents bucket policies:

```sql
-- Kullanıcılar sadece kendi belgelerini görebilir
CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Kullanıcılar sadece kendi klasörlerine yükleyebilir
CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Kullanıcılar sadece kendi belgelerini güncelleyebilir
CREATE POLICY "Users can update own documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Kullanıcılar sadece kendi belgelerini silebilir
CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### backups bucket policies:

```sql
-- Kullanıcılar sadece kendi yedeklerini görebilir
CREATE POLICY "Users can view own backups" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'backups' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Kullanıcılar sadece kendi klasörlerine yükleyebilir
CREATE POLICY "Users can upload own backups" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'backups' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Kullanıcılar sadece kendi yedeklerini silebilir
CREATE POLICY "Users can delete own backups" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'backups' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Klasör Yapısı

Her bucket'ta kullanıcıya özel klasörler oluşturulacak:

```
pigeon-images/
├── {user-id}/
│   ├── pigeon-{pigeon-id}.jpg
│   └── pigeon-{pigeon-id}-thumb.jpg

documents/
├── {user-id}/
│   ├── pedigree-{pigeon-id}.pdf
│   ├── race-report-{race-id}.pdf
│   └── health-report-{date}.pdf

backups/
├── {user-id}/
│   ├── backup-{date}.json
│   └── full-backup-{date}.zip
```

## JavaScript Kullanım Örnekleri

### Güvercin resmi yükleme:

```javascript
async function uploadPigeonImage(file, pigeonId) {
  const user = await supabase.auth.getUser();
  const userId = user.data.user.id;
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/pigeon-${pigeonId}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('pigeon-images')
    .upload(fileName, file, {
      upsert: true
    });

  if (error) throw error;

  // Public URL'i al
  const { data: urlData } = supabase.storage
    .from('pigeon-images')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}
```

### PDF rapor yükleme:

```javascript
async function uploadPDFReport(pdfBlob, reportType, id) {
  const user = await supabase.auth.getUser();
  const userId = user.data.user.id;
  const fileName = `${userId}/${reportType}-${id}.pdf`;

  const { data, error } = await supabase.storage
    .from('documents')
    .upload(fileName, pdfBlob, {
      contentType: 'application/pdf',
      upsert: true
    });

  if (error) throw error;
  return data.path;
}
```

### Yedek oluşturma:

```javascript
async function createBackup(backupData) {
  const user = await supabase.auth.getUser();
  const userId = user.data.user.id;
  const date = new Date().toISOString().split('T')[0];
  const fileName = `${userId}/backup-${date}.json`;

  const blob = new Blob([JSON.stringify(backupData)], {
    type: 'application/json'
  });

  const { data, error } = await supabase.storage
    .from('backups')
    .upload(fileName, blob, {
      upsert: true
    });

  if (error) throw error;
  return data.path;
}
```