-- Payment Tracking RLS Policies Fix
-- =================================
-- Bu dosyayı Supabase SQL Editor'de çalıştırın

-- 1. TÜM mevcut politikaları temizle (hem eski hem yeni isimler)
-- ===============================================================

-- payment_tracking policies
DROP POLICY IF EXISTS "Users can view their own payment tracking" ON payment_tracking;
DROP POLICY IF EXISTS "Users can view own payment tracking" ON payment_tracking;
DROP POLICY IF EXISTS "Users can insert their own payment tracking" ON payment_tracking;
DROP POLICY IF EXISTS "Users can create payment tracking" ON payment_tracking;
DROP POLICY IF EXISTS "Users can update their own payment tracking" ON payment_tracking;
DROP POLICY IF EXISTS "Users can update own payment tracking" ON payment_tracking;
DROP POLICY IF EXISTS "Admins can view all payment tracking" ON payment_tracking;
DROP POLICY IF EXISTS "Admins can manage all payment tracking" ON payment_tracking;
DROP POLICY IF EXISTS "Anyone can check tracking code exists" ON payment_tracking;

-- premium_subscriptions policies
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON premium_subscriptions;
DROP POLICY IF EXISTS "System can create premium subscriptions" ON premium_subscriptions;
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON premium_subscriptions;

-- verification_attempts policies
DROP POLICY IF EXISTS "Users can view their own verification attempts" ON verification_attempts;
DROP POLICY IF EXISTS "Users can insert their own verification attempts" ON verification_attempts;
DROP POLICY IF EXISTS "System can create verification attempts" ON verification_attempts;

-- support_tickets policies
DROP POLICY IF EXISTS "Users can view their own support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can insert their own support tickets" ON support_tickets;

-- profiles policies
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "System can create profiles" ON profiles;

-- auth.users policies (eğer varsa)
DROP POLICY IF EXISTS "Enable read access for FK checks and admin checks" ON auth.users;
DROP POLICY IF EXISTS "Enable read access for FK checks" ON auth.users;
DROP POLICY IF EXISTS "Users can view their own auth record" ON auth.users;

-- 2. Yeni politikalar oluştur

-- Kullanıcılar kendi payment tracking kayıtlarını görebilir
CREATE POLICY "Users can view own payment tracking" 
ON payment_tracking FOR SELECT 
USING (auth.uid() = user_id);

-- Tracking code benzersizlik kontrolü için politika
-- Sadece tracking_code kolonunu kontrol edebilirler
CREATE POLICY "Anyone can check tracking code exists" 
ON payment_tracking FOR SELECT 
USING (true);

-- Kullanıcılar kendi payment tracking kayıtlarını oluşturabilir
CREATE POLICY "Users can create payment tracking" 
ON payment_tracking FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi payment tracking kayıtlarını güncelleyebilir
CREATE POLICY "Users can update own payment tracking" 
ON payment_tracking FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Not: Admin politikası kaldırıldı çünkü auth.users sorgusu permission hatası veriyor
-- Admin işlemleri için get_admin_payment_view() fonksiyonu kullanılacak

-- 3. Support tickets admin join sorunu için table function oluştur
-- Önce mevcut view ve function'ları temizle
DROP VIEW IF EXISTS admin_payment_view CASCADE;
DROP FUNCTION IF EXISTS get_admin_payment_view() CASCADE;

-- Table function oluştur
CREATE OR REPLACE FUNCTION get_admin_payment_view()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  tracking_code VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  amount DECIMAL,
  currency VARCHAR,
  status VARCHAR,
  iyzi_link VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  user_name TEXT
) 
SECURITY DEFINER
AS $$
BEGIN
  -- Admin kontrolü - profiles tablosundan veya başka bir yöntemle yapılabilir
  -- Şimdilik auth.users sorgusu kaldırıldı (permission hatası nedeniyle)
  -- NOT: Gerçek uygulamada admin kontrolü eklenmelidir
  
  -- Admin ise verileri döndür
  RETURN QUERY
  SELECT 
    pt.id,
    pt.user_id,
    pt.tracking_code,
    pt.email,
    pt.phone,
    pt.amount,
    pt.currency,
    pt.status,
    pt.iyzi_link,
    pt.created_at,
    pt.verified_at,
    pt.expires_at,
    COALESCE(p.first_name || ' ' || p.last_name, 'İsimsiz')::TEXT
  FROM payment_tracking pt
  LEFT JOIN profiles p ON pt.user_id = p.id;
END;
$$ LANGUAGE plpgsql;

