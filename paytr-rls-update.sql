-- PayTR RLS Güncelleme Script
-- payment_tracking tablosuna kullanıcıların INSERT yapabilmesi için RLS politikası

-- 1. Önce mevcut politikaları kontrol et
-- DROP POLICY IF EXISTS "users_insert_own_payments" ON payment_tracking;

-- 2. Kullanıcılar kendi user_id'leri ile payment kaydı ekleyebilmeli
CREATE POLICY "users_insert_own_payments" ON payment_tracking
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Kullanıcılar kendi payment kayıtlarını güncelleyebilmeli (opsiyonel)
-- Bu genelde güvenlik açısından önerilmez, sadece service role yapmalı
-- CREATE POLICY "users_update_own_payments" ON payment_tracking
-- FOR UPDATE 
-- TO authenticated
-- USING (auth.uid() = user_id AND status = 'pending')
-- WITH CHECK (auth.uid() = user_id);

-- 4. Yedek mekanizma için: notification worker'ın user_id olmadan kayıt ekleyebilmesi
-- Service role zaten her şeyi yapabildiği için ekstra politika gerekmez

-- 5. payment_tracking tablosuna eksik kolonlar varsa ekle
ALTER TABLE payment_tracking 
ADD COLUMN IF NOT EXISTS paytr_notification_data JSONB,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 6. Eksik kayıtları bulmak için yardımcı view
CREATE OR REPLACE VIEW missing_user_payments AS
SELECT 
    merchant_oid,
    email,
    amount,
    status,
    created_at,
    paytr_notification_data,
    notes
FROM payment_tracking
WHERE user_id IS NULL
AND merchant_oid IS NOT NULL
ORDER BY created_at DESC;

-- 7. RLS'i etkinleştir (eğer kapalıysa)
ALTER TABLE payment_tracking ENABLE ROW LEVEL SECURITY;

-- NOT: Bu script'i Supabase SQL Editor'de çalıştırın
-- Önce SELECT pg_policies.* FROM pg_policies WHERE tablename = 'payment_tracking';
-- komutu ile mevcut politikaları kontrol edin