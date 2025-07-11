# 📋 SQL Sorgu Düzeltmeleri - Kullanım Kılavuzu

## ❌ Hata Nedeni
```sql
ERROR: 42703: column "email" does not exist
```

**Sebep:** `profiles` tablosunda `email` alanı yok! Email bilgisi `auth.users` tablosunda tutuluyor.

## ✅ Çözüm
Tüm sorgular `auth.users` tablosu ile JOIN kullanacak şekilde güncellendi.

## 📝 Adım Adım Kullanım

### 1. İlk Önce User ID'yi Bulun
```sql
-- Email adresinden user_id bulma (7. sorgu)
SELECT 
    u.id as user_id,
    u.email,
    p.is_premium,
    p.premium_expires_at
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'kullanici@email.com';  -- Email'i değiştirin
```

### 2. Profil Bilgilerini Kontrol Edin
```sql
-- 1. sorguyu çalıştırın
-- Email'i değiştirmeyi unutmayın!
```

### 3. Payment Durumunu Kontrol Edin
```sql
-- 2. sorguyu çalıştırın
-- Bu sorguda JOIN yok çünkü payment_tracking'de email VAR
```

## 🧪 Test İçin Premium Yapma

1. **Önce user_id'yi bulun** (7. sorgu)
2. **Sonra 8. sorgudaki komutları kullanın:**

```sql
-- USER_ID'yi 7. sorgudan aldığınız değerle değiştirin
UPDATE profiles 
SET 
    is_premium = true,
    premium_expires_at = NOW() + INTERVAL '30 days'
WHERE id = 'buraya-user-id-yazin';

-- Test payment kaydı ekleyin
INSERT INTO payment_tracking (
    user_id,
    tracking_code,
    email,
    amount,
    currency,
    status,
    verified_at
) VALUES (
    'buraya-user-id-yazin',
    'TEST_' || substr(md5(random()::text), 1, 10),
    'kullanici@email.com',
    39.90,
    'TRY',
    'verified',
    NOW() - INTERVAL '1 day'
);
```

## 📊 Önemli Notlar

1. **profiles tablosunda email YOK**
2. **auth.users ile JOIN yapmalısınız**
3. **payment_tracking'de email VAR**
4. **Test için önce user_id bulun**

## 🚀 Hızlı Test

```sql
-- Tüm premium kullanıcıları listele
SELECT u.email, p.is_premium, p.premium_expires_at
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.is_premium = true;
```