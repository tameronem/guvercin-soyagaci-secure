# SUPABASE KURULUM ADIMLARI

## 1. Supabase Projesi Oluşturma

1. [supabase.com](https://supabase.com) adresine gidin
2. "Start your project" butonuna tıklayın
3. GitHub ile giriş yapın
4. "New Project" butonuna tıklayın
5. Proje bilgilerini girin:
   - **Name**: guvercin-soyagaci
   - **Database Password**: Güçlü bir şifre belirleyin (kaydedin!)
   - **Region**: Europe (Frankfurt) - eu-central-1
   - **Pricing Plan**: Free tier ile başlayın

## 2. Veritabanı Şemasını Yükleme

1. Supabase Dashboard'da SQL Editor'e gidin
2. "New query" butonuna tıklayın
3. `supabase-schema.sql` dosyasındaki tüm SQL kodunu yapıştırın
4. "Run" butonuna tıklayın
5. Tüm tablolar ve politikalar oluşturulacak

## 3. Storage Bucket'ları Oluşturma

1. Dashboard'da Storage bölümüne gidin
2. "Create a new bucket" butonuna tıklayın
3. Sırayla şu bucket'ları oluşturun:

### pigeon-images bucket:
- Name: `pigeon-images`
- Public bucket: ✓ (işaretleyin)
- Create bucket

### documents bucket:
- Name: `documents`
- Public bucket: ☐ (işaretlemeyin)
- Create bucket

### backups bucket:
- Name: `backups`
- Public bucket: ☐ (işaretlemeyin)
- Create bucket

## 4. Storage Policies Ekleme

1. SQL Editor'e dönün
2. `supabase-storage-setup.md` dosyasındaki Storage Policies bölümündeki SQL kodlarını çalıştırın

## 5. Auth Ayarları

1. Dashboard'da Authentication > Settings'e gidin
2. Site URL: `https://yourdomain.com` (deployment sonrası güncellenecek)
3. Redirect URLs'e ekleyin:
   - `http://localhost:3000/*`
   - `https://yourdomain.com/*`

## 6. API Anahtarlarını Alma

1. Dashboard'da Settings > API'ye gidin
2. Şu bilgileri kopyalayın ve güvenli bir yerde saklayın:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIs...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIs...` (GİZLİ - sadece backend için)

## 7. Email Şablonları (Opsiyonel)

1. Authentication > Email Templates'e gidin
2. Türkçe email şablonları ekleyebilirsiniz:

### Confirm signup (Kayıt Onayı):
```html
<h2>Hoş Geldiniz!</h2>
<p>Güvercin Soyağacı Takip Sistemi'ne kayıt olduğunuz için teşekkürler.</p>
<p>Hesabınızı aktifleştirmek için aşağıdaki linke tıklayın:</p>
<p><a href="{{ .ConfirmationURL }}">Hesabımı Aktifleştir</a></p>
```

### Reset Password (Şifre Sıfırlama):
```html
<h2>Şifre Sıfırlama</h2>
<p>Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:</p>
<p><a href="{{ .ConfirmationURL }}">Şifremi Sıfırla</a></p>
<p>Bu işlemi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.</p>
```

## 8. Test Etme

1. Supabase Dashboard'da Table Editor'e gidin
2. Tabloların oluştuğunu kontrol edin
3. Authentication > Users'da test kullanıcı oluşturmayı deneyin

## Önemli Notlar

- **Database Password**: İlk oluştururken belirlediğiniz şifreyi kaydedin
- **API Keys**: Güvenli bir yerde saklayın, özellikle service_role key'i
- **RLS**: Row Level Security aktif, güvenlik için önemli
- **Backup**: Düzenli yedekleme için Supabase'in otomatik backup özelliğini aktif edin

## Sonraki Adımlar

1. Frontend kodunu Supabase'e bağlama
2. localStorage'dan Supabase'e veri migration
3. Ödeme sistemi entegrasyonu (Stripe)
4. Production deployment