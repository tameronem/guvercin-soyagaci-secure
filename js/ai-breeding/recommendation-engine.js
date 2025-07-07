// Öneri Motoru Modülü
// Kullanıcıya en uygun eşleştirme önerilerini sunar

const RecommendationEngine = {
    // Bir güvercin için en iyi eşleştirme önerilerini getir
    async getBreedingRecommendations(targetPigeon, candidatePigeons, preferences = {}, limit = 10) {
        console.log(`${targetPigeon.name} için eşleştirme önerileri hazırlanıyor...`);
        
        // Hedef güvercinin cinsiyetine göre adayları filtrele
        const eligibleCandidates = candidatePigeons.filter(candidate => {
            // Karşı cins olmalı
            if (targetPigeon.gender === candidate.gender) return false;
            
            // Kendisi olmamalı
            if (targetPigeon.id === candidate.id) return false;
            
            // Yaş uygunluğu (1-8 yaş arası)
            const age = this.calculateAge(candidate.birth_date);
            if (age < 1 || age > 8) return false;
            
            return true;
        });
        
        console.log(`${eligibleCandidates.length} uygun aday bulundu`);
        
        // Her aday için skor hesapla
        const recommendations = [];
        
        for (const candidate of eligibleCandidates) {
            const male = targetPigeon.gender === 'male' ? targetPigeon : candidate;
            const female = targetPigeon.gender === 'female' ? targetPigeon : candidate;
            
            // Uyumluluk skorunu hesapla
            const compatibility = await CompatibilityScorer.calculateBreedingScore(
                male, 
                female, 
                preferences
            );
            
            // Fenotip tahminleri
            const phenotypePredictions = this.getPhenotypePredictions(male, female);
            
            // Öneri oluştur
            recommendations.push({
                targetPigeon: targetPigeon,
                candidatePigeon: candidate,
                male: male,
                female: female,
                compatibility: compatibility,
                phenotypePredictions: phenotypePredictions,
                matchReasons: this.generateMatchReasons(compatibility, phenotypePredictions),
                quickStats: this.generateQuickStats(compatibility)
            });
        }
        
        // Skorlara göre sırala
        recommendations.sort((a, b) => b.compatibility.totalScore - a.compatibility.totalScore);
        
        // Kategorize et
        const categorized = this.categorizeRecommendations(recommendations);
        
        // İlk N öneriyi döndür
        return {
            recommendations: recommendations.slice(0, limit),
            categories: categorized,
            summary: this.generateSummary(recommendations, targetPigeon)
        };
    },
    
    // Çoklu güvercin için optimal eşleştirme planı
    async generateOptimalPairings(pigeons, preferences = {}) {
        console.log('Optimal eşleştirme planı oluşturuluyor...');
        
        // Erkek ve dişileri ayır
        const males = pigeons.filter(p => p.gender === 'male' && this.isBreedingAge(p));
        const females = pigeons.filter(p => p.gender === 'female' && this.isBreedingAge(p));
        
        if (males.length === 0 || females.length === 0) {
            return {
                success: false,
                message: 'Yeterli sayıda uygun erkek veya dişi güvercin bulunamadı',
                pairings: []
            };
        }
        
        // Tüm olası kombinasyonları hesapla
        const allCombinations = [];
        
        for (const male of males) {
            for (const female of females) {
                const compatibility = await CompatibilityScorer.calculateBreedingScore(
                    male, 
                    female, 
                    preferences
                );
                
                allCombinations.push({
                    male: male,
                    female: female,
                    score: compatibility.totalScore,
                    compatibility: compatibility
                });
            }
        }
        
        // Optimal eşleştirmeleri bul (Hungarian algoritması benzeri)
        const optimalPairings = this.findOptimalMatching(allCombinations, males, females);
        
        // Sezon planı oluştur
        const seasonPlan = this.createSeasonPlan(optimalPairings);
        
        return {
            success: true,
            pairings: optimalPairings,
            seasonPlan: seasonPlan,
            statistics: this.generatePairingStatistics(optimalPairings),
            alternativePairings: this.findAlternativePairings(allCombinations, optimalPairings)
        };
    },
    
    // Akıllı filtreleme ve öneri sistemi
    async getSmartRecommendations(targetPigeon, allPigeons, userHistory = {}) {
        // Kullanıcının geçmiş tercihlerini analiz et
        const learnedPreferences = this.analyzeUserPreferences(userHistory);
        
        // Hedef güvercinin özelliklerine göre tercih tahmin et
        const predictedPreferences = this.predictPreferences(targetPigeon);
        
        // Tercihleri birleştir
        const combinedPreferences = {
            ...predictedPreferences,
            ...learnedPreferences
        };
        
        // Standart önerileri al
        const basicRecommendations = await this.getBreedingRecommendations(
            targetPigeon,
            allPigeons,
            combinedPreferences
        );
        
        // Özel durumları ekle
        const enhancedRecommendations = this.enhanceRecommendations(
            basicRecommendations.recommendations,
            targetPigeon,
            userHistory
        );
        
        return {
            recommendations: enhancedRecommendations,
            learnedPreferences: learnedPreferences,
            insights: this.generateInsights(enhancedRecommendations, targetPigeon)
        };
    },
    
    // Yardımcı fonksiyonlar
    
    calculateAge(birthDate) {
        if (!birthDate) return 2; // Varsayılan
        const birth = new Date(birthDate);
        const today = new Date();
        return Math.floor((today - birth) / (365.25 * 24 * 60 * 60 * 1000));
    },
    
    isBreedingAge(pigeon) {
        const age = this.calculateAge(pigeon.birth_date);
        return age >= 1 && age <= 8;
    },
    
    getPhenotypePredictions(male, female) {
        // Basitleştirilmiş fenotip tahmini
        // Gerçek uygulamada PhenotypePredictor kullanılacak
        return {
            colorProbabilities: {
                'Kırmızı': 40,
                'Mavi': 35,
                'Kahverengi': 25
            },
            patternProbabilities: {
                'Düz': 50,
                'Çizgili': 30,
                'Kareli': 20
            }
        };
    },
    
    generateMatchReasons(compatibility, phenotypePredictions) {
        const reasons = [];
        
        // Yüksek skorlu alanları belirle
        if (compatibility.scores.genetic.score > 80) {
            reasons.push({
                icon: 'fas fa-dna',
                text: 'Mükemmel genetik uyum',
                color: 'text-green-400'
            });
        }
        
        if (compatibility.scores.health.score > 85) {
            reasons.push({
                icon: 'fas fa-heart',
                text: 'Sağlıklı yavrular bekleniyor',
                color: 'text-red-400'
            });
        }
        
        if (compatibility.scores.performance.score > 75) {
            reasons.push({
                icon: 'fas fa-trophy',
                text: 'Yüksek performans potansiyeli',
                color: 'text-yellow-400'
            });
        }
        
        // Fenotip tahminlerine göre
        const dominantColor = Object.entries(phenotypePredictions.colorProbabilities)
            .sort((a, b) => b[1] - a[1])[0];
        
        reasons.push({
            icon: 'fas fa-palette',
            text: `%${dominantColor[1]} ${dominantColor[0]} yavru olasılığı`,
            color: 'text-purple-400'
        });
        
        return reasons;
    },
    
    generateQuickStats(compatibility) {
        return {
            overallScore: Math.round(compatibility.totalScore),
            geneticDiversity: Math.round(compatibility.scores.genetic.score),
            healthScore: Math.round(compatibility.scores.health.score),
            performanceScore: Math.round(compatibility.scores.performance.score)
        };
    },
    
    categorizeRecommendations(recommendations) {
        const categories = {
            excellent: [],
            good: [],
            moderate: [],
            poor: []
        };
        
        recommendations.forEach(rec => {
            const score = rec.compatibility.totalScore;
            if (score >= 80) {
                categories.excellent.push(rec);
            } else if (score >= 60) {
                categories.good.push(rec);
            } else if (score >= 40) {
                categories.moderate.push(rec);
            } else {
                categories.poor.push(rec);
            }
        });
        
        return categories;
    },
    
    generateSummary(recommendations, targetPigeon) {
        const topRecommendation = recommendations[0];
        const avgScore = recommendations.reduce((sum, r) => sum + r.compatibility.totalScore, 0) / recommendations.length;
        
        return {
            targetPigeon: targetPigeon.name,
            totalCandidates: recommendations.length,
            averageCompatibility: Math.round(avgScore),
            topMatch: topRecommendation ? {
                name: topRecommendation.candidatePigeon.name,
                score: Math.round(topRecommendation.compatibility.totalScore)
            } : null,
            excellentMatches: recommendations.filter(r => r.compatibility.totalScore >= 80).length,
            goodMatches: recommendations.filter(r => r.compatibility.totalScore >= 60 && r.compatibility.totalScore < 80).length
        };
    },
    
    findOptimalMatching(combinations, males, females) {
        // Basit açgözlü algoritma - gerçek uygulamada Hungarian algoritması kullanılabilir
        const used = new Set();
        const pairings = [];
        
        // Skorlara göre sırala
        combinations.sort((a, b) => b.score - a.score);
        
        for (const combo of combinations) {
            const maleKey = `m-${combo.male.id}`;
            const femaleKey = `f-${combo.female.id}`;
            
            // Her güvercin sadece bir kez eşleşebilir
            if (!used.has(maleKey) && !used.has(femaleKey)) {
                pairings.push({
                    ...combo,
                    pairingId: `${combo.male.id}-${combo.female.id}`,
                    priority: pairings.length + 1
                });
                used.add(maleKey);
                used.add(femaleKey);
            }
            
            // Tüm güvercinler eşleştiyse dur
            if (pairings.length >= Math.min(males.length, females.length)) {
                break;
            }
        }
        
        return pairings;
    },
    
    createSeasonPlan(pairings) {
        // Eşleştirmeleri sezon boyunca dağıt
        const plan = {
            phases: [],
            totalDuration: '6 ay',
            recommendedStart: new Date()
        };
        
        // 3 faza böl
        const pairingsPerPhase = Math.ceil(pairings.length / 3);
        
        for (let phase = 0; phase < 3; phase++) {
            const start = phase * pairingsPerPhase;
            const end = Math.min(start + pairingsPerPhase, pairings.length);
            const phasePairings = pairings.slice(start, end);
            
            plan.phases.push({
                phaseNumber: phase + 1,
                startMonth: phase * 2 + 1,
                pairings: phasePairings,
                focus: phase === 0 ? 'En iyi eşleştirmeler' : phase === 1 ? 'Dengeli eşleştirmeler' : 'Deneysel eşleştirmeler'
            });
        }
        
        return plan;
    },
    
    generatePairingStatistics(pairings) {
        const stats = {
            totalPairings: pairings.length,
            averageScore: 0,
            scoreDistribution: {
                excellent: 0,
                good: 0,
                moderate: 0,
                poor: 0
            },
            geneticDiversity: 0,
            expectedOffspring: pairings.length * 2 // Ortalama 2 yavru
        };
        
        let totalScore = 0;
        let totalDiversity = 0;
        
        pairings.forEach(pairing => {
            totalScore += pairing.score;
            totalDiversity += pairing.compatibility.scores.genetic.score;
            
            if (pairing.score >= 80) stats.scoreDistribution.excellent++;
            else if (pairing.score >= 60) stats.scoreDistribution.good++;
            else if (pairing.score >= 40) stats.scoreDistribution.moderate++;
            else stats.scoreDistribution.poor++;
        });
        
        stats.averageScore = Math.round(totalScore / pairings.length);
        stats.geneticDiversity = Math.round(totalDiversity / pairings.length);
        
        return stats;
    },
    
    findAlternativePairings(allCombinations, selectedPairings) {
        const usedPigeons = new Set();
        selectedPairings.forEach(p => {
            usedPigeons.add(p.male.id);
            usedPigeons.add(p.female.id);
        });
        
        // Kullanılmayan güvercinlerin en iyi eşleştirmelerini bul
        const alternatives = allCombinations
            .filter(combo => !usedPigeons.has(combo.male.id) || !usedPigeons.has(combo.female.id))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
        
        return alternatives;
    },
    
    analyzeUserPreferences(userHistory) {
        // Kullanıcı geçmişinden tercih analizi
        const preferences = {
            priorityColor: false,
            priorityPerformance: false,
            priorityHealth: true,
            priorityDiversity: true
        };
        
        // TODO: Gerçek geçmiş analizine göre güncelle
        
        return preferences;
    },
    
    predictPreferences(targetPigeon) {
        // Güvercin özelliklerine göre tercih tahmini
        const preferences = {};
        
        // Yarış güverciniyse performans öncelikli
        if (targetPigeon.race_count > 5) {
            preferences.priorityPerformance = true;
        }
        
        // Nadir renkte ise renk korunması öncelikli
        if (targetPigeon.breed && targetPigeon.breed.includes('Nadir')) {
            preferences.priorityColor = true;
        }
        
        return preferences;
    },
    
    enhanceRecommendations(recommendations, targetPigeon, userHistory) {
        // Önerileri zenginleştir
        return recommendations.map(rec => {
            const enhanced = { ...rec };
            
            // Özel durumları ekle
            if (rec.candidatePigeon.awards && rec.candidatePigeon.awards.length > 0) {
                enhanced.specialBadge = {
                    icon: 'fas fa-award',
                    text: 'Ödüllü güvercin',
                    color: 'text-yellow-400'
                };
            }
            
            // Popülerlik skoru
            enhanced.popularityScore = this.calculatePopularityScore(rec.candidatePigeon, userHistory);
            
            return enhanced;
        });
    },
    
    calculatePopularityScore(pigeon, userHistory) {
        // Basit popülerlik hesaplaması
        return Math.random() * 100;
    },
    
    generateInsights(recommendations, targetPigeon) {
        const insights = [];
        
        // En yüksek skorlu eşleştirme analizi
        if (recommendations.length > 0) {
            const topMatch = recommendations[0];
            insights.push({
                type: 'top_match',
                title: 'En İyi Eşleştirme',
                description: `${topMatch.candidatePigeon.name} ile %${Math.round(topMatch.compatibility.totalScore)} uyum`,
                icon: 'fas fa-star'
            });
        }
        
        // Ortak özellikler
        const commonTraits = this.findCommonTraits(recommendations.slice(0, 3));
        if (commonTraits.length > 0) {
            insights.push({
                type: 'common_traits',
                title: 'Önerilen Ortak Özellikler',
                description: commonTraits.join(', '),
                icon: 'fas fa-search'
            });
        }
        
        // Risk uyarısı
        const highRiskCount = recommendations.filter(r => 
            r.compatibility.warnings && r.compatibility.warnings.length > 0
        ).length;
        
        if (highRiskCount > recommendations.length / 2) {
            insights.push({
                type: 'risk_warning',
                title: 'Sınırlı Seçenekler',
                description: 'Mevcut adayların çoğunda risk faktörleri var',
                icon: 'fas fa-exclamation-triangle'
            });
        }
        
        return insights;
    },
    
    findCommonTraits(topRecommendations) {
        // En iyi önerilerdeki ortak özellikleri bul
        const traits = [];
        
        // TODO: Gerçek özellik analizi
        
        return traits;
    }
};

// Export
window.RecommendationEngine = RecommendationEngine;