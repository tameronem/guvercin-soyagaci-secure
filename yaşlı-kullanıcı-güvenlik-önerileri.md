# YAŞLI KULLANICILAR İÇİN GÜVENLİK ÖNERİLERİ

## Email Doğrulaması Yerine Alternatifler

### 1. **TELEFON NUMARASI DOĞRULAMA (İleride eklenebilir)**
- Yaşlı kullanıcılar SMS'i daha kolay kullanır
- WhatsApp doğrulama entegrasyonu
- Telefon ile kayıt seçeneği

### 2. **BASİT CAPTCHA**
- Robot kontrolü için basit matematik soruları
- "3 + 5 kaçtır?" gibi
- Resimli doğrulama yerine metin bazlı

### 3. **KOLAY ŞİFRE KURTARMA**
- Güvenlik soruları:
  - "İlk güvercinizin adı?"
  - "Doğum yeriniz?"
  - "Anne kızlık soyadı?"
- Telefon ile şifre sıfırlama

### 4. **HESAP GÜVENLİĞİ**
- Şüpheli giriş bildirimleri
- Aynı anda tek oturum sınırı
- IP bazlı kontroller

### 5. **KULLANICI EĞİTİMİ**
- Basit güvenlik rehberi
- Video anlatımlar
- Telefon desteği

## Kod Önerileri

### Basit Matematik Captcha:
```javascript
function generateSimpleCaptcha() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const answer = num1 + num2;
    
    return {
        question: `${num1} + ${num2} = ?`,
        answer: answer
    };
}
```

### Güvenlik Soruları:
```javascript
const securityQuestions = [
    "İlk güvercinizin adı neydi?",
    "Hangi şehirde doğdunuz?",
    "İlk öğretmeninizin adı?",
    "En sevdiğiniz güvercin cinsi?",
    "Annenizin kızlık soyadı?"
];
```

### Yaşlı Dostu Hata Mesajları:
```javascript
const elderlyFriendlyMessages = {
    password_too_short: "Şifreniz en az 6 karakter olmalı. Örnek: guzel123",
    email_invalid: "Email adresinizi kontrol edin. Örnek: ahmet@gmail.com",
    login_failed: "Email veya şifre yanlış. Büyük/küçük harflere dikkat edin.",
    session_expired: "Güvenliğiniz için çıkış yapıldı. Lütfen tekrar giriş yapın."
};
```

## UI/UX Önerileri

### 1. **BÜYÜK BUTONLAR VE YAZILAR**
```css
.elderly-friendly-button {
    font-size: 20px;
    padding: 15px 30px;
    min-height: 60px;
}

.elderly-friendly-input {
    font-size: 18px;
    padding: 12px;
    min-height: 50px;
}
```

### 2. **YÜKSEK KONTRAST**
- Beyaz arka plan üzerinde siyah yazı
- Mavi linkler yerine altı çizili siyah
- Hata mesajları için büyük kırmızı yazı

### 3. **BASİT NAVİGASYON**
- Az menü öğesi
- Açık ve net isimler
- Her sayfada "Ana Sayfa" butonu

## Supabase Ayarları

### Authentication > Settings:
- ✅ Enable signup: Açık
- ❌ Enable email confirmations: Kapalı
- ❌ Enable email change confirmations: Kapalı
- ✅ Password min length: 6 (kolay hatırlanabilir)

### Email Templates (Türkçe ve Basit):
- Kısa ve net mesajlar
- Teknik terimler yok
- Büyük font kullanımı

## Veritabanı Güvenlik Önlemleri

### Rate Limiting:
```sql
-- Aynı IP'den dakikada max 5 kayıt
CREATE OR REPLACE FUNCTION check_registration_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Rate limit kontrolü
  IF (
    SELECT COUNT(*) 
    FROM auth.users 
    WHERE created_at > NOW() - INTERVAL '1 minute'
    AND raw_app_meta_data->>'ip_address' = NEW.raw_app_meta_data->>'ip_address'
  ) >= 5 THEN
    RAISE EXCEPTION 'Çok fazla kayıt denemesi. Lütfen biraz bekleyin.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Hesap Güvenliği:
```sql
-- Şüpheli aktivite logları
CREATE TABLE security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  event_type TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```