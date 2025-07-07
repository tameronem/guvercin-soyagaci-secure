-- AI Güvercin Eşleştirme - Renk Genetiği Güncelleme
-- Bu dosya mevcut veritabanına renk sistemi eklemek için kullanılacak

-- 1. Pigeons tablosuna renk alanları ekleme
ALTER TABLE pigeons 
ADD COLUMN IF NOT EXISTS color VARCHAR(50),
ADD COLUMN IF NOT EXISTS pattern VARCHAR(50),
ADD COLUMN IF NOT EXISTS color_details JSONB;

-- 2. Türk güvercin renkleri kataloğu
CREATE TABLE IF NOT EXISTS pigeon_colors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name_tr VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    color_gene VARCHAR(20),
    pattern_gene VARCHAR(20),
    spread BOOLEAN DEFAULT FALSE,
    dilute BOOLEAN DEFAULT FALSE,
    brown BOOLEAN DEFAULT FALSE,
    pied BOOLEAN DEFAULT FALSE,
    genetic_notes TEXT,
    hidden_genes TEXT[],
    hex_color VARCHAR(7),
    category VARCHAR(50),
    breed_specific TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Türk güvercin renkleri verileri
INSERT INTO pigeon_colors (code, name_tr, name_en, color_gene, pattern_gene, spread, dilute, brown, pied, genetic_notes, hidden_genes, hex_color, category) VALUES
-- Temel Renkler
('arap', 'Arap (Düz Siyah)', 'Black', 'B', NULL, true, false, false, false, 'Mavi kuşun yayılma (Spread) geni ile düz siyaha dönmüş halidir', ARRAY['B+', 'bᵃ'], '#000000', 'solid'),
('mavi-seritli', 'Mavi Şeritli', 'Blue Bar', 'B+', 'C+', false, false, false, false, 'En yaygın yaban tipi renk', NULL, '#4169E1', 'base'),
('mavi-cakmakli', 'Mavi Çakmaklı', 'Blue Checker', 'B+', 'cˡ', false, false, false, false, 'Çakmaklı desen şeritliye baskındır', NULL, '#4682B4', 'base'),
('gok', 'Gök', 'Silver', 'B+', 'C+', false, true, false, false, 'Mavi rengin seyreltilmiş hali', NULL, '#C0C0C0', 'dilute'),
('sabuni', 'Sabuni', 'Cream', 'bᵃ', NULL, true, true, false, false, 'Ash-Red kuşun yayılma ve seyreltme genleriyle krem-lavanta tonu', NULL, '#E6E6FA', 'dilute'),

-- Komple/Bozalı Sistemleri
('karakomple', 'Karakomple', 'Black Pied', 'B', NULL, false, false, false, true, 'Eksik baskınlık modeliyle oluşan siyah tabanlı alaca', ARRAY['bᵃ', 'B+'], '#000000', 'pied'),
('karabozali', 'Karabozalı', 'Black Head-Tail', 'B', NULL, false, false, false, true, 'Baş ve kuyrukta koyu renk, gövde beyaz', ARRAY['bᵃ', 'B+'], '#000000', 'pied'),
('miski', 'Miski (Boz)', 'Dun', 'B', NULL, true, true, false, false, 'İki yolla oluşur: Brown geni veya Arap seyrelmesi', ARRAY['B+'], '#696969', 'dilute'),
('baska', 'Baska', 'Black Grizzle', 'B', NULL, false, false, false, true, 'Karakomple varyantı, %50 beyaz %50 renkli', ARRAY['bᵃ', 'B+'], '#000000', 'pied'),
('sekeri', 'Şekeri', 'Red Pied', 'bᵃ', NULL, false, false, false, true, 'Ash-Red kuşların beyazla eşleşmesinden oluşan kırmızı alaca', NULL, '#DC143C', 'pied'),

-- Özel Renkler
('kurenk', 'Kürenk', 'Recessive Red', 'e', NULL, false, false, false, false, 'Tüm renkleri maskeleyen resesif gen, krem-kırmızı yapar', NULL, '#FFB6C1', 'special'),
('sari-komple', 'Sarı Komple', 'Yellow Pied', 'bᵃ', NULL, false, true, false, true, 'Ash-Red dilute geniyle sarılaşmış komple', NULL, '#FFD700', 'pied'),
('kirmizi-komple', 'Kırmızı Komple', 'Red Pied', 'bᵃ', NULL, false, false, false, true, 'Ash-Red kuşun komple sistemi', NULL, '#DC143C', 'pied'),

-- Düz Renkler
('duz-siyah', 'Düz Siyah', 'Solid Black', 'B', NULL, true, false, false, false, 'Yayılma geni ile tam siyah', ARRAY['bᵃ', 'B+'], '#000000', 'solid'),
('duz-mavi', 'Düz Mavi', 'Solid Blue', 'B+', NULL, false, false, false, false, 'Klasik mavi kuş', NULL, '#4169E1', 'base'),
('duz-kirmizi', 'Düz Kırmızı', 'Solid Red', 'bᵃ', NULL, true, false, false, false, 'Ash-Red yayılma geni ile düz kırmızı', NULL, '#DC143C', 'solid'),
('beyaz', 'Beyaz', 'White', 'aa', NULL, false, false, false, false, 'Saf beyaz veya pied olabilir, gizli renk taşıyabilir', ARRAY['B', 'bᵃ', 'B+'], '#FFFFFF', 'special')
ON CONFLICT (code) DO NOTHING;

