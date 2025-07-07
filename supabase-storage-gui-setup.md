# SUPABASE STORAGE GUI İLE KURULUM

## Storage Policy'lerini GUI'den Ekleme

Storage policy'lerini SQL yerine Supabase Dashboard üzerinden eklemek daha kolay olabilir:

### 1. pigeon-images Bucket İçin:

1. Supabase Dashboard'da Storage'a gidin
2. `pigeon-images` bucket'ına tıklayın
3. "Policies" sekmesine gidin
4. "New Policy" butonuna tıklayın
5. "For full customization" seçeneğini seçin

**SELECT Policy (Herkes okuyabilir):**
- Policy name: `Public read access`
- Allowed operation: SELECT
- Target roles: anon, authenticated
- Policy definition:
```sql
bucket_id = 'pigeon-images'
```

**INSERT Policy (Kullanıcılar yükleyebilir):**
- Policy name: `Authenticated users can upload`
- Allowed operation: INSERT
- Target roles: authenticated
- Policy definition:
```sql
bucket_id = 'pigeon-images' AND auth.uid()::text = (string_to_array(name, '/'))[1]
```

**UPDATE Policy:**
- Policy name: `Users can update own images`
- Allowed operation: UPDATE
- Target roles: authenticated
- Policy definition:
```sql
bucket_id = 'pigeon-images' AND auth.uid()::text = (string_to_array(name, '/'))[1]
```

**DELETE Policy:**
- Policy name: `Users can delete own images`
- Allowed operation: DELETE
- Target roles: authenticated
- Policy definition:
```sql
bucket_id = 'pigeon-images' AND auth.uid()::text = (string_to_array(name, '/'))[1]
```

### 2. documents ve backups Bucket'ları İçin:

Aynı adımları tekrarlayın ama SELECT policy'de sadece authenticated kullanıcıları hedefleyin.

## Basitleştirilmiş Policy Yaklaşımı

Eğer klasör bazlı kontrol çok karmaşık geliyorsa, daha basit bir yaklaşım:

### pigeon-images için:
1. "Quick templates" seçin
2. "Public read access" template'ini seçin
3. "Authenticated can upload" template'ini ekleyin

### documents ve backups için:
1. "Quick templates" seçin
2. "Authenticated users only" template'ini seçin

## Test Etme

Policy'leri ekledikten sonra test edin:

```javascript
// Test kodu
const testUpload = async () => {
  const file = new File(['test'], 'test.txt', { type: 'text/plain' });
  
  const { data, error } = await supabase.storage
    .from('pigeon-images')
    .upload(`${user.id}/test.txt`, file);
    
  console.log('Upload result:', { data, error });
};
```

## Sorun Giderme

### Hata: "storage.foldername" function does not exist
**Çözüm:** `string_to_array(name, '/')` kullanın

### Hata: Policy violation on upload
**Çözüm:** Dosya yolu formatını kontrol edin: `{user-id}/filename.ext`

### Hata: Cannot read files
**Çözüm:** SELECT policy'nin doğru ayarlandığından emin olun