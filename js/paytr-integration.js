// PayTR iframe entegrasyonu için yardımcı fonksiyonlar

// Helper function to get supabase client
function getSupabaseClient() {
    if (window.supabaseClient && window.supabaseClient.client) {
        return window.supabaseClient.client;
    }
    console.error('[PayTR] Supabase client not available');
    return null;
}

// PayTR iframe callback fonksiyonu
window.callback = function(payment_status, payment_amount, payment_hash, merchant_oid) {
    console.log('PayTR callback:', { payment_status, payment_amount, payment_hash, merchant_oid });
    
    if (payment_status === 'success') {
        // Ödeme başarılı - kullanıcıya bilgi göster
        showPaymentSuccessModal(merchant_oid);
        
        // Premium durumunu kontrol et (notification worker işini yapana kadar)
        setTimeout(() => {
            checkAndUpdatePremiumStatus();
        }, 3000);
    } else {
        // Ödeme başarısız
        showPaymentFailureModal();
    }
};

// PayTR iframe ile ödeme başlatma
async function startPayTRPayment() {
    const supabase = getSupabaseClient();
    if (!supabase) {
        console.error('[PayTR] Supabase client not initialized');
        showError('Sistem hatası. Lütfen sayfayı yenileyin.');
        return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        showError('Lütfen önce giriş yapın.');
        return;
    }
    
    // Premium kontrolü
    const isPremium = await checkPremiumStatus(user.id);
    if (isPremium) {
        showError('Zaten premium üyesiniz.');
        return;
    }
    
    try {
        // Cloudflare Worker'a istek gönder
        const response = await fetch('https://pigeonpedigre-paytr.tamer-nem.workers.dev', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: user.id,
                user_email: user.email,
                user_name: user.user_metadata?.full_name || user.email.split('@')[0]
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // ÖNCELİK 1: Önce ödeme bilgisini kaydet
            const saveResult = await saveOrderToSupabase(user.id, result.merchant_oid, user.email);
            
            // Kayıt başarılıysa iframe'i göster
            if (saveResult && saveResult.success) {
                // ÖNCELİK 2: PayTR iframe'i göster
                showPayTRModal(result.token, result.merchant_oid);
            } else {
                // Kayıt başarısız oldu, kullanıcıyı bilgilendir
                showError('Ödeme kaydı oluşturulamadı. Lütfen tekrar deneyin.');
                console.error('Payment save failed for merchant_oid:', result.merchant_oid);
            }
        } else {
            showError('Ödeme başlatılamadı: ' + result.error);
        }
    } catch (error) {
        console.error('PayTR payment error:', error);
        showError('Ödeme sistemi geçici olarak kullanılamıyor.');
    }
}

// PayTR iframe modal'ını göster
function showPayTRModal(token, merchant_oid) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold">Güvenli Ödeme</h2>
                <button onclick="closePayTRModal()" class="text-gray-500 hover:text-gray-700">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div class="mb-4">
                <p class="text-sm text-gray-600">Sipariş No: ${merchant_oid}</p>
            </div>
            <iframe 
                src="https://www.paytr.com/odeme/guvenli/${token}" 
                id="paytriframe" 
                frameborder="0" 
                scrolling="yes" 
                style="width: 100%; height: 600px;">
            </iframe>
        </div>
    `;
    
    document.body.appendChild(modal);
    window.currentPayTRModal = modal;
}

// Modal'ı kapat
function closePayTRModal() {
    if (window.currentPayTRModal) {
        window.currentPayTRModal.remove();
        window.currentPayTRModal = null;
    }
}

// Ödeme başarı modal'ı
function showPaymentSuccessModal(merchant_oid) {
    closePayTRModal();
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div class="text-center">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Ödeme Başarılı!</h3>
                <p class="text-sm text-gray-500 mb-4">
                    Ödemeniz alındı. Premium üyeliğiniz kısa süre içinde aktif olacak.
                </p>
                <p class="text-xs text-gray-400 mb-4">Sipariş No: ${merchant_oid}</p>
                <button onclick="location.reload()" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                    Tamam
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Ödeme başarısız modal'ı
function showPaymentFailureModal() {
    closePayTRModal();
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div class="text-center">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Ödeme Başarısız</h3>
                <p class="text-sm text-gray-500 mb-4">
                    Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin.
                </p>
                <button onclick="this.closest('.fixed').remove()" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                    Tamam
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Ödeme bilgisini Supabase'e kaydet
async function saveOrderToSupabase(userId, merchantOid, userEmail) {
    try {
        console.log('Saving payment to Supabase:', { userId, merchantOid, userEmail });
        
        const supabase = getSupabaseClient();
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }
        const { data, error } = await supabase
            .from('payment_tracking')
            .insert({
                user_id: userId,
                merchant_oid: merchantOid,
                tracking_code: merchantOid, // Eski sistem ile uyumluluk için
                email: userEmail,
                amount: 39.90,
                currency: 'TRY',
                status: 'pending',
                created_at: new Date().toISOString()
            });
            
        if (error) {
            console.error('Payment save error:', error);
            // Merchant OID'yi kullanıcıya göster - destek için gerekebilir
            showError(`Ödeme kaydedilemedi. Sipariş No: ${merchantOid} - Hata: ${error.message}`);
            return { success: false, error };
        } else {
            console.log('Payment saved successfully:', data);
            return { success: true, data };
        }
    } catch (error) {
        console.error('Supabase error:', error);
        // Kritik hata durumunda merchant_oid'yi kullanıcıya göster
        showError(`Veritabanı hatası. Sipariş No: ${merchantOid} - Lütfen bu numarayı saklayın.`);
        return { success: false, error };
    }
}

// Premium durumunu kontrol et ve güncelle
async function checkAndUpdatePremiumStatus() {
    const supabase = getSupabaseClient();
    if (!supabase) {
        console.error('[PayTR] Supabase client not initialized');
        return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const isPremium = await checkPremiumStatus(user.id);
    
    if (isPremium) {
        // Premium badge'i güncelle
        updatePremiumBadge(true);
        
        // Başarı mesajı göster
        showSuccess('Premium üyeliğiniz aktif edildi!');
        
        // Sayfayı yenile
        setTimeout(() => {
            location.reload();
        }, 2000);
    }
}

// Hata mesajı göster
function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Başarı mesajı göster
function showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Premium badge güncelle
function updatePremiumBadge(isPremium) {
    const badge = document.getElementById('premiumBadge');
    if (badge) {
        if (isPremium) {
            badge.classList.remove('hidden');
            badge.textContent = 'Premium';
        } else {
            badge.classList.add('hidden');
        }
    }
}

// PayTR iframe'i aç
function openPayTRIframe() {
    startPayTRPayment();
}

// PayTR iframe'i kapat
function closePayTRIframe() {
    closePayTRModal();
}