-- 4. Renk kombinasyonu tahmin tablosu
CREATE TABLE IF NOT EXISTS color_inheritance_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    parent1_color VARCHAR(50),
    parent2_color VARCHAR(50),
    offspring_colors JSONB, -- {color: percentage} formatında
    notes TEXT,
    UNIQUE(parent1_color, parent2_color)
);

-- 5. Temel renk kalıtım kuralları
INSERT INTO color_inheritance_rules (parent1_color, parent2_color, offspring_colors, notes) VALUES
-- Arap eşleşmeleri
('arap', 'arap', '{"arap": 100}', 'Saf siyah yavru'),
('arap', 'beyaz', '{"karakomple": 100}', 'Beyaz pied taşıyıcıysa karakomple çıkar'),
('arap', 'mavi-seritli', '{"arap": 50, "mavi-cakmakli": 50}', 'Arap genellikle mavi taşır'),

-- Sabuni eşleşmeleri
('sabuni', 'sabuni', '{"sabuni": 100}', 'Saf sabuni yavru'),
('sabuni', 'gok', '{"sabuni": 50, "gok": 50}', 'Ash-Red baskın olduğu için sabuni çıkabilir'),
('sabuni', 'beyaz', '{"sari-komple": 50, "sabuni": 50}', 'Beyaz pied ise sarı komple olabilir'),

-- Mavi eşleşmeleri
('mavi-seritli', 'mavi-seritli', '{"mavi-seritli": 100}', 'Saf mavi şeritli'),
('mavi-seritli', 'gok', '{"mavi-seritli": 50, "gok": 50}', 'Dilute taşıyıcıysa gök çıkabilir'),
('mavi-cakmakli', 'mavi-seritli', '{"mavi-cakmakli": 50, "mavi-seritli": 50}', 'Çakmaklı yarı baskın'),

-- Beyaz eşleşmeleri
('beyaz', 'beyaz', '{"beyaz": 100}', 'Taşıdıkları gizli renge göre değişebilir'),
('beyaz', 'duz-kirmizi', '{"kirmizi-komple": 50, "sekeri": 50}', 'Kırmızı tabanlı alacalar')
ON CONFLICT (parent1_color, parent2_color) DO NOTHING;

-- 6. Irka özel renk standartları
CREATE TABLE IF NOT EXISTS breed_color_standards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    breed VARCHAR(50) NOT NULL,
    color_code VARCHAR(50) NOT NULL,
    is_standard BOOLEAN DEFAULT true,
    frequency FLOAT, -- 0-1 arası, ırkta görülme sıklığı
    notes TEXT,
    UNIQUE(breed, color_code)
);

-- 7. Irk renk standartları verileri
INSERT INTO breed_color_standards (breed, color_code, is_standard, frequency, notes) VALUES
-- Taklacı
('taklaci', 'beyaz', true, 0.30, 'En yaygın taklacı rengi'),
('taklaci', 'karakomple', true, 0.20, 'Siyah beyaz alaca'),
('taklaci', 'arap', true, 0.15, 'Düz siyah taklacı'),

-- Adana (Bozalı uzmanı)
('adana', 'karabozali', true, 0.80, 'Adana güvercininin karakteristik rengi'),
('adana', 'duz-kirmizi', true, 0.15, 'Kırmızı Adana'),

-- Posta güvercini
('posta', 'mavi-seritli', true, 0.60, 'En yaygın posta güvercini rengi'),
('posta', 'mavi-cakmakli', true, 0.20, 'Kareli desen'),
('posta', 'duz-kirmizi', true, 0.10, 'Kırmızı posta'),

-- Kelebek
('kelebek', 'beyaz', true, 0.50, 'Beyaz kelebek'),
('kelebek', 'karakomple', true, 0.30, 'Alaca kelebek')
ON CONFLICT (breed, color_code) DO NOTHING;

-- 8. İndeksler
CREATE INDEX IF NOT EXISTS idx_pigeons_color ON pigeons(color);
CREATE INDEX IF NOT EXISTS idx_pigeon_colors_code ON pigeon_colors(code);
CREATE INDEX IF NOT EXISTS idx_color_inheritance_parents ON color_inheritance_rules(parent1_color, parent2_color);
CREATE INDEX IF NOT EXISTS idx_breed_color_standards ON breed_color_standards(breed, color_code);

-- 9. RLS Politikaları
ALTER TABLE pigeon_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_inheritance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE breed_color_standards ENABLE ROW LEVEL SECURITY;

-- Herkes renk kataloğunu görebilir
CREATE POLICY "Renk kataloğu herkese açık" ON pigeon_colors
    FOR SELECT USING (true);

-- Herkes kalıtım kurallarını görebilir
CREATE POLICY "Kalıtım kuralları herkese açık" ON color_inheritance_rules
    FOR SELECT USING (true);

-- Herkes ırk standartlarını görebilir
CREATE POLICY "Irk standartları herkese açık" ON breed_color_standards
    FOR SELECT USING (true);

-- 10. Yardımcı fonksiyonlar
CREATE OR REPLACE FUNCTION predict_offspring_colors(
    parent1_color VARCHAR,
    parent2_color VARCHAR
) RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Önce direkt eşleşme ara
    SELECT offspring_colors INTO result
    FROM color_inheritance_rules
    WHERE (parent1_color = $1 AND parent2_color = $2)
       OR (parent1_color = $2 AND parent2_color = $1)
    LIMIT 1;
    
    -- Bulunamazsa basit tahmin yap
    IF result IS NULL THEN
        result = jsonb_build_object(
            parent1_color, 50,
            parent2_color, 50
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Güncelleme başarılı mesajı
DO $$
BEGIN
    RAISE NOTICE 'Renk genetiği sistemi başarıyla kuruldu!';
END $$;