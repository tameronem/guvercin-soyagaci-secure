# 🔄 Premium Üyelik İade Sistemi Dokümantasyonu

## 📋 İçindekiler
1. [Genel Bakış](#genel-bakış)
2. [Sistem Mimarisi](#sistem-mimarisi)
3. [Dosya Yapısı](#dosya-yapısı)
4. [Kurulum Adımları](#kurulum-adımları)
5. [Kullanım Kılavuzu](#kullanım-kılavuzu)
6. [Teknik Detaylar](#teknik-detaylar)
7. [Güvenlik Önlemleri](#güvenlik-önlemleri)
8. [Sorun Giderme](#sorun-giderme)
9. [API Referansı](#api-referansı)

---

## 🎯 Genel Bakış

Premium üyelik iade sistemi, kullanıcıların 3 gün içinde üyeliklerini iptal edebilmelerini sağlayan otomatik bir sistemdir.

### Özellikler:
- ✅ 3 gün iade garantisi
- ✅ Otomatik veritabanı güncellemeleri
- ✅ Güvenli API endpoint
- ✅ Kullanıcı dostu arayüz
- ✅ Detaylı loglama ve takip

### Kısıtlamalar:
- ⚠️ PayTR otomatik iade API'si yoktur
- ⚠️ Gerçek para iadesi manuel yapılmalıdır
- ⚠️ 3 gün süresi geçtikten sonra iade yapılamaz

---

## 🏗️ Sistem Mimarisi

```
┌─────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│                 │     │                     │     │                  │
│  Frontend       │────▶│  Cloudflare Worker  │────▶│    Supabase      │
│  (index.html)   │     │  (Refund API)       │     │    Database      │
│                 │     │                     │     │                  │
└─────────────────┘     └─────────────────────┘     └──────────────────┘
        │                                                      │
        │                                                      │
        └──────────────────── User Interface ─────────────────┘
```

### Akış Diyagramı:
1. Kullanıcı profil sayfasında "Üyeliği İptal Et" butonuna tıklar
2. Frontend onay modal'ı gösterir
3. Onay sonrası Cloudflare Worker'a istek gönderilir
4. Worker 3 gün kontrolü yapar
5. Uygunsa veritabanı güncellemeleri yapılır
6. Kullanıcıya sonuç bildirilir

---

## 📁 Dosya Yapısı

```
project/
│
├── cloudflare-worker/
│   ├── paytr-refund.js         # İade API endpoint'i
│   ├── wrangler-refund.toml    # Worker konfigürasyonu
│   └── DEPLOYMENT.md           # Deploy talimatları
│
├── index.html                  # Ana uygulama (güncellendi)
│   ├── showProfile()          # Profil sayfası
│   └── requestRefund()        # İade fonksiyonu
│
├── refund-system-update.sql    # Veritabanı güncellemeleri
│
└── REFUND-SYSTEM-DOCUMENTATION.md  # Bu dosya
```

---

## 🚀 Kurulum Adımları

### 1. Veritabanı Güncellemeleri

```sql
-- Supabase SQL Editor'de çalıştırın
-- refund-system-update.sql dosyasının içeriğini yapıştırın
```

### 2. Cloudflare Worker Deploy

```bash
# Proje dizinine gidin
cd cloudflare-worker

# Wrangler'ı yükleyin (yoksa)
npm install -g wrangler

# Cloudflare'e login olun
wrangler login

# Worker'ı deploy edin
wrangler deploy --config wrangler-refund.toml

# Environment variables ekleyin
wrangler secret put MERCHANT_ID --config wrangler-refund.toml
# Değer girin: [PayTR Merchant ID]

wrangler secret put MERCHANT_KEY --config wrangler-refund.toml
# Değer girin: [PayTR Merchant Key]

wrangler secret put MERCHANT_SALT --config wrangler-refund.toml
# Değer girin: [PayTR Merchant Salt]

wrangler secret put SUPABASE_URL --config wrangler-refund.toml
# Değer girin: https://[PROJECT_ID].supabase.co

wrangler secret put SUPABASE_SERVICE_ROLE_KEY --config wrangler-refund.toml
# Değer girin: [Service Role Key - Supabase Dashboard > Settings > API]
```

### 3. Frontend URL Güncelleme

index.html dosyasında Worker URL'ini güncelleyin:

```javascript
// Satır 5078'de
const REFUND_WORKER_URL = 'https://pigeonpedigre-refund.[YOUR-SUBDOMAIN].workers.dev';
```

---

## 📖 Kullanım Kılavuzu

### Kullanıcı Perspektifi

1. **Profil Sayfasına Erişim**
   - Giriş yapın
   - Sağ üstteki "Profil" butonuna tıklayın

2. **İade Hakkı Kontrolü**
   - Premium üyelik detaylarını görüntüleyin
   - İade durumu yeşil kutuda gösterilir (3 gün içindeyse)

3. **İade İşlemi**
   - "Üyeliği İptal Et" butonuna tıklayın
   - Onay mesajını okuyun ve onaylayın
   - İşlem sonucunu bekleyin

### Yönetici Perspektifi

1. **PayTR Panel**
   - İade taleplerini kontrol edin
   - Manuel iade işlemini gerçekleştirin

2. **Supabase Dashboard**
   - support_tickets tablosunda iade kayıtlarını görüntüleyin
   - refunded_payments view'ını kontrol edin

---

## 🔧 Teknik Detaylar

### API Endpoint

**URL:** `POST https://pigeonpedigre-refund.workers.dev`

**Request Body:**
```json
{
  "user_id": "uuid",
  "merchant_oid": "PRM1234567890"
}
```

**Response (Başarılı):**
```json
{
  "success": true,
  "message": "İade işlemi başarıyla tamamlandı",
  "refund_details": {
    "merchant_oid": "PRM1234567890",
    "amount": 39.90,
    "currency": "TRY",
    "refunded_at": "2024-01-01T12:00:00Z"
  }
}
```

**Response (Hatalı):**
```json
{
  "success": false,
  "error": "İade süresi dolmuş (3 gün geçmiş)",
  "days_passed": 5
}
```

### Veritabanı Değişiklikleri

İade işlemi sonrası:

1. **payment_tracking**
   - `status` → 'refunded'
   - `refunded_at` → current timestamp

2. **profiles**
   - `is_premium` → false
   - `premium_expires_at` → null

3. **premium_subscriptions**
   - `status` → 'refunded'
   - `updated_at` → current timestamp

4. **support_tickets**
   - Yeni kayıt eklenir (otomatik iade kaydı)

---

## 🔒 Güvenlik Önlemleri

### 1. Backend Validasyon
- ✅ 3 gün kuralı backend'de kontrol edilir
- ✅ User ID ve merchant_oid eşleşmesi doğrulanır
- ✅ Ödeme durumu kontrol edilir

### 2. CORS Politikası
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Production'da değiştirin
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};
```

### 3. Rate Limiting
- Cloudflare otomatik rate limiting
- Tek kullanıcı için tekrarlı istekler engellenir

### 4. Supabase RLS
- Service role key ile tam erişim
- Kullanıcılar sadece kendi verilerini görebilir

---

## 🛠️ Sorun Giderme

### Sık Karşılaşılan Hatalar

#### 1. "Ödeme kaydı bulunamadı"
**Sebep:** payment_tracking tablosunda kayıt yok
**Çözüm:** Ödeme durumunu kontrol edin

#### 2. "İade süresi dolmuş"
**Sebep:** 3 gün geçmiş
**Çözüm:** Manuel destek sağlayın

#### 3. "Failed to fetch"
**Sebep:** Worker URL yanlış veya deploy edilmemiş
**Çözüm:** URL'yi kontrol edin, worker'ı deploy edin

### Debug İpuçları

1. **Browser Console**
   ```javascript
   // Network sekmesinde isteği kontrol edin
   console.log('Refund response:', result);
   ```

2. **Worker Logs**
   ```bash
   wrangler tail --config wrangler-refund.toml
   ```

3. **Supabase Logs**
   - Dashboard > Logs > API logs

---

## 📊 Monitoring ve Raporlama

### SQL Sorgular

**İade İstatistikleri:**
```sql
SELECT * FROM refund_statistics;
```

**Kullanıcı İade Geçmişi:**
```sql
SELECT * FROM get_user_refund_history('user-uuid-here');
```

**Son 30 Günün İadeleri:**
```sql
SELECT * FROM refunded_payments 
WHERE refunded_at > NOW() - INTERVAL '30 days';
```

---

## 🔄 Güncellemeler ve Bakım

### Versiyon Kontrolü
- Worker versiyonu: wrangler.toml'da `compatibility_date`
- Frontend versiyonu: index.html içinde comment olarak

### Güncelleme Prosedürü
1. Test ortamında değişiklikleri test edin
2. Backup alın
3. Worker'ı yeniden deploy edin
4. Frontend'i güncelleyin
5. Monitoring ile kontrol edin

---

## 📞 Destek

### Teknik Destek
- Email: destek@guvercinsoyagaci.com
- Dokümantasyon: Bu dosya

### Acil Durumlar
1. Worker'ı devre dışı bırakın
2. Manuel iade sürecine geçin
3. Kullanıcıları bilgilendirin

---

## 🔗 İlgili Kaynaklar

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Supabase Docs](https://supabase.com/docs)
- [PayTR API Docs](https://www.paytr.com/magaza/entegrasyon)

---

*Son güncelleme: Ocak 2024*
*Versiyon: 1.0.0*