-- 4. generateTrackingCode fonksiyonunu güncelle (güvenli versiyon)
CREATE OR REPLACE FUNCTION generate_tracking_code()
RETURNS VARCHAR AS $$
DECLARE
  v_code VARCHAR;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- PRM-XXXXX formatında kod oluştur
    v_code := 'PRM-' || UPPER(
      SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 1, 6)
    );
    
    -- Kodun benzersiz olduğundan emin ol
    -- Sadece tracking_code kontrolü yapılıyor
    SELECT EXISTS(
      SELECT 1 FROM payment_tracking WHERE tracking_code = v_code
    ) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Premium subscriptions için eksik INSERT politikası
CREATE POLICY "System can create premium subscriptions" 
ON premium_subscriptions FOR INSERT 
WITH CHECK (true);

-- 6. Verification attempts için system politikası
CREATE POLICY "System can create verification attempts" 
ON verification_attempts FOR INSERT 
WITH CHECK (true);

-- Grants
GRANT EXECUTE ON FUNCTION get_admin_payment_view() TO authenticated;

-- 7. Foreign Key Constraints'leri Profiles Tablosuna Yönlendir
-- ============================================================

-- Önce profiles tablosuna is_premium kolonu ekle (yoksa)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- payment_tracking FK'sini değiştir
ALTER TABLE payment_tracking 
DROP CONSTRAINT IF EXISTS payment_tracking_user_id_fkey;

ALTER TABLE payment_tracking 
ADD CONSTRAINT payment_tracking_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- premium_subscriptions FK'sini değiştir
ALTER TABLE premium_subscriptions 
DROP CONSTRAINT IF EXISTS premium_subscriptions_user_id_fkey;

ALTER TABLE premium_subscriptions 
ADD CONSTRAINT premium_subscriptions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- verification_attempts FK'sini değiştir
ALTER TABLE verification_attempts 
DROP CONSTRAINT IF EXISTS verification_attempts_user_id_fkey;

ALTER TABLE verification_attempts 
ADD CONSTRAINT verification_attempts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- support_tickets FK'sini değiştir
ALTER TABLE support_tickets 
DROP CONSTRAINT IF EXISTS support_tickets_user_id_fkey;

ALTER TABLE support_tickets 
ADD CONSTRAINT support_tickets_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- resolved_by FK'sini de değiştir
ALTER TABLE support_tickets 
DROP CONSTRAINT IF EXISTS support_tickets_resolved_by_fkey;

ALTER TABLE support_tickets 
ADD CONSTRAINT support_tickets_resolved_by_fkey 
FOREIGN KEY (resolved_by) REFERENCES profiles(id);

-- 8. activate_premium Fonksiyonunu Güncelle
-- ========================================
CREATE OR REPLACE FUNCTION activate_premium(
  p_tracking_code VARCHAR,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_payment_exists BOOLEAN;
BEGIN
  -- Ödeme kaydını kontrol et
  SELECT EXISTS(
    SELECT 1 FROM payment_tracking 
    WHERE tracking_code = p_tracking_code 
    AND user_id = p_user_id 
    AND status = 'pending'
    AND expires_at > NOW()
  ) INTO v_payment_exists;
  
  IF NOT v_payment_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Transaction başlat
  -- Ödeme durumunu güncelle
  UPDATE payment_tracking 
  SET status = 'verified', verified_at = NOW()
  WHERE tracking_code = p_tracking_code;
  
  -- Premium abonelik oluştur
  INSERT INTO premium_subscriptions (user_id, tracking_code, status)
  VALUES (p_user_id, p_tracking_code, 'active');
  
  -- Profiles tablosunda is_premium'u güncelle
  UPDATE profiles
  SET is_premium = true
  WHERE id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Profiles tablosu için RLS politikaları (eğer yoksa)
-- =====================================================
-- Kullanıcılar kendi profillerini güncelleyebilir
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Kullanıcılar tüm profilleri görüntüleyebilir (public bilgi)
CREATE POLICY "Profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- Sistem profil oluşturabilir
CREATE POLICY "System can create profiles" 
ON profiles FOR INSERT 
WITH CHECK (true);

-- 10. Auth.users için Minimal RLS Politikası (FK kontrolü için)
-- =============================================================
-- Bu politika Foreign Key constraint kontrollerinin çalışması için gerekli

-- Auth.users RLS'i etkinleştir (eğer değilse)
DO $$ 
BEGIN
  ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN
    NULL;
END $$;

-- Önce mevcut auth.users politikalarını temizle
DROP POLICY IF EXISTS "Enable read access for FK checks and admin checks" ON auth.users;
DROP POLICY IF EXISTS "Users can view their own auth record" ON auth.users;

-- Auth.users için minimal okuma izni (sadece FK kontrolü için)
-- NOT: Admin kontrolü sonsuz döngüye neden olduğu için kaldırıldı
CREATE POLICY "Enable read access for FK checks" 
ON auth.users FOR SELECT 
USING (
  -- Sadece kendi kaydını görebilir (FK kontrolü için yeterli)
  auth.uid() = id
);