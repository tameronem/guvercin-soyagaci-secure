-- GÜVERCIN SOYAĞACI TAKİP SİSTEMİ - SUPABASE VERİTABANI ŞEMASI

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- KULLANICI PROFİLLERİ
-- =====================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'premium')),
  subscription_start DATE,
  subscription_end DATE,
  pigeon_limit INTEGER DEFAULT 5,
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- GÜVERCİNLER
-- =====================================================
CREATE TABLE pigeons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  band_number TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female')) NOT NULL,
  breed TEXT,
  birth_date DATE,
  father_id UUID REFERENCES pigeons(id) ON DELETE SET NULL,
  mother_id UUID REFERENCES pigeons(id) ON DELETE SET NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, band_number)
);

-- =====================================================
-- EŞLEŞTİRMELER
-- =====================================================
CREATE TABLE matings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  male_id UUID REFERENCES pigeons(id) ON DELETE CASCADE NOT NULL,
  female_id UUID REFERENCES pigeons(id) ON DELETE CASCADE NOT NULL,
  mating_date DATE NOT NULL,
  egg_laying_date DATE,
  expected_hatch_date DATE,
  hatched BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- YARIŞLAR
-- =====================================================
CREATE TABLE races (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  distance DECIMAL(10,2),
  participants INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- YARIŞ SONUÇLARI
-- =====================================================
CREATE TABLE race_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  race_id UUID REFERENCES races(id) ON DELETE CASCADE NOT NULL,
  pigeon_id UUID REFERENCES pigeons(id) ON DELETE CASCADE NOT NULL,
  position INTEGER,
  time TEXT,
  speed DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(race_id, pigeon_id)
);

-- =====================================================
-- SAĞLIK KAYITLARI
-- =====================================================
CREATE TABLE health_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pigeon_id UUID REFERENCES pigeons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  veterinarian TEXT,
  cost DECIMAL(10,2),
  next_due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PERFORMANS KAYITLARI
-- =====================================================
CREATE TABLE performance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pigeon_id UUID REFERENCES pigeons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  performance_type TEXT CHECK (performance_type IN ('tumbling', 'postal', 'butterfly', 'racing')) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  overall_score DECIMAL(3,1) CHECK (overall_score >= 0 AND overall_score <= 10),
  performance_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- İNDEKSLER
-- =====================================================
CREATE INDEX idx_pigeons_user_id ON pigeons(user_id);
CREATE INDEX idx_pigeons_father_id ON pigeons(father_id);
CREATE INDEX idx_pigeons_mother_id ON pigeons(mother_id);
CREATE INDEX idx_matings_user_id ON matings(user_id);
CREATE INDEX idx_matings_male_id ON matings(male_id);
CREATE INDEX idx_matings_female_id ON matings(female_id);
CREATE INDEX idx_races_user_id ON races(user_id);
CREATE INDEX idx_race_results_race_id ON race_results(race_id);
CREATE INDEX idx_race_results_pigeon_id ON race_results(pigeon_id);
CREATE INDEX idx_health_records_pigeon_id ON health_records(pigeon_id);
CREATE INDEX idx_health_records_user_id ON health_records(user_id);
CREATE INDEX idx_performance_records_pigeon_id ON performance_records(pigeon_id);
CREATE INDEX idx_performance_records_user_id ON performance_records(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Profiles tablosu için RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Pigeons tablosu için RLS
ALTER TABLE pigeons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pigeons" ON pigeons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pigeons" ON pigeons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pigeons" ON pigeons
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pigeons" ON pigeons
  FOR DELETE USING (auth.uid() = user_id);

-- Matings tablosu için RLS
ALTER TABLE matings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own matings" ON matings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own matings" ON matings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own matings" ON matings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own matings" ON matings
  FOR DELETE USING (auth.uid() = user_id);

-- Races tablosu için RLS
ALTER TABLE races ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own races" ON races
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own races" ON races
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own races" ON races
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own races" ON races
  FOR DELETE USING (auth.uid() = user_id);

-- Race Results tablosu için RLS
ALTER TABLE race_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own race results" ON race_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM races 
      WHERE races.id = race_results.race_id 
      AND races.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own race results" ON race_results
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM races 
      WHERE races.id = race_results.race_id 
      AND races.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own race results" ON race_results
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM races 
      WHERE races.id = race_results.race_id 
      AND races.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own race results" ON race_results
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM races 
      WHERE races.id = race_results.race_id 
      AND races.user_id = auth.uid()
    )
  );

