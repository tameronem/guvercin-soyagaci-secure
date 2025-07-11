-- Payment Tracking Kontrol Sorguları
-- ==================================

-- 1. Belirli bir kullanıcının payment kayıtlarını kontrol et
-- user_id'yi gerçek değerle değiştirin
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
WHERE user_id = 'USER_ID_BURAYA'
ORDER BY created_at DESC;

-- 2. Email ile payment kayıtlarını kontrol et
SELECT 
    id,
    user_id,
    tracking_code,
    email,
    amount,
    status,
    created_at,
    verified_at
FROM payment_tracking
WHERE email = 'KULLANICI_EMAIL_BURAYA'
ORDER BY created_at DESC;

-- 3. Tüm farklı status değerlerini listele
SELECT DISTINCT status, COUNT(*) as count
FROM payment_tracking
GROUP BY status
ORDER BY count DESC;

-- 4. Premium kullanıcılar ve payment durumları
SELECT 
    p.id as user_id,
    u.email,
    p.is_premium,
    p.premium_expires_at,
    pt.tracking_code,
    pt.status as payment_status,
    pt.created_at as payment_date
FROM profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN payment_tracking pt ON pt.user_id = p.id
WHERE p.is_premium = true
ORDER BY p.premium_expires_at DESC;

-- 5. Payment kaydı olmayan premium kullanıcılar
SELECT 
    p.id as user_id,
    u.email,
    p.is_premium,
    p.premium_expires_at,
    p.created_at as profile_created,
    p.updated_at as profile_updated
FROM profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN payment_tracking pt ON pt.user_id = p.id
WHERE p.is_premium = true 
AND pt.id IS NULL;

-- 6. NULL veya beklenmedik status değerli kayıtlar
SELECT 
    id,
    user_id,
    tracking_code,
    email,
    status,
    created_at
FROM payment_tracking
WHERE status IS NULL 
OR status NOT IN ('pending', 'verified', 'completed', 'success', 'paid', 'failed', 'refunded');

-- 7. Test: Payment kaydı eklemek için
-- user_id ve email'i değiştirin
/*
INSERT INTO payment_tracking (
    user_id,
    tracking_code,
    email,
    amount,
    currency,
    status,
    created_at,
    verified_at
) VALUES (
    'USER_ID_BURAYA',
    'TEST_' || substr(md5(random()::text), 1, 10),
    'KULLANICI_EMAIL_BURAYA',
    39.90,
    'TRY',
    'verified',  -- veya 'completed', 'success', 'paid'
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
);
*/