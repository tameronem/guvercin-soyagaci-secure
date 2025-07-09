# PayTR Tek Ödeme Sistemi Entegrasyonu

## ✅ Yapılan Değişiklikler

### 1. Veritabanı Güncellemeleri
- **payment_tracking** tablosu PayTR için güncellendi
- Yeni kolonlar eklendi: `merchant_oid`, `paytr_hash`, `payment_type`, vb.
- orders tablosu kullanılmıyor, tüm işlemler payment_tracking üzerinden

### 2. Worker Güncellemeleri
- **paytr-notification.js**: orders yerine payment_tracking kullanıyor
- Health check endpoints: `/health` ve `/test-db`
- Detaylı error logging ve debug özellikleri

### 3. Frontend Değişiklikleri
- İyziLink kaldırıldı, sadece PayTR kullanılıyor
- Tek "Yükselt" butonu - PayTR iframe açıyor
- handlePremiumPurchase() → PayTR iframe açar
- saveOrderToSupabase() → payment_tracking'e kayıt atar

### 4. Kaldırılan Özellikler
- ❌ İyziLink URL'leri
- ❌ Manuel ödeme doğrulama
- ❌ Tracking code sistemi (merchant_oid kullanılıyor)
- ❌ "Ödemeyi Yaptım" butonu
- ❌ Destek talebi ile ödeme doğrulama

## 🚀 Deployment Adımları

### 1. Veritabanı Migration
```sql
-- Supabase SQL Editor'de çalıştırın:
-- paytr-migration.sql dosyasının içeriğini yapıştırın
```

### 2. Workers Deploy
```bash
# Cloudflare Dashboard'da:
1. paytr-payment worker'ı güncelleyin ve deploy edin
2. paytr-notification worker'ı güncelleyin ve deploy edin
```

### 3. Environment Variables
Notification Worker için gerekli:
- `MERCHANT_KEY`
- `MERCHANT_SALT`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

### 4. Test
```bash
# Health check
curl https://pigeonpedigre-paytr-notification.tamer-nem.workers.dev/health

# Database bağlantısı
curl https://pigeonpedigre-paytr-notification.tamer-nem.workers.dev/test-db
```

## 📋 Yeni Ödeme Akışı

1. Kullanıcı "Yükselt" butonuna tıklar
2. PayTR iframe modal'ı açılır
3. Kullanıcı ödeme bilgilerini girer
4. PayTR ödemeyi işler
5. PayTR notification worker'a bildirim gönderir
6. Worker payment_tracking'e kaydeder
7. Worker kullanıcıyı premium yapar
8. Kullanıcı otomatik olarak premium olur

## ⚠️ Önemli Notlar

1. **Test Mode**: Şu an test modunda (`test_mode = '1'`)
2. **Service Key**: Supabase service_role key gerekli (anon key değil!)
3. **PayTR Panel**: Notification URL'yi ayarlamayı unutmayın
4. **RLS Politikaları**: Migration script'i RLS politikalarını da güncelliyor

## 🧪 Test Kartı
- Kart No: `4355084355084358`
- CVV: `000`
- Son Kullanma: `12/26`

## 📝 Kontrol Listesi

- [ ] SQL migration çalıştırıldı
- [ ] Workers deploy edildi
- [ ] Environment variables eklendi
- [ ] PayTR panel notification URL güncellendi
- [ ] Health check başarılı
- [ ] Test ödemesi yapıldı
- [ ] Premium aktivasyonu çalışıyor

## 🔍 Debug

Sorun yaşarsanız:
1. Worker logs'larını kontrol edin
2. `/health` endpoint'ini kontrol edin
3. payment_tracking tablosunda kayıt var mı bakın
4. PayTR panel'de notification loglarını kontrol edin