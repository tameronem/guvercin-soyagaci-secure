# PayTR Notification Worker Debug Rehberi

## ✅ Worker Güncellendi!

Notification worker'a aşağıdaki özellikler eklendi:

### 1. Health Check Endpoints

#### Ana Health Check: `/` veya `/health`
```bash
curl https://pigeonpedigre-paytr-notification.tamer-nem.workers.dev/health
```

Bu endpoint size:
- Environment variables'ların varlığını
- Merchant key uzunluğunu
- Service key'in ilk 20 karakterini gösterir

#### Database Bağlantı Testi: `/test-db`
```bash
curl https://pigeonpedigre-paytr-notification.tamer-nem.workers.dev/test-db
```

Bu endpoint:
- Supabase bağlantısını test eder
- Orders tablosuna erişimi kontrol eder

### 2. Geliştirilmiş Error Handling

- **TÜM hata durumlarında "OK" döner** - PayTR'nin tekrar denemesini önler
- Detaylı console.log'lar eklendi
- Her adımda ne yapıldığı loglanıyor

### 3. Debug Adımları

#### Adım 1: Environment Variables Kontrolü
```bash
# Worker URL'nize /health endpoint'i ekleyin
curl https://pigeonpedigre-paytr-notification.tamer-nem.workers.dev/health
```

Beklenen çıktı:
```json
{
  "status": "ok",
  "environment_check": {
    "has_merchant_key": true,
    "has_merchant_salt": true,
    "has_supabase_url": true,
    "has_service_key": true,
    "merchant_key_length": 16,
    "service_key_preview": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Adım 2: Database Bağlantı Testi
```bash
curl https://pigeonpedigre-paytr-notification.tamer-nem.workers.dev/test-db
```

Başarılı ise status: 200 görmelisiniz.

#### Adım 3: Worker Logs Kontrolü

Cloudflare Dashboard'da:
1. Workers & Pages > pigeonpedigre-paytr-notification
2. Logs sekmesine gidin
3. "Begin log stream" tıklayın
4. Test ödemesi yapın
5. Logları inceleyin

### 4. Sık Karşılaşılan Hatalar ve Çözümleri

#### "Missing PayTR credentials"
- Environment variables eksik
- Dashboard > Settings > Variables kontrol edin

#### "Order not found"
- Payment worker'dan orders tablosuna kayıt eklenmemiş olabilir
- Orders tablosunu kontrol edin:
```sql
SELECT * FROM orders WHERE merchant_oid LIKE 'PRM%' ORDER BY created_at DESC;
```

#### "Failed to update profile"
- user_id yanlış olabilir
- profiles tablosunda bu user_id var mı kontrol edin
- RLS politikaları service key'e izin veriyor mu?

### 5. Manuel Test

Test aracıyla manuel notification gönderin:
```bash
# paytr-test-tools.html dosyasını kullanın
# veya curl ile:

curl -X POST https://pigeonpedigre-paytr-notification.tamer-nem.workers.dev \
  -F "merchant_oid=PRM1234567890" \
  -F "status=success" \
  -F "total_amount=3990" \
  -F "hash=CALCULATED_HASH"
```

### 6. Payment Worker Kontrolü

Payment worker'ın orders tablosuna kayıt eklediğinden emin olun:

```javascript
// paytr-integration.js dosyasında saveOrderToSupabase fonksiyonunu kontrol edin
async function saveOrderToSupabase(userId, merchantOid) {
    // Bu fonksiyon çalışıyor mu?
}
```

### 7. Supabase RLS Politikaları

Service key ile işlem yaparken RLS bypass edilir, ancak yine de kontrol edin:

```sql
-- orders tablosu için service key erişimi
CREATE POLICY "Service role can do anything" ON orders
  USING (auth.role() = 'service_role');

-- profiles tablosu için service key erişimi  
CREATE POLICY "Service role can update profiles" ON profiles
  FOR UPDATE USING (auth.role() = 'service_role');
```

### 8. Worker'ı Yeniden Deploy Etme

```bash
# Dashboard üzerinden:
1. Workers & Pages > pigeonpedigre-paytr-notification
2. "Edit code" tıklayın
3. Yeni kodu yapıştırın
4. "Save and deploy"

# Deployment sonrası test:
curl https://pigeonpedigre-paytr-notification.tamer-nem.workers.dev/health
```

### 9. PayTR Panel Kontrolü

PayTR panelde:
- Bildirim URL'si doğru mu?
- Test modunda mı çalışıyorsunuz?
- Bildirim loglarını kontrol edin

### 10. Acil Durumlar

Eğer hala çalışmıyorsa:
1. Worker logs'larını paylaşın
2. /health endpoint çıktısını paylaşın
3. /test-db endpoint çıktısını paylaşın
4. Orders tablosunda ilgili kaydın var olup olmadığını kontrol edin

## Önemli Notlar

- Worker artık TÜM durumlarda "OK" dönüyor
- HTTP 500 hatası almayacaksınız
- Detaylı loglar Worker logs'larda görünecek
- Database hatalarında bile PayTR'ye OK dönülüyor