// Premium Üyelik Sistemi
// =====================

console.log('Loading premium-system.js...');

// Wrap everything in try-catch to prevent script errors
try {

// Function to initialize when dependencies are ready
function initializePremiumSystem() {
    console.log('Initializing premium system...');
    
    // Supabase client'ı al
    const supabase = window.supabaseClient?.client || window.supabase;
    
    if (!supabase) {
        console.error('Supabase client not found! Make sure supabase-client.js is loaded first.');
        return false;
    }
    
    // Check for required dependencies
    if (typeof window.SupabaseAuth === 'undefined') {
        console.warn('SupabaseAuth not available yet');
        return false;
    }
    
    return true;
}

// Try to initialize immediately
let initialized = initializePremiumSystem();

// If not initialized, wait for DOM ready
if (!initialized) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initialized = initializePremiumSystem();
            if (!initialized) {
                console.error('Failed to initialize premium system even after DOM ready');
            }
        });
    }
}

// Get supabase reference (may be undefined initially)
let supabase = window.supabaseClient?.client || window.supabase;

// Function to get supabase client
function getSupabase() {
    if (!supabase) {
        supabase = window.supabaseClient?.client || window.supabase;
    }
    return supabase;
}

// İyziLink yapılandırması
const IYZI_LINKS = {
    tr: 'https://iyzi.link/AKLYCA',
    en: 'https://iyzi.link/AKLYDQ'
};

// Premium özellikleri kontrolü
async function checkPremiumStatus(userId = null) {
    try {
        if (!window.SupabaseAuth || typeof window.SupabaseAuth.getCurrentUser !== 'function') {
            console.error('SupabaseAuth not available');
            return false;
        }
        const targetUserId = userId || (await window.SupabaseAuth.getCurrentUser()).id;
        
        // RPC yerine direkt sorgu kullan
        const { data, error } = await getSupabase()
            .from('premium_subscriptions')
            .select('*')
            .eq('user_id', targetUserId)
            .eq('status', 'active')
            .gte('end_date', new Date().toISOString());
        
        if (error) {
            throw error;
        }
        
        // Data artık bir array, eğer boşsa false, doluysa true döndür
        return data && data.length > 0;
    } catch (error) {
        console.error('Premium status check error:', error);
        return false;
    }
}

// Takip kodu oluşturma
async function generateTrackingCode() {
    let code;
    let exists = true;
    
    // Benzersiz kod bulana kadar dene
    while (exists) {
        // PRM-XXXXX formatında kod oluştur
        code = 'PRM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // Kodun benzersiz olduğunu kontrol et
        const { data, error } = await getSupabase()
            .from('payment_tracking')
            .select('tracking_code')
            .eq('tracking_code', code);
        
        // Eğer error varsa (RLS hatası vb.) veya data boş array değilse, kod mevcut
        if (error) {
            console.error('Tracking code check error:', error);
            // Hata durumunda yeni kod dene
            exists = true;
        } else {
            // Data boş array ise kod benzersiz
            exists = data && data.length > 0;
        }
    }
    
    return code;
}

// Telefon numarası formatlama
function formatPhoneNumber(input) {
    // Sadece rakamları al
    let value = input.value.replace(/\D/g, '');
    
    // Türkiye formatı için başında 0 varsa kaldır
    if (value.startsWith('0')) {
        value = value.substring(1);
    }
    
    // Format: 5XX XXX XX XX
    if (value.length > 0) {
        if (value.length <= 3) {
            input.value = value;
        } else if (value.length <= 6) {
            input.value = value.slice(0, 3) + ' ' + value.slice(3);
        } else if (value.length <= 8) {
            input.value = value.slice(0, 3) + ' ' + value.slice(3, 6) + ' ' + value.slice(6);
        } else {
            input.value = value.slice(0, 3) + ' ' + value.slice(3, 6) + ' ' + value.slice(6, 8) + ' ' + value.slice(8, 10);
        }
    }
}

// E-posta uyumsuzluk kontrolü
function checkEmailMatch(inputEmail) {
    const currentUserEmail = document.getElementById('currentUserEmail')?.value;
    const warningDiv = document.getElementById('emailWarning');
    const warningText = document.getElementById('emailWarningText');
    
    if (currentUserEmail && inputEmail.toLowerCase() !== currentUserEmail.toLowerCase()) {
        warningDiv.classList.remove('hidden');
        warningText.textContent = (window.currentLang || 'tr') === 'tr' ? 
            `Kayıtlı e-postanız: ${currentUserEmail}. Farklı bir e-posta kullanırsanız doğrulama zorlaşabilir.` :
            `Your registered email: ${currentUserEmail}. Using a different email may complicate verification.`;
    } else {
        warningDiv.classList.add('hidden');
    }
}

// Onay kutusu kontrolü
function checkConfirmation() {
    const confirmCheckbox = document.getElementById('confirmInfo');
    const proceedButton = document.getElementById('proceedButton');
    
    if (confirmCheckbox.checked) {
        proceedButton.disabled = false;
    } else {
        proceedButton.disabled = true;
    }
}

