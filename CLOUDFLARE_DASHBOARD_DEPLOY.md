# Cloudflare Dashboard ile Manuel Worker Deploy Rehberi

## Genel Bilgiler
Bu rehber, Cloudflare Dashboard'u kullanarak PayTR entegrasyonu için gerekli 2 Worker'ı manuel olarak deploy etmenizi sağlayacaktır.

## Bölüm 1: Payment Worker Deploy Etme

### Adım 1: Cloudflare Dashboard'a Giriş
1. https://dash.cloudflare.com adresine gidin
2. Email ve şifrenizi girerek login olun
3. Ana dashboard'da hesabınızı göreceksiniz

### Adım 2: Workers & Pages Bölümüne Gitme
1. Sol menüde **"Workers & Pages"** sekmesine tıklayın
2. Eğer göremiyorsanız, üst menüden **"Workers"** seçeneğini arayın

### Adım 3: Yeni Worker Oluşturma
1. **"Create application"** mavi butonuna tıklayın
2. **"Create Worker"** seçeneğini seçin
3. Worker adı olarak şunu girin: `pigeonpedigre-paytr`
   - Not: Bu isim benzersiz olmalı, eğer alınmışsa sonuna rakam ekleyin
4. **"Deploy"** butonuna tıklayın

### Adım 4: Worker Kodunu Ekleme
1. Deploy tamamlandıktan sonra **"Edit code"** butonuna tıklayın
2. Açılan kod editöründe varsayılan kodu silin
3. `cloudflare-worker/paytr-payment.js` dosyasındaki tüm kodu kopyalayın
4. Editöre yapıştırın
5. Sağ üstteki **"Save and deploy"** butonuna tıklayın

### Adım 5: Payment Worker URL'sini Not Etme
1. Deploy tamamlandıktan sonra Worker URL'niz şu formatta olacak:
   ```
   https://pigeonpedigre-paytr.YOUR-SUBDOMAIN.workers.dev
   ```
2. Bu URL'yi not edin, daha sonra kullanacağız

## Bölüm 2: Notification Worker Deploy Etme

### Adım 1: İkinci Worker Oluşturma
1. Workers & Pages ana sayfasına dönün
2. Tekrar **"Create application"** butonuna tıklayın
3. **"Create Worker"** seçeneğini seçin
4. Worker adı olarak şunu girin: `pigeonpedigre-paytr-notification`
5. **"Deploy"** butonuna tıklayın

### Adım 2: Notification Worker Kodunu Ekleme
1. **"Edit code"** butonuna tıklayın
2. Varsayılan kodu silin
3. `cloudflare-worker/paytr-notification.js` dosyasındaki tüm kodu kopyalayın
4. Editöre yapıştırın
5. **"Save and deploy"** butonuna tıklayın

### Adım 3: Notification Worker URL'sini Not Etme
1. Worker URL'niz şu formatta olacak:
   ```
   https://pigeonpedigre-paytr-notification.YOUR-SUBDOMAIN.workers.dev
   ```
2. Bu URL'yi not edin

## Bölüm 3: Environment Variables (Secret) Ekleme

### Payment Worker için Variables Ekleme

1. Workers & Pages sayfasında `pigeonpedigre-paytr` worker'ına tıklayın
2. Üst menüden **"Settings"** sekmesine geçin
3. Sol menüden **"Variables"** seçeneğini bulun
4. **"Add variable"** butonuna tıklayın

Her bir variable için şu adımları tekrarlayın:

#### MERCHANT_ID Ekleme:
- **Variable name**: `MERCHANT_ID`
- **Value**: PayTR'den aldığınız Merchant ID
- **"Encrypt"** kutusunu işaretleyin (güvenlik için)
- **"Save"** tıklayın

#### MERCHANT_KEY Ekleme:
- **Variable name**: `MERCHANT_KEY`
- **Value**: PayTR'den aldığınız Merchant Key
- **"Encrypt"** kutusunu işaretleyin
- **"Save"** tıklayın

#### MERCHANT_SALT Ekleme:
- **Variable name**: `MERCHANT_SALT`
- **Value**: PayTR'den aldığınız Merchant Salt
- **"Encrypt"** kutusunu işaretleyin
- **"Save"** tıklayın

