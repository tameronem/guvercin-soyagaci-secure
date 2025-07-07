-- Premium Üyelik Sistemi Tabloları
-- ================================

-- Ödeme takip tablosu
CREATE TABLE IF NOT EXISTS payment_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tracking_code VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, verified, failed, expired
  iyzi_link VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours'
);

-- Premium abonelikler tablosu
CREATE TABLE IF NOT EXISTS premium_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tracking_code VARCHAR(20) REFERENCES payment_tracking(tracking_code),
  status VARCHAR(50) DEFAULT 'active', -- active, expired, cancelled
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Doğrulama denemeleri tablosu
CREATE TABLE IF NOT EXISTS verification_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracking_code VARCHAR(20) REFERENCES payment_tracking(tracking_code),
  user_id UUID REFERENCES auth.users(id),
  attempt_type VARCHAR(50), -- auto, manual, admin
  input_email VARCHAR(255),
  input_phone VARCHAR(20),
  success BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Destek talepleri tablosu
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tracking_code VARCHAR(20),
  ticket_type VARCHAR(50) DEFAULT 'payment_verification',
  status VARCHAR(50) DEFAULT 'open', -- open, in_progress, resolved, closed
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  description TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_payment_tracking_user_id ON payment_tracking(user_id);
CREATE INDEX idx_payment_tracking_status ON payment_tracking(status);
CREATE INDEX idx_payment_tracking_code ON payment_tracking(tracking_code);
CREATE INDEX idx_premium_subscriptions_user_id ON premium_subscriptions(user_id);
CREATE INDEX idx_premium_subscriptions_status ON premium_subscriptions(status);
CREATE INDEX idx_verification_attempts_tracking_code ON verification_attempts(tracking_code);

-- Row Level Security (RLS)
ALTER TABLE payment_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Policies for payment_tracking
CREATE POLICY "Users can view their own payment tracking" ON payment_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment tracking" ON payment_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment tracking" ON payment_tracking
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies for premium_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON premium_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Policies for verification_attempts
CREATE POLICY "Users can view their own verification attempts" ON verification_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verification attempts" ON verification_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for support_tickets
CREATE POLICY "Users can view their own support tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own support tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin policies (admin_role kullanıcıları için)
CREATE POLICY "Admins can view all payment tracking" ON payment_tracking
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

CREATE POLICY "Admins can manage all subscriptions" ON premium_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

-- Functions
-- Premium aktivasyon fonksiyonu
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
  
  -- Kullanıcı meta bilgilerini güncelle
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || '{"is_premium": true}'::jsonb
  WHERE id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Premium durumu kontrol fonksiyonu
CREATE OR REPLACE FUNCTION check_premium_status(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM premium_subscriptions
    WHERE user_id = p_user_id
    AND status = 'active'
    AND end_date > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Takip kodu oluşturma fonksiyonu
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
    SELECT EXISTS(
      SELECT 1 FROM payment_tracking WHERE tracking_code = v_code
    ) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_premium_subscriptions_updated_at BEFORE UPDATE ON premium_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION activate_premium(VARCHAR, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_premium_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_tracking_code() TO authenticated;