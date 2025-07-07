// SUPABASE DATABASE OPERATIONS

const SupabaseDB = {
    // ===================== PIGEONS =====================
    
    // Güvercinleri getir
    async getPigeons(userId = null) {
        try {
            let query = supabase
                .from('pigeons')
                .select(`
                    *,
                    father:father_id(id, name, band_number),
                    mother:mother_id(id, name, band_number)
                `)
                .order('created_at', { ascending: false });

            // Kullanıcı ID'si verilmişse filtrele
            if (userId) {
                query = query.eq('user_id', userId);
            }

            const { data, error } = await query;
            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Get pigeons error:', error);
            return { success: false, error: error.message };
        }
    },

    // Tek güvercin getir
    async getPigeon(pigeonId) {
        try {
            const { data, error } = await supabase
                .from('pigeons')
                .select(`
                    *,
                    father:father_id(id, name, band_number),
                    mother:mother_id(id, name, band_number)
                `)
                .eq('id', pigeonId)
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Get pigeon error:', error);
            return { success: false, error: error.message };
        }
    },

    // Güvercin ekle
    async addPigeon(pigeonData) {
        try {
            // Premium limit kontrolü
            const { data: { user } } = await supabase.auth.getUser();
            const premiumStatus = await supabaseClient.checkPremiumStatus(user.id);
            
            // Mevcut güvercin sayısını kontrol et
            const { data: pigeonCount } = await supabase
                .from('pigeons')
                .select('id', { count: 'exact' })
                .eq('user_id', user.id);

            if (pigeonCount && pigeonCount.length >= premiumStatus.limit) {
                throw new Error(`Güvercin limitinize (${premiumStatus.limit}) ulaştınız. Plan yükseltmeyi düşünün.`);
            }

            // Güvercin verilerini hazırla
            const dataToInsert = {
                user_id: user.id,
                name: pigeonData.name,
                band_number: pigeonData.bandNumber,
                gender: pigeonData.gender,
                breed: pigeonData.breed,
                color: pigeonData.color || null,
                color_details: pigeonData.colorDetails || null,
                birth_date: pigeonData.birthDate,
                father_id: pigeonData.fatherId || null,
                mother_id: pigeonData.motherId || null,
                description: pigeonData.description || null,
                image_url: pigeonData.imageUrl || null
            };

            const { data, error } = await supabase
                .from('pigeons')
                .insert(dataToInsert)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Add pigeon error:', error);
            return { success: false, error: error.message };
        }
    },

    // Güvercin güncelle
    async updatePigeon(pigeonId, updateData) {
        try {
            const { data, error } = await supabase
                .from('pigeons')
                .update({
                    name: updateData.name,
                    band_number: updateData.bandNumber,
                    gender: updateData.gender,
                    breed: updateData.breed,
                    birth_date: updateData.birthDate,
                    father_id: updateData.fatherId || null,
                    mother_id: updateData.motherId || null,
                    description: updateData.description || null,
                    image_url: updateData.image_url
                })
                .eq('id', pigeonId)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Update pigeon error:', error);
            return { success: false, error: error.message };
        }
    },

    // Güvercin sil
    async deletePigeon(pigeonId) {
        try {
            const { error } = await supabase
                .from('pigeons')
                .delete()
                .eq('id', pigeonId);

            if (error) throw error;

            return { success: true };
        } catch (error) {
            console.error('Delete pigeon error:', error);
            return { success: false, error: error.message };
        }
    },

    // ===================== MATINGS =====================

    // Tek eşleştirme getir
    async getMating(matingId) {
        try {
            const { data, error } = await supabase
                .from('matings')
                .select(`
                    *,
                    male:male_id(id, name, band_number),
                    female:female_id(id, name, band_number)
                `)
                .eq('id', matingId)
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Get mating error:', error);
            return { success: false, error: error.message };
        }
    },

    // Eşleştirmeleri getir
    async getMatings(userId = null) {
        try {
            let query = supabase
                .from('matings')
                .select(`
                    *,
                    male:male_id(id, name, band_number),
                    female:female_id(id, name, band_number)
                `)
                .order('mating_date', { ascending: false });

            if (userId) {
                query = query.eq('user_id', userId);
            }

            const { data, error } = await query;
            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Get matings error:', error);
            return { success: false, error: error.message };
        }
    },

    // Eşleştirme ekle
    async addMating(matingData) {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const dataToInsert = {
                user_id: user.id,
                male_id: matingData.maleId,
                female_id: matingData.femaleId,
                mating_date: matingData.matingDate,
                egg_laying_date: matingData.eggLayingDate || null,
                expected_hatch_date: matingData.expectedHatchDate || null,
                hatched: matingData.hatched || false,
                notes: matingData.notes || null
            };

            const { data, error } = await supabase
                .from('matings')
                .insert(dataToInsert)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Add mating error:', error);
            return { success: false, error: error.message };
        }
    },

    // Eşleştirme güncelle
    async updateMating(matingId, updateData) {
        try {
            const { data, error } = await supabase
                .from('matings')
                .update({
                    male_id: updateData.maleId,
                    female_id: updateData.femaleId,
                    mating_date: updateData.matingDate,
                    egg_laying_date: updateData.eggLayingDate || null,
                    expected_hatch_date: updateData.expectedHatchDate || null,
                    hatched: updateData.hatched || false,
                    notes: updateData.notes || null
                })
                .eq('id', matingId)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Update mating error:', error);
            return { success: false, error: error.message };
        }
    },

    // Eşleştirme sil
    async deleteMating(matingId) {
        try {
            const { error } = await supabase
                .from('matings')
                .delete()
                .eq('id', matingId);

            if (error) throw error;

            return { success: true };
        } catch (error) {
            console.error('Delete mating error:', error);
            return { success: false, error: error.message };
        }
    },

    // ===================== HEALTH RECORDS =====================

    // Sağlık kayıtlarını getir
    async getHealthRecords(pigeonId = null) {
        try {
            let query = supabase
                .from('health_records')
                .select(`
                    *,
                    pigeon:pigeon_id(id, name, band_number)
                `)
                .order('date', { ascending: false });

            if (pigeonId) {
                query = query.eq('pigeon_id', pigeonId);
            }

            const { data, error } = await query;
            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Get health records error:', error);
            return { success: false, error: error.message };
        }
    },

    // Sağlık kaydı ekle
    async addHealthRecord(recordData) {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const dataToInsert = {
                user_id: user.id,
                pigeon_id: recordData.pigeonId,
                type: recordData.type,
                date: recordData.date,
                description: recordData.description || null,
                veterinarian: recordData.veterinarian || null,
                cost: recordData.cost || null,
                next_due_date: recordData.nextDueDate || null
            };

            const { data, error } = await supabase
                .from('health_records')
                .insert(dataToInsert)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Add health record error:', error);
            return { success: false, error: error.message };
        }
    },

    // ===================== PERFORMANCE RECORDS =====================

    // Performans kayıtlarını getir
    async getPerformanceRecords(pigeonId = null) {
        try {
            let query = supabase
                .from('performance_records')
                .select(`
                    *,
                    pigeon:pigeon_id(id, name, band_number)
                `)
                .order('date', { ascending: false });

            if (pigeonId) {
                query = query.eq('pigeon_id', pigeonId);
            }

            const { data, error } = await query;
            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Get performance records error:', error);
            return { success: false, error: error.message };
        }
    },

    // Performans kaydı ekle
    async addPerformanceRecord(recordData) {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const dataToInsert = {
                user_id: user.id,
                pigeon_id: recordData.pigeonId,
                performance_type: recordData.performanceType,
                date: recordData.date,
                notes: recordData.notes || null,
                overall_score: recordData.overallScore || null,
                performance_data: recordData.performanceData || {}
            };

            const { data, error } = await supabase
                .from('performance_records')
                .insert(dataToInsert)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Add performance record error:', error);
            return { success: false, error: error.message };
        }
    }
};

// Export
window.SupabaseDB = SupabaseDB;