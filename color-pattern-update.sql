-- Renk ve Desen Sistemi Güncellemeleri
-- AI Eşleştirme için genişletilmiş renk/desen veritabanı

-- 1. pigeons tablosuna yeni alanlar
ALTER TABLE pigeons 
ADD COLUMN IF NOT EXISTS color VARCHAR(50),
ADD COLUMN IF NOT EXISTS pattern VARCHAR(50),
ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(50), -- İkinci renk (ala için)
ADD COLUMN IF NOT EXISTS pied_level VARCHAR(20), -- Ala düzeyi
ADD COLUMN IF NOT EXISTS pattern_type VARCHAR(50), -- 'bar', 'checker', 'solid', 'bozali'
ADD COLUMN IF NOT EXISTS is_solid BOOLEAN DEFAULT FALSE, -- Komple/düz renk mi?
ADD COLUMN IF NOT EXISTS pattern_intensity VARCHAR(20), -- 'light', 'medium', 'dark'
ADD COLUMN IF NOT EXISTS color_details JSONB, -- Detaylı renk bilgisi
ADD COLUMN IF NOT EXISTS color_distribution JSONB, -- Renk dağılımı detayı
ADD COLUMN IF NOT EXISTS color_genetics JSONB; -- Genetik bilgi

-- 2. Renk ve Desen Kataloğu
CREATE TABLE IF NOT EXISTS color_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) NOT NULL, -- 'color' veya 'pattern'
    code VARCHAR(50) NOT NULL UNIQUE,
    name_tr VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    hex_color VARCHAR(7), -- Görsel temsil için
    secondary_hex VARCHAR(7), -- İkinci renk (ala için)
    genetic_code VARCHAR(50), -- BA, B+, b vb.
    category VARCHAR(50), -- 'base', 'dilute', 'special', 'mixed', 'solid'
    description_tr TEXT,
    description_en TEXT,
    breed_specific BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Türk Irklarına Özel Renk/Desen Kombinasyonları
CREATE TABLE IF NOT EXISTS turkish_breed_colors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    breed VARCHAR(100) NOT NULL,
    color_pattern VARCHAR(100) NOT NULL,
    frequency FLOAT DEFAULT 0.5, -- Bu ırkta görülme sıklığı (0-1)
    is_standard BOOLEAN DEFAULT FALSE, -- Irk standardı mı?
    is_preferred BOOLEAN DEFAULT FALSE, -- Tercih edilen mi?
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(breed, color_pattern)
);

-- 4. Renk Kataloğu Verileri
INSERT INTO color_patterns (type, code, name_tr, name_en, hex_color, secondary_hex, genetic_code, category, description_tr) VALUES
-- Temel Renkler
('color', 'blue-bar', 'Mavi Çizgili', 'Blue Bar', '#4169E1', NULL, 'B+/B+', 'base', 'Yaban tipi mavi renk'),
('color', 'ash-red', 'Kül Kırmızı', 'Ash Red', '#CD5C5C', NULL, 'BA/BA', 'base', 'Baskın kırmızı renk'),
('color', 'brown', 'Kahverengi', 'Brown', '#8B4513', NULL, 'b/b', 'base', 'Çekinik kahverengi'),

-- Seyreltilmiş Renkler
('color', 'silver', 'Gümüş', 'Silver', '#C0C0C0', NULL, 'B+/B+ d/d', 'dilute', 'Seyreltilmiş mavi'),
('color', 'ash-yellow', 'Kül Sarı', 'Ash Yellow', '#FFD700', NULL, 'BA/BA d/d', 'dilute', 'Seyreltilmiş kırmızı'),
('color', 'khaki', 'Haki', 'Khaki', '#F0E68C', NULL, 'b/b d/d', 'dilute', 'Seyreltilmiş kahverengi'),

-- Özel Renkler
('color', 'white', 'Beyaz', 'White', '#FFFFFF', NULL, 'z/z', 'special', 'Saf beyaz'),
('color', 'black', 'Siyah', 'Black', '#000000', NULL, 'S/S', 'special', 'Saf siyah'),
('color', 'red', 'Kırmızı', 'Red', '#FF0000', NULL, 'e/e', 'special', 'Çekinik kırmızı'),
('color', 'yellow', 'Sarı', 'Yellow', '#FFFF00', NULL, 'e/e d/d', 'special', 'Çekinik sarı'),

-- Karışım Renkler
('color', 'black-white-mix', 'Siyah Beyaz Karışım', 'Black White Grizzle', '#696969', '#D3D3D3', 'S/s G/g', 'mixed', 'Siyah ve beyaz tüylerin karışımı'),
('color', 'salt-pepper', 'Tuz Biber', 'Salt and Pepper', '#808080', NULL, 'B+/B+ G/g', 'mixed', 'Gri tonlarında karışım'),

-- Ala Renkler
('color', 'black-white-pied', 'Siyah Beyaz Ala', 'Black White Pied', '#000000', '#FFFFFF', 'S/S s/s', 'mixed', 'Siyah beyaz alaca'),
('color', 'blue-white-pied', 'Mavi Beyaz Ala', 'Blue White Pied', '#4169E1', '#FFFFFF', 'B+/B+ s/s', 'mixed', 'Mavi beyaz alaca'),
('color', 'red-white-pied', 'Kırmızı Beyaz Ala', 'Red White Pied', '#CD5C5C', '#FFFFFF', 'BA/BA s/s', 'mixed', 'Kırmızı beyaz alaca'),

