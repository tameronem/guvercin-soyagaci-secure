-- Fix Payment Status Consistency Between payment_tracking and profiles
-- This script updates payment records that have status='paid' to status='verified'
-- and adds verified_at timestamp for records where users are premium

-- First, let's check how many records need to be fixed
SELECT 
    pt.id,
    pt.merchant_oid,
    pt.user_id,
    pt.status,
    pt.verified_at,
    pt.payment_date,
    pt.created_at,
    p.is_premium,
    pt.email
FROM payment_tracking pt
INNER JOIN profiles p ON pt.user_id = p.id
WHERE 
    pt.status = 'paid' 
    AND pt.verified_at IS NULL
    AND p.is_premium = true
ORDER BY pt.created_at DESC;

-- Update payment_tracking records
-- Set status to 'verified' and add verified_at timestamp
UPDATE payment_tracking
SET 
    status = 'verified',
    verified_at = COALESCE(payment_date, created_at)
WHERE 
    status = 'paid' 
    AND verified_at IS NULL
    AND user_id IN (
        SELECT id FROM profiles WHERE is_premium = true
    );

-- Also update any 'pending' records where the user is already premium
-- This handles cases where notification wasn't received but payment was successful
UPDATE payment_tracking
SET 
    status = 'verified',
    verified_at = COALESCE(payment_date, created_at)
WHERE 
    status = 'pending' 
    AND verified_at IS NULL
    AND user_id IN (
        SELECT id FROM profiles WHERE is_premium = true
    )
    -- Only update if the payment is older than 10 minutes (to avoid updating very recent payments)
    AND created_at < NOW() - INTERVAL '10 minutes';

-- Verify the updates
SELECT 
    status, 
    COUNT(*) as count,
    COUNT(CASE WHEN verified_at IS NOT NULL THEN 1 END) as with_verified_at
FROM payment_tracking
WHERE user_id IN (SELECT id FROM profiles WHERE is_premium = true)
GROUP BY status
ORDER BY status;

-- Check for any remaining inconsistencies
SELECT 
    'Premium users with non-verified payments' as issue,
    COUNT(*) as count
FROM profiles p
INNER JOIN payment_tracking pt ON p.id = pt.user_id
WHERE 
    p.is_premium = true 
    AND pt.status NOT IN ('verified', 'refunded')
    AND pt.created_at > NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
    'Verified payments without verified_at date' as issue,
    COUNT(*) as count
FROM payment_tracking
WHERE 
    status = 'verified' 
    AND verified_at IS NULL;