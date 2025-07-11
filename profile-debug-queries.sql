-- Profil Sayfası Debug SQL Sorguları
-- ==================================

-- 1. Kullanıcının profil bilgilerini kontrol et
SELECT 
    id,
    email,
    first_name,
    last_name,
    is_premium,
    premium_expires_at,
    created_at,
    updated_at
FROM profiles
WHERE email = 'KULLANICI_EMAIL_BURAYA';  -- Email adresini değiştirin

-- 2. Payment tracking kayıtlarını kontrol et
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
    p.email
FROM premium_subscriptions ps
JOIN profiles p ON p.id = ps.user_id
WHERE p.email = 'KULLANICI_EMAIL_BURAYA';  -- Email adresini değiştirin

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
    p.email,
    p.is_premium,
    p.premium_expires_at,
    pt.tracking_code,
    pt.status as payment_status,
    pt.created_at as payment_date,
    pt.verified_at
FROM profiles p
LEFT JOIN payment_tracking pt ON pt.user_id = p.id
WHERE p.is_premium = true
ORDER BY p.email;

-- 7. Manuel premium üyelik ekleme (TEST İÇİN)
-- NOT: USER_ID'yi gerçek kullanıcı ID'si ile değiştirin
/*
UPDATE profiles 
SET 
    is_premium = true,
    premium_expires_at = NOW() + INTERVAL '30 days'
WHERE id = 'USER_ID_BURAYA';

-- Test payment kaydı ekleme
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