// Fenotip Tahmin Modülü
// Genetik bilgilere dayalı görünüm tahminleri

const PhenotypePredictor = {
    // Renk genetiği mapping'leri
    colorGenetics: {
        // Ana renk genleri
        'BA': { // Ash-Red (Kül Kırmızı)
            dominance: 'dominant',
            overrides: ['B+', 'b'],
            phenotypes: {
                'BABA': { name: 'Koyu Kırmızı', code: '#8B0000', intensity: 1.0 },
                'BAB+': { name: 'Kırmızı', code: '#DC143C', intensity: 0.8 },
                'BAb': { name: 'Açık Kırmızı', code: '#FF6B6B', intensity: 0.6 }
            }
        },
        'B+': { // Blue/Bar (Mavi/Çizgili - Yaban tipi)
            dominance: 'codominant',
            phenotypes: {
                'B+B+': { name: 'Mavi/Çizgili', code: '#4169E1', intensity: 1.0 },
                'B+b': { name: 'Mavi', code: '#6495ED', intensity: 0.8 }
            }
        },
        'b': { // Brown (Kahverengi)
            dominance: 'recessive',
            phenotypes: {
                'bb': { name: 'Kahverengi', code: '#8B4513', intensity: 1.0 }
            }
        },
        // Renk modifiye edici genler
        'D': { // Dilute (Seyreltici)
            dominance: 'recessive',
            modifier: true,
            effect: 'lightens',
            phenotypes: {
                'DD': { modifier: 1.0, name: 'Normal' },
                'Dd': { modifier: 1.0, name: 'Normal (Taşıyıcı)' },
                'dd': { modifier: 0.5, name: 'Seyrek' }
            }
        },
        'S': { // Spread (Yayılma)
            dominance: 'dominant',
            modifier: true,
            effect: 'solid',
            phenotypes: {
                'SS': { pattern: 'solid', name: 'Tam Düz' },
                'Ss': { pattern: 'solid', name: 'Düz' },
                'ss': { pattern: 'normal', name: 'Desenli' }
            }
        }
    },
    
    // Desen genetiği
    patternGenetics: {
        'C': { // Pattern genleri
            dominance: 'codominant',
            phenotypes: {
                'CC': { name: 'Tam Kareli', pattern: 'checker', intensity: 1.0 },
                'CC+': { name: 'Kareli', pattern: 'checker', intensity: 0.7 },
                'CCT': { name: 'Kareli-T', pattern: 'checker-t', intensity: 0.8 },
                'C+C+': { name: 'Çizgili', pattern: 'bar', intensity: 1.0 },
                'C+CT': { name: 'Çizgili-T', pattern: 'bar-t', intensity: 0.8 },
                'CTCT': { name: 'T-Desen', pattern: 't-pattern', intensity: 1.0 }
            }
        }
    },
    
    // Yapısal özellik genetiği
    structureGenetics: {
        'cr': { // Crest (Tepeli)
            dominance: 'recessive',
            phenotypes: {
                'CRCR': { trait: 'normal', name: 'Normal' },
                'CRcr': { trait: 'normal', name: 'Normal (Taşıyıcı)' },
                'crcr': { trait: 'crested', name: 'Tepeli' }
            }
        },
        'F': { // Feather foot (Paçalı)
            dominance: 'dominant',
            phenotypes: {
                'FF': { trait: 'heavy-muff', name: 'Tam Paçalı' },
                'Ff': { trait: 'muff', name: 'Paçalı' },
                'ff': { trait: 'clean', name: 'Çıplak Ayak' }
            }
        }
    },
    
    // İki ebeveynden yavru fenotipini tahmin et
    predictOffspringPhenotypes(maleGenetics, femaleGenetics) {
        const predictions = [];
        const traits = this.extractTraits(maleGenetics, femaleGenetics);
        
        // Her özellik için Punnett karesi hesapla
        Object.keys(traits).forEach(traitName => {
            const maleTrait = traits[traitName].male;
            const femaleTrait = traits[traitName].female;
            
            if (maleTrait && femaleTrait) {
                const outcomes = GeneticCalculator.calculatePunnettSquare(
                    [maleTrait.allele1, maleTrait.allele2],
                    [femaleTrait.allele1, femaleTrait.allele2]
                );
                
                predictions.push({
                    trait: traitName,
                    outcomes: outcomes.map(outcome => ({
                        genotype: outcome.genotype,
                        probability: outcome.probability * 100,
                        phenotype: this.genotypeToPhenotype(outcome.genotype, traitName)
                    }))
                });
            }
        });
        
        // Kombinasyon tahminleri oluştur
        const combinations = this.generatePhenotypeCombinations(predictions);
        
        return {
            individualTraits: predictions,
            combinations: combinations,
            summary: this.summarizePredictions(combinations)
        };
    },
    
    // Genetik verileri organize et
    extractTraits(maleGenetics, femaleGenetics) {
        const traits = {};
        
        maleGenetics.forEach(gene => {
            if (!traits[gene.trait_code]) {
                traits[gene.trait_code] = {};
            }
            traits[gene.trait_code].male = gene;
        });
        
        femaleGenetics.forEach(gene => {
            if (!traits[gene.trait_code]) {
                traits[gene.trait_code] = {};
            }
            traits[gene.trait_code].female = gene;
        });
        
        return traits;
    },
    
    // Genotipten fenotipe dönüşüm
    genotypeToPhenotype(genotype, traitCode) {
        // Renk genleri
        if (this.colorGenetics[traitCode]) {
            const geneInfo = this.colorGenetics[traitCode];
            return geneInfo.phenotypes[genotype] || { name: 'Bilinmeyen', code: '#808080' };
        }
        
        // Desen genleri
        if (this.patternGenetics[traitCode]) {
            const geneInfo = this.patternGenetics[traitCode];
            return geneInfo.phenotypes[genotype] || { name: 'Bilinmeyen', pattern: 'unknown' };
        }
        
        // Yapısal genler
        if (this.structureGenetics[traitCode]) {
            const geneInfo = this.structureGenetics[traitCode];
            return geneInfo.phenotypes[genotype] || { name: 'Bilinmeyen', trait: 'unknown' };
        }
        
        return { name: 'Tanımlanmamış', code: '#808080' };
    },
    
    // Fenotip kombinasyonlarını oluştur
    generatePhenotypeCombinations(predictions) {
        // Basitleştirilmiş versiyon - sadece ana renk ve desen kombinasyonları
        const colorPredictions = predictions.find(p => ['BA', 'B+', 'b'].includes(p.trait));
        const patternPredictions = predictions.find(p => p.trait === 'C');
        const dilutePredictions = predictions.find(p => p.trait === 'D');
        const spreadPredictions = predictions.find(p => p.trait === 'S');
        
        const combinations = [];
        
        if (colorPredictions) {
            colorPredictions.outcomes.forEach(colorOutcome => {
                let combination = {
                    color: colorOutcome.phenotype,
                    pattern: null,
                    dilute: null,
                    spread: null,
                    probability: colorOutcome.probability,
                    description: '',
                    visualRepresentation: null
                };
                
                // Desen ekle
                if (patternPredictions) {
                    const compatiblePattern = patternPredictions.outcomes[0]; // En olası
                    combination.pattern = compatiblePattern.phenotype;
                    combination.probability *= (compatiblePattern.probability / 100);
                }
                
                // Seyreltme ekle
                if (dilutePredictions) {
                    const compatibleDilute = dilutePredictions.outcomes[0];
                    combination.dilute = compatibleDilute.phenotype;
                    combination.probability *= (compatibleDilute.probability / 100);
                }
                
                // Yayılma ekle
                if (spreadPredictions) {
                    const compatibleSpread = spreadPredictions.outcomes[0];
                    combination.spread = compatibleSpread.phenotype;
                    combination.probability *= (compatibleSpread.probability / 100);
                }
                
                // Açıklama oluştur
                combination.description = this.generatePhenotypeDescription(combination);
                combination.visualRepresentation = this.generateVisualRepresentation(combination);
                
                combinations.push(combination);
            });
        }
        
        // Olasılığa göre sırala
        combinations.sort((a, b) => b.probability - a.probability);
        
        return combinations;
    },
    
    // Fenotip açıklaması oluştur
    generatePhenotypeDescription(combination) {
        let description = '';
        
        // Ana renk
        if (combination.color) {
            description += combination.color.name;
        }
        
        // Seyreltme
        if (combination.dilute && combination.dilute.modifier < 1) {
            description = 'Açık ' + description;
        }
        
        // Yayılma
        if (combination.spread && combination.spread.pattern === 'solid') {
            description += ' (Düz)';
        } else if (combination.pattern) {
            description += ' ' + combination.pattern.name;
        }
        
        return description;
    },
    
    // Görsel temsil oluştur
    generateVisualRepresentation(combination) {
        let baseColor = combination.color?.code || '#808080';
        
        // Seyreltme efekti
        if (combination.dilute && combination.dilute.modifier < 1) {
            baseColor = this.lightenColor(baseColor, combination.dilute.modifier);
        }
        
        return {
            primaryColor: baseColor,
            pattern: combination.pattern?.pattern || 'solid',
            spread: combination.spread?.pattern === 'solid'
        };
    },
    
    // Rengi açıklaştır
    lightenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        const newR = Math.min(255, r + (255 - r) * (1 - factor));
        const newG = Math.min(255, g + (255 - g) * (1 - factor));
        const newB = Math.min(255, b + (255 - b) * (1 - factor));
        
        return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
    },
    
    // Tahminleri özetle
    summarizePredictions(combinations) {
        const summary = {
            totalCombinations: combinations.length,
            mostLikely: combinations[0],
            colorDistribution: {},
            patternDistribution: {},
            specialTraits: []
        };
        
        // Renk dağılımı
        combinations.forEach(combo => {
            const colorName = combo.color?.name || 'Bilinmeyen';
            if (!summary.colorDistribution[colorName]) {
                summary.colorDistribution[colorName] = 0;
            }
            summary.colorDistribution[colorName] += combo.probability;
        });
        
        // Desen dağılımı
        combinations.forEach(combo => {
            const patternName = combo.pattern?.name || 'Düz';
            if (!summary.patternDistribution[patternName]) {
                summary.patternDistribution[patternName] = 0;
            }
            summary.patternDistribution[patternName] += combo.probability;
        });
        
        return summary;
    },
    
    // Irka özgü fenotip standardı kontrolü
    checkBreedStandard(phenotype, breed) {
        const breedStandards = {
            'Karabozalı': {
                idealColor: 'Koyu Kırmızı',
                acceptableColors: ['Koyu Kırmızı', 'Kırmızı'],
                idealPattern: 'Düz',
                requiredTraits: []
            },
            'Selanik': {
                idealColor: 'Mavi',
                acceptableColors: ['Mavi', 'Mavi/Çizgili'],
                idealPattern: 'Çizgili',
                requiredTraits: []
            },
            'Makaracı': {
                idealColor: 'Beyaz',
                acceptableColors: ['Beyaz'],
                idealPattern: 'Düz',
                requiredTraits: ['tepeli']
            }
        };
        
        const standard = breedStandards[breed];
        if (!standard) return { conformity: 50, notes: 'Irk standardı tanımlanmamış' };
        
        let conformity = 0;
        const notes = [];
        
        // Renk uyumu
        if (phenotype.color?.name === standard.idealColor) {
            conformity += 50;
            notes.push('İdeal renk ✓');
        } else if (standard.acceptableColors.includes(phenotype.color?.name)) {
            conformity += 30;
            notes.push('Kabul edilebilir renk');
        } else {
            notes.push('Standart dışı renk ✗');
        }
        
        // Desen uyumu
        if (phenotype.pattern?.name === standard.idealPattern || 
            (phenotype.spread?.pattern === 'solid' && standard.idealPattern === 'Düz')) {
            conformity += 30;
            notes.push('İdeal desen ✓');
        } else {
            notes.push('Standart dışı desen ✗');
        }
        
        // Gerekli özellikler
        standard.requiredTraits.forEach(trait => {
            if (phenotype[trait]) {
                conformity += 20 / standard.requiredTraits.length;
                notes.push(`${trait} ✓`);
            } else {
                notes.push(`${trait} eksik ✗`);
            }
        });
        
        return {
            conformity: Math.min(100, conformity),
            notes: notes
        };
    },
    
    // Görsel güvercin temsili oluştur (SVG)
    generatePigeonVisualization(phenotype) {
        const svg = {
            width: 200,
            height: 200,
            elements: []
        };
        
        // Temel güvercin şekli
        const bodyColor = phenotype.visualRepresentation?.primaryColor || '#808080';
        const pattern = phenotype.visualRepresentation?.pattern || 'solid';
        
        // Gövde
        svg.elements.push({
            type: 'ellipse',
            cx: 100,
            cy: 120,
            rx: 60,
            ry: 40,
            fill: bodyColor,
            stroke: '#333',
            strokeWidth: 2
        });
        
        // Baş
        svg.elements.push({
            type: 'circle',
            cx: 100,
            cy: 70,
            r: 30,
            fill: bodyColor,
            stroke: '#333',
            strokeWidth: 2
        });
        
        // Desen ekle
        if (pattern === 'bar') {
            // Çizgili desen
            svg.elements.push({
                type: 'rect',
                x: 70,
                y: 110,
                width: 60,
                height: 5,
                fill: '#333',
                opacity: 0.3
            });
            svg.elements.push({
                type: 'rect',
                x: 70,
                y: 125,
                width: 60,
                height: 5,
                fill: '#333',
                opacity: 0.3
            });
        } else if (pattern === 'checker') {
            // Kareli desen
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 2; j++) {
                    svg.elements.push({
                        type: 'rect',
                        x: 70 + i * 20,
                        y: 105 + j * 20,
                        width: 15,
                        height: 15,
                        fill: '#333',
                        opacity: 0.3
                    });
                }
            }
        }
        
        return svg;
    }
};

// Export
window.PhenotypePredictor = PhenotypePredictor;