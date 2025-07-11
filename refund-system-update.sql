-- İade Sistemi İçin Veritabanı Güncellemeleri
-- =========================================

-- payment_tracking tablosuna refunded_at alanı ekle
ALTER TABLE payment_tracking 
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE;

-- İade durumu için yeni index
CREATE INDEX IF NOT EXISTS idx_payment_tracking_refunded 
ON payment_tracking(status, refunded_at) 
WHERE status = 'refunded';

-- İade edilen ödemeleri görüntülemek için view
CREATE OR REPLACE VIEW refunded_payments AS
SELECT 
    pt.id,
    pt.user_id,
    pt.tracking_code,
    pt.email,
    pt.amount,
    pt.currency,
    pt.verified_at,
    pt.refunded_at,
    pt.refunded_at - pt.verified_at as refund_duration,
    p.first_name,
    p.last_name,
    p.is_premium,
    ps.status as subscription_status
FROM payment_tracking pt
LEFT JOIN profiles p ON p.id = pt.user_id
LEFT JOIN premium_subscriptions ps ON ps.tracking_code = pt.tracking_code
WHERE pt.status = 'refunded'
ORDER BY pt.refunded_at DESC;

-- İade istatistikleri için view
CREATE OR REPLACE VIEW refund_statistics AS
SELECT 
    COUNT(*) as total_refunds,
    SUM(amount) as total_refunded_amount,
    AVG(EXTRACT(EPOCH FROM (refunded_at - verified_at)) / 86400)::numeric(10,2) as avg_days_to_refund,
    COUNT(CASE WHEN EXTRACT(EPOCH FROM (refunded_at - verified_at)) / 86400 <= 3 THEN 1 END) as refunds_within_3_days,
    COUNT(CASE WHEN EXTRACT(EPOCH FROM (refunded_at - verified_at)) / 86400 > 3 THEN 1 END) as refunds_after_3_days
FROM payment_tracking
WHERE status = 'refunded';

-- Kullanıcı iade geçmişi fonksiyonu
CREATE OR REPLACE FUNCTION get_user_refund_history(p_user_id UUID)
RETURNS TABLE (
    tracking_code VARCHAR(20),
    amount DECIMAL(10,2),
    verified_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    days_until_refund NUMERIC(10,2),
    refund_reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pt.tracking_code,
        pt.amount,
        pt.verified_at,
        pt.refunded_at,
        EXTRACT(EPOCH FROM (pt.refunded_at - pt.verified_at)) / 86400 as days_until_refund,
        st.description as refund_reason
    FROM payment_tracking pt
    LEFT JOIN support_tickets st ON st.tracking_code = pt.tracking_code 
        AND st.ticket_type = 'refund_request'
    WHERE pt.user_id = p_user_id 
        AND pt.status = 'refunded'
    ORDER BY pt.refunded_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for views
GRANT SELECT ON refunded_payments TO authenticated;
GRANT SELECT ON refund_statistics TO authenticated;