// Premium satın alma başlangıcı
async function handlePremiumPurchase() {
    // Giriş kontrolü
    if (typeof window.checkAuth !== 'function' || !window.checkAuth()) {
        if (typeof window.openAuthModal === 'function') {
            window.openAuthModal('login');
        }
        if (typeof window.showNotification === 'function') {
            window.showNotification(
                (window.currentLang || 'tr') === 'tr' ? 
                    'Premium üyelik için giriş yapmanız gerekiyor' : 
                    'You need to login for premium membership',
                'warning'
            );
        }
        return;
    }
    
    // Zaten premium mu kontrol et
    const isPremium = await checkPremiumStatus();
    if (isPremium) {
        window.showNotification(
            (window.currentLang || 'tr') === 'tr' ? 
                'Zaten premium üyesiniz!' : 
                'You already have premium membership!',
            'info'
        );
        return;
    }
    
    // Ödeme formunu göster
    showPaymentForm();
}

// Ödeme formu modalı
async function showPaymentForm() {
    const user = await window.SupabaseAuth.getCurrentUser();
    const trackingCode = await generateTrackingCode();
    
    const modal = `
        <div id="paymentFormModal" class="modal" style="display: flex; z-index: 9999;">
            <div class="modal-content glass p-8 rounded-3xl max-w-lg" style="max-height: 90vh; overflow-y: auto;">
                <span class="absolute top-4 right-4 text-3xl cursor-pointer hover:text-red-400" onclick="closePaymentModal()">&times;</span>
                
                <h3 class="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    ${(window.currentLang || 'tr') === 'tr' ? 'Premium Üyelik Bilgileri' : 'Premium Membership Information'}
                </h3>
                
                <!-- Takip Kodu -->
                <div class="bg-purple-900/30 p-4 rounded-2xl mb-6 text-center">
                    <p class="text-sm text-gray-400 mb-1">
                        ${(window.currentLang || 'tr') === 'tr' ? 'Takip Kodunuz:' : 'Your Tracking Code:'}
                    </p>
                    <div class="text-2xl font-mono font-bold text-purple-400 flex items-center justify-center gap-2">
                        <span>${trackingCode}</span>
                        <button onclick="copyToClipboard('${trackingCode}')" class="text-sm text-gray-400 hover:text-white">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">
                        ${(window.currentLang || 'tr') === 'tr' ? 
                            'Bu kodu saklayın, ödeme takibi için gerekli' : 
                            'Save this code, required for payment tracking'}
                    </p>
                </div>
                
                <!-- Uyarı -->
                <div class="bg-yellow-900/30 border border-yellow-600 p-4 rounded-lg mb-6">
                    <p class="text-sm text-yellow-300">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        ${(window.currentLang || 'tr') === 'tr' ? 
                            'Lütfen bilgilerinizi doğru girdiğinizden emin olun. Yanlış bilgi ödeme doğrulamasını zorlaştırır.' : 
                            'Please ensure your information is correct. Incorrect info will complicate payment verification.'}
                    </p>
                </div>
                
                <form id="paymentInfoForm" onsubmit="proceedToPayment(event, '${trackingCode}')">
                    <!-- E-posta -->
                    <div class="mb-4">
                        <label class="block text-gray-300 mb-2">
                            ${(window.currentLang || 'tr') === 'tr' ? 'E-posta Adresiniz' : 'Your Email'}
                        </label>
                        <input type="hidden" id="currentUserEmail" value="${user.email}">
                        <input type="email" 
                               id="paymentEmail" 
                               value="${user.email}"
                               onblur="checkEmailMatch(this.value)"
                               required
                               class="w-full p-3 bg-black/50 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none">
                        <div id="emailWarning" class="hidden mt-2 text-sm text-yellow-400">
                            <i class="fas fa-warning mr-1"></i>
                            <span id="emailWarningText"></span>
                        </div>
                    </div>
                    
                    <!-- Telefon -->
                    <div class="mb-4">
                        <label class="block text-gray-300 mb-2">
                            ${(window.currentLang || 'tr') === 'tr' ? 'Telefon Numaranız' : 'Phone Number'}
                            <span class="text-red-400">*</span>
                        </label>
                        <input type="tel" 
                               id="paymentPhone" 
                               placeholder="${(window.currentLang || 'tr') === 'tr' ? '5XX XXX XX XX' : '+90 5XX XXX XX XX'}"
                               oninput="formatPhoneNumber(this)"
                               maxlength="13"
                               required
                               class="w-full p-3 bg-black/50 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none">
                        <p class="text-xs text-gray-500 mt-1">
                            ${(window.currentLang || 'tr') === 'tr' ? 
                                'İyziLink ödemesinde kullanacağınız telefon numarası' : 
                                'Phone number you will use in iyziLink payment'}
                        </p>
                    </div>
                    
                    <!-- Fiyat Bilgisi -->
                    <div class="bg-black/50 p-4 rounded-lg mb-6 text-center">
                        <p class="text-lg font-bold">
                            ${(window.currentLang || 'tr') === 'tr' ? '₺39.90 / Ay' : '$9.99 / Month'}
                        </p>
                        <p class="text-sm text-gray-400">
                            ${(window.currentLang || 'tr') === 'tr' ? 'Premium Üyelik' : 'Premium Membership'}
                        </p>
                    </div>
                    
                    <!-- Onay Kutusu -->
                    <div class="mb-6">
                        <label class="flex items-start gap-2 cursor-pointer">
                            <input type="checkbox" 
                                   id="confirmInfo" 
                                   onchange="checkConfirmation()"
                                   class="mt-1">
                            <span class="text-sm text-gray-300">
                                ${(window.currentLang || 'tr') === 'tr' ? 
                                    'Bilgilerimin doğru olduğunu ve iyziLink ödemesinde aynı bilgileri kullanacağımı onaylıyorum.' : 
                                    'I confirm my information is correct and I will use the same information in iyziLink payment.'}
                            </span>
                        </label>
                    </div>
                    
                    <button type="submit"
                            id="proceedButton"
                            disabled
                            class="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
                        ${(window.currentLang || 'tr') === 'tr' ? 'Ödemeye Geç' : 'Proceed to Payment'}
                    </button>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

// Ödemeye geçiş
async function proceedToPayment(event, trackingCode) {
    event.preventDefault();
    
    const email = document.getElementById('paymentEmail').value;
    const phone = document.getElementById('paymentPhone').value.replace(/\s/g, '');
    
    // Telefon validasyonu
    if ((window.currentLang || 'tr') === 'tr' && (!phone.startsWith('5') || phone.length !== 10)) {
        window.showNotification(
            'Lütfen geçerli bir telefon numarası girin (5XX XXX XX XX)',
            'error'
        );
        return;
    }
    
    try {
        // Loading göster
        window.showNotification(
            (window.currentLang || 'tr') === 'tr' ? 'İşleniyor...' : 'Processing...',
            'info'
        );
        
        // Ödeme takip kaydı oluştur
        const user = await window.SupabaseAuth.getCurrentUser();
        const { data, error } = await getSupabase()
            .from('payment_tracking')
            .insert({
                user_id: user.id,
                tracking_code: trackingCode,
                email: email,
                phone: phone,
                amount: (window.currentLang || 'tr') === 'tr' ? 39.90 : 9.99,
                currency: (window.currentLang || 'tr') === 'tr' ? 'TRY' : 'USD',
                iyzi_link: IYZI_LINKS[window.currentLang || 'tr'],
                status: 'pending'
            })
            .select()
            .single();
        
        if (error) throw error;
        
        // Formu kapat
        closePaymentModal();
        
        // Ödeme talimatlarını göster
        showPaymentInstructions(trackingCode, email, phone);
        
    } catch (error) {
        console.error('Payment process error:', error);
        window.showNotification(
            (window.currentLang || 'tr') === 'tr' ? 
                'Bir hata oluştu. Lütfen tekrar deneyin.' : 
                'An error occurred. Please try again.',
            'error'
        );
    }
}

// Ödeme talimatları modalı
function showPaymentInstructions(trackingCode, email, phone) {
    const iyziLink = IYZI_LINKS[window.currentLang || 'tr'];
    
    const modal = `
        <div id="paymentInstructionsModal" class="modal" style="display: flex; z-index: 9999;">
            <div class="modal-content glass p-8 rounded-3xl max-w-lg">
                <h3 class="text-2xl font-bold mb-6 text-center">
                    ${(window.currentLang || 'tr') === 'tr' ? 'Ödeme Talimatları' : 'Payment Instructions'}
                </h3>
                
                <!-- Kayıtlı Bilgiler -->
                <div class="bg-black/50 p-4 rounded-lg mb-6">
                    <h4 class="font-bold mb-3 text-purple-400">
                        ${(window.currentLang || 'tr') === 'tr' ? 'Kayıtlı Bilgileriniz:' : 'Your Registered Information:'}
                    </h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-400">${(window.currentLang || 'tr') === 'tr' ? 'Takip Kodu:' : 'Tracking Code:'}</span>
                            <span class="font-mono font-bold text-purple-400">${trackingCode}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">E-posta:</span>
                            <span>${email}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">${(window.currentLang || 'tr') === 'tr' ? 'Telefon:' : 'Phone:'}</span>
                            <span>${phone}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Adımlar -->
                <div class="space-y-4 mb-6">
                    <div class="flex items-start gap-3">
                        <span class="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">1</span>
                        <div>
                            <p class="font-semibold mb-1">
                                ${(window.currentLang || 'tr') === 'tr' ? 'Ödeme Sayfasına Gidin' : 'Go to Payment Page'}
                            </p>
                            <p class="text-sm text-gray-400">
                                ${(window.currentLang || 'tr') === 'tr' ? 
                                    'Aşağıdaki butona tıklayarak iyziLink ödeme sayfasına gidin' : 
                                    'Click the button below to go to iyziLink payment page'}
                            </p>
                        </div>
                    </div>
                    
                    <div class="flex items-start gap-3">
                        <span class="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">2</span>
                        <div>
                            <p class="font-semibold mb-1">
                                ${(window.currentLang || 'tr') === 'tr' ? 'Bilgileri Girin' : 'Enter Information'}
                            </p>
                            <p class="text-sm text-gray-400">
                                ${(window.currentLang || 'tr') === 'tr' ? 
                                    'Yukarıdaki e-posta ve telefon bilgilerini kullanın' : 
                                    'Use the email and phone information above'}
                            </p>
                        </div>
                    </div>
                    
                    <div class="flex items-start gap-3">
                        <span class="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">3</span>
                        <div>
                            <p class="font-semibold mb-1">
                                ${(window.currentLang || 'tr') === 'tr' ? 'Ödemeyi Tamamlayın' : 'Complete Payment'}
                            </p>
                            <p class="text-sm text-gray-400">
                                ${(window.currentLang || 'tr') === 'tr' ? 
                                    'Kredi kartı veya banka kartı ile ödeme yapın' : 
                                    'Pay with credit or debit card'}
                            </p>
                        </div>
                    </div>
                    
                    <div class="flex items-start gap-3">
                        <span class="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">4</span>
                        <div>
                            <p class="font-semibold mb-1">
                                ${(window.currentLang || 'tr') === 'tr' ? 'Buraya Dönün' : 'Return Here'}
                            </p>
                            <p class="text-sm text-gray-400">
                                ${(window.currentLang || 'tr') === 'tr' ? 
                                    'Ödeme sonrası "Ödemeyi Yaptım" butonuna tıklayın' : 
                                    'After payment, click "I Made the Payment" button'}
                            </p>
                        </div>
                    </div>
                </div>
                
                <!-- Ödeme Butonu -->
                <a href="${iyziLink}" 
                   target="_blank" 
                   class="block w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center rounded-full font-bold hover:from-purple-600 hover:to-pink-600 transition mb-4">
                    <i class="fas fa-external-link-alt mr-2"></i>
                    ${(window.currentLang || 'tr') === 'tr' ? 'İyziLink Ödeme Sayfasına Git' : 'Go to iyziLink Payment Page'}
                </a>
                
                <!-- Ödemeyi Yaptım Butonu -->
                <button onclick="showVerificationModal('${trackingCode}')" 
                        class="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white rounded-full font-bold transition mb-2">
                    <i class="fas fa-check mr-2"></i>
                    ${(window.currentLang || 'tr') === 'tr' ? 'Ödemeyi Yaptım' : 'I Made the Payment'}
                </button>
                
                <!-- İptal -->
                <button onclick="closePaymentInstructions()" 
                        class="w-full text-gray-400 hover:text-white transition">
                    ${(window.currentLang || 'tr') === 'tr' ? 'Daha Sonra' : 'Later'}
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

// Doğrulama modalı
function showVerificationModal(trackingCode) {
    // Talimat modalını kapat
    closePaymentInstructions();
    
    const modal = `
        <div id="verificationModal" class="modal" style="display: flex; z-index: 9999;">
            <div class="modal-content glass p-8 rounded-3xl max-w-lg">
                <h3 class="text-2xl font-bold mb-6 text-center">
                    ${(window.currentLang || 'tr') === 'tr' ? 'Ödeme Doğrulama' : 'Payment Verification'}
                </h3>
                
                <!-- Takip Kodu -->
                <div class="bg-purple-900/30 p-4 rounded-lg mb-6 text-center">
                    <p class="text-sm text-gray-400 mb-1">
                        ${(window.currentLang || 'tr') === 'tr' ? 'Takip Kodunuz:' : 'Your Tracking Code:'}
                    </p>
                    <div class="text-2xl font-mono font-bold text-purple-400">
                        ${trackingCode}
                    </div>
                </div>
                
                <!-- Doğrulama Seçenekleri -->
                <div class="space-y-4">
                    <!-- Otomatik Doğrulama -->
                    <div class="border border-gray-600 rounded-lg p-4 hover:border-purple-500 transition">
                        <h4 class="font-bold mb-2">
                            ${(window.currentLang || 'tr') === 'tr' ? 'Otomatik Doğrulama' : 'Automatic Verification'}
                        </h4>
                        <p class="text-sm text-gray-400 mb-3">
                            ${(window.currentLang || 'tr') === 'tr' ? 
                                'Kayıt sırasında girdiğiniz bilgilerle doğrulama' : 
                                'Verify with the information you entered during registration'}
                        </p>
                        <button onclick="autoVerifyPayment('${trackingCode}')" 
                                class="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition">
                            ${(window.currentLang || 'tr') === 'tr' ? 'Otomatik Doğrula' : 'Auto Verify'}
                        </button>
                    </div>
                    
                    <!-- Manuel Doğrulama -->
                    <div class="border border-gray-600 rounded-lg p-4">
                        <h4 class="font-bold mb-2">
                            ${(window.currentLang || 'tr') === 'tr' ? 'Manuel Doğrulama' : 'Manual Verification'}
                        </h4>
                        <p class="text-sm text-gray-400 mb-3">
                            ${(window.currentLang || 'tr') === 'tr' ? 
                                'Ödeme sırasında farklı bilgi kullandıysanız' : 
                                'If you used different information during payment'}
                        </p>
                        
                        <input type="email" 
                               id="verifyEmail" 
                               placeholder="${(window.currentLang || 'tr') === 'tr' ? 'E-posta' : 'Email'}"
                               class="w-full p-2 bg-black/50 rounded border border-gray-700 mb-2 focus:border-purple-500 focus:outline-none">
                               
                        <input type="tel" 
                               id="verifyPhone" 
                               placeholder="${(window.currentLang || 'tr') === 'tr' ? 'Telefon' : 'Phone'}"
                               oninput="formatPhoneNumber(this)"
                               class="w-full p-2 bg-black/50 rounded border border-gray-700 mb-3 focus:border-purple-500 focus:outline-none">
                               
                        <button onclick="manualVerifyPayment('${trackingCode}')" 
                                class="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition">
                            ${(window.currentLang || 'tr') === 'tr' ? 'Manuel Doğrula' : 'Manual Verify'}
                        </button>
                    </div>
                    
                    <!-- Destek -->
                    <div class="border border-gray-600 rounded-lg p-4">
                        <h4 class="font-bold mb-2">
                            ${(window.currentLang || 'tr') === 'tr' ? 'Yardıma mı ihtiyacınız var?' : 'Need Help?'}
                        </h4>
                        <p class="text-sm text-gray-400 mb-3">
                            ${(window.currentLang || 'tr') === 'tr' ? 
                                'Sorun yaşıyorsanız destek ekibimizle iletişime geçin' : 
                                'Contact our support team if you have problems'}
                        </p>
                        <button onclick="requestSupport('${trackingCode}')" 
                                class="w-full py-2 px-4 bg-green-600 hover:bg-green-700 rounded-lg transition">
                            <i class="fas fa-headset mr-2"></i>
                            ${(window.currentLang || 'tr') === 'tr' ? 'Destek Talebi' : 'Support Request'}
                        </button>
                    </div>
                </div>
                
                <!-- Kapat -->
                <button onclick="closeVerificationModal()" 
                        class="w-full mt-4 text-gray-400 hover:text-white transition">
                    ${(window.currentLang || 'tr') === 'tr' ? 'Kapat' : 'Close'}
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

// Premium aktivasyon fonksiyonu
async function activatePremium(trackingCode, userId) {
    try {
        // 1. Payment tracking'i kontrol et
        const { data: payment, error: paymentError } = await supabase
            .from('payment_tracking')
            .select('*')
            .eq('tracking_code', trackingCode)
            .eq('user_id', userId)
            .eq('status', 'pending')
            .single();
        
        if (!payment || paymentError) {
            console.error('Payment not found or already processed');
            return false;
        }
        
        // 2. Payment'ı verified yap
        const { error: updateError } = await supabase
            .from('payment_tracking')
            .update({ 
                status: 'verified', 
                verified_at: new Date().toISOString() 
            })
            .eq('tracking_code', trackingCode);
        
        if (updateError) {
            console.error('Failed to update payment status:', updateError);
            return false;
        }
        
        // 3. Premium subscription oluştur
        const { error: subError } = await supabase
            .from('premium_subscriptions')
            .insert({
                user_id: userId,
                tracking_code: trackingCode,
                status: 'active',
                start_date: new Date().toISOString(),
                end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            });
        
        if (subError) {
            console.error('Failed to create subscription:', subError);
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.error('Premium activation error:', error);
        return false;
    }
}

// Otomatik doğrulama
async function autoVerifyPayment(trackingCode) {
    try {
        window.showNotification(
            (window.currentLang || 'tr') === 'tr' ? 'Ödeme kontrol ediliyor...' : 'Checking payment...',
            'info'
        );
        
        const user = await window.SupabaseAuth.getCurrentUser();
        
        // Doğrulama denemesi kaydet
        await supabase
            .from('verification_attempts')
            .insert({
                tracking_code: trackingCode,
                user_id: user.id,
                attempt_type: 'auto',
                success: false
            });
        
        // Premium aktivasyonu dene
        const success = await activatePremium(trackingCode, user.id);
        
        if (success) {
            // Başarılı
            closeVerificationModal();
            showSuccessModal();
            
            // 3 saniye sonra sayfayı yenile
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        } else {
            window.showNotification(
                (window.currentLang || 'tr') === 'tr' ? 
                    'Ödeme henüz onaylanmamış. Lütfen birkaç dakika bekleyin veya manuel doğrulama yapın.' : 
                    'Payment not confirmed yet. Please wait a few minutes or try manual verification.',
                'warning'
            );
        }
        
    } catch (error) {
        console.error('Auto verification error:', error);
        window.showNotification(
            (window.currentLang || 'tr') === 'tr' ? 
                'Doğrulama başarısız. Lütfen manuel doğrulama yapın.' : 
                'Verification failed. Please try manual verification.',
            'error'
        );
    }
}

// Manuel doğrulama
async function manualVerifyPayment(trackingCode) {
    const email = document.getElementById('verifyEmail').value;
    const phone = document.getElementById('verifyPhone').value.replace(/\s/g, '');
    
    if (!email && !phone) {
        window.showNotification(
            (window.currentLang || 'tr') === 'tr' ? 
                'Lütfen e-posta veya telefon bilgisi girin' : 
                'Please enter email or phone information',
            'error'
        );
        return;
    }
    
    try {
        window.showNotification(
            (window.currentLang || 'tr') === 'tr' ? 'Doğrulama yapılıyor...' : 'Verifying...',
            'info'
        );
        
        const user = await window.SupabaseAuth.getCurrentUser();
        
        // Manuel doğrulama denemesi kaydet
        await supabase
            .from('verification_attempts')
            .insert({
                tracking_code: trackingCode,
                user_id: user.id,
                attempt_type: 'manual',
                input_email: email,
                input_phone: phone,
                success: false
            });
        
        // Admin onayı gerekiyor mesajı
        window.showNotification(
            (window.currentLang || 'tr') === 'tr' ? 
                'Bilgileriniz kaydedildi. Manuel doğrulama için destek ekibimiz sizinle iletişime geçecek.' : 
                'Your information has been saved. Our support team will contact you for manual verification.',
            'info'
        );
        
        // Destek talebi oluştur
        await createSupportTicket(trackingCode, email, phone);
        
    } catch (error) {
        console.error('Manual verification error:', error);
        window.showNotification(
            (window.currentLang || 'tr') === 'tr' ? 
                'Bir hata oluştu. Lütfen destek ile iletişime geçin.' : 
                'An error occurred. Please contact support.',
            'error'
        );
    }
}

// Destek talebi oluştur
async function createSupportTicket(trackingCode, email = null, phone = null) {
    try {
        const user = await window.SupabaseAuth.getCurrentUser();
        
        const description = `
            Takip Kodu: ${trackingCode}
            ${email ? `E-posta: ${email}` : ''}
            ${phone ? `Telefon: ${phone}` : ''}
            Tarih: ${new Date().toLocaleString((window.currentLang || 'tr') === 'tr' ? 'tr-TR' : 'en-US')}
        `;
        
        const { data, error } = await getSupabase()
            .from('support_tickets')
            .insert({
                user_id: user.id,
                tracking_code: trackingCode,
                ticket_type: 'payment_verification',
                status: 'open',
                priority: 'high',
                description: description
            })
            .select()
            .single();
        
        if (error) throw error;
        
        return data;
        
    } catch (error) {
        console.error('Support ticket error:', error);
        throw error;
    }
}

// Destek talebi modalı
async function requestSupport(trackingCode) {
    try {
        const ticket = await createSupportTicket(trackingCode);
        
        // WhatsApp mesajı
        const whatsappMessage = encodeURIComponent(
            (window.currentLang || 'tr') === 'tr' ? 
                `Merhaba, premium üyelik ödememi yaptım ancak doğrulama yapamıyorum.\nTakip kodum: ${trackingCode}\nDestek talep no: ${ticket.id}` :
                `Hello, I made premium membership payment but cannot verify.\nTracking code: ${trackingCode}\nSupport ticket: ${ticket.id}`
        );
        
        const modal = `
            <div id="supportModal" class="modal" style="display: flex; z-index: 10000;">
                <div class="modal-content glass p-8 rounded-3xl max-w-md">
                    <h3 class="text-2xl font-bold mb-4 text-center">
                        ${(window.currentLang || 'tr') === 'tr' ? 'Destek Talebi Oluşturuldu' : 'Support Ticket Created'}
                    </h3>
                    
                    <div class="bg-green-900/30 border border-green-600 p-4 rounded-lg mb-6">
                        <p class="text-green-400 text-center">
                            <i class="fas fa-check-circle text-2xl mb-2"></i><br>
                            ${(window.currentLang || 'tr') === 'tr' ? 
                                'Destek talebiniz alındı. En kısa sürede size dönüş yapacağız.' : 
                                'Your support request has been received. We will contact you soon.'}
                        </p>
                    </div>
                    
                    <div class="bg-black/50 p-4 rounded-lg mb-6">
                        <p class="text-sm text-gray-400 mb-1">
                            ${(window.currentLang || 'tr') === 'tr' ? 'Talep No:' : 'Ticket ID:'}
                        </p>
                        <p class="font-mono text-lg">${ticket.id}</p>
                    </div>
                    
                    <a href="https://wa.me/905369134977?text=${whatsappMessage}" 
                       target="_blank"
                       class="block w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white text-center rounded-full font-bold transition mb-2">
                        <i class="fab fa-whatsapp mr-2"></i>
                        ${(window.currentLang || 'tr') === 'tr' ? 'WhatsApp Destek' : 'WhatsApp Support'}
                    </a>
                    
                    <button onclick="closeSupportModal()" 
                            class="w-full text-gray-400 hover:text-white transition">
                        ${(window.currentLang || 'tr') === 'tr' ? 'Kapat' : 'Close'}
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modal);
        closeVerificationModal();
        
    } catch (error) {
        window.showNotification(
            (window.currentLang || 'tr') === 'tr' ? 
                'Destek talebi oluşturulamadı.' : 
                'Could not create support ticket.',
            'error'
        );
    }
}

