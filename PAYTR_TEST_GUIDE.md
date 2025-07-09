# PayTR Entegrasyon Test Rehberi

## Yapılan Değişiklikler Özeti

### 1. Backend - Cloudflare Workers
- **paytr-notification.js**: PayTR'den gelen bildirimleri karşılayan yeni worker
- **paytr-payment.js**: Notification URL eklendi
- **wrangler-notification.toml**: Notification worker için config dosyası
- **DEPLOYMENT.md**: Deploy talimatları

### 2. Frontend 
- **paytr-integration.js**: PayTR iframe entegrasyonu için yeni dosya
- **index.html**: PayTR butonları ve script eklendi

## Test Adımları

### 1. Workers'ı Deploy Etme

```bash
cd cloudflare-worker/

# Payment worker
wrangler deploy

# Notification worker  
wrangler deploy --config wrangler-notification.toml
```

### 2. Environment Variables Ekleme

```bash
# Payment Worker
wrangler secret put MERCHANT_ID
wrangler secret put MERCHANT_KEY
wrangler secret put MERCHANT_SALT

# Notification Worker
wrangler secret put MERCHANT_KEY --config wrangler-notification.toml
wrangler secret put MERCHANT_SALT --config wrangler-notification.toml
wrangler secret put SUPABASE_URL --config wrangler-notification.toml
wrangler secret put SUPABASE_SERVICE_KEY --config wrangler-notification.toml
```

### 3. URL'leri Güncelleme

Deploy sonrası aldığınız notification worker URL'sini `paytr-payment.js` dosyasında güncelleyin:

```javascript
const merchant_notify_url = 'https://pigeonpedigre-paytr-notification.YOUR-SUBDOMAIN.workers.dev';
```

### 4. Test Senaryoları

#### A. Başarılı Ödeme Testi
1. Giriş yapın
2. Premium satın alma sayfasına gidin
3. "PayTR ile Öde" butonuna tıklayın
4. Test kartı kullanın: 4355084355084358
5. Ödemeyi tamamlayın
6. Callback ve notification kontrolü

#### B. Başarısız Ödeme Testi
1. Hatalı kart bilgisi girin
2. Ödeme reddedilmeli
3. Orders tablosunda status: failed olmalı

#### C. Notification Endpoint Testi
```bash
# Manuel test için
curl -X POST https://your-notification-worker.workers.dev \
  -F "merchant_oid=PRM1234567890" \
  -F "status=success" \
  -F "total_amount=3990" \
  -F "hash=YOUR_HASH"
```

### 5. Kontrol Edilecek Noktalar

#### Supabase Tabloları:
- **orders**: Yeni siparişler eklenmeli
- **profiles**: is_premium true olmalı
- **premium_expires_at**: 1 yıl sonrası olmalı

#### Log Kontrolleri:
```bash
# Worker logları
wrangler tail
wrangler tail --config wrangler-notification.toml
```

#### PayTR Panel:
- Bildirim URL'si doğru ayarlanmış mı?
- Test ödemeleri görünüyor mu?

### 6. Production Öncesi Yapılacaklar

1. **CORS Ayarları**: 
   - `paytr-payment.js` içinde sadece pigeonpedigre.com'a izin verin

2. **IP Kontrolü**:
   - `paytr-notification.js` içinde PayTR IP kontrolünü aktif edin

3. **Test Mode**:
   - `test_mode = '0'` olarak değiştirin

4. **URL'ler**:
   - Tüm worker URL'lerini production URL'leri ile değiştirin

## Sorun Giderme

### "Bad Hash" Hatası
- Merchant key/salt doğru mu?
- Hash hesaplama sırası doğru mu?

### Notification Ulaşmıyor
- Worker URL'si doğru mu?
- PayTR panelde bildirim URL'si tanımlı mı?

### Premium Aktif Olmuyor
- Supabase service key doğru mu?
- RLS politikaları service key'e izin veriyor mu?

## Önemli Notlar

1. PayTR sadece Türkiye IP'lerinden test edilebilir
2. Test modunda gerçek para çekilmez
3. Notification worker her zaman "OK" dönmeli
4. Supabase service key'i güvenli tutun