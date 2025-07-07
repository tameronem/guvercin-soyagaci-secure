-- AI Güvercin Eşleştirme Sistemi - Veritabanı Şeması (Düzeltilmiş)
-- Bu dosya mevcut supabase-schema.sql dosyasına ek olarak uygulanmalıdır

-- 1. Genetik Özellikler Kataloğu
CREATE TABLE IF NOT EXISTS genetic_traits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trait_name VARCHAR(100) NOT NULL,
    trait_code VARCHAR(50) NOT NULL UNIQUE,
    trait_category VARCHAR(50) NOT NULL, -- 'color', 'pattern', 'performance', 'health', 'structure'
    gene_type VARCHAR(20) NOT NULL, -- 'dominant', 'recessive', 'codominant', 'polygenic'
    breed_specific BOOLEAN DEFAULT FALSE,
    applicable_breeds TEXT[], -- Hangi ırklara uygulanabilir
    description TEXT,
    inheritance_pattern TEXT, -- Kalıtım modeli açıklaması
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Güvercin Genetik Bilgileri
CREATE TABLE IF NOT EXISTS pigeon_genetics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pigeon_id UUID NOT NULL REFERENCES pigeons(id) ON DELETE CASCADE,
    trait_id UUID NOT NULL REFERENCES genetic_traits(id),
    allele1 VARCHAR(10) NOT NULL, -- Birinci alel (örn: 'A', 'a', 'B+', 'b')
    allele2 VARCHAR(10) NOT NULL, -- İkinci alel
    expression_level FLOAT DEFAULT 1.0 CHECK (expression_level >= 0 AND expression_level <= 1), -- Gen ifade gücü
    phenotype_expression VARCHAR(100), -- Görünümdeki karşılığı
    verified BOOLEAN DEFAULT FALSE, -- Genetik test ile doğrulandı mı?
    verification_method VARCHAR(50), -- 'genetic_test', 'pedigree_analysis', 'visual_observation'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(pigeon_id, trait_id)
);

-- 3. AI Eşleştirme Önerileri
CREATE TABLE IF NOT EXISTS breeding_recommendations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    male_id UUID NOT NULL REFERENCES pigeons(id),
    female_id UUID NOT NULL REFERENCES pigeons(id),
    compatibility_score FLOAT NOT NULL CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
    genetic_diversity_score FLOAT CHECK (genetic_diversity_score >= 0 AND genetic_diversity_score <= 100),
    health_risk_score FLOAT CHECK (health_risk_score >= 0 AND health_risk_score <= 100),
    performance_prediction_score FLOAT CHECK (performance_prediction_score >= 0 AND performance_prediction_score <= 100),
    phenotype_predictions JSONB, -- Olası yavru fenotipleri ve olasılıkları
    genetic_risks JSONB, -- Tespit edilen genetik riskler
    recommendation_reasons JSONB, -- Öneri nedenleri detaylı
    user_preferences JSONB, -- Kullanıcının tercih ettiği kriterler
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    selected BOOLEAN DEFAULT FALSE, -- Kullanıcı bu öneriyi seçti mi?
    mating_id UUID REFERENCES matings(id), -- Eğer eşleştirme yapıldıysa
    UNIQUE(male_id, female_id, created_at)
);

-- 4. Genetik İlişkiler (Akrabalık)
CREATE TABLE IF NOT EXISTS genetic_relationships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pigeon1_id UUID NOT NULL REFERENCES pigeons(id) ON DELETE CASCADE,
    pigeon2_id UUID NOT NULL REFERENCES pigeons(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL, -- 'parent', 'offspring', 'sibling', 'half-sibling', 'grandparent', 'cousin'
    relationship_degree INTEGER, -- 1: anne-baba, 2: dede-nine, 3: kuzen vb.
    kinship_coefficient FLOAT CHECK (kinship_coefficient >= 0 AND kinship_coefficient <= 1), -- Wright'ın akrabalık katsayısı
    common_ancestors JSONB, -- Ortak atalar listesi
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (pigeon1_id != pigeon2_id),
    UNIQUE(pigeon1_id, pigeon2_id)
);

-- 5. Irk Spesifik Genetik Özellikler
CREATE TABLE IF NOT EXISTS breed_genetic_standards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    breed_name VARCHAR(100) NOT NULL,
    trait_id UUID NOT NULL REFERENCES genetic_traits(id),
    standard_genotype VARCHAR(20), -- Standart genotip (örn: 'AA', 'Aa')
    frequency FLOAT, -- Bu ırkta bu genotipin görülme sıklığı
    importance_level INTEGER DEFAULT 5, -- 1-10 arası önem derecesi
    notes TEXT,
    UNIQUE(breed_name, trait_id)
);

