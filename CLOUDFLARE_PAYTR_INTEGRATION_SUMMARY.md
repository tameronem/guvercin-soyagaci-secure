# Cloudflare Workers PayTR Entegrasyonu - Özet

## 🎯 Yapılan İşlemler

### 1. Cloudflare Workers Oluşturuldu
✅ **Payment Worker** (`paytr-payment.js`)
- PayTR ödeme token'ı oluşturur
- Frontend'den gelen istekleri karşılar
- Notification URL'yi otomatik ekler

✅ **Notification Worker** (`paytr-notification.js`)
- PayTR'den gelen bildirimleri karşılar
- Hash doğrulaması yapar
- Supabase'de kullanıcıyı premium yapar
- PayTR'ye "OK" cevabı döner

### 2. Frontend Entegrasyonu
✅ **PayTR iframe desteği** (`paytr-integration.js`)
- Modal içinde PayTR iframe gösterir
- Ödeme callback'lerini dinler
- Başarı/başarısız durumları yönetir

### 3. Yardımcı Dosyalar
✅ **Deploy rehberi** (`CLOUDFLARE_DASHBOARD_DEPLOY.md`)
✅ **Test rehberi** (`PAYTR_TEST_GUIDE.md`)
✅ **Test araçları** (`paytr-test-tools.html`)
✅ **PHP örnek kodu** (`premium-payment-form.php`)

## 📝 Yapmanız Gerekenler

### 1. Cloudflare Dashboard'da Workers Oluşturma

#### Payment Worker:
1. Workers & Pages > Create Worker
2. İsim: `pigeonpedigre-paytr`
3. Kodu yapıştır ve deploy et
4. Environment variables ekle:
   - `MERCHANT_ID`
   - `MERCHANT_KEY`
   - `MERCHANT_SALT`

#### Notification Worker:
1. Workers & Pages > Create Worker
2. İsim: `pigeonpedigre-paytr-notification`
3. Kodu yapıştır ve deploy et
4. Environment variables ekle:
   - `MERCHANT_KEY`
   - `MERCHANT_SALT`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`

### 2. URL'leri Güncelleme

Deploy sonrası aldığınız notification worker URL'sini güncellemelisiniz:

**Dosya:** `paytr-payment.js` (37. satır)
```javascript
const merchant_notify_url = 'https://pigeonpedigre-paytr-notification.YOUR-SUBDOMAIN.workers.dev';
```

**Dosya:** `paytr-integration.js` (36. satır)
```javascript
const response = await fetch('https://pigeonpedigre-paytr.YOUR-SUBDOMAIN.workers.dev', {
```

### 3. PayTR Panel Ayarları

PayTR mağaza panelinizde:
- Ayarlar > Bildirim URL'si
- Notification worker URL'nizi ekleyin

### 4. Supabase Service Key

1. Supabase Dashboard > Settings > API
2. "service_role" key'i kopyalayın (anon key DEĞİL!)
3. Bu key'i notification worker'a ekleyin

## 🧪 Test Adımları

### 1. Worker URL'lerini Test Etme
```bash
# Payment Worker
curl https://pigeonpedigre-paytr.YOUR-SUBDOMAIN.workers.dev

# Notification Worker  
curl https://pigeonpedigre-paytr-notification.YOUR-SUBDOMAIN.workers.dev
```

Her ikisi de "Method not allowed" dönmeli (normal).

### 2. PayTR Test Kartı
- Kart No: `4355084355084358`
- CVV: `000`
- Son Kullanma: `12/26`

### 3. Test Araçları
`paytr-test-tools.html` dosyasını tarayıcıda açın ve:
- Payment Worker'ı test edin
- Hash hesaplayın
- Notification'ı test edin
- Supabase bağlantısını kontrol edin

## ⚠️ Önemli Notlar

### Güvenlik:
1. ✅ Tüm secret'lar "Encrypt" olarak eklenmeli
2. ✅ Production'da CORS ayarları güncellenmeli
3. ✅ PayTR IP kontrolü aktifleştirilmeli
4. ✅ Test mode kapatılmalı (`test_mode = '0'`)

### Veritabanı:
- `orders` tablosunda siparişler saklanır
- `profiles` tablosunda premium durumu güncellenir
- Service key ile RLS bypass edilir

### Hata Durumları:
- "Bad Hash" → Merchant key/salt kontrol edin
- "Order not found" → merchant_oid doğru mu?
- "Database error" → Supabase credentials kontrol edin

## 🚀 Production Kontrol Listesi

- [ ] Worker URL'leri güncellendi
- [ ] Environment variables eklendi
- [ ] PayTR panel bildirim URL'si ayarlandı
- [ ] CORS sadece pigeonpedigre.com'a izin veriyor
- [ ] Test mode kapalı
- [ ] IP kontrolü aktif
- [ ] Frontend'de Worker URL'leri doğru

## 📞 Destek

Sorun yaşarsanız:
1. Worker logs'ları kontrol edin (Settings > Logs)
2. Browser console'da hata var mı bakın
3. Test araçlarıyla adım adım test edin

---

**Not:** Bu entegrasyon tamamen serverless çalışır. PHP'ye ihtiyacınız yoktur. Tüm işlemler Cloudflare Workers üzerinde gerçekleşir.