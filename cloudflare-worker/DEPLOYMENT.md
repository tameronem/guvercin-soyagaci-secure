# Cloudflare Workers Deployment Talimatları

## 1. Payment Worker Deploy Etme

```bash
# Payment worker'ı deploy et
wrangler deploy

# Secret'ları ekle
wrangler secret put MERCHANT_ID
wrangler secret put MERCHANT_KEY
wrangler secret put MERCHANT_SALT
```

## 2. Notification Worker Deploy Etme

```bash
# Notification worker'ı deploy et
wrangler deploy --config wrangler-notification.toml

# Secret'ları ekle
wrangler secret put MERCHANT_KEY --config wrangler-notification.toml
wrangler secret put MERCHANT_SALT --config wrangler-notification.toml
wrangler secret put SUPABASE_URL --config wrangler-notification.toml
wrangler secret put SUPABASE_SERVICE_KEY --config wrangler-notification.toml
```

## 3. Notification URL'yi Güncelleme

Deploy ettikten sonra notification worker'ın URL'sini alın ve `paytr-payment.js` dosyasındaki notification URL'yi güncelleyin:

```javascript
const merchant_notify_url = 'https://pigeonpedigre-paytr-notification.YOUR-SUBDOMAIN.workers.dev';
```

Sonra payment worker'ı tekrar deploy edin:
```bash
wrangler deploy
```

## 4. PayTR Panel Ayarları

PayTR mağaza panelinizde:
- Bildirim URL'si ayarlarına gidin
- Notification worker URL'nizi ekleyin
- Test ödemesi yaparak doğrulayın

## 5. Supabase Service Key Alma

1. Supabase Dashboard'a gidin
2. Settings > API bölümüne gidin
3. "service_role" key'i kopyalayın (anon key değil!)
4. Bu key'i SUPABASE_SERVICE_KEY olarak ekleyin

## Önemli Notlar

- Production'da CORS ayarlarını güncelleyin (sadece pigeonpedigre.com)
- PayTR IP kontrolünü production'da aktif edin
- Test mode'u production'da kapatın (test_mode = '0')
- Notification URL'nin her zaman erişilebilir olduğundan emin olun