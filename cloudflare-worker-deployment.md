# Cloudflare Worker Deployment Kılavuzu

## 1. Cloudflare Dashboard'a Giriş
- https://dash.cloudflare.com adresine gidin
- Hesabınıza giriş yapın

## 2. Worker Oluşturma
1. Sol menüden **Workers & Pages** seçin
2. **Create Application** butonuna tıklayın
3. **Create Worker** seçin
4. Worker adı: `pigeonpedigre-refund` (tam bu şekilde yazın)
5. **Deploy** butonuna tıklayın

## 3. Worker Kodunu Yükleme
1. Oluşturulan Worker'ın üzerine tıklayın
2. **Quick edit** butonuna basın
3. Açılan editörde var olan kodu tamamen silin
4. `cloudflare-worker/paytr-refund.js` dosyasının içeriğini kopyalayıp yapıştırın
   - Alternatif: Eğer hata alırsanız `cloudflare-worker/paytr-refund-module.js` dosyasını deneyin
5. **Save and Deploy** butonuna tıklayın

## 4. Environment Variables (Çevre Değişkenleri) Ekleme
1. Worker sayfasında **Settings** sekmesine gidin
2. **Variables** bölümünü bulun
3. **Add variable** butonuna tıklayarak şu değişkenleri ekleyin:

   | Variable Name | Value |
   |--------------|--------|
   | SUPABASE_URL | https://bgdzjhpfbpmawhxfqcdv.supabase.co |
   | SUPABASE_SERVICE_ROLE_KEY | [Supabase service role key'inizi buraya girin] |

   Not: Service role key'i Supabase Dashboard > Settings > API bölümünden alabilirsiniz.

4. **Save** butonuna tıklayın

## 5. Worker URL'ini Kontrol Etme
- Worker deploy edildikten sonra size bir URL verilecek
- URL formatı: `https://pigeonpedigre-refund.[hesap-subdomain].workers.dev`
- Örnek: `https://pigeonpedigre-refund.tamer-nem.workers.dev`

## 6. Frontend Güncelleme (Gerekirse)
Eğer Worker URL'iniz yukarıdaki örnekten farklıysa:

1. `index.html` dosyasını açın
2. 5150. satırdaki `REFUND_WORKER_URL` değişkenini bulun
3. URL'yi kendi Worker URL'iniz ile değiştirin

## 7. Test Etme
1. Browser'da Network sekmesini açın
2. Profil sayfasında iade butonuna tıklayın
3. Network'te OPTIONS ve POST isteklerinin başarılı olduğunu kontrol edin

## Sorun Giderme

### 404 Hatası Alıyorsanız:
1. Worker'ın gerçekten deploy edildiğini kontrol edin:
   - Workers & Pages sayfasında Worker'ınızı görüyor musunuz?
   - Worker üzerine tıklayıp "Deployments" sekmesinde aktif deployment var mı?

2. Worker URL'ini doğrulayın:
   - Worker sayfasında sağ üstte görünen URL'yi kopyalayın
   - Bu URL `index.html` dosyasındaki URL ile aynı mı?

3. Test sayfasını kullanın:
   - `test-worker.html` dosyasını browser'da açın
   - Test butonuna tıklayın
   - Console'da detaylı hata mesajlarını kontrol edin

4. Worker format sorunu olabilir:
   - Eğer `paytr-refund.js` çalışmıyorsa
   - `paytr-refund-module.js` dosyasını deneyin

5. Subdomain kontrolü:
   - URL'deki subdomain kısmı (`tamer-nem`) sizin Cloudflare hesabınıza ait mi?
   - Farklıysa URL'yi güncellemeniz gerekir

### CORS Hatası Alıyorsanız:
- Worker kodunun en son versiyonu kullandığınızdan emin olun
- Environment variables'ların doğru eklendiğinden emin olun

### 500 Hatası Alıyorsanız:
- Supabase credentials'ların doğru olduğundan emin olun
- Worker logs'larını kontrol edin (Workers & Pages > Logs)