-- 6. Genetik Hastalıklar ve Riskler
CREATE TABLE IF NOT EXISTS genetic_disorders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    disorder_name VARCHAR(100) NOT NULL,
    disorder_code VARCHAR(50) UNIQUE,
    inheritance_type VARCHAR(50), -- 'autosomal_recessive', 'autosomal_dominant', 'x_linked'
    associated_traits UUID[], -- İlişkili genetik özellikler
    risk_genotypes JSONB, -- Riskli genotip kombinasyonları
    symptoms TEXT,
    prevention_notes TEXT,
    severity_level INTEGER CHECK (severity_level >= 1 AND severity_level <= 10)
);

-- 7. Eşleştirme Simülasyon Sonuçları
CREATE TABLE IF NOT EXISTS breeding_simulations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recommendation_id UUID REFERENCES breeding_recommendations(id),
    simulation_number INTEGER,
    offspring_genotype JSONB, -- Simüle edilen yavru genotipi
    offspring_phenotype JSONB, -- Simüle edilen yavru fenotipi
    health_score FLOAT,
    performance_score FLOAT,
    breed_conformity_score FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mevcut pigeons tablosuna eklenecek sütunlar
ALTER TABLE pigeons ADD COLUMN IF NOT EXISTS genetic_profile_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE pigeons ADD COLUMN IF NOT EXISTS inbreeding_coefficient FLOAT DEFAULT 0;
ALTER TABLE pigeons ADD COLUMN IF NOT EXISTS genetic_health_score FLOAT;
ALTER TABLE pigeons ADD COLUMN IF NOT EXISTS breed_purity_percentage FLOAT;
ALTER TABLE pigeons ADD COLUMN IF NOT EXISTS genetic_tested BOOLEAN DEFAULT FALSE;
ALTER TABLE pigeons ADD COLUMN IF NOT EXISTS genetic_test_date DATE;

-- İndeksler - IF NOT EXISTS ile
CREATE INDEX IF NOT EXISTS idx_pigeon_genetics_pigeon ON pigeon_genetics(pigeon_id);
CREATE INDEX IF NOT EXISTS idx_pigeon_genetics_trait ON pigeon_genetics(trait_id);
CREATE INDEX IF NOT EXISTS idx_breeding_recommendations_user ON breeding_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_breeding_recommendations_score ON breeding_recommendations(compatibility_score DESC);
CREATE INDEX IF NOT EXISTS idx_genetic_relationships_pigeons ON genetic_relationships(pigeon1_id, pigeon2_id);

-- Örnek Genetik Özellikler (Başlangıç Verileri)
INSERT INTO genetic_traits (trait_name, trait_code, trait_category, gene_type, description) VALUES
-- Renk Genleri
('Ash-Red', 'BA', 'color', 'dominant', 'Baskın kırmızı/kestane renk geni'),
('Blue/Bar', 'B+', 'color', 'codominant', 'Mavi/çizgili renk geni (yaban tipi)'),
('Brown', 'b', 'color', 'recessive', 'Kahverengi renk geni'),
('Dilute', 'D/d', 'color', 'recessive', 'Renk açıcı gen'),
('Recessive Red', 'e', 'color', 'recessive', 'Çekinik kırmızı gen'),
('Recessive White', 'z', 'color', 'recessive', 'Çekinik beyaz gen'),

-- Desen Genleri
('Checker', 'C', 'pattern', 'codominant', 'Kareli desen geni'),
('Bar', 'C+', 'pattern', 'codominant', 'Çizgili desen geni (yaban tipi)'),
('T-pattern', 'CT', 'pattern', 'codominant', 'T-desen geni'),
('Spread', 'S', 'pattern', 'dominant', 'Yayılma geni - tek renk'),

-- Yapısal Genler
('Crest', 'cr', 'structure', 'recessive', 'Tepeli/hotoz geni'),
('Feather Foot', 'F', 'structure', 'dominant', 'Paçalı ayak geni'),
('Frill', 'fr', 'structure', 'recessive', 'Kıvırcık tüy geni'),

