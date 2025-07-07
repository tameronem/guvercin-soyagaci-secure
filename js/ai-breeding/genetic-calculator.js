// Genetik Hesaplama Modülü
// AI Güvercin Eşleştirme Sistemi için temel genetik hesaplamalar

const GeneticCalculator = {
    // Punnett karesi hesaplama
    calculatePunnettSquare(parent1Alleles, parent2Alleles) {
        const results = [];
        
        // Her anne aleli için
        for (const allele1 of parent1Alleles) {
            // Her baba aleli ile kombinasyon oluştur
            for (const allele2 of parent2Alleles) {
                results.push({
                    genotype: this.formatGenotype(allele1, allele2),
                    alleles: [allele1, allele2],
                    probability: (1 / parent1Alleles.length) * (1 / parent2Alleles.length)
                });
            }
        }
        
        // Aynı genotipleri birleştir
        const combined = this.combineGenotypes(results);
        return combined;
    },
    
    // Genotip formatlama (AA, Aa, aa şeklinde)
    formatGenotype(allele1, allele2) {
        // Baskın aleller önce yazılır
        const sorted = [allele1, allele2].sort((a, b) => {
            // Büyük harf (baskın) önce
            if (a === a.toUpperCase() && b === b.toLowerCase()) return -1;
            if (a === a.toLowerCase() && b === b.toUpperCase()) return 1;
            return a.localeCompare(b);
        });
        return sorted.join('');
    },
    
    // Aynı genotipleri birleştir ve olasılıkları topla
    combineGenotypes(results) {
        const combined = {};
        
        results.forEach(result => {
            const key = result.genotype;
            if (!combined[key]) {
                combined[key] = {
                    genotype: key,
                    probability: 0,
                    alleles: result.alleles
                };
            }
            combined[key].probability += result.probability;
        });
        
        return Object.values(combined);
    },
    
    // Fenotip tahmini
    predictPhenotype(genotype, trait) {
        const phenotypes = {
            // Renk genleri
            'BA': { // Ash-Red
                'BABA': 'Koyu Kırmızı',
                'BAB+': 'Kırmızı',
                'BAb': 'Açık Kırmızı',
                'B+B+': 'Mavi/Çizgili',
                'B+b': 'Mavi',
                'bb': 'Kahverengi'
            },
            'D': { // Dilute
                'DD': 'Normal Renk',
                'Dd': 'Normal Renk (Taşıyıcı)',
                'dd': 'Açık Renk'
            },
            'S': { // Spread
                'SS': 'Tam Yayılmış (Düz Renk)',
                'Ss': 'Yayılmış',
                'ss': 'Desenli'
            },
            'C': { // Pattern
                'CC': 'Tam Kareli',
                'CC+': 'Kareli',
                'CCT': 'Kareli-T Arası',
                'C+C+': 'Çizgili',
                'C+CT': 'Çizgili-T Arası',
                'CTCT': 'T-Desen'
            }
        };
        
        return phenotypes[trait]?.[genotype] || 'Bilinmeyen Fenotip';
    },
    
    // İki güvercinin genetik uyumluluğunu hesapla
    calculateCompatibility(male, female, preferences = {}) {
        const scores = {
            kinship: 0,
            diversity: 0,
            health: 0,
            phenotype: 0,
            performance: 0,
            colorCompatibility: 0  // Yeni renk uyumu skoru
        };
        
        // 1. Akrabalık skorunu hesapla (düşük akrabalık = yüksek skor)
        const kinshipCoeff = this.calculateKinshipCoefficient(male, female);
        scores.kinship = Math.max(0, 100 - (kinshipCoeff * 200)); // 0.5 akrabalık = 0 puan
        
        // 2. Genetik çeşitlilik skorunu hesapla
        scores.diversity = this.calculateGeneticDiversity(male.genetics, female.genetics);
        
        // 3. Sağlık risk skorunu hesapla
        const healthRisk = this.calculateHealthRisk(male.genetics, female.genetics);
        scores.health = Math.max(0, 100 - healthRisk);
        
        // 4. Fenotip uyum skorunu hesapla
        scores.phenotype = this.calculatePhenotypeCompatibility(male, female, preferences);
        
        // 5. Performans tahmin skorunu hesapla
        scores.performance = this.calculatePerformanceScore(male, female);
        
        // 6. Renk uyumluluk skorunu hesapla
        if (male.color && female.color && window.ColorPatternSystem) {
            const colorCompat = window.ColorPatternSystem.checkColorCompatibility(male.color, female.color);
            scores.colorCompatibility = colorCompat.score;
        }
        
        // Ağırlıklı toplam skor
        const weights = {
            kinship: preferences.kinshipWeight || 0.20,
            diversity: preferences.diversityWeight || 0.15,
            health: preferences.healthWeight || 0.20,
            phenotype: preferences.phenotypeWeight || 0.15,
            performance: preferences.performanceWeight || 0.15,
            colorCompatibility: preferences.colorWeight || 0.15
        };
        
        let totalScore = 0;
        let totalWeight = 0;
        
        for (const [key, score] of Object.entries(scores)) {
            totalScore += score * weights[key];
            totalWeight += weights[key];
        }
        
        return {
            totalScore: totalWeight > 0 ? totalScore / totalWeight : 0,
            details: scores,
            weights: weights
        };
    },
    
    // Basit akrabalık katsayısı hesaplama
    calculateKinshipCoefficient(pigeon1, pigeon2) {
        // TODO: Gerçek akrabalık hesaplaması veritabanından gelecek
        // Şimdilik basit bir simülasyon
        
        // Aynı güvercin
        if (pigeon1.id === pigeon2.id) return 1.0;
        
        // Anne-baba kontrol
        if (pigeon1.father_id === pigeon2.id || pigeon1.mother_id === pigeon2.id ||
            pigeon2.father_id === pigeon1.id || pigeon2.mother_id === pigeon1.id) {
            return 0.5;
        }
        
        // Kardeş kontrol
        if (pigeon1.father_id && pigeon1.father_id === pigeon2.father_id &&
            pigeon1.mother_id && pigeon1.mother_id === pigeon2.mother_id) {
            return 0.5;
        }
        
        // Yarı kardeş
        if ((pigeon1.father_id && pigeon1.father_id === pigeon2.father_id) ||
            (pigeon1.mother_id && pigeon1.mother_id === pigeon2.mother_id)) {
            return 0.25;
        }
        
        // Varsayılan: akraba değil
        return 0;
    },
    
    // Genetik çeşitlilik hesaplama
    calculateGeneticDiversity(maleGenetics, femaleGenetics) {
        if (!maleGenetics || !femaleGenetics) return 50;
        
        let diversityScore = 0;
        let traitCount = 0;
        
        // Her genetik özellik için
        maleGenetics.forEach(maleTrait => {
            const femaleTrait = femaleGenetics.find(f => f.trait_id === maleTrait.trait_id);
            if (femaleTrait) {
                // Farklı aleller = daha yüksek çeşitlilik
                const allelesSimilarity = this.calculateAlleleSimilarity(
                    [maleTrait.allele1, maleTrait.allele2],
                    [femaleTrait.allele1, femaleTrait.allele2]
                );
                diversityScore += (100 - allelesSimilarity);
                traitCount++;
            }
        });
        
        return traitCount > 0 ? diversityScore / traitCount : 50;
    },
    
    // Alel benzerliği hesaplama
    calculateAlleleSimilarity(alleles1, alleles2) {
        let matches = 0;
        const total = 4; // 2x2 karşılaştırma
        
        alleles1.forEach(a1 => {
            alleles2.forEach(a2 => {
                if (a1 === a2) matches++;
            });
        });
        
        return (matches / total) * 100;
    },
    
    // Sağlık riski hesaplama
    calculateHealthRisk(maleGenetics, femaleGenetics) {
        let riskScore = 0;
        const riskFactors = [];
        
        // Çekinik hastalık genlerini kontrol et
        const recessiveDisorders = ['z', 'cr', 'fr']; // Örnek çekinik hastalık genleri
        
        maleGenetics.forEach(maleTrait => {
            const femaleTrait = femaleGenetics.find(f => f.trait_id === maleTrait.trait_id);
            if (femaleTrait) {
                // Her iki ebeveyn de taşıyıcıysa risk var
                const maleCarrier = recessiveDisorders.includes(maleTrait.allele1.toLowerCase()) || 
                                   recessiveDisorders.includes(maleTrait.allele2.toLowerCase());
                const femaleCarrier = recessiveDisorders.includes(femaleTrait.allele1.toLowerCase()) || 
                                     recessiveDisorders.includes(femaleTrait.allele2.toLowerCase());
                
                if (maleCarrier && femaleCarrier) {
                    riskScore += 25; // %25 risk
                    riskFactors.push({
                        trait: maleTrait.trait_name,
                        risk: 'Çekinik hastalık riski'
                    });
                }
            }
        });
        
        // Akrabalık riski ekle
        const kinship = this.calculateKinshipCoefficient(
            { id: 'temp1', father_id: null, mother_id: null },
            { id: 'temp2', father_id: null, mother_id: null }
        );
        if (kinship > 0.125) { // Kuzen ve daha yakın
            riskScore += kinship * 50;
            riskFactors.push({
                type: 'kinship',
                risk: 'Yakın akrabalık riski'
            });
        }
        
        return Math.min(100, riskScore);
    },
    
    // Fenotip uyumluluk hesaplama
    calculatePhenotypeCompatibility(male, female, preferences) {
        if (!preferences.targetPhenotypes) return 75; // Varsayılan skor
        
        let compatibilityScore = 0;
        let traitCount = 0;
        
        // Her hedef fenotip için olasılık hesapla
        preferences.targetPhenotypes.forEach(target => {
            const probability = this.calculatePhenotypeProbability(
                male.genetics,
                female.genetics,
                target
            );
            compatibilityScore += probability * 100;
            traitCount++;
        });
        
        return traitCount > 0 ? compatibilityScore / traitCount : 75;
    },
    
    // Belirli bir fenotipin ortaya çıkma olasılığı
    calculatePhenotypeProbability(maleGenetics, femaleGenetics, targetPhenotype) {
        // Basitleştirilmiş hesaplama
        // Gerçek uygulamada daha karmaşık genetik etkileşimler olacak
        return 0.5; // %50 varsayılan
    },
    
    // Performans skoru hesaplama
    calculatePerformanceScore(male, female) {
        let score = 50; // Başlangıç skoru
        
        // Yarış performansı
        if (male.race_count > 0 && female.race_count > 0) {
            const avgPosition = (male.avg_position + female.avg_position) / 2;
            score += Math.max(0, 50 - avgPosition * 5); // İyi pozisyon = yüksek skor
        }
        
        // Sağlık geçmişi
        if (male.health_score && female.health_score) {
            score = (score + (male.health_score + female.health_score) / 2) / 2;
        }
        
        return Math.min(100, Math.max(0, score));
    },
    
    // Yavru tahmin simülasyonu
    simulateOffspring(maleGenetics, femaleGenetics, count = 10, maleColor = null, femaleColor = null) {
        const simulations = [];
        
        for (let i = 0; i < count; i++) {
            const offspring = {
                genetics: [],
                phenotypes: {},
                color: null,
                colorProbability: 0,
                healthScore: 0,
                performanceScore: 0
            };
            
            // Her genetik özellik için
            maleGenetics.forEach(maleTrait => {
                const femaleTrait = femaleGenetics.find(f => f.trait_id === maleTrait.trait_id);
                if (femaleTrait) {
                    // Rastgele alel seçimi (Mendel kanunları)
                    const maleAllele = Math.random() < 0.5 ? maleTrait.allele1 : maleTrait.allele2;
                    const femaleAllele = Math.random() < 0.5 ? femaleTrait.allele1 : femaleTrait.allele2;
                    
                    offspring.genetics.push({
                        trait_id: maleTrait.trait_id,
                        trait_name: maleTrait.trait_name,
                        allele1: maleAllele,
                        allele2: femaleAllele,
                        genotype: this.formatGenotype(maleAllele, femaleAllele)
                    });
                    
                    // Fenotip tahmini
                    offspring.phenotypes[maleTrait.trait_name] = this.predictPhenotype(
                        this.formatGenotype(maleAllele, femaleAllele),
                        maleTrait.trait_code
                    );
                }
            });
            
            // Renk tahmini
            if (maleColor && femaleColor && window.ColorPatternSystem) {
                const colorPredictions = window.ColorPatternSystem.predictOffspringColors(maleColor, femaleColor);
                if (colorPredictions && colorPredictions.length > 0) {
                    // Ağırlıklı rastgele seçim
                    const rand = Math.random() * 100;
                    let cumulative = 0;
                    for (const pred of colorPredictions) {
                        cumulative += pred.probability;
                        if (rand <= cumulative) {
                            offspring.color = pred.color;
                            offspring.colorProbability = pred.probability;
                            break;
                        }
                    }
                }
            }
            
            // Sağlık ve performans skorları (basit tahmin)
            offspring.healthScore = 70 + Math.random() * 30;
            offspring.performanceScore = 60 + Math.random() * 40;
            
            simulations.push(offspring);
        }
        
        return simulations;
    },
    
    // Simülasyon sonuçlarını özetle
    summarizeSimulations(simulations) {
        const summary = {
            phenotypeDistribution: {},
            colorDistribution: {},  // Renk dağılımı eklendi
            avgHealthScore: 0,
            avgPerformanceScore: 0,
            geneticVariability: 0
        };
        
        // Fenotip dağılımını hesapla
        simulations.forEach(sim => {
            Object.entries(sim.phenotypes).forEach(([trait, phenotype]) => {
                if (!summary.phenotypeDistribution[trait]) {
                    summary.phenotypeDistribution[trait] = {};
                }
                if (!summary.phenotypeDistribution[trait][phenotype]) {
                    summary.phenotypeDistribution[trait][phenotype] = 0;
                }
                summary.phenotypeDistribution[trait][phenotype]++;
            });
            
            // Renk dağılımını hesapla
            if (sim.color) {
                if (!summary.colorDistribution[sim.color]) {
                    summary.colorDistribution[sim.color] = 0;
                }
                summary.colorDistribution[sim.color]++;
            }
            
            summary.avgHealthScore += sim.healthScore;
            summary.avgPerformanceScore += sim.performanceScore;
        });
        
        // Ortalamaları hesapla
        summary.avgHealthScore /= simulations.length;
        summary.avgPerformanceScore /= simulations.length;
        
        // Yüzdelere çevir
        Object.keys(summary.phenotypeDistribution).forEach(trait => {
            const total = simulations.length;
            Object.keys(summary.phenotypeDistribution[trait]).forEach(phenotype => {
                summary.phenotypeDistribution[trait][phenotype] = 
                    (summary.phenotypeDistribution[trait][phenotype] / total) * 100;
            });
        });
        
        // Renk dağılımını yüzdeye çevir
        Object.keys(summary.colorDistribution).forEach(color => {
            summary.colorDistribution[color] = 
                (summary.colorDistribution[color] / simulations.length) * 100;
        });
        
        return summary;
    }
};

// Export
window.GeneticCalculator = GeneticCalculator;