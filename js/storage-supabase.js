// SUPABASE STORAGE OPERATIONS

const SupabaseStorage = {
    // Güvercin resmi yükle
    async uploadPigeonImage(file, pigeonId) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Kullanıcı girişi gerekli');

            // Dosya boyutu kontrolü (5MB)
            if (file.size > 5 * 1024 * 1024) {
                throw new Error('Dosya boyutu 5MB\'dan büyük olamaz');
            }

            // Dosya tipi kontrolü
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                throw new Error('Sadece JPG, PNG, WEBP ve GIF dosyaları yüklenebilir');
            }

            // Dosya adını oluştur
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/pigeon-${pigeonId}-${Date.now()}.${fileExt}`;

            // Dosyayı yükle
            const { data, error } = await supabase.storage
                .from('pigeon-images')
                .upload(fileName, file, {
                    upsert: true,
                    cacheControl: '3600'
                });

            if (error) throw error;

            // Public URL'i al
            const { data: urlData } = supabase.storage
                .from('pigeon-images')
                .getPublicUrl(fileName);

            // Güvercin kaydını güncelle
            const updateResult = await SupabaseDB.updatePigeon(pigeonId, {
                image_url: urlData.publicUrl
            });

            if (!updateResult.success) {
                throw new Error('Resim URL\'si kaydedilemedi');
            }

            return {
                success: true,
                url: urlData.publicUrl,
                path: data.path
            };

        } catch (error) {
            console.error('Upload pigeon image error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Güvercin resmini sil
    async deletePigeonImage(imagePath) {
        try {
            const { error } = await supabase.storage
                .from('pigeon-images')
                .remove([imagePath]);

            if (error) throw error;

            return { success: true };

        } catch (error) {
            console.error('Delete pigeon image error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // PDF rapor yükle
    async uploadPDFReport(pdfBlob, reportType, id) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Kullanıcı girişi gerekli');

            // Dosya boyutu kontrolü (10MB)
            if (pdfBlob.size > 10 * 1024 * 1024) {
                throw new Error('PDF dosyası 10MB\'dan büyük olamaz');
            }

            // Dosya adını oluştur
            const date = new Date().toISOString().split('T')[0];
            const fileName = `${user.id}/${reportType}-${id}-${date}.pdf`;

            // PDF'i yükle
            const { data, error } = await supabase.storage
                .from('documents')
                .upload(fileName, pdfBlob, {
                    contentType: 'application/pdf',
                    upsert: true
                });

            if (error) throw error;

            // Signed URL oluştur (1 saat geçerli)
            const { data: urlData, error: urlError } = await supabase.storage
                .from('documents')
                .createSignedUrl(fileName, 3600);

            if (urlError) throw urlError;

            return {
                success: true,
                url: urlData.signedUrl,
                path: data.path
            };

        } catch (error) {
            console.error('Upload PDF report error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Yedek oluştur ve yükle
    async createBackup() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Kullanıcı girişi gerekli');

            // Tüm verileri topla
            const backupData = {
                timestamp: new Date().toISOString(),
                user_id: user.id,
                data: {}
            };

            // Güvercinleri al
            const pigeons = await SupabaseDB.getPigeons(user.id);
            if (pigeons.success) backupData.data.pigeons = pigeons.data;

            // Eşleştirmeleri al
            const matings = await SupabaseDB.getMatings(user.id);
            if (matings.success) backupData.data.matings = matings.data;


            // Sağlık kayıtlarını al
            const healthRecords = await SupabaseDB.getHealthRecords();
            if (healthRecords.success) {
                backupData.data.healthRecords = healthRecords.data.filter(r => 
                    backupData.data.pigeons.some(p => p.id === r.pigeon_id)
                );
            }

            // Performans kayıtlarını al
            const performanceRecords = await SupabaseDB.getPerformanceRecords();
            if (performanceRecords.success) {
                backupData.data.performanceRecords = performanceRecords.data.filter(r => 
                    backupData.data.pigeons.some(p => p.id === r.pigeon_id)
                );
            }

            // JSON blob oluştur
            const blob = new Blob([JSON.stringify(backupData, null, 2)], {
                type: 'application/json'
            });

            // Dosya adını oluştur
            const date = new Date().toISOString().split('T')[0];
            const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
            const fileName = `${user.id}/backup-${date}-${time}.json`;

            // Yedeği yükle
            const { data, error } = await supabase.storage
                .from('backups')
                .upload(fileName, blob, {
                    contentType: 'application/json',
                    upsert: false
                });

            if (error) throw error;

            // Signed URL oluştur (24 saat geçerli)
            const { data: urlData, error: urlError } = await supabase.storage
                .from('backups')
                .createSignedUrl(fileName, 86400);

            if (urlError) throw urlError;

            return {
                success: true,
                url: urlData.signedUrl,
                path: data.path,
                fileName: fileName.split('/').pop()
            };

        } catch (error) {
            console.error('Create backup error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Yedekleri listele
    async listBackups() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Kullanıcı girişi gerekli');

            const { data, error } = await supabase.storage
                .from('backups')
                .list(user.id, {
                    limit: 20,
                    offset: 0,
                    sortBy: { column: 'created_at', order: 'desc' }
                });

            if (error) throw error;

            // Her dosya için signed URL oluştur
            const backupsWithUrls = await Promise.all(
                data.map(async (file) => {
                    const { data: urlData } = await supabase.storage
                        .from('backups')
                        .createSignedUrl(`${user.id}/${file.name}`, 3600);
                    
                    return {
                        ...file,
                        url: urlData?.signedUrl
                    };
                })
            );

            return {
                success: true,
                data: backupsWithUrls
            };

        } catch (error) {
            console.error('List backups error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Yedekten geri yükle
    async restoreFromBackup(backupUrl) {
        try {
            // Backup dosyasını indir
            const response = await fetch(backupUrl);
            if (!response.ok) throw new Error('Yedek dosyası indirilemedi');

            const backupData = await response.json();

            // Veri bütünlüğünü kontrol et
            if (!backupData.data || !backupData.user_id) {
                throw new Error('Geçersiz yedek dosyası');
            }

            // TODO: Geri yükleme işlemi karmaşık olduğu için
            // kullanıcıya onay aldıktan sonra yapılmalı
            // ve mevcut verilerin üzerine yazma stratejisi belirlenmeli

            return {
                success: true,
                message: 'Yedek dosyası doğrulandı',
                data: backupData
            };

        } catch (error) {
            console.error('Restore from backup error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
};

// Export
window.SupabaseStorage = SupabaseStorage;