-- Desen Verileri
('pattern', 'bar', 'Çizgili', 'Bar', NULL, NULL, 'C+/C+', 'standard', 'İki çizgili kanat deseni'),
('pattern', 'checker', 'Kareli', 'Checker', NULL, NULL, 'C/C', 'standard', 'Kareli kanat deseni'),
('pattern', 't-pattern', 'T-Desen', 'T-Pattern', NULL, NULL, 'CT/CT', 'standard', 'T şeklinde koyu desen'),
('pattern', 'barless', 'Çizgisiz', 'Barless', NULL, NULL, 'c/c', 'standard', 'Desensiz düz kanat'),
('pattern', 'bozali', 'Bozalı (Karabozalı)', 'Ash-Red Bar', NULL, NULL, 'BA/BA C+/C+', 'special', 'Kül kırmızı üzerine koyu çizgiler'),

-- Komple (Solid) Desenler
('pattern', 'solid-black', 'Kara Komple', 'Solid Black', '#000000', NULL, 'S/S', 'solid', 'Tamamen siyah, desensiz'),
('pattern', 'solid-yellow', 'Sarı Komple', 'Solid Yellow', '#FFFF00', NULL, 'e/e d/d S/S', 'solid', 'Tamamen sarı, desensiz'),
('pattern', 'solid-blue', 'Mavi Komple', 'Solid Blue', '#4169E1', NULL, 'B+/B+ S/S', 'solid', 'Tamamen mavi, desensiz'),
('pattern', 'solid-red', 'Kırmızı Komple', 'Solid Red', '#CD5C5C', NULL, 'BA/BA S/S', 'solid', 'Tamamen kırmızı, desensiz'),
('pattern', 'solid-white', 'Beyaz Komple', 'Solid White', '#FFFFFF', NULL, 'z/z', 'solid', 'Tamamen beyaz')
ON CONFLICT (code) DO NOTHING;

-- 5. Türk Irkları İçin Standart Renkler
INSERT INTO turkish_breed_colors (breed, color_pattern, frequency, is_standard, is_preferred, notes) VALUES
-- Adana Güvercini
('Adana Güvercini', 'bozali', 0.80, true, true, 'Klasik Adana bozalısı, ırk standardı'),
('Adana Güvercini', 'ash-red', 0.15, true, false, 'Düz kül kırmızı da kabul edilir'),

-- Bursa Oynarı
('Bursa Oynarı', 'solid-white', 0.60, true, true, 'Saf beyaz tercih edilir'),
('Bursa Oynarı', 'white', 0.30, true, false, 'Beyaz kabul edilir'),

-- Ankara Tütün
('Ankara Tütün', 'solid-black', 0.40, true, true, 'Simsiyah olmalı'),
('Ankara Tütün', 'black', 0.30, true, false, 'Siyah kabul edilir'),

-- İstanbul Kumrusu
('İstanbul Kumrusu', 'solid-red', 0.50, true, true, 'Koyu kırmızı ideal'),
('İstanbul Kumrusu', 'ash-red', 0.30, true, false, 'Kül kırmızı da olabilir'),

-- Taklacı
('Taklacı', 'white', 0.30, true, true, 'Beyaz yaygın'),
('Taklacı', 'black-white-pied', 0.20, true, false, 'Ala renkler de görülür'),
('Taklacı', 'solid-black', 0.15, true, false, 'Siyah taklacılar'),

-- Van Güvercini
('Van Güvercini', 'black-white-mix', 0.25, true, false, 'Karışık renkli'),
('Van Güvercini', 'salt-pepper', 0.20, true, false, 'Tuz biber rengi')
ON CONFLICT (breed, color_pattern) DO NOTHING;

-- 6. Renk Genetiği İlişki Tablosu
CREATE TABLE IF NOT EXISTS color_genetics_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent1_color VARCHAR(50),
    parent1_pattern VARCHAR(50),
    parent2_color VARCHAR(50),
    parent2_pattern VARCHAR(50),
    offspring_color VARCHAR(50),
    offspring_pattern VARCHAR(50),
    probability FLOAT CHECK (probability >= 0 AND probability <= 1),
    notes TEXT
);

-- Örnek genetik kurallar
INSERT INTO color_genetics_rules (parent1_color, parent1_pattern, parent2_color, parent2_pattern, offspring_color, offspring_pattern, probability) VALUES
-- İki siyah = siyah
('black', 'solid-black', 'black', 'solid-black', 'black', 'solid-black', 0.95),
-- İki beyaz = beyaz
('white', 'solid-white', 'white', 'solid-white', 'white', 'solid-white', 0.98),
-- Bozalı x Bozalı = Bozalı
('ash-red', 'bozali', 'ash-red', 'bozali', 'ash-red', 'bozali', 0.75);

-- 7. İndeksler
CREATE INDEX idx_color_patterns_type ON color_patterns(type);
CREATE INDEX idx_color_patterns_category ON color_patterns(category);
CREATE INDEX idx_turkish_breed_colors_breed ON turkish_breed_colors(breed);
CREATE INDEX idx_pigeons_color ON pigeons(color);
CREATE INDEX idx_pigeons_pattern ON pigeons(pattern);

-- 8. RLS Politikaları
ALTER TABLE color_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE turkish_breed_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_genetics_rules ENABLE ROW LEVEL SECURITY;

-- Herkes renk kataloğunu görebilir
CREATE POLICY "Renk kataloğu herkese açık" ON color_patterns
    FOR SELECT USING (true);

-- Herkes ırk renklerini görebilir
CREATE POLICY "Irk renkleri herkese açık" ON turkish_breed_colors
    FOR SELECT USING (true);

-- Herkes genetik kuralları görebilir
CREATE POLICY "Genetik kurallar herkese açık" ON color_genetics_rules
    FOR SELECT USING (true);