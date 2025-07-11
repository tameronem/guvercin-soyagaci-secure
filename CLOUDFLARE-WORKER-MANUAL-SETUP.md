# 🚀 Cloudflare Worker Manuel Kurulum Rehberi

## 📋 İçindekiler
1. [Hazırlık](#hazırlık)
2. [Worker Oluşturma](#worker-oluşturma)
3. [Kod Yükleme](#kod-yükleme)
4. [Environment Variables](#environment-variables)
5. [Test ve Doğrulama](#test-ve-doğrulama)
6. [Frontend Entegrasyonu](#frontend-entegrasyonu)
7. [Sorun Giderme](#sorun-giderme)

---

## 📌 Hazırlık

### İhtiyacınız Olanlar:
- ✅ Cloudflare hesabı (ücretsiz plan yeterli)
- ✅ Supabase projeniz
- ✅ PayTR mağaza bilgileri (test için zorunlu değil)

### Toplanması Gereken Bilgiler:
```
1. Supabase URL: https://xxxxx.supabase.co
2. Supabase Service Role Key: eyJhbGc...
3. PayTR Merchant ID: (opsiyonel)
4. PayTR Merchant Key: (opsiyonel)
5. PayTR Merchant Salt: (opsiyonel)
```

---

## 🔧 Worker Oluşturma

### Adım 1: Cloudflare Dashboard'a Giriş
1. [https://dash.cloudflare.com](https://dash.cloudflare.com) adresine gidin
2. Email ve şifrenizle giriş yapın

### Adım 2: Workers & Pages Bölümü
1. Sol menüden **"Workers & Pages"** tıklayın
2. Sağ üstteki **"Create application"** butonuna tıklayın

### Adım 3: Worker Oluştur
1. **"Create Worker"** seçeneğini seçin
2. Worker adını girin: `pigeonpedigre-paytr-refund`
3. **"Deploy"** butonuna tıklayın

---

## 📝 Kod Yükleme

### Adım 1: Worker'ı Düzenle
1. Worker oluşturulduktan sonra **"Edit code"** butonuna tıklayın
2. Açılan editörde varsayılan kodu silin

### Adım 2: Refund Worker Kodunu Yapıştır
1. `cloudflare-worker/paytr-refund.js` dosyasını açın
2. **TÜM KODU** kopyalayın (Ctrl+A, Ctrl+C)
3. Cloudflare editöre yapıştırın (Ctrl+V)

### Adım 3: Kaydet ve Deploy Et
1. Sağ üstteki **"Save and deploy"** butonuna tıklayın
2. Deploy işleminin tamamlanmasını bekleyin

---

## 🔐 Environment Variables

### Adım 1: Settings'e Git
1. Worker sayfasında **"Settings"** sekmesine tıklayın
2. Sol menüden **"Variables"** seçeneğini seçin

### Adım 2: Environment Variables Ekle
**"Add variable"** butonuna tıklayarak aşağıdaki değişkenleri ekleyin:

#### 1. SUPABASE_URL
- **Variable name:** `SUPABASE_URL`
- **Value:** `https://xxxxx.supabase.co` (kendi URL'niz)
- **Encrypt** kutusunu işaretlemeyin

#### 2. SUPABASE_SERVICE_ROLE_KEY
- **Variable name:** `SUPABASE_SERVICE_ROLE_KEY`
- **Value:** `eyJhbGc...` (service role key)
- **Encrypt** kutusunu ✅ işaretleyin

#### 3. MERCHANT_ID (Opsiyonel)
- **Variable name:** `MERCHANT_ID`
- **Value:** PayTR Merchant ID
- **Encrypt** kutusunu işaretlemeyin

#### 4. MERCHANT_KEY (Opsiyonel)
- **Variable name:** `MERCHANT_KEY`
- **Value:** PayTR Merchant Key
- **Encrypt** kutusunu ✅ işaretleyin

#### 5. MERCHANT_SALT (Opsiyonel)
- **Variable name:** `MERCHANT_SALT`
- **Value:** PayTR Merchant Salt
- **Encrypt** kutusunu ✅ işaretleyin

### Adım 3: Kaydet
**"Save"** butonuna tıklayın

---

## 🧪 Test ve Doğrulama

### Adım 1: Worker URL'ini Kopyala
1. Worker sayfasında URL'yi bulun:
   ```
   https://pigeonpedigre-paytr-refund.YOUR-SUBDOMAIN.workers.dev
   ```
2. Bu URL'yi kopyalayın

### Adım 2: Basit Test
1. Tarayıcınızda yeni sekme açın
2. Worker URL'sine gidin
3. "Method not allowed" mesajı görmelisiniz (✅ Bu normal)

### Adım 3: Postman veya cURL ile Test
```bash
curl -X POST https://pigeonpedigre-paytr-refund.YOUR-SUBDOMAIN.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test","merchant_oid":"test"}'
```

Beklenen yanıt:
```json
{
  "success": false,
  "error": "Ödeme kaydı bulunamadı"
}
```

---

## 🔗 Frontend Entegrasyonu

### index.html Dosyasını Güncelle

1. `index.html` dosyasını bir text editörde açın
2. **Ctrl+F** ile arama yapın: `REFUND_WORKER_URL`
3. Bulduğunuz satırı güncelleyin:

```javascript
// ESKİ:
const REFUND_WORKER_URL = 'https://pigeonpedigre-refund.tamer-nem.workers.dev';

// YENİ: (Kendi worker URL'nizi yazın)
const REFUND_WORKER_URL = 'https://pigeonpedigre-paytr-refund.YOUR-SUBDOMAIN.workers.dev';
```

4. Dosyayı kaydedin

---

## ✅ Kontrol Listesi

Worker kurulumu tamamlandıktan sonra kontrol edin:

- [ ] Worker başarıyla oluşturuldu
- [ ] Kod yüklendi ve deploy edildi
- [ ] Environment variables eklendi
- [ ] Worker URL'si kopyalandı
- [ ] Frontend'de URL güncellendi
- [ ] Basit test yapıldı

---

## 🛠️ Sorun Giderme

### "Script not found" Hatası
- Kodu tam olarak kopyaladığınızdan emin olun
- Save and deploy'u unutmayın

### "Environment variable not found" Hatası
- Variables bölümünde tüm değişkenleri ekleyin
- Variable isimlerini büyük harfle yazın
- Save butonuna tıklamayı unutmayın

### CORS Hatası
- Worker kodunda CORS headers var mı kontrol edin
- Frontend URL'si doğru mu kontrol edin

### "Ödeme kaydı bulunamadı" Hatası
- Bu normal, gerçek bir user_id ve merchant_oid gerekli
- Supabase bağlantısını kontrol edin

---

## 📞 Destek İçin

### Worker Loglarını Görüntüleme
1. Worker sayfasında **"Logs"** sekmesine gidin
2. **"Begin log stream"** tıklayın
3. İade işlemi yapın ve logları izleyin

### Debug İpuçları
1. Browser console'da network sekmesini açın
2. İade butonuna tıklayın
3. Request ve response'u inceleyin

---

## 🎯 Sonraki Adımlar

1. **Test İşlemleri**
   - Gerçek kullanıcı ile test edin
   - 3 gün kuralını test edin
   - Hata senaryolarını test edin

2. **Production Hazırlığı**
   - CORS ayarlarını güncelleyin (sadece sitenizin domain'i)
   - Rate limiting ekleyin
   - Monitoring kurun

3. **Dokümantasyon**
   - Worker URL'sini kaydedin
   - Environment variables'ı güvenli saklayın
   - Test sonuçlarını dokümante edin

---

## 🔄 Güncelleme Yapmak İçin

1. Worker sayfasına gidin
2. **"Edit code"** tıklayın
3. Yeni kodu yapıştırın
4. **"Save and deploy"** tıklayın

---

*Manuel kurulum tamamlandı! 🎉*

**Not:** PayTR bilgileri olmadan da sistem çalışır, sadece veritabanı güncellemeleri yapılır.