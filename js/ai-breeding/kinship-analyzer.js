// Akrabalık Analizi Modülü
// Güvercinler arası genetik ilişkileri hesaplar

const KinshipAnalyzer = {
    // Wright'ın akrabalık katsayısı formülü kullanarak hesaplama
    calculateWrightCoefficient(pigeon1, pigeon2, pedigreeData) {
        // Aynı güvercin kontrolü
        if (pigeon1.id === pigeon2.id) return 1.0;
        
        // Önbellekte var mı kontrol et
        const cached = this.getCachedCoefficient(pigeon1.id, pigeon2.id);
        if (cached !== null) return cached;
        
        // Ortak ataları bul
        const commonAncestors = this.findCommonAncestors(pigeon1, pigeon2, pedigreeData);
        
        if (commonAncestors.length === 0) {
            this.cacheCoefficient(pigeon1.id, pigeon2.id, 0);
            return 0;
        }
        
        // Wright formülü: F = Σ(1/2)^(n1+n2+1) * (1 + FA)
        let coefficient = 0;
        
        commonAncestors.forEach(ancestor => {
            const n1 = this.getGenerationDistance(pigeon1, ancestor, pedigreeData);
            const n2 = this.getGenerationDistance(pigeon2, ancestor, pedigreeData);
            
            if (n1 !== -1 && n2 !== -1) {
                // Ortak atanın kendi akrabalık katsayısı (şimdilik 0 varsayıyoruz)
                const ancestorInbreeding = 0;
                
                coefficient += Math.pow(0.5, n1 + n2 + 1) * (1 + ancestorInbreeding);
            }
        });
        
        this.cacheCoefficient(pigeon1.id, pigeon2.id, coefficient);
        return coefficient;
    },
    
    // İki güvercin arasındaki ilişki tipini belirle
    determineRelationshipType(pigeon1, pigeon2) {
        // Direkt anne-baba kontrolü
        if (pigeon1.father_id === pigeon2.id || pigeon1.mother_id === pigeon2.id) {
            return { type: 'parent', degree: 1, relation: 'Ebeveyn' };
        }
        if (pigeon2.father_id === pigeon1.id || pigeon2.mother_id === pigeon1.id) {
            return { type: 'offspring', degree: 1, relation: 'Yavru' };
        }
        
        // Kardeş kontrolü
        const sameParents = pigeon1.father_id && pigeon1.father_id === pigeon2.father_id &&
                           pigeon1.mother_id && pigeon1.mother_id === pigeon2.mother_id;
        if (sameParents) {
            return { type: 'sibling', degree: 1, relation: 'Kardeş' };
        }
        
        // Yarı kardeş kontrolü
        const sameFather = pigeon1.father_id && pigeon1.father_id === pigeon2.father_id;
        const sameMother = pigeon1.mother_id && pigeon1.mother_id === pigeon2.mother_id;
        if (sameFather || sameMother) {
            return { 
                type: 'half-sibling', 
                degree: 2, 
                relation: sameFather ? 'Baba bir kardeş' : 'Anne bir kardeş' 
            };
        }
        
        // Daha uzak ilişkiler için akrabalık katsayısına bak
        const coefficient = this.calculateWrightCoefficient(pigeon1, pigeon2, {});
        
        if (coefficient >= 0.25) {
            return { type: 'close-relative', degree: 2, relation: 'Yakın akraba' };
        } else if (coefficient >= 0.125) {
            return { type: 'cousin', degree: 3, relation: 'Kuzen' };
        } else if (coefficient >= 0.0625) {
            return { type: 'second-cousin', degree: 4, relation: 'İkinci kuzen' };
        } else if (coefficient > 0) {
            return { type: 'distant-relative', degree: 5, relation: 'Uzak akraba' };
        }
        
        return { type: 'unrelated', degree: 0, relation: 'Akraba değil' };
    },
    
    // Ortak ataları bul
    findCommonAncestors(pigeon1, pigeon2, pedigreeData) {
        const ancestors1 = this.getAllAncestors(pigeon1, pedigreeData);
        const ancestors2 = this.getAllAncestors(pigeon2, pedigreeData);
        
        // Ortak olanları bul
        const common = [];
        ancestors1.forEach(a1 => {
            if (ancestors2.some(a2 => a2.id === a1.id)) {
                common.push(a1);
            }
        });
        
        return common;
    },
    
    // Bir güvercinin tüm atalarını getir
    getAllAncestors(pigeon, pedigreeData, visited = new Set()) {
        const ancestors = [];
        
        // Döngüyü önle
        if (visited.has(pigeon.id)) return ancestors;
        visited.add(pigeon.id);
        
        // Anne
        if (pigeon.mother_id && pedigreeData[pigeon.mother_id]) {
            const mother = pedigreeData[pigeon.mother_id];
            ancestors.push(mother);
            ancestors.push(...this.getAllAncestors(mother, pedigreeData, visited));
        }
        
        // Baba
        if (pigeon.father_id && pedigreeData[pigeon.father_id]) {
            const father = pedigreeData[pigeon.father_id];
            ancestors.push(father);
            ancestors.push(...this.getAllAncestors(father, pedigreeData, visited));
        }
        
        return ancestors;
    },
    
    // İki güvercin arası nesil farkı
    getGenerationDistance(descendant, ancestor, pedigreeData, distance = 0, visited = new Set()) {
        // Kendisi mi?
        if (descendant.id === ancestor.id) return distance;
        
        // Döngüyü önle
        if (visited.has(descendant.id)) return -1;
        visited.add(descendant.id);
        
        // Anne tarafından kontrol
        if (descendant.mother_id && pedigreeData[descendant.mother_id]) {
            const motherDistance = this.getGenerationDistance(
                pedigreeData[descendant.mother_id], 
                ancestor, 
                pedigreeData, 
                distance + 1,
                new Set(visited)
            );
            if (motherDistance !== -1) return motherDistance;
        }
        
        // Baba tarafından kontrol
        if (descendant.father_id && pedigreeData[descendant.father_id]) {
            const fatherDistance = this.getGenerationDistance(
                pedigreeData[descendant.father_id], 
                ancestor, 
                pedigreeData, 
                distance + 1,
                new Set(visited)
            );
            if (fatherDistance !== -1) return fatherDistance;
        }
        
        return -1; // Bulunamadı
    },
    
    // Akrabalık derecesine göre risk değerlendirmesi
    assessInbreedingRisk(coefficient) {
        if (coefficient >= 0.5) {
            return {
                level: 'extreme',
                risk: 'Çok Yüksek',
                color: 'red',
                recommendation: 'Bu eşleştirme kesinlikle önerilmez. Ciddi genetik sorunlar ortaya çıkabilir.',
                healthRisk: 90
            };
        } else if (coefficient >= 0.25) {
            return {
                level: 'high',
                risk: 'Yüksek',
                color: 'orange',
                recommendation: 'Yakın akraba eşleştirmesi. Genetik çeşitlilik için farklı bir eş düşünün.',
                healthRisk: 60
            };
        } else if (coefficient >= 0.125) {
            return {
                level: 'moderate',
                risk: 'Orta',
                color: 'yellow',
                recommendation: 'Kabul edilebilir ancak sık tekrarlanmamalı.',
                healthRisk: 30
            };
        } else if (coefficient >= 0.0625) {
            return {
                level: 'low',
                risk: 'Düşük',
                color: 'lightgreen',
                recommendation: 'Güvenli eşleştirme. Minimal genetik risk.',
                healthRisk: 10
            };
        } else {
            return {
                level: 'minimal',
                risk: 'Minimal',
                color: 'green',
                recommendation: 'İdeal eşleştirme. Genetik çeşitlilik korunur.',
                healthRisk: 0
            };
        }
    },
    
    // Soy ağacı derinlik analizi
    analyzePedigreeDepth(pigeon, pedigreeData) {
        const analysis = {
            totalGenerations: 0,
            knownAncestors: 0,
            expectedAncestors: 0,
            completeness: 0,
            gaps: []
        };
        
        // Her nesil için analiz yap (5 nesile kadar)
        for (let gen = 1; gen <= 5; gen++) {
            const expectedCount = Math.pow(2, gen);
            const actualCount = this.countAncestorsAtGeneration(pigeon, gen, pedigreeData);
            
            analysis.expectedAncestors += expectedCount;
            analysis.knownAncestors += actualCount;
            
            if (actualCount > 0) {
                analysis.totalGenerations = gen;
            }
            
            if (actualCount < expectedCount) {
                analysis.gaps.push({
                    generation: gen,
                    missing: expectedCount - actualCount,
                    percentage: (actualCount / expectedCount) * 100
                });
            }
        }
        
        analysis.completeness = (analysis.knownAncestors / analysis.expectedAncestors) * 100;
        
        return analysis;
    },
    
    // Belirli nesildeki ata sayısı
    countAncestorsAtGeneration(pigeon, targetGen, pedigreeData, currentGen = 0) {
        if (currentGen === targetGen) return 1;
        if (!pigeon || currentGen > targetGen) return 0;
        
        let count = 0;
        
        if (pigeon.mother_id && pedigreeData[pigeon.mother_id]) {
            count += this.countAncestorsAtGeneration(
                pedigreeData[pigeon.mother_id], 
                targetGen, 
                pedigreeData, 
                currentGen + 1
            );
        }
        
        if (pigeon.father_id && pedigreeData[pigeon.father_id]) {
            count += this.countAncestorsAtGeneration(
                pedigreeData[pigeon.father_id], 
                targetGen, 
                pedigreeData, 
                currentGen + 1
            );
        }
        
        return count;
    },
    
    // Akrabalık katsayısı önbelleği
    coefficientCache: {},
    
    getCachedCoefficient(id1, id2) {
        const key = [id1, id2].sort().join('-');
        return this.coefficientCache[key] || null;
    },
    
    cacheCoefficient(id1, id2, value) {
        const key = [id1, id2].sort().join('-');
        this.coefficientCache[key] = value;
    },
    
    // Önbelleği temizle
    clearCache() {
        this.coefficientCache = {};
    },
    
    // Eşleştirme için akrabalık raporu
    generateKinshipReport(male, female, pedigreeData) {
        const coefficient = this.calculateWrightCoefficient(male, female, pedigreeData);
        const relationship = this.determineRelationshipType(male, female);
        const risk = this.assessInbreedingRisk(coefficient);
        const commonAncestors = this.findCommonAncestors(male, female, pedigreeData);
        
        return {
            coefficient: coefficient,
            coefficientPercentage: (coefficient * 100).toFixed(2),
            relationship: relationship,
            risk: risk,
            commonAncestors: commonAncestors.map(a => ({
                id: a.id,
                name: a.name,
                bandNumber: a.band_number,
                generationsFromMale: this.getGenerationDistance(male, a, pedigreeData),
                generationsFromFemale: this.getGenerationDistance(female, a, pedigreeData)
            })),
            recommendation: this.generateRecommendation(coefficient, relationship, risk),
            visualData: this.prepareVisualizationData(male, female, commonAncestors, pedigreeData)
        };
    },
    
    // Eşleştirme önerisi oluştur
    generateRecommendation(coefficient, relationship, risk) {
        const recommendations = [];
        
        if (risk.level === 'extreme' || risk.level === 'high') {
            recommendations.push({
                type: 'warning',
                icon: 'fas fa-exclamation-triangle',
                text: risk.recommendation
            });
        } else if (risk.level === 'moderate') {
            recommendations.push({
                type: 'caution',
                icon: 'fas fa-info-circle',
                text: risk.recommendation
            });
        } else {
            recommendations.push({
                type: 'success',
                icon: 'fas fa-check-circle',
                text: risk.recommendation
            });
        }
        
        // Genetik çeşitlilik önerisi
        if (coefficient < 0.0625) {
            recommendations.push({
                type: 'info',
                icon: 'fas fa-dna',
                text: 'Genetik çeşitlilik açısından ideal bir eşleştirme.'
            });
        }
        
        return recommendations;
    },
    
    // Görselleştirme için veri hazırla
    prepareVisualizationData(male, female, commonAncestors, pedigreeData) {
        // Basit bir soy ağacı görselleştirme verisi
        return {
            nodes: [
                { id: male.id, label: male.name, type: 'male', level: 0 },
                { id: female.id, label: female.name, type: 'female', level: 0 }
            ],
            edges: [],
            commonAncestorIds: commonAncestors.map(a => a.id)
        };
    }
};

// Export
window.KinshipAnalyzer = KinshipAnalyzer;