-- Performans İlişkili
('Homing Ability', 'HOM', 'performance', 'polygenic', 'Eve dönüş yeteneği - çoklu gen'),
('Speed', 'SPD', 'performance', 'polygenic', 'Hız yeteneği - çoklu gen'),
('Endurance', 'END', 'performance', 'polygenic', 'Dayanıklılık - çoklu gen'),

-- Sağlık İlişkili
('Immune Strength', 'IMM', 'health', 'polygenic', 'Bağışıklık gücü - çoklu gen'),
('Fertility', 'FER', 'health', 'polygenic', 'Üreme yeteneği - çoklu gen')
ON CONFLICT (trait_code) DO NOTHING;

-- Fonksiyonlar

-- Akrabalık katsayısı hesaplama fonksiyonu
CREATE OR REPLACE FUNCTION calculate_kinship_coefficient(pigeon1_id UUID, pigeon2_id UUID)
RETURNS FLOAT AS $$
DECLARE
    kinship FLOAT;
BEGIN
    -- Basit akrabalık hesaplaması (geliştirilmeli)
    -- Anne-baba: 0.5, Kardeş: 0.5, Kuzen: 0.125 vb.
    SELECT kinship_coefficient INTO kinship
    FROM genetic_relationships
    WHERE (pigeon1_id = $1 AND pigeon2_id = $2) 
       OR (pigeon1_id = $2 AND pigeon2_id = $1)
    LIMIT 1;
    
    RETURN COALESCE(kinship, 0);
END;
$$ LANGUAGE plpgsql;

-- RLS Politikaları
ALTER TABLE genetic_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE pigeon_genetics ENABLE ROW LEVEL SECURITY;
ALTER TABLE breeding_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE genetic_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE breed_genetic_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE genetic_disorders ENABLE ROW LEVEL SECURITY;
ALTER TABLE breeding_simulations ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları DROP et (varsa) ve yeniden oluştur
DROP POLICY IF EXISTS "Genetik özellikler herkese açık" ON genetic_traits;
DROP POLICY IF EXISTS "Kullanıcılar kendi güvercinlerinin genetiğini yönetebilir" ON pigeon_genetics;
DROP POLICY IF EXISTS "Kullanıcılar kendi önerilerini görebilir" ON breeding_recommendations;
DROP POLICY IF EXISTS "Kullanıcılar kendi güvercinlerinin ilişkilerini görebilir" ON genetic_relationships;
DROP POLICY IF EXISTS "Irk standartları herkese açık" ON breed_genetic_standards;
DROP POLICY IF EXISTS "Hastalık bilgileri herkese açık" ON genetic_disorders;
DROP POLICY IF EXISTS "Kullanıcılar kendi simülasyonlarını görebilir" ON breeding_simulations;

-- Herkes genetik özellikleri görebilir
CREATE POLICY "Genetik özellikler herkese açık" ON genetic_traits
    FOR SELECT USING (true);

-- Kullanıcılar sadece kendi güvercinlerinin genetik bilgilerini görebilir/düzenleyebilir
CREATE POLICY "Kullanıcılar kendi güvercinlerinin genetiğini yönetebilir" ON pigeon_genetics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM pigeons 
            WHERE pigeons.id = pigeon_genetics.pigeon_id 
            AND pigeons.user_id = auth.uid()
        )
    );

-- Kullanıcılar sadece kendi eşleştirme önerilerini görebilir
CREATE POLICY "Kullanıcılar kendi önerilerini görebilir" ON breeding_recommendations
    FOR ALL USING (user_id = auth.uid());

-- Kullanıcılar kendi güvercinlerinin ilişkilerini görebilir
CREATE POLICY "Kullanıcılar kendi güvercinlerinin ilişkilerini görebilir" ON genetic_relationships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pigeons 
            WHERE pigeons.id IN (pigeon1_id, pigeon2_id) 
            AND pigeons.user_id = auth.uid()
        )
    );

-- Herkes ırk standartlarını görebilir
CREATE POLICY "Irk standartları herkese açık" ON breed_genetic_standards
    FOR SELECT USING (true);

-- Herkes hastalık bilgilerini görebilir
CREATE POLICY "Hastalık bilgileri herkese açık" ON genetic_disorders
    FOR SELECT USING (true);

-- Kullanıcılar kendi simülasyonlarını görebilir
CREATE POLICY "Kullanıcılar kendi simülasyonlarını görebilir" ON breeding_simulations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM breeding_recommendations br
            WHERE br.id = breeding_simulations.recommendation_id
            AND br.user_id = auth.uid()
        )
    );