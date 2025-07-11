-- Profil Sayfası Debug SQL Sorguları
-- ==================================
-- NOT: profiles tablosunda email alanı YOK! auth.users tablosu ile JOIN gerekli.

-- 1. Kullanıcının profil bilgilerini kontrol et
SELECT 
    p.id,
    u.email,
    p.first_name,
    p.last_name,
    p.is_premium,
    p.premium_expires_at,
    p.created_at,
    p.updated_at
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'KULLANICI_EMAIL_BURAYA';  -- Email adresini değiştirin

-- 2. Payment tracking kayıtlarını kontrol et
-- NOT: payment_tracking tablosunda email VAR, JOIN gerekmiyor
SELECT 
    id,
    user_id,
    tracking_code,
    email,
    amount,
    currency,
    status,
    created_at,
    verified_at,
    refunded_at
FROM payment_tracking
WHERE email = 'KULLANICI_EMAIL_BURAYA'  -- Email adresini değiştirin
ORDER BY created_at DESC;

-- 3. Premium subscription durumunu kontrol et
SELECT 
    ps.*,
    u.email
FROM premium_subscriptions ps
JOIN profiles p ON p.id = ps.user_id
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'KULLANICI_EMAIL_BURAYA';  -- Email adresini değiştirin

-- 4. Tüm payment status değerlerini görüntüle
SELECT DISTINCT status, COUNT(*) as count
FROM payment_tracking
GROUP BY status;

-- 5. Son 30 günün ödemelerini listele
SELECT 
    pt.tracking_code,
    pt.email,
    pt.amount,
    pt.status,
    pt.created_at,
    pt.verified_at,
    p.is_premium,
    p.premium_expires_at
FROM payment_tracking pt
LEFT JOIN profiles p ON p.id = pt.user_id
WHERE pt.created_at > NOW() - INTERVAL '30 days'
ORDER BY pt.created_at DESC;

-- 6. Premium kullanıcıların ödeme durumunu kontrol et
SELECT 
    p.id,
    u.email,
    p.is_premium,
    p.premium_expires_at,
    pt.tracking_code,
    pt.status as payment_status,
    pt.created_at as payment_date,
    pt.verified_at
FROM profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN payment_tracking pt ON pt.user_id = p.id
WHERE p.is_premium = true
ORDER BY u.email;

-- 7. User ID'yi email'den bulmak için
SELECT 
    u.id as user_id,
    u.email,
    p.is_premium,
    p.premium_expires_at
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'KULLANICI_EMAIL_BURAYA';

-- 8. Manuel premium üyelik ekleme (TEST İÇİN)
-- NOT: Önce yukarıdaki 7. sorgudan USER_ID'yi alın
/*
-- Önce user_id'yi bulun (7. sorguyu çalıştırın)

-- Profiles tablosunu güncelleyin
UPDATE profiles 
SET 
    is_premium = true,
    premium_expires_at = NOW() + INTERVAL '30 days'
WHERE id = 'USER_ID_BURAYA';

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
    'USER_ID_BURAYA',
    'TEST_' || substr(md5(random()::text), 1, 10),
    'KULLANICI_EMAIL_BURAYA',
    39.90,
    'TRY',
    'verified',
    NOW() - INTERVAL '1 day'  -- 1 gün önce ödeme yapılmış gibi
);
*/