// Başarı modalı
function showSuccessModal() {
    const modal = `
        <div id="successModal" class="modal" style="display: flex; z-index: 10000;">
            <div class="modal-content glass p-8 rounded-3xl max-w-md text-center">
                <div class="mb-6">
                    <i class="fas fa-check-circle text-6xl text-green-400"></i>
                </div>
                
                <h3 class="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    ${(window.currentLang || 'tr') === 'tr' ? 'Tebrikler!' : 'Congratulations!'}
                </h3>
                
                <p class="text-lg mb-6">
                    ${(window.currentLang || 'tr') === 'tr' ? 
                        'Premium üyeliğiniz başarıyla aktif edildi!' : 
                        'Your premium membership has been activated!'}
                </p>
                
                <div class="bg-purple-900/30 p-4 rounded-lg mb-6">
                    <p class="text-sm text-gray-400 mb-2">
                        ${(window.currentLang || 'tr') === 'tr' ? 'Premium özellikleri:' : 'Premium features:'}
                    </p>
                    <ul class="text-sm space-y-1">
                        <li><i class="fas fa-check text-purple-400 mr-2"></i>${(window.currentLang || 'tr') === 'tr' ? 'Sınırsız güvercin kaydı' : 'Unlimited pigeon records'}</li>
                        <li><i class="fas fa-check text-purple-400 mr-2"></i>${(window.currentLang || 'tr') === 'tr' ? '10 nesil soyağacı' : '10 generation pedigree'}</li>
                        <li><i class="fas fa-check text-purple-400 mr-2"></i>${(window.currentLang || 'tr') === 'tr' ? 'AI eşleştirme' : 'AI matching'}</li>
                        <li><i class="fas fa-check text-purple-400 mr-2"></i>${(window.currentLang || 'tr') === 'tr' ? 've daha fazlası...' : 'and more...'}</li>
                    </ul>
                </div>
                
                <p class="text-sm text-gray-400">
                    ${(window.currentLang || 'tr') === 'tr' ? 
                        'Sayfa yenilenecek...' : 
                        'Page will refresh...'}
                </p>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

// Navbar premium badge güncelleme
async function updateNavbarForPremium() {
    const isPremium = await checkPremiumStatus();
    
    if (isPremium) {
        const authSection = document.getElementById('authSection');
        const existingBadge = document.getElementById('premiumBadge');
        
        if (authSection && !existingBadge) {
            const badge = `
                <span id="premiumBadge" class="bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 rounded-full text-xs font-bold">
                    PREMIUM
                </span>
            `;
            authSection.insertAdjacentHTML('afterbegin', badge);
        }
    }
}

// Modal kapatma fonksiyonları
function closePaymentModal() {
    const modal = document.getElementById('paymentFormModal');
    if (modal) modal.remove();
}

function closePaymentInstructions() {
    const modal = document.getElementById('paymentInstructionsModal');
    if (modal) modal.remove();
}

function closeVerificationModal() {
    const modal = document.getElementById('verificationModal');
    if (modal) modal.remove();
}

function closeSupportModal() {
    const modal = document.getElementById('supportModal');
    if (modal) modal.remove();
}

// Kopyalama fonksiyonu
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        window.showNotification(
            (window.currentLang || 'tr') === 'tr' ? 'Kopyalandı!' : 'Copied!',
            'success'
        );
    });
}

// Admin panel fonksiyonları
async function showAdminPayments() {
    // Admin kontrolü
    const user = await window.SupabaseAuth.getCurrentUser();
    const isAdmin = user.user_metadata?.role === 'admin';
    
    if (!isAdmin) {
        window.showNotification(
            (window.currentLang || 'tr') === 'tr' ? 'Yetkiniz yok' : 'Unauthorized',
            'error'
        );
        return;
    }
    
    // Bekleyen ödemeleri getir - get_admin_payment_view fonksiyonunu kullan
    const { data: allPayments, error } = await supabase
        .rpc('get_admin_payment_view');
    
    if (error) {
        console.error('Admin panel error:', error);
        return;
    }
    
    // Sadece pending olanları filtrele ve sırala
    const pendingPayments = allPayments
        .filter(payment => payment.status === 'pending')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Admin paneli göster
    document.getElementById('content').innerHTML = `
        <div class="container mx-auto">
            <h2 class="text-3xl font-bold mb-6">Bekleyen Ödemeler</h2>
            
            <div class="space-y-4">
                ${pendingPayments.map(payment => `
                    <div class="glass p-6 rounded-2xl">
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                            <div>
                                <p class="text-gray-400 text-sm">Kullanıcı</p>
                                <p class="font-semibold">${payment.email}</p>
                                <p class="text-sm text-gray-500">${payment.phone || '-'}</p>
                            </div>
                            <div>
                                <p class="text-gray-400 text-sm">Takip Kodu</p>
                                <p class="font-mono font-bold text-purple-400">${payment.tracking_code}</p>
                            </div>
                            <div>
                                <p class="text-gray-400 text-sm">Tutar</p>
                                <p class="font-semibold">${payment.amount} ${payment.currency}</p>
                                <p class="text-sm text-gray-500">${new Date(payment.created_at).toLocaleString('tr-TR')}</p>
                            </div>
                            <div class="flex gap-2">
                                <button onclick="approvePayment('${payment.tracking_code}', '${payment.user_id}')" 
                                        class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition">
                                    <i class="fas fa-check mr-1"></i> Onayla
                                </button>
                                <button onclick="rejectPayment('${payment.tracking_code}')" 
                                        class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition">
                                    <i class="fas fa-times mr-1"></i> Reddet
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            ${pendingPayments.length === 0 ? `
                <div class="text-center py-12 text-gray-400">
                    <i class="fas fa-check-circle text-4xl mb-4"></i>
                    <p>Bekleyen ödeme yok</p>
                </div>
            ` : ''}
        </div>
    `;
}

// Admin onay fonksiyonu
async function approvePayment(trackingCode, userId) {
    if (!confirm('Bu ödemeyi onaylamak istediğinizden emin misiniz?')) return;
    
    try {
        // Premium aktivasyonu
        const success = await activatePremium(trackingCode, userId);
        
        if (success) {
            window.showNotification('Ödeme onaylandı ve premium aktif edildi!', 'success');
            
            // Listeyi yenile
            showAdminPayments();
        } else {
            throw new Error('Premium aktivasyonu başarısız');
        }
        
    } catch (error) {
        console.error('Approval error:', error);
        window.showNotification('Onaylama sırasında hata oluştu', 'error');
    }
}

// Admin red fonksiyonu
async function rejectPayment(trackingCode) {
    if (!confirm('Bu ödemeyi reddetmek istediğinizden emin misiniz?')) return;
    
    try {
        const { error } = await supabase
            .from('payment_tracking')
            .update({ status: 'failed' })
            .eq('tracking_code', trackingCode);
        
        if (error) throw error;
        
        window.showNotification('Ödeme reddedildi', 'info');
        
        // Listeyi yenile
        showAdminPayments();
        
    } catch (error) {
        console.error('Rejection error:', error);
        window.showNotification('Reddetme sırasında hata oluştu', 'error');
    }
}

// Export functions
window.handlePremiumPurchase = handlePremiumPurchase;
window.checkPremiumStatus = checkPremiumStatus;
window.updateNavbarForPremium = updateNavbarForPremium;
window.showAdminPayments = showAdminPayments;
window.formatPhoneNumber = formatPhoneNumber;
window.checkEmailMatch = checkEmailMatch;
window.checkConfirmation = checkConfirmation;
window.proceedToPayment = proceedToPayment;
window.autoVerifyPayment = autoVerifyPayment;
window.manualVerifyPayment = manualVerifyPayment;
window.requestSupport = requestSupport;
window.approvePayment = approvePayment;
window.rejectPayment = rejectPayment;
window.copyToClipboard = copyToClipboard;
window.closePaymentModal = closePaymentModal;
window.closePaymentInstructions = closePaymentInstructions;
window.closeVerificationModal = closeVerificationModal;
window.closeSupportModal = closeSupportModal;

console.log('premium-system.js loaded successfully');
console.log('handlePremiumPurchase is:', typeof window.handlePremiumPurchase);

} catch (error) {
    console.error('Error loading premium-system.js:', error);
    // Still export a basic handlePremiumPurchase function
    window.handlePremiumPurchase = function() {
        console.error('Premium system failed to load properly');
        if (typeof window.showNotification === 'function') {
            window.showNotification(
                'Premium sistem yüklenemedi. Lütfen sayfayı yenileyin.',
                'error'
            );
        }
    };
}