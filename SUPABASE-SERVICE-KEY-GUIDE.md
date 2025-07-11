# 🔑 Supabase Service Role Key Alma Rehberi

## 📋 Adım Adım Service Role Key Bulma

### 1️⃣ Supabase Dashboard'a Giriş
1. [https://app.supabase.com](https://app.supabase.com) adresine gidin
2. Email ve şifrenizle giriş yapın
3. Projenizi seçin

### 2️⃣ Settings Menüsü
1. Sol menüde en altta **"Settings"** (Ayarlar) simgesine tıklayın
   ```
   ⚙️ Settings
   ```

### 3️⃣ API Bölümü
1. Settings altında **"API"** seçeneğine tıklayın
2. Sağ tarafta API ayarları açılacak

### 4️⃣ Service Role Key'i Bulma
API sayfasında aşağıdaki bölümleri göreceksiniz:

```
Project URL
• https://xxxxx.supabase.co

Project API keys
• anon (public)   eyJhbGc... [Reveal]
• service_role    eyJhbGc... [Reveal]  ⚠️ Bu key'i kullanın!
```

### 5️⃣ Key'i Kopyalama
1. **service_role** satırındaki **"Reveal"** butonuna tıklayın
2. Açılan key'i kopyalayın (çok uzun bir string)
3. Bu key'i güvenli bir yere kaydedin

---

## ⚠️ Güvenlik Uyarıları

### ❌ YAPMAMANIZ GEREKENLER:
- Service role key'i frontend kodunda kullanmayın
- GitHub'a yüklerken .env dosyasına koyun
- Kimseyle paylaşmayın
- Public repoda görünür yapmayın

### ✅ YAPMAMIZ GEREKENLER:
- Sadece backend/server tarafında kullanın
- Cloudflare Worker environment variable olarak saklayın
- Encrypt edilmiş olarak kaydedin

---

## 🔍 Doğru Key'i Seçtiğinizden Emin Olun

### YANLIŞ ❌
```
anon (public) key: 
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ...
```
Bu key frontend'de kullanılır, limited erişime sahiptir.

### DOĞRU ✅
```
service_role key:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUifQ...
```
Bu key backend'de kullanılır, full erişime sahiptir.

---

## 🎯 Cloudflare Worker'da Kullanım

Environment Variables'a eklerken:
1. Variable name: `SUPABASE_SERVICE_ROLE_KEY`
2. Value: Kopyaladığınız service role key
3. **Encrypt** kutusunu ✅ işaretleyin

---

## 🆘 Sorun mu Yaşıyorsunuz?

### Key Bulamıyorum
- Proje admin yetkileriniz var mı kontrol edin
- Doğru projeyi seçtiğinizden emin olun

### Key Çalışmıyor
- service_role key'i kopyaladığınızdan emin olun (anon değil)
- Kopyalarken başında/sonunda boşluk olmadığından emin olun
- Environment variable ismini doğru yazdığınızdan emin olun

---

*Service role key güvenliğiniz için kritiktir. Lütfen dikkatli kullanın! 🔐*