-- Health Records tablosu için RLS
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health records" ON health_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health records" ON health_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health records" ON health_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health records" ON health_records
  FOR DELETE USING (auth.uid() = user_id);

-- Performance Records tablosu için RLS
ALTER TABLE performance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own performance records" ON performance_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own performance records" ON performance_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own performance records" ON performance_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own performance records" ON performance_records
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGER FONKSİYONLARI
-- =====================================================

-- Updated_at otomatik güncelleme için trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Profiles tablosu için trigger
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Pigeons tablosu için trigger
CREATE TRIGGER update_pigeons_updated_at BEFORE UPDATE ON pigeons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Matings tablosu için trigger
CREATE TRIGGER update_matings_updated_at BEFORE UPDATE ON matings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Races tablosu için trigger
CREATE TRIGGER update_races_updated_at BEFORE UPDATE ON races
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Health Records tablosu için trigger
CREATE TRIGGER update_health_records_updated_at BEFORE UPDATE ON health_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Performance Records tablosu için trigger
CREATE TRIGGER update_performance_records_updated_at BEFORE UPDATE ON performance_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- KULLANICI KAYIT SONRASI PROFİL OLUŞTURMA
-- =====================================================

-- Yeni kullanıcı kaydı sonrası otomatik profil oluşturma
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, subscription_plan, pigeon_limit)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    'free',
    5
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auth.users tablosuna trigger ekle
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- GÜVERCIN LİMİT KONTROLÜ
-- =====================================================

CREATE OR REPLACE FUNCTION check_pigeon_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_plan TEXT;
  user_limit INTEGER;
  current_count INTEGER;
BEGIN
  -- Kullanıcının planını ve limitini al
  SELECT subscription_plan, pigeon_limit INTO user_plan, user_limit
  FROM profiles
  WHERE id = NEW.user_id;

  -- Mevcut güvercin sayısını al
  SELECT COUNT(*) INTO current_count
  FROM pigeons
  WHERE user_id = NEW.user_id;

  -- Limit kontrolü
  IF current_count >= user_limit THEN
    RAISE EXCEPTION 'Güvercin limitinize ulaştınız. Plan yükseltmeyi düşünün.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Güvercin ekleme öncesi limit kontrolü
CREATE TRIGGER check_pigeon_limit_before_insert
  BEFORE INSERT ON pigeons
  FOR EACH ROW EXECUTE FUNCTION check_pigeon_limit();

-- =====================================================
-- GÖRÜNÜMLER (VIEWS)
-- =====================================================

-- Güvercin detaylı görünümü (anne-baba bilgileri ile)
CREATE OR REPLACE VIEW pigeon_details AS
SELECT 
  p.id,
  p.user_id,
  p.name,
  p.band_number,
  p.gender,
  p.breed,
  p.birth_date,
  p.description,
  p.image_url,
  p.created_at,
  p.updated_at,
  father.name AS father_name,
  father.band_number AS father_band_number,
  mother.name AS mother_name,
  mother.band_number AS mother_band_number
FROM pigeons p
LEFT JOIN pigeons father ON p.father_id = father.id
LEFT JOIN pigeons mother ON p.mother_id = mother.id;

-- Yarış performans özeti
CREATE OR REPLACE VIEW race_performance_summary AS
SELECT 
  p.id AS pigeon_id,
  p.name AS pigeon_name,
  p.band_number,
  COUNT(DISTINCT rr.race_id) AS total_races,
  COUNT(CASE WHEN rr.position <= 3 THEN 1 END) AS top3_finishes,
  AVG(rr.position) AS avg_position,
  MIN(rr.position) AS best_position
FROM pigeons p
LEFT JOIN race_results rr ON p.id = rr.pigeon_id
GROUP BY p.id, p.name, p.band_number;