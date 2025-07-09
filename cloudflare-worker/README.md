# PayTR Cloudflare Worker Deployment Talimatları

## Genel Bakış
Bu Cloudflare Worker, PayTR ödeme sistemi ile entegrasyon sağlar. PHP yerine JavaScript kullanarak PayTR API'sine istek gönderir ve ödeme token'ı alır.

## Deployment Adımları

### 1. Cloudflare Hesabı Hazırlığı
1. [Cloudflare Dashboard](https://dash.cloudflare.com) üzerinden giriş yapın
2. Sol menüden **Workers & Pages** seçeneğine tıklayın

### 2. Worker Oluşturma
1. **Create Application** butonuna tıklayın
2. **Create Worker** seçeneğini seçin
3. Worker adını `pigeonpedigre-paytr` olarak girin
4. **Deploy** butonuna tıklayın

### 3. Worker Kodunu Yükleme
1. Deploy edilen worker'ın sayfasında **Quick edit** butonuna tıklayın
2. Editördeki varsayılan kodu silin
3. `paytr-payment.js` dosyasındaki tüm kodu kopyalayıp yapıştırın
4. **Save and Deploy** butonuna tıklayın

### 4. Environment Variables (Gizli Bilgiler) Ekleme
1. Worker sayfasında **Settings** sekmesine gidin
2. **Variables** bölümünü bulun
3. **Add variable** butonuna tıklayarak aşağıdaki değişkenleri ekleyin:

#### Eklenecek Değişkenler:
- **MERCHANT_ID**: `593847` (Encrypt seçeneğini işaretleyin)
- **MERCHANT_KEY**: `GHFnc6n26sKMBr18` (Encrypt seçeneğini işaretleyin)
- **MERCHANT_SALT**: `k7177bzk3sRHrGT8` (Encrypt seçeneğini işaretleyin)

**ÖNEMLİ**: Her değişken için **Encrypt** kutucuğunu işaretleyin!

### 5. Worker URL'ini Alma
1. Worker'ın ana sayfasında URL'yi kopyalayın
   - Format: `https://pigeonpedigre-paytr.[your-subdomain].workers.dev`
2. Bu URL'yi not edin

### 6. Frontend Güncelleme
1. `index.html` dosyasını açın
2. Satır 5900'deki `WORKER_URL` değişkenini bulun:
   ```javascript
   const WORKER_URL = 'https://pigeonpedigre-paytr.YOUR-SUBDOMAIN.workers.dev';
   ```
3. `YOUR-SUBDOMAIN` kısmını kendi worker URL'inizdeki subdomain ile değiştirin

### 7. Test
1. Tarayıcıda sitenizi açın
2. Premium satın alma butonuna tıklayın
3. Console'da hata olmadığını kontrol edin
4. PayTR ödeme sayfasına yönlendirildiğinizi doğrulayın

## Sorun Giderme

### CORS Hatası
Eğer CORS hatası alırsanız:
1. Worker kodunda `corsHeaders` içindeki `Access-Control-Allow-Origin` değerini kontrol edin
2. `*` yerine spesifik domain kullanmayı deneyin: `https://pigeonpedigre.com`

### 405 Method Not Allowed
Worker'ın OPTIONS request'leri doğru handle ettiğinden emin olun.

### Payment Token Hatası
1. PayTR bilgilerinin doğru girildiğinden emin olun
2. Hash hesaplamasının doğru olduğunu kontrol edin
3. PayTR'ın döndürdüğü hata mesajını inceleyin

## Güvenlik Notları
- API anahtarlarını **asla** kod içinde plain text olarak bırakmayın
- Environment variables kullanarak hassas bilgileri koruyun
- Worker URL'ini sadece güvendiğiniz domainlerden çağırın

## PayTR Test Modu
Test yapmak için:
1. Worker kodunda `test_mode: '0'` değerini `test_mode: '1'` yapın
2. Test kartları ile ödeme deneyin
3. Production'a geçerken tekrar `'0'` yapın

## Destek
Sorun yaşarsanız:
- PayTR dokümantasyonu: https://www.paytr.com/dokuman
- Cloudflare Workers dokümantasyonu: https://developers.cloudflare.com/workers/