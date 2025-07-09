-- PayTR Migration Script
-- Bu script payment_tracking tablosunu PayTR için günceller

-- 1. PayTR için gerekli kolonları ekle
ALTER TABLE payment_tracking 
ADD COLUMN IF NOT EXISTS merchant_oid TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS paytr_hash TEXT,
ADD COLUMN IF NOT EXISTS payment_type TEXT,
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failed_reason TEXT,
ADD COLUMN IF NOT EXISTS failed_at TIMESTAMP WITH TIME ZONE;

-- 2. merchant_oid için index oluştur (performans için)
CREATE INDEX IF NOT EXISTS idx_payment_tracking_merchant_oid ON payment_tracking(merchant_oid);

-- 3. Status değerlerini güncelle (PayTR ile uyumlu hale getir)
-- Mevcut değerler: pending, verified, failed
-- PayTR değerleri: pending, paid, failed
UPDATE payment_tracking 
SET status = 'paid' 
WHERE status = 'verified';

-- 4. RLS politikalarını güncelle (service role için)
-- Service role her şeyi yapabilmeli
CREATE POLICY "service_role_all_access" ON payment_tracking
FOR ALL USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 5. Kullanıcılar kendi ödeme kayıtlarını görebilmeli
CREATE POLICY "users_view_own_payments" ON payment_tracking
FOR SELECT USING (auth.uid() = user_id);

-- 6. İstatistikler için view oluştur (opsiyonel)
CREATE OR REPLACE VIEW payment_stats AS
SELECT 
    COUNT(*) as total_payments,
    COUNT(CASE WHEN status = 'paid' THEN 1 END) as successful_payments,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
    SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_revenue
FROM payment_tracking
WHERE merchant_oid IS NOT NULL;

-- 7. Premium aktivasyonu için trigger (opsiyonel)
-- Ödeme başarılı olduğunda otomatik premium yap
CREATE OR REPLACE FUNCTION activate_premium_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'paid' AND OLD.status = 'pending' THEN
        UPDATE profiles 
        SET 
            is_premium = true,
            premium_expires_at = NOW() + INTERVAL '1 year',
            subscription_plan = 'premium',
            pigeon_limit = 9999,
            updated_at = NOW()
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı oluştur
DROP TRIGGER IF EXISTS trigger_activate_premium ON payment_tracking;
CREATE TRIGGER trigger_activate_premium
AFTER UPDATE ON payment_tracking
FOR EACH ROW
EXECUTE FUNCTION activate_premium_on_payment();

-- Migration tamamlandı
-- NOT: Bu script'i çalıştırmadan önce veritabanınızı yedekleyin!