### Notification Worker için Variables Ekleme

1. Workers & Pages sayfasında `pigeonpedigre-paytr-notification` worker'ına tıklayın
2. **"Settings"** > **"Variables"** yolunu izleyin
3. Şu variable'ları ekleyin:

#### MERCHANT_KEY:
- **Variable name**: `MERCHANT_KEY`
- **Value**: PayTR Merchant Key (aynı değer)
- **"Encrypt"** işaretleyin

#### MERCHANT_SALT:
- **Variable name**: `MERCHANT_SALT`
- **Value**: PayTR Merchant Salt (aynı değer)
- **"Encrypt"** işaretleyin

#### SUPABASE_URL:
- **Variable name**: `SUPABASE_URL`
- **Value**: Supabase projenizin URL'si (örn: https://xxxxx.supabase.co)
- **"Encrypt"** işaretlemeyin

#### SUPABASE_SERVICE_KEY:
- **Variable name**: `SUPABASE_SERVICE_KEY`
- **Value**: Supabase service role key'i
- **"Encrypt"** işaretleyin

## Bölüm 4: Payment Worker'da Notification URL Güncelleme

### Adım 1: Kodu Güncelleme
1. `pigeonpedigre-paytr` worker'ına gidin
2. **"Edit code"** butonuna tıklayın
3. Kod içinde şu satırı bulun (37. satır civarı):
   ```javascript
   const merchant_notify_url = 'https://pigeonpedigre-paytr-notification.your-subdomain.workers.dev';
   ```
4. `your-subdomain` kısmını kendi subdomain'inizle değiştirin
5. Örnek:
   ```javascript
   const merchant_notify_url = 'https://pigeonpedigre-paytr-notification.tamer-nem.workers.dev';
   ```
6. **"Save and deploy"** tıklayın

## Bölüm 5: Test ve Doğrulama

### Worker'ları Test Etme

#### Payment Worker Testi:
1. Worker URL'nize gidin
2. "Method not allowed" hatası görmelisiniz (normal, çünkü POST bekliyoruz)

#### Notification Worker Testi:
1. Worker URL'nize gidin
2. "Method not allowed" hatası görmelisiniz (normal)

### Real-time Logs Kontrolü
1. Her worker için Settings > Logs bölümüne gidin
2. **"Begin log stream"** butonuna tıklayın
3. Test yaparken hataları buradan görebilirsiniz

## Bölüm 6: Frontend Güncelleme

`js/paytr-integration.js` dosyasında Worker URL'nizi güncellemeyi unutmayın:

```javascript
const response = await fetch('https://pigeonpedigre-paytr.YOUR-SUBDOMAIN.workers.dev', {
```

## Önemli Notlar

### Güvenlik Kontrolleri:
1. ✅ Tüm secret'ların "Encrypt" ile şifrelendiğinden emin olun
2. ✅ Supabase service key'in doğru olduğunu kontrol edin
3. ✅ PayTR bilgilerinin doğru girildiğini kontrol edin

### PayTR Panel Ayarları:
1. PayTR mağaza panelinize girin
2. Ayarlar > Bildirim URL'si bölümüne gidin
3. Notification Worker URL'nizi ekleyin:
   ```
   https://pigeonpedigre-paytr-notification.YOUR-SUBDOMAIN.workers.dev
   ```

### Production Öncesi:
1. Test mode'u kapatmayı unutmayın (`test_mode = '0'`)
2. CORS ayarlarını sadece sitenize izin verecek şekilde güncelleyin
3. IP kontrolünü aktif edin (notification worker'da)

## Sorun Giderme

### "Internal Server Error" Hatası:
- Variables doğru eklendi mi kontrol edin
- Kod kopyalarken eksik kısım kalmış olabilir

### "Bad Gateway" Hatası:
- Worker'ın deploy olduğundan emin olun
- Save and deploy yaptınız mı?

### Variables Görünmüyor:
- Save yaptıktan sonra sayfayı yenileyin
- Settings > Variables tekrar kontrol edin

## Destek
Herhangi bir sorunla karşılaşırsanız:
1. Worker logs'larını kontrol edin
2. Browser console'da hata var mı bakın
3. PayTR destek ekibiyle iletişime geçin