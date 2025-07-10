-- =====================================================
-- PREMIUM SİSTEM KOMPLE KURULUM
-- =====================================================
-- Bu dosyayı Supabase SQL Editor'de çalıştırın
-- Tarih: 2025-07-10
-- =====================================================

-- 1. PROFILES TABLOSU GÜNCELLEMELERİ
-- Premium alanları ekle
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP WITH TIME ZONE;

-- Index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_profiles_premium 
ON profiles(is_premium, premium_expires_at);

-- 2. PAYMENT_TRACKING TABLOSU
-- PayTR ödemeleri için
CREATE TABLE IF NOT EXISTS payment_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tracking_code VARCHAR(20) UNIQUE NOT NULL,
  merchant_oid TEXT UNIQUE,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  paytr_hash TEXT,
  payment_type TEXT,
  paid_amount DECIMAL(10,2),
  payment_date TIMESTAMP WITH TIME ZONE,
  failed_reason TEXT,
  failed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  paytr_notification_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_tracking_user_id 
ON payment_tracking(user_id);

CREATE INDEX IF NOT EXISTS idx_payment_tracking_merchant_oid 
ON payment_tracking(merchant_oid);

CREATE INDEX IF NOT EXISTS idx_payment_tracking_status 
ON payment_tracking(status);

CREATE INDEX IF NOT EXISTS idx_payment_tracking_tracking_code 
ON payment_tracking(tracking_code);

-- 3. RLS (ROW LEVEL SECURITY) AYARLARI
-- RLS'i aktif et
ALTER TABLE payment_tracking ENABLE ROW LEVEL SECURITY;

-- Mevcut policies'leri temizle (varsa)
DROP POLICY IF EXISTS "service_role_all_access" ON payment_tracking;
DROP POLICY IF EXISTS "users_view_own_payments" ON payment_tracking;
DROP POLICY IF EXISTS "users_insert_own_payments" ON payment_tracking;

-- Service role için full access
CREATE POLICY "service_role_all_access" ON payment_tracking
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Kullanıcılar kendi ödemelerini görsün
CREATE POLICY "users_view_own_payments" ON payment_tracking
FOR SELECT 
USING (auth.uid() = user_id);

-- Kullanıcılar kendi ödemelerini oluştursun
CREATE POLICY "users_insert_own_payments" ON payment_tracking
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. UPDATED_AT TRİGGER
-- Otomatik güncelleme zamanı
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger oluştur
DROP TRIGGER IF EXISTS update_payment_tracking_updated_at ON payment_tracking;
CREATE TRIGGER update_payment_tracking_updated_at 
BEFORE UPDATE ON payment_tracking
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- 5. KONTROL SORGUSU
-- Tablonun doğru oluşturulduğunu kontrol et
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'payment_tracking'
ORDER BY ordinal_position;

-- 6. PROFILES TABLOSU KONTROL
-- Premium alanlarının eklendiğini kontrol et
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name IN ('is_premium', 'premium_expires_at');

-- =====================================================
-- KURULUM TAMAMLANDI
-- =====================================================
-- NOT: Bu script'i çalıştırdıktan sonra:
-- 1. Cloudflare Workers'ı deploy edin
-- 2. PayTR panel ayarlarını yapın
-- 3. Test ödemesi ile kontrol edin
-- =====================================================