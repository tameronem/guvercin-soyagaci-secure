// Uyumluluk Skorlama Modülü
// Eşleştirme uyumluluğunu çok boyutlu analiz eder

const CompatibilityScorer = {
    // Ana skorlama fonksiyonu
    async calculateBreedingScore(male, female, preferences = {}) {
        console.log('Eşleştirme uyumluluğu hesaplanıyor...', { male: male.name, female: female.name });
        
        // Varsayılan tercihler
        const defaultPreferences = {
            priorityColor: false,
            priorityPerformance: true,
            priorityHealth: true,
            priorityDiversity: true,
            targetColors: [],
            targetPatterns: [],
            avoidInbreeding: true,
            inbreedingTolerance: 0.125, // %12.5 - kuzen seviyesi
            minimumHealthScore: 70,
            breedStandard: null
        };
        
        const prefs = { ...defaultPreferences, ...preferences };
        
        // Skorlama bileşenleri
        const scores = {
            genetic: await this.calculateGeneticScore(male, female, prefs),
            health: await this.calculateHealthScore(male, female, prefs),
            performance: await this.calculatePerformanceScore(male, female, prefs),
            phenotype: await this.calculatePhenotypeScore(male, female, prefs),
            fertility: await this.calculateFertilityScore(male, female),
            experience: await this.calculateExperienceScore(male, female)
        };
        
        // Ağırlıkları belirle
        const weights = this.determineWeights(prefs);
        
        // Ağırlıklı toplam skor
        let totalScore = 0;
        let totalWeight = 0;
        
        Object.keys(scores).forEach(category => {
            if (weights[category] > 0) {
                totalScore += scores[category].score * weights[category];
                totalWeight += weights[category];
            }
        });
        
        const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
        
        // Detaylı rapor oluştur
        const report = this.generateDetailedReport(male, female, scores, weights, finalScore, prefs);
        
        return {
            totalScore: finalScore,
            scores: scores,
            weights: weights,
            report: report,
            recommendation: this.generateRecommendation(finalScore, scores, prefs),
            warnings: this.generateWarnings(scores, prefs),
            advantages: this.generateAdvantages(scores, prefs)
        };
    },
    
    // Genetik skor hesaplama
    async calculateGeneticScore(male, female, prefs) {
        const score = {
            score: 0,
            details: {},
            factors: []
        };
        
        // Akrabalık analizi
        const kinshipCoeff = KinshipAnalyzer.calculateWrightCoefficient(male, female, {});
        const kinshipRisk = KinshipAnalyzer.assessInbreedingRisk(kinshipCoeff);
        
        // Akrabalık skoru (düşük akrabalık = yüksek skor)
        let kinshipScore = 100;
        if (prefs.avoidInbreeding) {
            if (kinshipCoeff > prefs.inbreedingTolerance) {
                kinshipScore = Math.max(0, 100 - (kinshipCoeff * 400)); // Hızlı düşüş
            } else {
                kinshipScore = 100 - (kinshipCoeff * 100); // Normal düşüş
            }
        }
        
        score.details.kinship = {
            coefficient: kinshipCoeff,
            score: kinshipScore,
            risk: kinshipRisk
        };
        score.factors.push({
            name: 'Akrabalık Durumu',
            value: kinshipScore,
            description: kinshipRisk.recommendation
        });
        
        // Genetik çeşitlilik
        const diversityScore = this.calculateDiversityScore(male, female);
        score.details.diversity = diversityScore;
        score.factors.push({
            name: 'Genetik Çeşitlilik',
            value: diversityScore,
            description: diversityScore > 70 ? 'Yüksek çeşitlilik' : 'Düşük çeşitlilik'
        });
        
        // Heterozigotluk avantajı
        const heterozygosityScore = this.calculateHeterozygosityAdvantage(male, female);
        score.details.heterozygosity = heterozygosityScore;
        score.factors.push({
            name: 'Heterozigot Avantajı',
            value: heterozygosityScore,
            description: 'Yavrularda gen çeşitliliği'
        });
        
        // Toplam genetik skor
        score.score = (kinshipScore * 0.5 + diversityScore * 0.3 + heterozygosityScore * 0.2);
        
        return score;
    },
    
    // Sağlık skoru hesaplama
    async calculateHealthScore(male, female, prefs) {
        const score = {
            score: 0,
            details: {},
            factors: []
        };
        
        // Bireysel sağlık skorları
        const maleHealth = male.genetic_health_score || 80;
        const femaleHealth = female.genetic_health_score || 80;
        const avgHealth = (maleHealth + femaleHealth) / 2;
        
        score.details.individualHealth = {
            male: maleHealth,
            female: femaleHealth,
            average: avgHealth
        };
        
        // Minimum sağlık kontrolü
        if (avgHealth < prefs.minimumHealthScore) {
            score.score = avgHealth * 0.5; // Ceza uygula
            score.factors.push({
                name: 'Düşük Sağlık Skoru',
                value: score.score,
                description: 'Minimum sağlık kriterini karşılamıyor'
            });
        } else {
            score.score = avgHealth;
            score.factors.push({
                name: 'Sağlık Durumu',
                value: avgHealth,
                description: avgHealth > 85 ? 'Mükemmel' : 'İyi'
            });
        }
        
        // Genetik hastalık riski
        const diseaseRisk = await this.calculateDiseaseRisk(male, female);
        score.details.diseaseRisk = diseaseRisk;
        
        if (diseaseRisk.totalRisk > 0) {
            score.score *= (1 - diseaseRisk.totalRisk / 100);
            score.factors.push({
                name: 'Hastalık Riski',
                value: 100 - diseaseRisk.totalRisk,
                description: `${diseaseRisk.risks.length} potansiyel risk tespit edildi`
            });
        }
        
        // Yaşam gücü (vitality) tahmini
        const vitalityScore = this.estimateOffspringVitality(male, female);
        score.details.vitality = vitalityScore;
        score.factors.push({
            name: 'Yavru Yaşam Gücü',
            value: vitalityScore,
            description: vitalityScore > 80 ? 'Yüksek' : 'Orta'
        });
        
        // Final sağlık skoru
        score.score = (score.score * 0.6 + vitalityScore * 0.4);
        
        return score;
    },
    
    // Performans skoru hesaplama
    async calculatePerformanceScore(male, female, prefs) {
        const score = {
            score: 0,
            details: {},
            factors: []
        };
        
        // Yarış performansları
        const maleRaceScore = this.calculateRacePerformance(male);
        const femaleRaceScore = this.calculateRacePerformance(female);
        const avgRaceScore = (maleRaceScore + femaleRaceScore) / 2;
        
        score.details.racing = {
            male: maleRaceScore,
            female: femaleRaceScore,
            average: avgRaceScore
        };
        score.factors.push({
            name: 'Yarış Performansı',
            value: avgRaceScore,
            description: avgRaceScore > 70 ? 'Yüksek performans' : 'Orta performans'
        });
        
        // Atletik yapı uyumu
        const athleticCompatibility = this.calculateAthleticCompatibility(male, female);
        score.details.athletic = athleticCompatibility;
        score.factors.push({
            name: 'Atletik Uyum',
            value: athleticCompatibility,
            description: 'Fiziksel özellik uyumu'
        });
        
        // Performans genlerinin kalıtımı
        const performanceInheritance = this.estimatePerformanceInheritance(male, female);
        score.details.inheritance = performanceInheritance;
        score.factors.push({
            name: 'Performans Kalıtımı',
            value: performanceInheritance,
            description: 'Yavruya aktarım potansiyeli'
        });
        
        // Toplam performans skoru
        score.score = (avgRaceScore * 0.5 + athleticCompatibility * 0.3 + performanceInheritance * 0.2);
        
        return score;
    },
    
    // Fenotip skoru hesaplama
    async calculatePhenotypeScore(male, female, prefs) {
        const score = {
            score: 0,
            details: {},
            factors: []
        };
        
        // Hedef renklere uyum
        if (prefs.targetColors && prefs.targetColors.length > 0) {
            const colorScore = this.calculateTargetColorScore(male, female, prefs.targetColors);
            score.details.color = colorScore;
            score.factors.push({
                name: 'Hedef Renk Uyumu',
                value: colorScore,
                description: `${prefs.targetColors.join(', ')} hedefleniyor`
            });
            score.score += colorScore * 0.4;
        } else {
            score.score += 75 * 0.4; // Varsayılan
        }
        
        // Hedef desenlere uyum
        if (prefs.targetPatterns && prefs.targetPatterns.length > 0) {
            const patternScore = this.calculateTargetPatternScore(male, female, prefs.targetPatterns);
            score.details.pattern = patternScore;
            score.factors.push({
                name: 'Hedef Desen Uyumu',
                value: patternScore,
                description: `${prefs.targetPatterns.join(', ')} hedefleniyor`
            });
            score.score += patternScore * 0.3;
        } else {
            score.score += 75 * 0.3; // Varsayılan
        }
        
        // Irk standardına uyum
        if (prefs.breedStandard) {
            const standardScore = this.calculateBreedStandardScore(male, female, prefs.breedStandard);
            score.details.standard = standardScore;
            score.factors.push({
                name: 'Irk Standardı',
                value: standardScore,
                description: `${prefs.breedStandard} standardı`
            });
            score.score += standardScore * 0.3;
        } else {
            score.score += 75 * 0.3; // Varsayılan
        }
        
        return score;
    },
    
    // Üreme/doğurganlık skoru
    async calculateFertilityScore(male, female) {
        const score = {
            score: 0,
            details: {},
            factors: []
        };
        
        // Yaş uygunluğu
        const ageScore = this.calculateAgeCompatibility(male, female);
        score.details.age = ageScore;
        score.factors.push({
            name: 'Yaş Uygunluğu',
            value: ageScore.score,
            description: ageScore.description
        });
        
        // Önceki üreme başarısı
        const breedingHistory = this.analyzeBreedingHistory(male, female);
        score.details.history = breedingHistory;
        score.factors.push({
            name: 'Üreme Geçmişi',
            value: breedingHistory.score,
            description: breedingHistory.description
        });
        
        // Toplam doğurganlık skoru
        score.score = (ageScore.score * 0.4 + breedingHistory.score * 0.6);
        
        return score;
    },
    
    // Deneyim skoru
    async calculateExperienceScore(male, female) {
        const score = {
            score: 0,
            details: {},
            factors: []
        };
        
        // Ebeveynlik deneyimi
        const parentingExp = this.calculateParentingExperience(male, female);
        score.details.parenting = parentingExp;
        score.factors.push({
            name: 'Ebeveynlik Deneyimi',
            value: parentingExp,
            description: parentingExp > 70 ? 'Deneyimli' : 'Az deneyimli'
        });
        
        score.score = parentingExp;
        return score;
    },
    
    // Yardımcı fonksiyonlar
    
    calculateDiversityScore(male, female) {
        // Basit çeşitlilik hesaplaması
        // Gerçek uygulamada genetik verilere dayanacak
        return 70 + Math.random() * 30;
    },
    
    calculateHeterozygosityAdvantage(male, female) {
        // Heterozigot avantajı hesaplaması
        return 60 + Math.random() * 40;
    },
    
    async calculateDiseaseRisk(male, female) {
        // Hastalık riski analizi
        const risks = [];
        let totalRisk = 0;
        
        // Örnek risk kontrolü
        if (male.genetic_health_score < 60 && female.genetic_health_score < 60) {
            risks.push({ name: 'Düşük bağışıklık', risk: 30 });
            totalRisk += 30;
        }
        
        return { risks, totalRisk };
    },
    
    estimateOffspringVitality(male, female) {
        // Yavru yaşam gücü tahmini
        const baseVitality = 80;
        const healthBonus = ((male.genetic_health_score || 80) + (female.genetic_health_score || 80)) / 2 - 80;
        return Math.min(100, baseVitality + healthBonus);
    },
    
    calculateRacePerformance(pigeon) {
        // Yarış performans skoru
        if (!pigeon.race_count || pigeon.race_count === 0) return 50;
        
        // Ortalama pozisyon bazlı skor
        const avgPosition = pigeon.avg_position || 50;
        return Math.max(0, 100 - avgPosition);
    },
    
    calculateAthleticCompatibility(male, female) {
        // Atletik uyumluluk
        return 70 + Math.random() * 30;
    },
    
    estimatePerformanceInheritance(male, female) {
        // Performans kalıtımı tahmini
        return 65 + Math.random() * 35;
    },
    
    calculateTargetColorScore(male, female, targetColors) {
        // Hedef renk uyumu
        // Gerçek uygulamada genetik hesaplama yapılacak
        return 60 + Math.random() * 40;
    },
    
    calculateTargetPatternScore(male, female, targetPatterns) {
        // Hedef desen uyumu
        return 60 + Math.random() * 40;
    },
    
    calculateBreedStandardScore(male, female, breedStandard) {
        // Irk standardı uyumu
        return 70 + Math.random() * 30;
    },
    
    calculateAgeCompatibility(male, female) {
        const maleAge = this.calculateAge(male.birth_date);
        const femaleAge = this.calculateAge(female.birth_date);
        
        // İdeal yaş aralığı: 1-5 yaş
        let score = 100;
        let description = 'İdeal yaş';
        
        if (maleAge < 1 || femaleAge < 1) {
            score = 30;
            description = 'Çok genç';
        } else if (maleAge > 7 || femaleAge > 7) {
            score = 50;
            description = 'Yaşlı';
        } else if (Math.abs(maleAge - femaleAge) > 4) {
            score = 70;
            description = 'Yaş farkı fazla';
        }
        
        return { score, description, maleAge, femaleAge };
    },
    
    calculateAge(birthDate) {
        if (!birthDate) return 2; // Varsayılan
        const birth = new Date(birthDate);
        const today = new Date();
        return Math.floor((today - birth) / (365.25 * 24 * 60 * 60 * 1000));
    },
    
    analyzeBreedingHistory(male, female) {
        // Üreme geçmişi analizi
        // TODO: Gerçek veri ile değiştirilecek
        return {
            score: 80,
            description: 'İyi üreme geçmişi'
        };
    },
    
    calculateParentingExperience(male, female) {
        // Ebeveynlik deneyimi
        // TODO: Gerçek veri ile değiştirilecek
        return 75;
    },
    
    // Ağırlıkları belirle
    determineWeights(preferences) {
        const weights = {
            genetic: 0.25,
            health: 0.25,
            performance: 0.20,
            phenotype: 0.15,
            fertility: 0.10,
            experience: 0.05
        };
        
        // Tercihlere göre ağırlıkları ayarla
        if (preferences.priorityHealth) {
            weights.health = 0.35;
            weights.genetic = 0.30;
        }
        
        if (preferences.priorityPerformance) {
            weights.performance = 0.30;
        }
        
        if (preferences.priorityColor) {
            weights.phenotype = 0.25;
        }
        
        if (preferences.priorityDiversity) {
            weights.genetic = 0.35;
        }
        
        // Normalize et
        const total = Object.values(weights).reduce((a, b) => a + b, 0);
        Object.keys(weights).forEach(key => {
            weights[key] = weights[key] / total;
        });
        
        return weights;
    },
    
    // Detaylı rapor oluştur
    generateDetailedReport(male, female, scores, weights, finalScore, preferences) {
        return {
            summary: {
                maleName: male.name,
                femaleName: female.name,
                finalScore: finalScore,
                recommendation: finalScore > 80 ? 'Mükemmel' : finalScore > 60 ? 'İyi' : 'Orta',
                date: new Date().toISOString()
            },
            scores: scores,
            weights: weights,
            preferences: preferences,
            details: {
                genetic: scores.genetic.details,
                health: scores.health.details,
                performance: scores.performance.details,
                phenotype: scores.phenotype.details,
                fertility: scores.fertility.details
            }
        };
    },
    
    // Öneri oluştur
    generateRecommendation(finalScore, scores, preferences) {
        if (finalScore >= 80) {
            return {
                level: 'excellent',
                text: 'Mükemmel eşleştirme! Tüm kriterler optimal seviyede.',
                icon: 'fas fa-star',
                color: 'green'
            };
        } else if (finalScore >= 60) {
            return {
                level: 'good',
                text: 'İyi bir eşleştirme. Bazı alanlarda iyileştirme potansiyeli var.',
                icon: 'fas fa-check',
                color: 'blue'
            };
        } else if (finalScore >= 40) {
            return {
                level: 'moderate',
                text: 'Orta seviye eşleştirme. Dikkatli değerlendirin.',
                icon: 'fas fa-info-circle',
                color: 'yellow'
            };
        } else {
            return {
                level: 'poor',
                text: 'Zayıf eşleştirme. Başka seçenekleri değerlendirin.',
                icon: 'fas fa-exclamation-triangle',
                color: 'red'
            };
        }
    },
    
    // Uyarılar oluştur
    generateWarnings(scores, preferences) {
        const warnings = [];
        
        if (scores.genetic.details.kinship?.coefficient > preferences.inbreedingTolerance) {
            warnings.push({
                type: 'genetic',
                severity: 'high',
                text: 'Yüksek akrabalık derecesi tespit edildi'
            });
        }
        
        if (scores.health.score < 60) {
            warnings.push({
                type: 'health',
                severity: 'medium',
                text: 'Sağlık skorları ortalamanın altında'
            });
        }
        
        if (scores.fertility.details.age?.score < 50) {
            warnings.push({
                type: 'fertility',
                severity: 'low',
                text: 'Yaş uygunluğu optimal değil'
            });
        }
        
        return warnings;
    },
    
    // Avantajlar oluştur
    generateAdvantages(scores, preferences) {
        const advantages = [];
        
        if (scores.genetic.score > 80) {
            advantages.push({
                type: 'genetic',
                text: 'Mükemmel genetik çeşitlilik'
            });
        }
        
        if (scores.performance.score > 75) {
            advantages.push({
                type: 'performance',
                text: 'Yüksek performans potansiyeli'
            });
        }
        
        if (scores.health.score > 85) {
            advantages.push({
                type: 'health',
                text: 'Sağlıklı ve güçlü yavrular bekleniyor'
            });
        }
        
        return advantages;
    }
};

// Export
window.CompatibilityScorer = CompatibilityScorer;