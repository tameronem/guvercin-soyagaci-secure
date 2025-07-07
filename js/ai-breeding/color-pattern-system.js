// Renk ve Desen Sistemi
// Türk güverciciliğine özel genişletilmiş renk/desen tanımlamaları

const ColorPatternSystem = {
    // Türk Güvercin Renkleri - Detaylı Genetik Tanımlamalar
    turkishPigeonColors: {
        // ARAP (Düz Siyah)
        'arap': {
            name_tr: 'Arap (Düz Siyah)',
            name_en: 'Black',
            color_gene: 'B',
            pattern_gene: null,
            spread: true,
            dilute: false,
            brown: false,
            pied: false,
            genetic_notes: 'Mavi kuşun yayılma (Spread) geni ile düz siyaha dönmüş halidir',
            hidden_genes: ['B+', 'bᵃ'],
            hex: '#000000',
            category: 'solid'
        },
        
        // MAVİ ŞERİTLİ
        'mavi-seritli': {
            name_tr: 'Mavi Şeritli',
            name_en: 'Blue Bar',
            color_gene: 'B+',
            pattern_gene: 'C+',
            spread: false,
            dilute: false,
            brown: false,
            pied: false,
            genetic_notes: 'En yaygın yaban tipi renk, kanatlarında iki siyah bant bulunur',
            hidden_genes: null,
            hex: '#4169E1',
            category: 'base'
        },
        
        // MAVİ ÇAKMAKLI
        'mavi-cakmakli': {
            name_tr: 'Mavi Çakmaklı',
            name_en: 'Blue Checker',
            color_gene: 'B+',
            pattern_gene: 'cˡ',
            spread: false,
            dilute: false,
            brown: false,
            pied: false,
            genetic_notes: 'Çakmaklı desen şeritliye baskındır, dama taşı görünümü',
            hidden_genes: null,
            hex: '#4682B4',
            category: 'base'
        },
        
        // GÖK
        'gok': {
            name_tr: 'Gök',
            name_en: 'Silver',
            color_gene: 'B+',
            pattern_gene: 'C+',
            spread: false,
            dilute: true,
            brown: false,
            pied: false,
            genetic_notes: 'Mavi rengin seyreltilmiş hali, pastel mavi-gri ton',
            hidden_genes: null,
            hex: '#C0C0C0',
            category: 'dilute'
        },
        
        // SABUNİ
        'sabuni': {
            name_tr: 'Sabuni',
            name_en: 'Cream',
            color_gene: 'bᵃ',
            pattern_gene: null,
            spread: true,
            dilute: true,
            brown: false,
            pied: false,
            genetic_notes: 'Ash-Red kuşun hem yayılma hem seyreltme genleriyle krem-lavanta tonu',
            hidden_genes: null,
            hex: '#E6E6FA',
            category: 'dilute'
        },
        
        // KARAKOMPLE
        'karakomple': {
            name_tr: 'Karakomple',
            name_en: 'Black Pied',
            color_gene: 'B',
            pattern_gene: null,
            spread: false,
            dilute: false,
            brown: false,
            pied: true,
            genetic_notes: 'Eksik baskınlık modeliyle oluşan siyah tabanlı alacalı desen',
            hidden_genes: ['bᵃ', 'B+'],
            hex: '#000000',
            secondary_hex: '#FFFFFF',
            category: 'pied'
        },
        
        // KARABOZALI
        'karabozali': {
            name_tr: 'Karabozalı',
            name_en: 'Black Head-Tail',
            color_gene: 'B',
            pattern_gene: null,
            spread: false,
            dilute: false,
            brown: false,
            pied: true,
            genetic_notes: 'Baş ve kuyrukta koyu renk, gövde beyaz. Adana güvercininde yaygın',
            hidden_genes: ['bᵃ', 'B+'],
            hex: '#000000',
            secondary_hex: '#FFFFFF',
            category: 'pied'
        },
        
        // MİSKİ (BOZ)
        'miski': {
            name_tr: 'Miski (Boz)',
            name_en: 'Dun',
            color_gene: 'B',
            pattern_gene: null,
            spread: true,
            dilute: true,
            brown: false,
            pied: false,
            genetic_notes: 'İki yolla oluşur: Brown geni veya Arap seyrelmesi. Kurşuni boz renk',
            hidden_genes: ['B+'],
            hex: '#696969',
            category: 'dilute'
        },
        
        // BASKA
        'baska': {
            name_tr: 'Baska',
            name_en: 'Black Grizzle',
            color_gene: 'B',
            pattern_gene: null,
            spread: false,
            dilute: false,
            brown: false,
            pied: true,
            genetic_notes: 'Karakomple varyantı, %50 beyaz %50 renkli tüy yapısı',
            hidden_genes: ['bᵃ', 'B+'],
            hex: '#000000',
            secondary_hex: '#FFFFFF',
            category: 'pied'
        },
        
        // ŞEKERİ
        'sekeri': {
            name_tr: 'Şekeri',
            name_en: 'Red Pied',
            color_gene: 'bᵃ',
            pattern_gene: null,
            spread: false,
            dilute: false,
            brown: false,
            pied: true,
            genetic_notes: 'Ash-Red kuşların beyazla eşleşmesinden oluşan kırmızı tabanlı alaca',
            hidden_genes: null,
            hex: '#DC143C',
            secondary_hex: '#FFFFFF',
            category: 'pied'
        },
        
        // KÜRENK
        'kurenk': {
            name_tr: 'Kürenk',
            name_en: 'Recessive Red',
            color_gene: 'e',
            pattern_gene: null,
            spread: false,
            dilute: false,
            brown: false,
            pied: false,
            genetic_notes: 'Tüm renkleri maskeleyen resesif gen. Kuşu baştan aşağı krem-kırmızı yapar',
            hidden_genes: null,
            hex: '#FFB6C1',
            category: 'special'
        },
        
        // SARI KOMPLE
        'sari-komple': {
            name_tr: 'Sarı Komple',
            name_en: 'Yellow Pied',
            color_gene: 'bᵃ',
            pattern_gene: null,
            spread: false,
            dilute: true,
            brown: false,
            pied: true,
            genetic_notes: 'Ash-Red kuşun dilute geniyle sarılaşması ve komple sistemiyle beyaz lekelenmesi',
            hidden_genes: null,
            hex: '#FFD700',
            secondary_hex: '#FFFFFF',
            category: 'pied'
        },
        
        // KIRMIZI KOMPLE
        'kirmizi-komple': {
            name_tr: 'Kırmızı Komple',
            name_en: 'Red Pied',
            color_gene: 'bᵃ',
            pattern_gene: null,
            spread: false,
            dilute: false,
            brown: false,
            pied: true,
            genetic_notes: 'Ash-Red kuşun beyazla eşleşmesinden çıkan kırmızı tabanlı komple',
            hidden_genes: null,
            hex: '#DC143C',
            secondary_hex: '#FFFFFF',
            category: 'pied'
        },
        
        // DÜZ SİYAH
        'duz-siyah': {
            name_tr: 'Düz Siyah',
            name_en: 'Solid Black',
            color_gene: 'B',
            pattern_gene: null,
            spread: true,
            dilute: false,
            brown: false,
            pied: false,
            genetic_notes: 'Yayılma geni ile düz siyaha dönüşmüş kuş. Arap ile aynı',
            hidden_genes: ['bᵃ', 'B+'],
            hex: '#000000',
            category: 'solid'
        },
        
        // DÜZ MAVİ
        'duz-mavi': {
            name_tr: 'Düz Mavi',
            name_en: 'Solid Blue',
            color_gene: 'B+',
            pattern_gene: null,
            spread: false,
            dilute: false,
            brown: false,
            pied: false,
            genetic_notes: 'Klasik mavi kuş, desensiz',
            hidden_genes: null,
            hex: '#4169E1',
            category: 'base'
        },
        
        // DÜZ KIRMIZI
        'duz-kirmizi': {
            name_tr: 'Düz Kırmızı',
            name_en: 'Solid Red',
            color_gene: 'bᵃ',
            pattern_gene: null,
            spread: true,
            dilute: false,
            brown: false,
            pied: false,
            genetic_notes: 'Ash-Red kuşun yayılma geni ile düz kırmızıya dönmesi',
            hidden_genes: null,
            hex: '#DC143C',
            category: 'solid'
        },
        
        // BEYAZ
        'beyaz': {
            name_tr: 'Beyaz',
            name_en: 'White',
            color_gene: 'aa',
            pattern_gene: null,
            spread: false,
            dilute: false,
            brown: false,
            pied: false,
            genetic_notes: 'Saf beyaz veya pied olabilir. Genellikle gizli renk taşır',
            hidden_genes: ['B', 'bᵃ', 'B+'],
            hex: '#FFFFFF',
            category: 'special'
        }
    },
    
    // Eski sistem ile uyumluluk için renk mapping
    colors: {
        // Bu bölüm geriye dönük uyumluluk için korunuyor
        'arap': { name_tr: 'Arap', hex: '#000000', category: 'solid' },
        'mavi-seritli': { name_tr: 'Mavi Şeritli', hex: '#4169E1', category: 'base' },
        'sabuni': { name_tr: 'Sabuni', hex: '#E6E6FA', category: 'dilute' },
        'beyaz': { name_tr: 'Beyaz', hex: '#FFFFFF', category: 'special' }
    },
    
    // Desen Tanımlamaları
    patterns: {
        // Standart Desenler
        'bar': { 
            name_tr: 'Çizgili', 
            name_en: 'Bar',
            genetic: 'C+/C+',
            type: 'standard'
        },
        'checker': { 
            name_tr: 'Kareli', 
            name_en: 'Checker',
            genetic: 'C/C',
            type: 'standard'
        },
        't-pattern': { 
            name_tr: 'T-Desen', 
            name_en: 'T-Pattern',
            genetic: 'CT/CT',
            type: 'standard'
        },
        'barless': { 
            name_tr: 'Çizgisiz', 
            name_en: 'Barless',
            genetic: 'c/c',
            type: 'standard'
        },
        
        // Özel Türk Desenleri
        'bozali': { 
            name_tr: 'Bozalı (Karabozalı)', 
            name_en: 'Ash-Red Bar',
            genetic: 'BA/BA C+/C+',
            type: 'special',
            required_color: 'ash-red'
        },
        
        // Komple (Solid) Desenler
        'solid-black': { 
            name_tr: 'Kara Komple', 
            name_en: 'Solid Black',
            genetic: 'S/S',
            type: 'solid',
            is_solid: true,
            base_color: 'black'
        },
        'solid-yellow': { 
            name_tr: 'Sarı Komple', 
            name_en: 'Solid Yellow',
            genetic: 'e/e d/d S/S',
            type: 'solid',
            is_solid: true,
            base_color: 'yellow'
        },
        'solid-blue': { 
            name_tr: 'Mavi Komple', 
            name_en: 'Solid Blue',
            genetic: 'B+/B+ S/S',
            type: 'solid',
            is_solid: true,
            base_color: 'blue'
        },
        'solid-red': { 
            name_tr: 'Kırmızı Komple', 
            name_en: 'Solid Red',
            genetic: 'BA/BA S/S',
            type: 'solid',
            is_solid: true,
            base_color: 'red'
        },
        'solid-white': { 
            name_tr: 'Beyaz Komple', 
            name_en: 'Solid White',
            genetic: 'z/z',
            type: 'solid',
            is_solid: true,
            base_color: 'white'
        }
    },
    
    // Irka Özel Renkler (Türk güvercin renkleriyle güncellendi)
    breedColors: {
        'adana': [
            { color: 'karabozali', pattern: null, standard: true, frequency: 0.80 },
            { color: 'duz-kirmizi', pattern: null, standard: true, frequency: 0.15 }
        ],
        'bursa_oynari': [
            { color: 'white', pattern: 'solid-white', standard: true, frequency: 0.60 },
            { color: 'white', pattern: null, standard: true, frequency: 0.30 }
        ],
        'dolapci': [
            { color: 'black', pattern: 'solid-black', standard: true, frequency: 0.40 },
            { color: 'black', pattern: null, standard: true, frequency: 0.30 }
        ],
        'hunkari': [
            { color: 'red', pattern: 'solid-red', standard: true, frequency: 0.50 },
            { color: 'ash-red', pattern: 'solid-red', standard: true, frequency: 0.30 }
        ],
        'taklaci': [
            { color: 'beyaz', pattern: null, standard: true, frequency: 0.30 },
            { color: 'karakomple', pattern: null, standard: true, frequency: 0.20 },
            { color: 'arap', pattern: null, standard: true, frequency: 0.15 }
        ],
        'van': [
            { color: 'black-white-mix', pattern: null, standard: true, frequency: 0.25 },
            { color: 'salt-pepper', pattern: null, standard: true, frequency: 0.20 }
        ],
        'posta': [
            { color: 'mavi-seritli', pattern: null, standard: true, frequency: 0.60 },
            { color: 'mavi-cakmakli', pattern: null, standard: true, frequency: 0.20 },
            { color: 'duz-kirmizi', pattern: null, standard: true, frequency: 0.10 }
        ],
        'sebap': [
            { color: 'white', pattern: null, standard: true, frequency: 0.40 },
            { color: 'yellow', pattern: null, standard: true, frequency: 0.30 }
        ],
        'kelebek': [
            { color: 'beyaz', pattern: null, standard: true, frequency: 0.50 },
            { color: 'karakomple', pattern: null, standard: true, frequency: 0.30 }
        ]
    },
    
    // Renk-Desen Uyumluluğu Kontrolü
    validateColorPattern(color, pattern) {
        // Bozalı sadece kül kırmızıda olur
        if (pattern === 'bozali' && color !== 'ash-red') {
            return {
                valid: false,
                message: 'Bozalı desen sadece kül kırmızı renkte olur'
            };
        }
        
        // Komple desenler için renk uyumu
        if (pattern && this.patterns[pattern]?.is_solid) {
            const requiredColor = this.patterns[pattern].base_color;
            if (color !== requiredColor) {
                return {
                    valid: false,
                    message: `${this.patterns[pattern].name_tr} için ${this.colors[requiredColor].name_tr} renk gerekli`
                };
            }
        }
        
        return { valid: true };
    },
    
    // Irka göre renk önerisi
    getBreedRecommendations(breed) {
        const recommendations = this.breedColors[breed] || [];
        return recommendations.sort((a, b) => b.frequency - a.frequency);
    },
    
    // Renk görsel önizleme HTML'i oluştur
    createColorPreview(color, pattern = null, piedLevel = null) {
        // Önce Türk renkleri sisteminde ara
        const colorData = this.turkishPigeonColors[color] || this.colors[color];
        const patternData = pattern ? this.patterns[pattern] : null;
        
        let html = '<div class="color-preview-container">';
        
        // Ala renk önizlemesi
        if (colorData?.category === 'pied' || piedLevel) {
            html += `
                <div class="pigeon-preview pied">
                    <div class="color-base" style="background: ${colorData.hex}"></div>
                    <div class="color-secondary" style="background: ${colorData.secondary_hex || '#FFFFFF'}"></div>
                </div>
            `;
        }
        // Komple renk önizlemesi
        else if (patternData?.is_solid) {
            html += `
                <div class="pigeon-preview solid">
                    <div class="pigeon-silhouette" style="background: ${colorData.hex}">
                        <i class="fas fa-dove fa-3x"></i>
                    </div>
                </div>
            `;
        }
        // Standart renk/desen önizlemesi
        else {
            html += `
                <div class="pigeon-preview standard">
                    <div class="color-base" style="background: ${colorData?.hex || '#808080'}"></div>
                    ${pattern === 'bar' ? '<div class="pattern-bars"></div>' : ''}
                    ${pattern === 'checker' ? '<div class="pattern-checker"></div>' : ''}
                </div>
            `;
        }
        
        // Renk bilgisi
        html += `
            <div class="color-info mt-2">
                <strong>${colorData?.name_tr || 'Bilinmeyen'}</strong>
                ${patternData ? `<br><small>${patternData.name_tr}</small>` : ''}
            </div>
        `;
        
        html += '</div>';
        return html;
    },
    
    // Genetik analiz
    analyzeColorGenetics(pigeon) {
        const color = this.colors[pigeon.color];
        const pattern = this.patterns[pigeon.pattern];
        
        return {
            colorGenetic: color?.genetic || 'unknown',
            patternGenetic: pattern?.genetic || 'unknown',
            category: color?.category,
            isSolid: pattern?.is_solid || false,
            breedConformity: this.checkBreedConformity(pigeon.breed, pigeon.color, pigeon.pattern)
        };
    },
    
    // Irk standardına uygunluk kontrolü
    checkBreedConformity(breed, color, pattern) {
        const breedStandards = this.breedColors[breed];
        if (!breedStandards) return null;
        
        const match = breedStandards.find(std => 
            std.color === color && 
            (std.pattern === pattern || (!std.pattern && !pattern))
        );
        
        return match ? {
            conforms: true,
            frequency: match.frequency,
            isStandard: match.standard
        } : {
            conforms: false,
            frequency: 0,
            isStandard: false
        };
    },
    
    // Renk kalıtım tahmini
    predictOffspringColors(maleColor, femaleColor) {
        const male = this.turkishPigeonColors[maleColor];
        const female = this.turkishPigeonColors[femaleColor];
        
        if (!male || !female) return null;
        
        const predictions = [];
        
        // Basit kalıtım kuralları
        // Ash-Red (bᵃ) > Siyah (B) > Mavi (B+)
        if (male.color_gene === 'bᵃ' || female.color_gene === 'bᵃ') {
            // Ash-Red baskın
            if (male.spread && female.spread) {
                predictions.push({ color: 'duz-kirmizi', probability: 50 });
            } else if (male.pied || female.pied) {
                predictions.push({ color: 'sekeri', probability: 30 });
                predictions.push({ color: 'kirmizi-komple', probability: 20 });
            }
        }
        
        // Beyaz eşleşmeleri
        if (maleColor === 'beyaz' || femaleColor === 'beyaz') {
            const otherColor = maleColor === 'beyaz' ? femaleColor : maleColor;
            const other = this.turkishPigeonColors[otherColor];
            
            if (other.color_gene === 'B') {
                predictions.push({ color: 'karakomple', probability: 50 });
                predictions.push({ color: 'karabozali', probability: 30 });
            } else if (other.color_gene === 'bᵃ') {
                predictions.push({ color: 'sekeri', probability: 40 });
                predictions.push({ color: 'sari-komple', probability: 30 });
            }
        }
        
        // Aynı renk eşleşmeleri
        if (maleColor === femaleColor) {
            predictions.push({ color: maleColor, probability: 75 });
            
            // Dilute taşıyıcılığı
            if (male.dilute === false) {
                if (maleColor === 'arap') predictions.push({ color: 'miski', probability: 25 });
                if (maleColor === 'mavi-seritli') predictions.push({ color: 'gok', probability: 25 });
            }
        }
        
        // Sabuni eşleşmeleri
        if (maleColor === 'sabuni' || femaleColor === 'sabuni') {
            predictions.push({ color: 'sabuni', probability: 50 });
            if (maleColor === 'gok' || femaleColor === 'gok') {
                predictions.push({ color: 'gok', probability: 30 });
            }
        }
        
        // Eğer hiç tahmin yoksa varsayılan
        if (predictions.length === 0) {
            predictions.push({ color: maleColor, probability: 50 });
            predictions.push({ color: femaleColor, probability: 50 });
        }
        
        return predictions;
    },
    
    // Renk genetik uyumluluğu kontrol
    checkColorCompatibility(color1, color2) {
        const c1 = this.turkishPigeonColors[color1];
        const c2 = this.turkishPigeonColors[color2];
        
        if (!c1 || !c2) return { compatible: false, score: 0 };
        
        let score = 50; // Başlangıç skoru
        
        // Aynı kategori uyumlu
        if (c1.category === c2.category) score += 20;
        
        // Dilute uyumu
        if (c1.dilute === c2.dilute) score += 10;
        
        // Pied uyumu
        if (c1.pied && c2.pied) score += 15;
        
        // Spread geni uyumu
        if (c1.spread === c2.spread) score += 5;
        
        // Risk faktörleri
        const risks = [];
        
        // Çift dilute riski
        if (c1.dilute && c2.dilute) {
            risks.push('Çok açık renk yavrular olabilir');
            score -= 10;
        }
        
        // Çift pied riski
        if (c1.pied && c2.pied) {
            risks.push('Aşırı beyaz yavrular doğabilir');
            score -= 15;
        }
        
        return {
            compatible: true,
            score: Math.max(0, Math.min(100, score)),
            risks: risks
        };
    },
    
    // Renk adını kullanıcı dostu formata çevir
    getColorDisplayName(colorCode) {
        const color = this.turkishPigeonColors[colorCode];
        return color ? color.name_tr : colorCode;
    },
    
    // Rengin genetik açıklamasını getir
    getColorGeneticInfo(colorCode) {
        const color = this.turkishPigeonColors[colorCode];
        if (!color) return null;
        
        return {
            name: color.name_tr,
            genes: {
                color: color.color_gene,
                pattern: color.pattern_gene,
                modifiers: {
                    spread: color.spread,
                    dilute: color.dilute,
                    brown: color.brown,
                    pied: color.pied
                }
            },
            notes: color.genetic_notes,
            hiddenGenes: color.hidden_genes
        };
    },
    
    // Beyaz kuş için gizli renk tahmini
    predictWhiteHiddenColor(parentColors) {
        // Ebeveyn renklerine göre beyaz kuşun taşıyabileceği gizli rengi tahmin et
        const colorFrequency = {};
        
        parentColors.forEach(color => {
            const c = this.turkishPigeonColors[color];
            if (c && c.color_gene) {
                colorFrequency[c.color_gene] = (colorFrequency[c.color_gene] || 0) + 1;
            }
        });
        
        // En sık görülen gen muhtemelen taşınıyor
        let mostLikely = 'B+'; // Varsayılan mavi
        let maxFreq = 0;
        
        Object.entries(colorFrequency).forEach(([gene, freq]) => {
            if (freq > maxFreq) {
                maxFreq = freq;
                mostLikely = gene;
            }
        });
        
        return mostLikely;
    }
};

// Export
window.ColorPatternSystem = ColorPatternSystem;